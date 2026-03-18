/**
 * Provider types for chain information resolution.
 */

import type { TransportFactory } from '../client/transport-common'
import type { ChainType, NetworkType } from '../client/types'
import type { Coin } from '../core/coin'
import type { AssetList } from '@initia/initia-registry-types'
import type { AssetList as CosmosAssetList } from '@chain-registry/types'

/**
 * Chain information - flat interface for all chain types.
 *
 * Use chainType to determine chain capabilities:
 * ```typescript
 * if (chainInfo.chainType === 'minievm') {
 *   chainInfo.evmRpc // EVM RPC available
 * }
 * ```
 */
export interface ChainInfo {
  /** Unique chain identifier (e.g., 'initiation-2', 'minimove-1') */
  chainId: string

  /** Human-readable chain name */
  chainName: string

  /** Chain type discriminator */
  chainType: ChainType

  /** Network type (mainnet, testnet, local, or custom) */
  network: NetworkType

  /** CometBFT RPC endpoint URL (optional, for HTTP RPC client and WebSocket derivation) */
  rpc?: string

  /** REST/LCD endpoint URL (optional, not currently used by SDK) */
  rest?: string

  /** gRPC endpoint URL (optional) */
  grpc?: string

  /** gRPC-Web endpoint URL (optional, for browser environments) */
  grpcWeb?: string

  /** WebSocket endpoint URL (optional, for real-time subscriptions) */
  wss?: string

  /** EVM JSON-RPC HTTP endpoint URL (optional, primarily for minievm chains) */
  evmRpc?: string

  /** EVM JSON-RPC WebSocket endpoint URL (optional, primarily for minievm chains) */
  evmWss?: string

  /** General API endpoint URL (optional, distinct from REST) */
  api?: string

  /** Indexer API endpoint URL (optional) */
  indexer?: string

  /** Native token denom (e.g., 'uinit') */
  nativeDenom?: string

  /** Default gas price string (e.g., '0.015uinit') derived from registry fee_tokens */
  gasPrice?: string

  /** Bech32 address prefix (e.g., 'init') */
  bech32Prefix?: string

  /** EVM chain ID for minievm chains (for wallet integration) */
  evmChainId?: number

  /** BIP44 coin type (e.g., 60 for Ethereum, 118 for Cosmos) */
  slip44?: number

  /** OPInit bridge ID (L2 chains only, used for L1↔L2 deposits/withdrawals) */
  opBridgeId?: bigint

  /** OP Bridge supported denoms (from metadata.op_denoms) */
  opDenoms?: string[]

  /** OPInit Executor API URL (L2 chains only, used for withdrawal status tracking) */
  executorUri?: string

  /** Block explorer URL (first explorer) */
  explorerUrl?: string

  /** IBC channels from chain metadata (inline in registry data) */
  ibcChannels?: IbcChannelInfo[]
}

/**
 * Helper type to narrow ChainInfo for a specific chain type.
 */
export type ChainInfoForType<T extends ChainType> = ChainInfo & { chainType: T }

/**
 * Interface for chain information providers.
 *
 * All methods are synchronous - providers should be initialized before use.
 * Use factory functions (e.g., createRegistryProvider) for async initialization.
 *
 * Key implementations:
 * - RegistryProvider: Fetches from registry API (use createRegistryProvider)
 * - CustomProvider: User-defined chain configurations (sync constructor)
 * - CompositeProvider: Combines multiple providers (sync constructor)
 * - CosmosRegistryProvider: Bundled Cosmos ecosystem chains (sync constructor)
 * - LocalRegistryProvider: Local filesystem registry (use createLocalRegistryProvider)
 */
export interface ChainInfoProvider {
  /**
   * Get chain information by chain ID.
   *
   * @param chainId - The chain ID to look up
   * @returns Chain info if found, undefined otherwise
   */
  getChainInfo<T extends ChainType = ChainType>(chainId: string): ChainInfoForType<T> | undefined

  /**
   * List all available chains.
   *
   * @returns Array of all known chain configurations
   */
  listChains(): ChainInfo[]

  /**
   * Check if a chain is supported.
   *
   * @param chainId - The chain ID to check
   * @returns true if chain is available
   */
  hasChain(chainId: string): boolean

  /** Transport factory for bridge operations. Set by entry points. */
  createTransport?: TransportFactory
}

