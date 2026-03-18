/**
 * Unified WebSocket session for managing subscriptions to both Cosmos and EVM events.
 */

import type { ChainInfo } from '../../provider/types'
import { WebSocketNotAvailableError } from '../../errors'
import type {
  Subscription,
  SessionOptions,
  EventSpec,
  CosmosEventSpec,
  EvmEventSpec,
  InferEventData,
} from './types'
import { isCosmosEvent } from './types'
import { InternalCosmosSession } from './cosmos-session'
import { InternalEvmSession } from './evm-session'

// Re-export for convenience
export { WebSocketNotAvailableError }

/**
 * Unified WebSocket session for managing subscriptions to both Cosmos and EVM events.
 *
 * Lazily creates connections to the appropriate WebSocket based on the event type.
 * For minievm chains, a single session can manage both Cosmos and EVM subscriptions.
 *
 * Features:
 * - **Auto-reconnect**: Automatically reconnects on disconnect with exponential backoff (default: enabled)
 * - **Re-subscription**: All subscriptions are automatically restored after reconnection
 * - **Connection events**: Optional callback for monitoring connection state changes
 *
 * @example Basic usage
 * ```typescript
 * const session = createSession(chainInfo)
 *
 * // Subscribe to Cosmos events (uses wss endpoint)
 * const blockSub = await session.subscribe({ event: 'block' }, (block) => {
 *   console.log('New block:', block)
 * })
 *
 * // Subscribe to EVM events (uses evmWss endpoint)
 * const logSub = await session.subscribe({
 *   event: 'evmLogs',
 *   filter: { address: '0x...' }
 * }, (log) => {
 *   console.log('EVM log:', log)
 * })
 *
 * // Check connection status
 * console.log('Cosmos connected:', session.cosmosConnected)
 * console.log('EVM connected:', session.evmConnected)
 *
 * // Cleanup all connections
 * session.close()
 * ```
 *
 * @example With connection monitoring
 * ```typescript
 * const session = createSession(chainInfo, {
 *   onConnectionEvent: (event) => {
 *     console.log(`[${event.type}] at ${new Date(event.timestamp).toISOString()}`)
 *     if (event.type === 'reconnect') {
 *       console.log(`  Attempt #${event.attempt}`)
 *     }
 *     if (event.error) {
 *       console.log(`  Error: ${event.error}`)
 *     }
 *   }
 * })
 * ```
 *
 * @example Disable auto-reconnect
 * ```typescript
 * const session = createSession(chainInfo, { autoReconnect: false })
 * ```
 */
export class WebSocketSession {
  private cosmosSession?: InternalCosmosSession
  private evmSession?: InternalEvmSession

  constructor(
    private readonly chainInfo: ChainInfo,
    private readonly options: SessionOptions = {}
  ) {}

  /**
   * Subscribe to blockchain events.
   *
   * Automatically routes to the appropriate WebSocket based on event type.
   * Event data type is inferred from the event spec. Use generic parameter
   * to override with a custom type.
   *
   * @typeParam T - Optional custom type override for event data
   * @param spec - Event specification
   * @param callback - Function called for each event with inferred or custom type
   * @returns Subscription handle
   *
   * @example Default type inference
   * ```typescript
   * session.subscribe({ event: 'block' }, (block) => {
   *   console.log(block.header?.height)  // WsBlock type inferred
   * })
   * ```
   *
   * @example Custom type override
   * ```typescript
   * interface MyBlock { header: { height: string } }
   * session.subscribe<MyBlock>({ event: 'block' }, (block) => {
   *   console.log(block.header.height)  // MyBlock type used
   * })
   * ```
   */
  async subscribe<T = undefined, S extends EventSpec = EventSpec>(
    spec: S,
    callback: (data: T extends undefined ? InferEventData<S> : T) => void
  ): Promise<Subscription> {
    if (isCosmosEvent(spec)) {
      return this.subscribeCosmos(spec, callback as (data: unknown) => void)
    } else {
      return this.subscribeEvm(spec, callback as (data: unknown) => void)
    }
  }

