/**
 * WebSocket type definitions for real-time blockchain events.
 */

// ============================================================================
// Subscription Types
// ============================================================================

/**
 * Subscription handle for cleanup.
 */
export interface Subscription {
  /** Unique subscription ID */
  readonly id: string
  /** Unsubscribe and optionally close the connection */
  unsubscribe(): void
}

/**
 * Connection event types for monitoring WebSocket state.
 */
export type ConnectionEventType =
  | 'connect'
  | 'disconnect'
  | 'reconnect'
  | 'error'
  | 'maxRetriesReached'

/**
 * Connection event data passed to event callbacks.
 */
export interface ConnectionEvent {
  /** Event type */
  type: ConnectionEventType
  /** Timestamp of the event */
  timestamp: number
  /** Reconnect attempt number (only for 'reconnect' events) */
  attempt?: number
  /** Error message (only for 'error' and 'disconnect' events) */
  error?: string
}

/**
 * Options for WebSocket session behavior.
 */
export interface SessionOptions {
  /**
   * Enable automatic reconnection on disconnect.
   * @default true
   */
  autoReconnect?: boolean

  /**
   * Maximum number of reconnection attempts.
   * Set to Infinity for unlimited retries.
   * @default Infinity
   */
  maxRetries?: number

  /**
   * Initial delay between reconnection attempts in milliseconds.
   * Uses exponential backoff: delay * 2^attempt
   * @default 1000
   */
  retryDelay?: number

  /**
   * Maximum delay between reconnection attempts in milliseconds.
   * @default 30000
   */
  maxRetryDelay?: number

  /**
   * Callback fired on connection events (connect, disconnect, reconnect, error).
   * Useful for monitoring and debugging.
   */
  onConnectionEvent?: (event: ConnectionEvent) => void
}

/**
 * Default session options.
 */
export const DEFAULT_SESSION_OPTIONS: Required<Omit<SessionOptions, 'onConnectionEvent'>> = {
  autoReconnect: true,
  maxRetries: Infinity,
  retryDelay: 1000,
  maxRetryDelay: 30000,
}

/** Default timeout for subscription confirmation (10 seconds) */
export const SUBSCRIPTION_TIMEOUT_MS = 10000

// ============================================================================
// Event Specification Types
// ============================================================================

/**
 * Cosmos: Subscribe to new full blocks.
 */
export interface BlockEventSpec {
  readonly event: 'block'
}

/**
 * Cosmos: Subscribe to new block headers (lighter than full blocks).
 */
export interface BlockHeaderEventSpec {
  readonly event: 'blockHeader'
}

/**
 * Cosmos: Subscribe to transactions matching a filter.
 */
export interface TxEventSpec {
  readonly event: 'tx'
  /** CometBFT query filter (e.g., "transfer.recipient='init1...'") */
  readonly filter?: string
}

/**
 * Cosmos: Subscribe to validator set changes.
 */
export interface ValidatorUpdatesEventSpec {
  readonly event: 'validatorUpdates'
}

/**
 * Cosmos: Subscribe with custom CometBFT query.
 */
export interface CosmosCustomEventSpec {
  readonly event: 'cosmosCustom'
  /** Full CometBFT query string */
  readonly query: string
}

/**
 * EVM: Subscribe to contract log events.
 */
export interface EvmLogsEventSpec {
  readonly event: 'evmLogs'
  /** Log filter */
  readonly filter?: {
    address?: string
    topics?: string[]
  }
}

/**
 * EVM: Subscribe to new block headers.
 */
export interface EvmHeadsEventSpec {
  readonly event: 'evmHeads'
}

/**
 * EVM: Subscribe to pending transactions in mempool.
 */
export interface EvmPendingTxsEventSpec {
  readonly event: 'evmPendingTxs'
}

/**
 * EVM: Subscribe to sync status changes.
 */
export interface EvmSyncingEventSpec {
  readonly event: 'evmSyncing'
}

/**
 * EVM: Subscribe with custom subscription type.
 */
export interface EvmCustomEventSpec {
  readonly event: 'evmCustom'
  /** Subscription type */
  readonly type: string
  /** Subscription parameters */
  readonly params?: Record<string, unknown>
}

/**
 * All Cosmos event specifications.
 */
export type CosmosEventSpec =
  | BlockEventSpec
  | BlockHeaderEventSpec
  | TxEventSpec
  | ValidatorUpdatesEventSpec
  | CosmosCustomEventSpec

/**
 * All EVM event specifications.
 */
export type EvmEventSpec =
  | EvmLogsEventSpec
  | EvmHeadsEventSpec
  | EvmPendingTxsEventSpec
  | EvmSyncingEventSpec
  | EvmCustomEventSpec