// =============================================================================
// Asset & IBC Types
// =============================================================================

/**
 * Asset information (normalized view).
 *
 * Abstracts differences between Initia registry (snake_case) and
 * Cosmos chain-registry (camelCase) into a unified interface.
 */
export interface AssetInfo {
  /** Chain ID where this asset exists */
  chainId: string
  /** Base denom (e.g., 'uinit', 'ibc/ABC...') */
  denom: string
  /** Human-readable symbol (e.g., 'INIT') */
  symbol: string
  /** Display name (e.g., 'Initia Native Token') */
  name: string
  /** Human-readable description (from registry or user input) */
  description?: string
  /** Display denom for human-readable unit (e.g., 'INIT') */
  display: string
  /** Denom units for amount conversion */
  denomUnits: Array<{ denom: string; exponent: number; aliases?: string[] }>
  /** Decimal places for display unit (derived from denomUnits) */
  decimals: number
  /** Contract address (for ERC20/CW20) */
  contractAddress?: string
  /** Logo URL */
  logoUrl?: string
  /** CoinGecko ID for price lookup */
  coingeckoId?: string
  /** Oracle symbol for price feeds (may differ from display symbol) */
  oracleSymbol?: string
  /** Original chain ID (undefined for native assets, from traces for IBC/bridged) */
  originChainId?: string
  /** Original denom on source chain (undefined for native assets) */
  originDenom?: string
  /** Asset type from registry (e.g., 'sdk.coin', 'erc20', 'cw20', 'ics20') */
  typeAsset?: string
}

/**
 * IBC channel information.
 *
 * Reflects Initia online registry's metadata.ibc_channels structure.
 * Defined from each chain's perspective (unidirectional).
 */
export interface IbcChannelInfo {
  /** Counterparty chain ID (e.g., 'noble-1', 'interwoven-1') */
  chainId: string
  /** Port ID (e.g., 'transfer', 'nft-transfer') */
  portId: string
  /** Local channel ID (e.g., 'channel-0') */
  channelId: string
  /** ICS version (e.g., 'ics20-1', 'ics721-1') */
  version: string
}

/**
 * Asset list query options.
 */
export interface ListAssetsOptions {
  /** Filter by chain ID */
  chainId?: string
  /** Filter by symbol (case-insensitive) */
  symbol?: string
}

/**
 * OP Bridge information (Initia L1 <-> L2).
 */
export interface OpBridgeInfo {
  /** Bridge ID (from metadata.op_bridge_id) */
  bridgeId: bigint
  /** L2 chain ID */
  l2ChainId: string
  /** OP Bridge supported denoms (from metadata.op_denoms) */
  denoms: string[]
  /** OPinit executor API URL (from metadata.executor_uri) */
  executorUri?: string
}

/**
 * IBC transfer path information.
 * Returned by getTransferPath() for IBC channel-based single-hop routes.
 */
export interface TransferPath {
  /** Source chain ID */
  sourceChainId: string
  /** Destination chain ID */
  destChainId: string
  /** IBC channel ID (e.g., 'channel-0') */
  channel: string
  /** Port ID (e.g., 'transfer') */
  port: string
}

// =============================================================================
// Type Guards
// =============================================================================

/**
 * Type guard: Initia AssetList (snake_case).
 * Initia registry uses snake_case: chain_name, denom_units, type_asset, logo_URIs
 */
export function isInitiaAssetList(raw: AssetList | CosmosAssetList): raw is AssetList {
  return 'chain_name' in raw
}

/**
 * Type guard: Cosmos AssetList (camelCase).
 * Cosmos chain-registry uses camelCase: chainName, denomUnits, typeAsset, logoURIs
 */
export function isCosmosAssetList(raw: AssetList | CosmosAssetList): raw is CosmosAssetList {
  return 'chainName' in raw
}

// =============================================================================
// Unified Provider Interface
// =============================================================================

/**
 * Unified provider interface for chain info, assets, and IBC channels.
 *
 * Extends ChainInfoProvider with asset and IBC data capabilities.
 * All async methods may trigger network requests on first call
 * (implementations should cache results).
 */
export interface ChainDataProvider extends ChainInfoProvider {
  // === Assets ===

  /**
   * Get all assets for a specific chain.
   * @param chainId - Chain ID to look up
   */
  getAssets(chainId: string): Promise<AssetInfo[]>

