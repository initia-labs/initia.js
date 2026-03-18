/**
 * Client module - gRPC client utilities for Initia chains.
 */

// Types
export type {
  ChainType,
  NetworkType,
  BaseClient,
  InitiaClient,
  MinievmClient,
  MiniwasmClient,
  MinimoveClient,
  Client,
  HasClient,
  ClientFor,
  HasEvmService,
  HasWasmService,
  HasMoveService,
  SignModeType,
  TxOptions,
  SignedTx,
  UsernamesSupportedNetwork,
  HasUsernames,
  AuthConfig,
  HttpRequestOptions,
  QueryOptions,
} from './types'

// UnsignedTx is a class — export as value (not just type)
export { UnsignedTx } from './types'
export type { MultisigSignature } from './types'

// Auth helpers
export { auth } from './types'

// gRPC Client
export { createGrpcClient, type ServiceClients, type QueryClient } from './grpc-client'

// Response Wrapper
export {
  wrapResponse,
  isWrappedResponse,
  type WrappedResponse,
  type WrapReturnType,
} from './response'

// Client Factory
export type { CachedClient } from './cached-client'

// Broadcast
export {
  broadcast,
  createBroadcastResultWithWait,
  type BroadcastResult,
  type BroadcastResultWithWait,
  type BroadcastMode,
  type BroadcastOptions,
  type SignBroadcastOptions,
  type TxClient,
} from './broadcast'

// Transport utilities
export {
  createHeadersInterceptor,
  createRetryInterceptor,
  type TransportOptions,
  type RetryOptions,
  type Interceptor,
} from './transport-common'

// WebSocket Subscriptions
export {
  // Core Types
  type Subscription,
  // Session Options & Connection Events
  type SessionOptions,
  type ConnectionEvent,
  type ConnectionEventType,
  // Event Spec Types
  type EventSpec,
  type CosmosEventSpec,
  type EvmEventSpec,
  type BlockEventSpec,
  type BlockHeaderEventSpec,
  type TxEventSpec,
  type ValidatorUpdatesEventSpec,
  type CosmosCustomEventSpec,
  type EvmLogsEventSpec,
  type EvmHeadsEventSpec,
  type EvmPendingTxsEventSpec,
  type EvmSyncingEventSpec,
  type EvmCustomEventSpec,
  // Event Data Types (loose interfaces for WebSocket JSON)
  type WsBlock,
  type WsBlockHeader,
  type WsTxResult,
  type WsValidatorUpdates,
  type WsEvmLog,
  type WsEvmBlockHeader,
  type WsEvmSyncStatus,
  type EventDataMap,
  type InferEventData,
  // Type Guards
  isCosmosEvent,
  isEvmEvent,
  // Session Management
  WebSocketSession,
  createSession,
  // Standalone Subscribe
  subscribe,
  // Utility
  hasWebSocketEndpoint,
  // Error
  WebSocketNotAvailableError,
  // Transaction Waiting
  waitForTx,
  type WaitForTxOptions,
  type TxResult,
  type TxEvent,
  type TxQueryClient,
  // Event Waiting
  waitForEvent,
  buildEventQuery,
  matchesEventFilter,
  type WaitForEventOptions,
  type EventFilter,
  type TxSearchClient,
} from './websocket'

// Gas estimation
export {
  estimateGas,
  getGasPrices,
  type GasEstimate,
  type EstimateOptions,
  type SimulateClient,
  type GasPriceClient,
} from './gas'

// Address profile (comprehensive address introspection)
export {
  getAddressProfile,
  type AccountKind,
  type ContractKind,
  type AddressProfile,
  type EvmProfile,
  type ShorthandProfile,
  type EoaProfile,
  type MoveProfile,
  type WasmProfile,
  type GetAddressProfileOptions,
  type ProfileCache,
} from './address-profile'

// Cosmos event utilities (used by Move and Wasm)
export {
  // Basic event functions
  findEvent,
  findEvents,
  getEventAttribute,
  getEventAttributes,
  getEventValue,
  filterEvents,
  // Wasm event functions
  isWasmEvent,
  parseWasmEvents,
  findWasmEventsByContract,
  findWasmEventsByAction,
  // Move event functions
  isMoveEvent,
  parseMoveEvents,
  findMoveEventsByModule,
  findMoveEventsByType,
  // Typed parsing
  parseEventAttrs,
  parseMoveEventData,
  // Types
  type EventAttribute,
  type CosmosEvent,
  type ParsedWasmEvent,
  type ParsedMoveEvent,
} from './events'
