/**
 * WebSocket subscription utilities for real-time blockchain events.
 *
 * Provides a unified API for subscribing to both Cosmos (CometBFT) and EVM events.
 *
 * @example Session-based (recommended for multiple subscriptions)
 * ```typescript
 * const session = createSession(chainInfo)
 *
 * // Cosmos events
 * const sub1 = await session.subscribe({ event: 'block' }, onBlock)
 * const sub2 = await session.subscribe({ event: 'tx', filter: "..." }, onTx)
 *
 * // EVM events (minievm chains)
 * const sub3 = await session.subscribe({ event: 'evmLogs', filter: {...} }, onLog)
 *
 * // Cleanup
 * session.close()
 * ```
 *
 * @example Standalone (for single subscriptions)
 * ```typescript
 * const sub = await subscribe(chainInfo, { event: 'block' }, onBlock)
 * sub.unsubscribe()  // Closes the connection
 * ```
 *
 * @module
 */

// Types
export type {
  Subscription,
  ConnectionEventType,
  ConnectionEvent,
  SessionOptions,
  BlockEventSpec,
  BlockHeaderEventSpec,
  TxEventSpec,
  ValidatorUpdatesEventSpec,
  CosmosCustomEventSpec,
  EvmLogsEventSpec,
  EvmHeadsEventSpec,
  EvmPendingTxsEventSpec,
  EvmSyncingEventSpec,
  EvmCustomEventSpec,
  CosmosEventSpec,
  EvmEventSpec,
  EventSpec,
  WsBlock,
  WsBlockHeader,
  WsTxResult,
  WsValidatorUpdates,
  WsEvmLog,
  WsEvmBlockHeader,
  WsEvmSyncStatus,
  EventDataMap,
  InferEventData,
} from './types'

// Type guards
export { isCosmosEvent, isEvmEvent } from './types'

// Session
export {
  WebSocketSession,
  createSession,
  subscribe,
  hasWebSocketEndpoint,
  WebSocketNotAvailableError,
} from './session'

// Waiting utilities
export type {
  WaitForTxOptions,
  TxResult,
  TxEvent,
  TxQueryClient,
  WaitForEventOptions,
  EventFilter,
  TxSearchClient,
} from './waiting'

export { waitForTx, waitForEvent, buildEventQuery, matchesEventFilter } from './waiting'