  /**
   * Get raw AssetList for advanced usage.
   * Returns Initia AssetList (snake_case) or Cosmos AssetList (camelCase) depending on provider.
   * Use type guards: isInitiaAssetList(raw) or isCosmosAssetList(raw)
   * CustomProvider always returns undefined (data is already normalized).
   */
  getRawAssetList(chainId: string): Promise<AssetList | CosmosAssetList | undefined>

  /**
   * Find asset by denom.
   * Always provide chainId for predictable results.
   * @param denom - Base denom (e.g., 'uinit', 'ibc/ABC...')
   * @param chainId - Chain ID (strongly recommended)
   */
  findAsset(denom: string, chainId?: string): Promise<AssetInfo | undefined>

  /**
   * Find multiple assets by denoms (batch operation).
   * @param denoms - Array of base denoms
   * @param chainId - Chain ID (required for deterministic results)
   * @returns Map of denom to AssetInfo (undefined if not found)
   */
  findAssets(denoms: string[], chainId: string): Promise<Map<string, AssetInfo | undefined>>

  /**
   * Find assets by symbol (case-insensitive).
   * Returns array since same symbol can exist on multiple chains.
   * @param symbol - Display symbol (e.g., 'USDC')
   * @param chainId - Optional chain filter
   */
  findAssetBySymbol(symbol: string, chainId?: string): Promise<AssetInfo[]>

  /**
   * List assets with optional filtering.
   * @param options - Filter options (chainId, symbol)
   */
  listAssets(options?: ListAssetsOptions): Promise<AssetInfo[]>

  // === IBC ===

  /**
   * Get IBC channels for a chain.
   */
  getIbcChannels(chainId: string): IbcChannelInfo[]

  /**
   * Get IBC channel between two chains.
   * Returns the first matching channel.
   */
  getIbcChannel(fromChainId: string, toChainId: string): IbcChannelInfo | undefined

  /**
   * Get IBC transfer path between chains.
   * Returns undefined for OP Bridge routes — use getOpBridge() instead.
   * @param denom - Reserved for future denom-aware routing
   */
  getTransferPath(fromChainId: string, toChainId: string, denom?: string): TransferPath | undefined

  /**
   * Get OP Bridge info for L2 chain.
   */
  getOpBridge(l2ChainId: string): OpBridgeInfo | undefined

  // === Amount Conversion ===

  /**
   * Convert amount between denom units.
   * @example convertAmount('1000000', 'uinit', 'INIT', 'interwoven-1') → '1'
   */
  convertAmount(
    amount: string,
    fromDenom: string,
    toDenom: string,
    chainId: string
  ): Promise<string>

  /**
   * Convert base amount to display amount.
   * @param coin - Coin with base denom and base amount
   * @param chainId - Chain ID to look up decimals
   */
  toDisplayAmount(coin: Coin, chainId: string): Promise<string>

  /**
   * Convert display amount to base amount.
   * @param amount - Display amount as string (e.g., '1', '1.5')
   * @param denom - Base denom only (e.g., 'uinit')
   * @param chainId - Chain ID to look up decimals
   */
  toBaseAmount(amount: string, denom: string, chainId: string): Promise<string>

  /**
   * Format base amount for display (with symbol).
   * @example formatAmount(coin('uinit', '1000000'), 'interwoven-1') → '1 INIT'
   */
  formatAmount(
    coin: Coin,
    chainId: string,
    options?: { maxDecimals?: number; minDecimals?: number; trimTrailingZeros?: boolean }
  ): Promise<string>

  // === Resolution ===

  /**
   * Resolve chain_name to chain_id.
   * @param chainName - Chain name (e.g., 'noble', 'osmosis')
   * @param network - Optional network filter
   */
  resolveChainId(chainName: string, network?: NetworkType): string | undefined

  /**
   * Get chain_name from chain_id (reverse of resolveChainId).
   */
  getChainName(chainId: string): string | undefined

  // === Provider Management ===

  /**
   * Refresh provider data (re-fetch from source).
   * Returns partial failure info if some sub-operations failed.
   */
  refresh(): Promise<RefreshResult>
}

/** Result of a provider refresh operation. */
export interface RefreshResult {
  /** Errors from partial failures (e.g., one of multiple registries was unreachable). */
  errors?: Error[]
}