  private async subscribeCosmos(
    spec: CosmosEventSpec,
    callback: (data: unknown) => void
  ): Promise<Subscription> {
    // Lazy initialization
    if (!this.cosmosSession) {
      if (!this.chainInfo.wss) {
        throw new WebSocketNotAvailableError(this.chainInfo.chainId)
      }
      this.cosmosSession = new InternalCosmosSession(this.chainInfo.wss, this.options)
    }

    // Build query and data extractor
    let query: string
    let dataExtractor: (data: unknown) => unknown = data => data

    switch (spec.event) {
      case 'block':
        query = "tm.event='NewBlock'"
        dataExtractor = data => {
          const value = data as { block?: unknown }
          return value.block ?? data
        }
        break
      case 'blockHeader':
        query = "tm.event='NewBlockHeader'"
        dataExtractor = data => {
          const value = data as { header?: unknown }
          return value.header ?? data
        }
        break
      case 'tx':
        query = spec.filter ? `tm.event='Tx' AND ${spec.filter}` : "tm.event='Tx'"
        dataExtractor = data => {
          const value = data as { TxResult?: unknown }
          return value.TxResult ?? data
        }
        break
      case 'validatorUpdates':
        query = "tm.event='ValidatorSetUpdates'"
        break
      case 'cosmosCustom':
        query = spec.query
        break
    }

    return this.cosmosSession.subscribe(query, data => {
      callback(dataExtractor(data))
    })
  }

  private async subscribeEvm(
    spec: EvmEventSpec,
    callback: (data: unknown) => void
  ): Promise<Subscription> {
    // Lazy initialization
    if (!this.evmSession) {
      const evmWss = this.chainInfo.evmWss
      if (!evmWss) {
        throw new WebSocketNotAvailableError(this.chainInfo.chainId)
      }
      this.evmSession = new InternalEvmSession(evmWss, this.options)
    }

    // Build subscription parameters
    let type: 'logs' | 'newHeads' | 'newPendingTransactions' | 'syncing'
    let params: Record<string, unknown> = {}

    switch (spec.event) {
      case 'evmLogs':
        type = 'logs'
        params = spec.filter ?? {}
        break
      case 'evmHeads':
        type = 'newHeads'
        break
      case 'evmPendingTxs':
        type = 'newPendingTransactions'
        break
      case 'evmSyncing':
        type = 'syncing'
        break
      case 'evmCustom':
        type = spec.type as typeof type
        params = spec.params ?? {}
        break
    }

    return this.evmSession.subscribe(type, params, callback)
  }

  /**
   * Check if Cosmos WebSocket endpoint is available.
   */
  get hasCosmosEndpoint(): boolean {
    return !!this.chainInfo.wss
  }

  /**
   * Check if EVM WebSocket endpoint is available.
   */
  get hasEvmEndpoint(): boolean {
    return !!this.chainInfo.evmWss
  }

  /**
   * Check if Cosmos WebSocket is currently connected.
   */
  get cosmosConnected(): boolean {
    return this.cosmosSession?.connected ?? false
  }

  /**
   * Check if EVM WebSocket is currently connected.
   */
  get evmConnected(): boolean {
    return this.evmSession?.connected ?? false
  }

  /**
   * Get total number of active subscriptions across all connections.
   */
  get subscriptionCount(): number {
    return (this.cosmosSession?.subscriptionCount ?? 0) + (this.evmSession?.subscriptionCount ?? 0)
  }

  /**
   * Close all WebSocket connections and subscriptions.
   */
  close(): void {
    this.cosmosSession?.close()
    this.evmSession?.close()
    this.cosmosSession = undefined
    this.evmSession = undefined
  }
}

// ============================================================================
// Factory Functions
// ============================================================================

