/**
 * Initia SDK v2
 *
 * Core entry point — essential types and classes for getting started.
 * Domain-specific APIs are available via subpath exports:
 *
 * - `initia.js/client`    — gRPC client, broadcast, gas, transport
 * - `initia.js/tx`        — signing, serialize/deserialize, amino
 * - `initia.js/msgs`      — message builders (Message, msg, msgCustom, ...)
 * - `initia.js/evm`       — EVM contracts, ABI, RPC, events
 * - `initia.js/move`      — Move contracts, BCS, ABI
 * - `initia.js/wasm`      — CosmWasm contracts, schema
 * - `initia.js/bridge`    — OPInit bridge, deposit/withdraw/claim
 * - `initia.js/provider`  — RegistryProvider, CustomProvider, ...
 * - `initia.js/signer`    — Signer interfaces, KeyStore
 * - `initia.js/events`    — Event parsing, WebSocket subscriptions
 * - `initia.js/util`      — Hash, address, denom, formatting
 * - `initia.js/usernames` — .init domain resolution
 * - `initia.js/cosmos`    — CosmosRegistryProvider
 * - `initia.js/modules`  — ChainConfigBuilder, chain configs for custom chains
 * - `initia.js/codegen`  — ABI codegen CLI
 * - `initia.js/vip`      — VIP lock staking, gauge voting, rewards
 *
 * @packageDocumentation
 */

// =============================================================================
// Core - Fundamental types and utilities
// =============================================================================

export type { Numeric } from './types'
export {
  Coin,
  DecCoin,
  coin,
  coins,
  parseCoin,
  decCoin,
  parseDecCoin,
  type CoinLike,
} from './core/coin'
export { Coins, DecCoins } from './core/coins'
export { getAccount, type AccountInfo, type AuthClient } from './core/account'
export { getGasPrices, type GasPriceClient } from './client/gas'

// =============================================================================
// Errors
// =============================================================================

export {
  InitiaError,
  AccountNotFoundError,
  AssetNotFoundError,
  AuthenticationError,
  BroadcastError,
  type BroadcastErrorCategory,
  ChainNotFoundError,
  HeaderConflictError,
  isNotFoundError,
  SimulationError,
  TimeoutError,
} from './errors'

export { TxNotFoundError } from './tx/get-tx'
export type {
  DecodedTx,
  DecodedTxMessage,
  GetTxOptions,
  GetTxOptionsFor,
  AbiRegistry,
  AbiRegistryFor,
} from './tx/get-tx'

export { createSignedTx, makeStdSignDoc, makeAminoSignBytes, buildStdFee } from './tx/sign'
export { UnsignedTx } from './tx/unsigned-tx'
export type { MultisigSignature } from './tx/unsigned-tx'

// =============================================================================
// Key Management
// =============================================================================

export { Key, DEFAULT_BECH32_PREFIX } from './key'
export { RawKey } from './key'
export {
  MnemonicKey,
  INIT_COIN_TYPE,
  type MnemonicKeyOptions,
  type MnemonicKeyGenerateOptions,
} from './key'
export { HDPath, COIN_TYPE, type CoinType } from './key'
export {
  MultisigPublicKey,
  CompactBitArray,
  MultiSignature,
  encodeMultisigAminoPubKey,
} from './key/multisig'

// =============================================================================
// ChainContext
// =============================================================================

export {
  NoSignerError,
  type ChainContext,
  type ChainContextOptions,
  type GetBalanceOptions,
  type GetAccountOptions,
  type GetTokenInfoOptions,
  type Subscription,
  type BroadcastResult,
  type BroadcastResultWithWait,
  type SignBroadcastOptions,
  type EventFilter,
  type WaitForEventOptions,
} from './wallet'

export type {
  TypedContextOptions,
  TypedContextFactory,
  TypedFactoryOptions,
} from './wallet/typed-context'

// =============================================================================
// Provider types (also available from initia.js/provider)
// =============================================================================

export type {
  ChainInfo,
  ChainInfoForType,
  ChainInfoProvider,
  ChainDataProvider,
} from './provider/types'

// =============================================================================
// Chain Config - ChainConfigBuilder (chain configs via initia.js/modules)
// =============================================================================

export {
  createChainConfig,
  ChainConfigBuilder,
  type ChainConfig,
  type CoreMsgMethods,
} from './chain-config'

// =============================================================================
// Message - Core types (also available from initia.js/msgs)
// =============================================================================

export { Message, type MsgInput, type JsonMsg } from './msgs'

// =============================================================================
// Token - VM-agnostic abstraction
// =============================================================================

export {
  resolveTokenContract,
  type TokenContract,
  type EvmEnabled,
  type WasmEnabled,
  type MoveEnabled,
} from './token'

// =============================================================================
// Contracts - VM-agnostic ABI helper
// =============================================================================

export { abi } from './contracts/abi-helpers'
