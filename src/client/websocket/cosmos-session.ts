/**
 * Internal Cosmos WebSocket session implementation.
 *
 * ## Connection State Machine
 *
 * ```
 *                    ┌─────────────────────────────────────────┐
 *                    │                                         │
 *                    ▼                                         │
 *  ┌──────────┐   connect()   ┌───────────┐   onopen    ┌─────────────┐
 *  │DISCONNECT├──────────────►│CONNECTING ├────────────►│  CONNECTED  │
 *  └──────────┘               └─────┬─────┘             └──────┬──────┘
 *       ▲                           │                          │
 *       │                       onerror                    onclose
 *       │                           │                     (unexpected)
 *       │                           ▼                          │
 *       │                    ┌──────────┐                      │
 *       │                    │  FAILED  │                      │
 *       │                    └──────────┘                      │
 *       │                                                      ▼
 *       │    maxRetries      ┌──────────────┐  retryDelay  ┌────────────┐
 *       │◄───exceeded────────┤ RECONNECTING │◄─────────────┤ SCHEDULING │
 *       │                    └───────┬──────┘              └────────────┘
 *       │                            │
 *       │                       reconnect
 *       │                        success
 *       │                            │
 *       │                            ▼
 *       │                    ┌─────────────┐
 *       └────user close()────┤  CONNECTED  │
 *                            └─────────────┘
 * ```
 *
 * ## Event Flow
 *
 * 1. `connect` - Initial connection established
 * 2. `disconnect` - Connection lost (will auto-reconnect if enabled)
 * 3. `reconnect` - Successfully reconnected after disconnect
 * 4. `error` - Connection error occurred
 * 5. `maxRetriesReached` - All reconnection attempts exhausted, pending promises rejected
 *
 * ## Pending Subscription Handling
 *
 * - Subscriptions requested during disconnect are queued in `pendingSubscriptions`
 * - On `maxRetriesReached`: all pending promises are rejected with error
 * - On `close()`: all pending promises are rejected with "Session closed"
 */

import type { Subscription, SessionOptions, ConnectionEventType, CosmosWsResponse } from './types'
import { DEFAULT_SESSION_OPTIONS, SUBSCRIPTION_TIMEOUT_MS } from './types'

/**
 * Internal Cosmos WebSocket session for CometBFT subscriptions.
 * @internal
 */
export class InternalCosmosSession {
  private ws: WebSocket | null = null
  private subscriptions: Map<string, (data: unknown) => void> = new Map()
  private messageIdCounter = 0
  private pendingSubscriptions: Map<
    number,
    { resolve: () => void; reject: (err: Error) => void; query: string }
  > = new Map()
  private isConnected = false
  private connectionPromise: Promise<void> | null = null
  private isUserClose = false
  private reconnectAttempt = 0
  private reconnectTimer: ReturnType<typeof setTimeout> | null = null
  private readonly options: Required<Omit<SessionOptions, 'onConnectionEvent'>> & {
    onConnectionEvent?: (event: {
      type: ConnectionEventType
      timestamp: number
      attempt?: number
      error?: string
    }) => void
  }

  constructor(
    private readonly wssUrl: string,
    options: SessionOptions = {}
  ) {
    this.options = {
      ...DEFAULT_SESSION_OPTIONS,
      onConnectionEvent: options.onConnectionEvent,
    }
    if (options.autoReconnect !== undefined) this.options.autoReconnect = options.autoReconnect
    if (options.maxRetries !== undefined) this.options.maxRetries = options.maxRetries
    if (options.retryDelay !== undefined) this.options.retryDelay = options.retryDelay
    if (options.maxRetryDelay !== undefined) this.options.maxRetryDelay = options.maxRetryDelay
  }

  private emitEvent(type: ConnectionEventType, extra?: { attempt?: number; error?: string }): void {
    this.options.onConnectionEvent?.({
      type,
      timestamp: Date.now(),
      ...extra,
    })
  }

  private async connect(): Promise<void> {
    return new Promise((resolve, reject) => {
      this.ws = new WebSocket(this.wssUrl)

      this.ws.onopen = () => {
        this.isConnected = true
        this.connectionPromise = null
        this.reconnectAttempt = 0
        this.emitEvent('connect')
        resolve()
      }

      this.ws.onerror = () => {
        this.connectionPromise = null
        const errorMsg = `WebSocket connection failed: ${this.wssUrl}`
        this.emitEvent('error', { error: errorMsg })
        reject(new Error(errorMsg))
      }

      this.ws.onclose = () => {
        const wasConnected = this.isConnected
        this.isConnected = false
        this.ws = null

        if (wasConnected && !this.isUserClose) {
          this.emitEvent('disconnect', { error: 'Connection closed unexpectedly' })
          this.scheduleReconnect()
        }
      }

      this.ws.onmessage = event => {
        this.handleMessage(event)
      }
    })
  }