/**
 * Union of all event specifications.
 *
 * @example
 * ```typescript
 * // Cosmos events
 * { event: 'block' }
 * { event: 'blockHeader' }
 * { event: 'tx', filter: "transfer.recipient='init1...'" }
 * { event: 'validatorUpdates' }
 * { event: 'cosmosCustom', query: "tm.event='NewBlock'" }
 *
 * // EVM events
 * { event: 'evmLogs', filter: { address: '0x...', topics: ['0x...'] } }
 * { event: 'evmHeads' }
 * { event: 'evmPendingTxs' }
 * { event: 'evmSyncing' }
 * { event: 'evmCustom', type: 'logs', params: { ... } }
 * ```
 */
export type EventSpec = CosmosEventSpec | EvmEventSpec

/**
 * Helper to check if an event spec is a Cosmos event.
 */
export function isCosmosEvent(spec: EventSpec): spec is CosmosEventSpec {
  return (
    spec.event === 'block' ||
    spec.event === 'blockHeader' ||
    spec.event === 'tx' ||
    spec.event === 'validatorUpdates' ||
    spec.event === 'cosmosCustom'
  )
}

/**
 * Helper to check if an event spec is an EVM event.
 */
export function isEvmEvent(spec: EventSpec): spec is EvmEventSpec {
  return (
    spec.event === 'evmLogs' ||
    spec.event === 'evmHeads' ||
    spec.event === 'evmPendingTxs' ||
    spec.event === 'evmSyncing' ||
    spec.event === 'evmCustom'
  )
}

// ============================================================================
// Event Data Types (Loose interfaces for WebSocket JSON responses)
// ============================================================================

/**
 * Cosmos block data from WebSocket.
 * Loose interface - use generic override for strict typing.
 */
export interface WsBlock {
  header?: {
    height?: string
    time?: string
    chain_id?: string
    proposer_address?: string
    last_block_id?: { hash?: string }
    app_hash?: string
    [key: string]: unknown
  }
  data?: {
    txs?: string[]
    [key: string]: unknown
  }
  evidence?: unknown
  last_commit?: unknown
  [key: string]: unknown
}

/**
 * Cosmos block header data from WebSocket.
 */
export interface WsBlockHeader {
  height?: string
  time?: string
  chain_id?: string
  proposer_address?: string
  last_block_id?: { hash?: string }
  app_hash?: string
  [key: string]: unknown
}

/**
 * Cosmos transaction result from WebSocket.
 */
export interface WsTxResult {
  height?: string
  tx?: string
  result?: {
    code?: number
    data?: string
    log?: string
    gas_wanted?: string
    gas_used?: string
    events?: Array<{
      type?: string
      attributes?: Array<{ key?: string; value?: string }>
    }>
    [key: string]: unknown
  }
  [key: string]: unknown
}

/**
 * Cosmos validator updates from WebSocket.
 */
export interface WsValidatorUpdates {
  validator_updates?: Array<{
    pub_key?: { type?: string; value?: string }
    power?: string
    [key: string]: unknown
  }>
  [key: string]: unknown
}

/**
 * EVM log event from WebSocket.
 */
export interface WsEvmLog {
  address?: string
  topics?: string[]
  data?: string
  blockNumber?: string
  transactionHash?: string
  transactionIndex?: string
  blockHash?: string
  logIndex?: string
  removed?: boolean
  [key: string]: unknown
}

/**
 * EVM block header from WebSocket.
 */
export interface WsEvmBlockHeader {
  number?: string
  hash?: string
  parentHash?: string
  timestamp?: string
  gasLimit?: string
  gasUsed?: string
  miner?: string
  [key: string]: unknown
}

/**
 * EVM sync status from WebSocket.
 */
export interface WsEvmSyncStatus {
  syncing?: boolean
  status?: {
    startingBlock?: string
    currentBlock?: string
    highestBlock?: string
    [key: string]: unknown
  }
  [key: string]: unknown
}

// ============================================================================
// Event Data Type Mapping
// ============================================================================

/**
 * Maps event types to their data types.
 * Used for type inference in subscribe methods.
 */
export type EventDataMap = {
  block: WsBlock
  blockHeader: WsBlockHeader
  tx: WsTxResult
  validatorUpdates: WsValidatorUpdates
  cosmosCustom: unknown
  evmLogs: WsEvmLog
  evmHeads: WsEvmBlockHeader
  evmPendingTxs: string // Transaction hash
  evmSyncing: WsEvmSyncStatus
  evmCustom: unknown
}

/**
 * Infer event data type from EventSpec.
 */
export type InferEventData<S extends EventSpec> = S extends { event: infer E }
  ? E extends keyof EventDataMap
    ? EventDataMap[E]
    : unknown
  : unknown

// ============================================================================
// Internal: WebSocket Response Types
// ============================================================================

export interface CosmosWsResponse {
  id?: number
  result?: {
    query?: string
    data?: {
      value?: unknown
    }
  }
}

export interface EvmWsResponse {
  id?: number
  result?: string
  method?: string
  params?: {
    subscription?: string
    result?: unknown
  }
}

/** Stored subscription info for resubscription after reconnect */
export interface EvmSubscriptionInfo {
  type: 'logs' | 'newHeads' | 'newPendingTransactions' | 'syncing'
  params: Record<string, unknown>
  callback: (data: unknown) => void
}