/**
 * Create a WebSocket session for subscribing to blockchain events.
 *
 * The session lazily connects to the appropriate WebSocket (Cosmos or EVM)
 * based on the events you subscribe to.
 *
 * **Auto-reconnect behavior** (enabled by default):
 * - Automatically reconnects when connection drops unexpectedly
 * - Uses exponential backoff: 1s, 2s, 4s, 8s... up to 30s max
 * - Re-subscribes all existing subscriptions after reconnection
 * - Disable with `{ autoReconnect: false }` for manual control
 *
 * @param chainInfo - Chain configuration
 * @param options - Session options (auto-reconnect, connection events)
 * @returns WebSocketSession instance
 *
 * @example Basic usage
 * ```typescript
 * const session = createSession(chainInfo)
 *
 * // Mixed Cosmos and EVM subscriptions (for minievm chains)
 * await session.subscribe({ event: 'block' }, onBlock)
 * await session.subscribe({ event: 'evmLogs', filter: {...} }, onLog)
 *
 * session.close()
 * ```
 *
 * @example With connection monitoring
 * ```typescript
 * const session = createSession(chainInfo, {
 *   onConnectionEvent: (event) => {
 *     if (event.type === 'disconnect') {
 *       console.warn('WebSocket disconnected:', event.error)
 *     } else if (event.type === 'reconnect') {
 *       console.log(`Reconnecting... (attempt ${event.attempt})`)
 *     } else if (event.type === 'connect') {
 *       console.log('WebSocket connected')
 *     }
 *   }
 * })
 * ```
 *
 * @example Custom reconnect settings
 * ```typescript
 * const session = createSession(chainInfo, {
 *   autoReconnect: true,
 *   maxRetries: 10,        // Give up after 10 attempts
 *   retryDelay: 2000,      // Start with 2s delay
 *   maxRetryDelay: 60000,  // Cap at 60s
 * })
 * ```
 */
export function createSession(chainInfo: ChainInfo, options?: SessionOptions): WebSocketSession {
  return new WebSocketSession(chainInfo, options)
}

// ============================================================================
// Standalone Subscribe Function
// ============================================================================

/**
 * Subscribe to blockchain events with automatic session management.
 *
 * Creates a temporary session for the subscription and closes it when unsubscribed.
 * For multiple subscriptions, use `createSession()` for better efficiency.
 *
 * Event data type is inferred from the event spec. Use generic parameter
 * to override with a custom type.
 *
 * @typeParam T - Optional custom type override for event data
 * @param chainInfo - Chain configuration
 * @param spec - Event specification
 * @param callback - Function called for each event with inferred or custom type
 * @returns Subscription handle
 *
 * @example Default type inference
 * ```typescript
 * const sub = await subscribe(chainInfo, { event: 'block' }, (block) => {
 *   console.log('New block:', block.header?.height)  // WsBlock inferred
 * })
 * ```
 *
 * @example Custom type override
 * ```typescript
 * interface MyBlock { header: { height: string } }
 * const sub = await subscribe<MyBlock>(chainInfo, { event: 'block' }, (block) => {
 *   console.log('New block:', block.header.height)  // MyBlock used
 * })
 * ```
 */
export async function subscribe<T = undefined, S extends EventSpec = EventSpec>(
  chainInfo: ChainInfo,
  spec: S,
  callback: (data: T extends undefined ? InferEventData<S> : T) => void
): Promise<Subscription> {
  const session = createSession(chainInfo)
  const sub = await session.subscribe(spec, callback as (data: unknown) => void)

  return {
    id: sub.id,
    unsubscribe: () => {
      sub.unsubscribe()
      session.close()
    },
  }
}

// ============================================================================
// Utility Functions
// ============================================================================

/**
 * Check if WebSocket endpoint is available for the chain.
 *
 * @param chainInfo - Chain configuration
 * @param type - Endpoint type to check (default: 'cosmos')
 * @returns true if the endpoint is available
 *
 * @example
 * ```typescript
 * if (hasWebSocketEndpoint(chainInfo)) {
 *   // Cosmos WS available
 * }
 *
 * if (hasWebSocketEndpoint(chainInfo, 'evm')) {
 *   // EVM WS available (minievm chains)
 * }
 * ```
 */
export function hasWebSocketEndpoint(
  chainInfo: ChainInfo,
  type: 'cosmos' | 'evm' = 'cosmos'
): boolean {
  return type === 'cosmos' ? !!chainInfo.wss : !!chainInfo.evmWss
}