  private rejectAllPending(reason: string): void {
    for (const [, pending] of this.pendingSubscriptions) {
      pending.reject(new Error(reason))
    }
    this.pendingSubscriptions.clear()
  }

  private scheduleReconnect(): void {
    if (!this.options.autoReconnect) return
    if (this.reconnectAttempt >= this.options.maxRetries) {
      this.rejectAllPending('Max reconnection attempts reached')
      this.emitEvent('maxRetriesReached')
      return
    }

    this.reconnectAttempt++
    const delay = Math.min(
      this.options.retryDelay * Math.pow(2, this.reconnectAttempt - 1),
      this.options.maxRetryDelay
    )

    this.emitEvent('reconnect', { attempt: this.reconnectAttempt })

    this.reconnectTimer = setTimeout(() => {
      void this.reconnectAndResubscribe()
    }, delay)
  }

  private async reconnectAndResubscribe(): Promise<void> {
    try {
      await this.connect()
      // Re-subscribe all existing subscriptions
      this.resubscribeAll()
    } catch {
      // connect() already handles next reconnect attempt via onclose
    }
  }

  private resubscribeAll(): void {
    // Re-subscribe all existing subscriptions after reconnect.
    // Fire-and-forget: we don't await confirmation during reconnect
    // since callbacks are already registered in this.subscriptions.
    const queries = Array.from(this.subscriptions.keys())
    for (const query of queries) {
      const messageId = ++this.messageIdCounter
      this.ws?.send(
        JSON.stringify({
          jsonrpc: '2.0',
          method: 'subscribe',
          id: messageId,
          params: [query],
        })
      )
    }
  }

  private async ensureConnected(): Promise<void> {
    if (this.isConnected && this.ws) {
      return
    }

    if (this.connectionPromise) {
      return this.connectionPromise
    }

    this.connectionPromise = this.connect()
    return this.connectionPromise
  }

  private handleMessage(event: MessageEvent): void {
    try {
      const data = JSON.parse(event.data as string) as CosmosWsResponse

      // Handle event data (has query and data fields)
      if (data.result?.query && data.result?.data?.value) {
        const query = data.result.query
        const callback = this.subscriptions.get(query)
        if (callback) {
          callback(data.result.data.value)
        }
        return
      }

      // Handle subscription confirmation (empty result object)
      if (data.id !== undefined && data.result !== undefined) {
        const pending = this.pendingSubscriptions.get(data.id)
        if (pending) {
          this.pendingSubscriptions.delete(data.id)
          pending.resolve()
        }
        return
      }
    } catch {
      // Ignore parse errors
    }
  }

  async subscribe(query: string, callback: (data: unknown) => void): Promise<Subscription> {
    await this.ensureConnected()

    const messageId = ++this.messageIdCounter
    const subscriptionId = `cosmos-${messageId}-${Date.now()}`

    // Wait for subscription confirmation with timeout
    await new Promise<void>((resolve, reject) => {
      this.pendingSubscriptions.set(messageId, { resolve, reject, query })

      this.ws!.send(
        JSON.stringify({
          jsonrpc: '2.0',
          method: 'subscribe',
          id: messageId,
          params: [query],
        })
      )

      setTimeout(() => {
        if (this.pendingSubscriptions.has(messageId)) {
          this.pendingSubscriptions.delete(messageId)
          reject(new Error(`Subscription confirmation timeout for query: ${query}`))
        }
      }, SUBSCRIPTION_TIMEOUT_MS)
    })

    this.subscriptions.set(query, callback)

    return {
      id: subscriptionId,
      unsubscribe: () => {
        this.subscriptions.delete(query)
        if (this.ws && this.isConnected) {
          this.ws.send(
            JSON.stringify({
              jsonrpc: '2.0',
              method: 'unsubscribe',
              id: ++this.messageIdCounter,
              params: [query],
            })
          )
        }
      },
    }
  }

  get connected(): boolean {
    return this.isConnected
  }

  get subscriptionCount(): number {
    return this.subscriptions.size
  }

  close(): void {
    this.isUserClose = true
    if (this.reconnectTimer) {
      clearTimeout(this.reconnectTimer)
      this.reconnectTimer = null
    }
    this.subscriptions.clear()
    this.rejectAllPending('Session closed')
    if (this.ws) {
      this.ws.close()
      this.ws = null
    }
    this.isConnected = false
  }
}
