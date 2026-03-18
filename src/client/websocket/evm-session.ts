/**
 * Internal EVM WebSocket session implementation.
 *
 * ## Connection State Machine
 *
 * See cosmos-session.ts for the full state diagram.
 * EVM session follows the same reconnection state machine:
 *
 * DISCONNECTED → CONNECTING → CONNECTED ↔ RECONNECTING → MAX_RETRIES
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

import type {
  Subscription,
  SessionOptions,
  ConnectionEventType,
  EvmWsResponse,
  EvmSubscriptionInfo,
} from './types'
import { DEFAULT_SESSION_OPTIONS, SUBSCRIPTION_TIMEOUT_MS } from './types'

/**
 * Internal EVM WebSocket session for Ethereum-compatible subscriptions.
 * @internal
 */
export class InternalEvmSession {
  private ws: WebSocket | null = null
  private subscriptions: Map<string, (data: unknown) => void> = new Map()
  /** Stored subscription info for resubscription */
  private subscriptionInfo: Map<string, EvmSubscriptionInfo> = new Map()
  private messageIdCounter = 0
  private pendingSubscriptions: Map<
    number,
    { resolve: (id: string) => void; reject: (err: Error) => void }
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
      await this.resubscribeAll()
    } catch {
      // connect() already handles next reconnect attempt via onclose
    }
  }

  private async resubscribeAll(): Promise<void> {
    // Store old subscription info and clear current mappings
    const oldInfos = new Map(this.subscriptionInfo)
    this.subscriptions.clear()
    this.subscriptionInfo.clear()

    for (const [, info] of oldInfos) {
      try {
        await this.subscribe(info.type, info.params, info.callback)
      } catch {
        // Subscription failed, will be retried on next reconnect
      }
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
      const data = JSON.parse(event.data as string) as EvmWsResponse

      if (data.id !== undefined && data.result !== undefined) {
        const pending = this.pendingSubscriptions.get(data.id)
        if (pending) {
          pending.resolve(data.result)
          this.pendingSubscriptions.delete(data.id)
        }
        return
      }

      if (data.method === 'eth_subscription' && data.params?.subscription) {
        const callback = this.subscriptions.get(data.params.subscription)
        if (callback) {
          callback(data.params.result)
        }
      }
    } catch {
      // Ignore parse errors
    }
  }

  async subscribe(
    type: 'logs' | 'newHeads' | 'newPendingTransactions' | 'syncing',
    params: Record<string, unknown>,
    callback: (data: unknown) => void
  ): Promise<Subscription> {
    await this.ensureConnected()

    const messageId = ++this.messageIdCounter
    const subscribeParams: unknown[] = type === 'logs' ? [type, params] : [type]

    const subscriptionId = await new Promise<string>((resolve, reject) => {
      this.pendingSubscriptions.set(messageId, { resolve, reject })

      this.ws!.send(
        JSON.stringify({
          jsonrpc: '2.0',
          method: 'eth_subscribe',
          id: messageId,
          params: subscribeParams,
        })
      )

      setTimeout(() => {
        if (this.pendingSubscriptions.has(messageId)) {
          this.pendingSubscriptions.delete(messageId)
          reject(new Error('Subscription confirmation timeout'))
        }
      }, SUBSCRIPTION_TIMEOUT_MS)
    })

    this.subscriptions.set(subscriptionId, callback)
    this.subscriptionInfo.set(subscriptionId, { type, params, callback })

    return {
      id: subscriptionId,
      unsubscribe: () => {
        this.subscriptions.delete(subscriptionId)
        this.subscriptionInfo.delete(subscriptionId)
        if (this.ws && this.isConnected) {
          this.ws.send(
            JSON.stringify({
              jsonrpc: '2.0',
              method: 'eth_unsubscribe',
              id: ++this.messageIdCounter,
              params: [subscriptionId],
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
    this.subscriptionInfo.clear()
    this.rejectAllPending('Session closed')
    if (this.ws) {
      this.ws.close()
      this.ws = null
    }
    this.isConnected = false
  }
}
