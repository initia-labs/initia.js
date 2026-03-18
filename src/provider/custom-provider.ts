/**
 * Custom chain info provider.
 *
 * Allows users to define their own chain configurations with assets and IBC channels.
 * Useful for local testnets, private chains, or custom setups.
 *
 * Two input styles:
 * - **Programmatic** (TypeScript types): constructor, addChain, addAssets, addIbcChannel
 * - **JSON import** (flexible formats): CustomProvider.from(), addAssetList()
 */

import * as v from 'valibot'
import type { AssetList } from '@initia/initia-registry-types'
import type { AssetList as CosmosAssetList } from '@chain-registry/types'
import type { ChainType, NetworkType } from '../client/types'
import type {
  ChainInfo,
  ChainInfoForType,
  AssetInfo,
  IbcChannelInfo,
  ListAssetsOptions,
  OpBridgeInfo,
  TransferPath,
} from './types'
import { BaseChainDataProvider } from './base-provider'
import { Bridge } from '../bridge/bridge'
import { ROUTER_URLS } from '../bridge/constants'
import { ValidationError } from '../errors'

// =============================================================================
// Valibot Schema (chain-registry format validation for from())
// =============================================================================

const ApiEndpoint = v.object({ address: v.string() })

/**
 * Chain schema for validating chain-registry format (snake_case).
 * Used by CustomProvider.from() for JSON input.
 */
const ChainInputSchema = v.object({
  chain_id: v.string(),
  chain_name: v.string(),
  pretty_name: v.optional(v.string()),
  network_type: v.picklist(['mainnet', 'testnet', 'devnet']),
  bech32_prefix: v.string(),
  slip44: v.optional(v.number()),
  apis: v.object({
    rpc: v.optional(v.array(ApiEndpoint)),
    rest: v.optional(v.array(ApiEndpoint)),
    grpc: v.optional(v.array(ApiEndpoint)),
    'grpc-web': v.optional(v.array(ApiEndpoint)),
    wss: v.optional(v.array(ApiEndpoint)),
    'json-rpc': v.optional(v.array(ApiEndpoint)),
    'json-rpc-websocket': v.optional(v.array(ApiEndpoint)),
  }),
  fees: v.object({
    fee_tokens: v.pipe(v.array(v.object({ denom: v.string() })), v.minLength(1)),
  }),
  metadata: v.optional(
    v.object({
      is_l1: v.optional(v.boolean()),
      minitia: v.optional(
        v.object({
          type: v.picklist(['minimove', 'miniwasm', 'minievm', 'custom']),
        })
      ),
    })
  ),
  assets: v.optional(v.array(v.record(v.string(), v.unknown()))),
  ibc_channels: v.optional(v.array(v.record(v.string(), v.unknown()))),
})

type ChainInput = v.InferOutput<typeof ChainInputSchema>

// =============================================================================
// Helper Functions (module-level)
// =============================================================================

/**
 * Convert chain-registry ChainInput to ChainInfo.
 */
function toChainInfo(chain: ChainInput): ChainInfo {
  return {
    chainId: chain.chain_id,
    chainName: chain.pretty_name ?? chain.chain_name,
    chainType: detectChainType(chain),
    network: mapNetworkType(chain.network_type),
    rpc: chain.apis.rpc?.[0]?.address,
    rest: chain.apis.rest?.[0]?.address,
    grpc: chain.apis.grpc?.[0]?.address,
    grpcWeb: chain.apis['grpc-web']?.[0]?.address,
    wss: chain.apis.wss?.[0]?.address,
    evmRpc: chain.apis['json-rpc']?.[0]?.address,
    evmWss: chain.apis['json-rpc-websocket']?.[0]?.address,
    nativeDenom: chain.fees.fee_tokens[0]?.denom,
    bech32Prefix: chain.bech32_prefix,
    slip44: chain.slip44,
  }
}

/**
 * Detect chain type from registry metadata.
 */
function detectChainType(chain: ChainInput): ChainType {
  if (chain.metadata?.is_l1) return 'initia'
  const minitiaType = chain.metadata?.minitia?.type
  if (minitiaType === 'minievm') return 'minievm'
  if (minitiaType === 'miniwasm') return 'miniwasm'
  if (minitiaType === 'minimove') return 'minimove'
  return 'other'
}

/**
 * Map registry network type to our NetworkType.
 */
function mapNetworkType(networkType: ChainInput['network_type']): NetworkType {
  if (networkType === 'mainnet') return 'mainnet'
  if (networkType === 'testnet') return 'testnet'
  return 'local'
}

/**
 * Parse JSON with a contextual error message.
 */
function parseJson(input: string, context: string): unknown {
  try {
    return JSON.parse(input)
  } catch (err) {
    throw new ValidationError(
      'input',
      `${context}: invalid JSON input: ${err instanceof Error ? err.message : String(err)}`
    )
  }
}

/**
 * Validate a single chain input against the schema.
 */
function parseChainInput(item: unknown): ChainInput {
  try {
    return v.parse(ChainInputSchema, item)
  } catch (err) {
    const hint =
      typeof item === 'object' && item !== null && 'chain_id' in item
        ? ` for chain '${String((item as Record<string, unknown>).chain_id)}'`
        : ''
    throw new ValidationError(
      'input',
      `CustomProvider.from(): invalid chain input${hint}: ${err instanceof Error ? err.message : String(err)}`
    )
  }
}

/** Safe string extraction from unknown value. */
const str = (v: unknown): string | undefined => (typeof v === 'string' ? v : undefined)

/* eslint-disable @typescript-eslint/no-base-to-string -- intentional String() coercion from unknown */
/**
 * Normalize flexible asset input to AssetInfo.
 * Supports Initia (snake_case), Cosmos (camelCase), and minimal formats.
 */
function normalizeAssetInput(raw: Record<string, unknown>, chainId: string): AssetInfo {
  const denomUnits = ((raw.denomUnits ?? raw.denom_units ?? []) as Record<string, unknown>[]).map(
    u => ({
      denom: String(u.denom),
      exponent: Number(u.exponent),
      ...((u.aliases as string[])?.length ? { aliases: u.aliases as string[] } : {}),
    })
  )

  const denomRaw = raw.denom ?? raw.base
  const denom = typeof denomRaw === 'string' ? denomRaw : ''
  if (!denom) {
    throw new ValidationError(
      'input',
      `Asset input missing required 'denom' or 'base' field (chainId: ${chainId})`
    )
  }
  const symbol = String(raw.symbol ?? '')
  const display = String(raw.display ?? symbol)
  const displayUnit = denomUnits.find(u => u.denom === display)
  const decimals = typeof raw.decimals === 'number' ? raw.decimals : (displayUnit?.exponent ?? 0)

  const logoURIs = (raw.logoURIs ?? raw.logo_URIs) as Record<string, string> | undefined
  const images = raw.images as Array<Record<string, string>> | undefined

  return {
    chainId,
    denom,
    symbol,
    name: String(raw.name ?? symbol),
    description: str(raw.description),
    display,
    denomUnits,
    decimals,
    contractAddress: str(raw.contractAddress ?? raw.contract_address ?? raw.address),
    logoUrl: str(raw.logoUrl ?? logoURIs?.png ?? images?.[0]?.png),
    coingeckoId: str(raw.coingeckoId ?? raw.coingecko_id),
    oracleSymbol: str(raw.oracleSymbol ?? raw.oracle_symbol),
    originChainId: str(raw.originChainId ?? raw.origin_chain_id),
    originDenom: str(raw.originDenom ?? raw.origin_denom),
    typeAsset: str(raw.typeAsset ?? raw.type_asset),
  }
}

/**
 * Normalize flexible IBC channel input to IbcChannelInfo.
 * Supports snake_case and camelCase field names.
 */
function normalizeIbcChannelInput(raw: Record<string, unknown>): IbcChannelInfo {
  return {
    chainId: String(raw.chainId ?? raw.chain_id ?? ''),
    portId: String(raw.portId ?? raw.port_id ?? 'transfer'),
    channelId: String(raw.channelId ?? raw.channel_id ?? ''),
    version: String(raw.version ?? 'ics20-1'),
  }
}
/* eslint-enable @typescript-eslint/no-base-to-string */

// =============================================================================
// Types
// =============================================================================

/**
 * Extended chain config with optional inline assets and IBC channels.
 * Used with constructor and addChain() for one-step chain registration.
 */
export interface CustomChainConfig extends ChainInfo {
  /** Assets on this chain (normalized format) */
  assets?: AssetInfo[]
  /** IBC channels from this chain */
  ibcChannels?: IbcChannelInfo[]
}

/**
 * Flexible asset list input for addAssetList().
 * Supports both snake_case and camelCase identifiers.
 */
export interface AssetListInput {
  /** Chain ID (camelCase) */
  chainId?: string
  /** Chain ID (snake_case) */
  chain_id?: string
  /** Assets in any supported format (snake_case, camelCase, or minimal) */
  assets: Record<string, unknown>[]
}

// =============================================================================
// CustomProvider Class
// =============================================================================

/**
 * Custom chain info provider.
 *
 * Provides chain information, assets, and IBC channels from user-defined configurations.
 * Supports dynamic addition and removal of chains.
 *
 * @example Basic usage (programmatic)
 * ```typescript
 * const provider = new CustomProvider([
 *   {
 *     chainId: 'my-local-chain',
 *     chainName: 'My Local Chain',
 *     chainType: 'initia',
 *     network: 'local',
 *     grpc: 'localhost:9090',
 *     nativeDenom: 'utoken',
 *     assets: [
 *       { chainId: 'my-local-chain', denom: 'utoken', symbol: 'TOKEN', name: 'Token',
 *         display: 'token', denomUnits: [{ denom: 'utoken', exponent: 0 }, { denom: 'token', exponent: 6 }],
 *         decimals: 6 },
 *     ],
 *   }
 * ])
 * ```
 *
 * @example From chain-registry JSON
 * ```typescript
 * const provider = CustomProvider.from({
 *   chain_id: 'my-chain', chain_name: 'my-chain', network_type: 'testnet',
 *   bech32_prefix: 'init', apis: { grpc: [{ address: 'localhost:9090' }] },
 *   fees: { fee_tokens: [{ denom: 'utoken' }] },
 *   assets: [{ denom: 'utoken', symbol: 'TOKEN', name: 'Token', decimals: 6, denom_units: [...] }],
 * })
 * ```
 */
export class CustomProvider extends BaseChainDataProvider {
  private chains: Map<string, ChainInfo>
  private assetMap: Map<string, AssetInfo[]> = new Map()
  private ibcMap: Map<string, IbcChannelInfo[]> = new Map()
  private _bridge?: Bridge

  constructor(chains: (ChainInfo | CustomChainConfig)[] = []) {
    super()
    this.chains = new Map()
    for (const chain of chains) {
      this.chains.set(chain.chainId, chain)
      if ('assets' in chain && chain.assets?.length) {
        this.assetMap.set(chain.chainId, [...chain.assets])
      }
      if ('ibcChannels' in chain && chain.ibcChannels?.length) {
        this.ibcMap.set(chain.chainId, [...chain.ibcChannels])
      }
    }
  }

  /**
   * Create a CustomProvider from chain-registry JSON (snake_case format).
   *
   * Validates input with Valibot schema. Supports inline assets and IBC channels.
   *
   * @param input - JSON string, ChainInput object, or ChainInput array
   * @returns CustomProvider instance with validated chain(s)
   * @throws If input is invalid JSON or fails schema validation
   */
  static from(input: string | ChainInput | ChainInput[]): CustomProvider {
    const data: unknown =
      typeof input === 'string' ? parseJson(input, 'CustomProvider.from()') : input
    const items = Array.isArray(data) ? data : [data]

    const provider = new CustomProvider()
    for (const item of items) {
      const validated = parseChainInput(item)
      const chainInfo = toChainInfo(validated)
      provider.chains.set(chainInfo.chainId, chainInfo)

      // Normalize inline assets if present
      if (validated.assets?.length) {
        const assets = validated.assets.map(a => normalizeAssetInput(a, chainInfo.chainId))
        provider.assetMap.set(chainInfo.chainId, assets)
      }

      // Normalize inline IBC channels if present
      if (validated.ibc_channels?.length) {
        const channels = validated.ibc_channels.map(c => normalizeIbcChannelInput(c))
        provider.ibcMap.set(chainInfo.chainId, channels)
      }
    }

    return provider
  }

  // === Mutation methods ===

  /**
   * Add a chain configuration.
   * Overwrites if chain with same ID already exists.
   * Optionally includes inline assets and IBC channels.
   */
  addChain(chain: CustomChainConfig): void {
    this.chains.set(chain.chainId, chain)
    if (chain.assets?.length) {
      this.addAssets(chain.chainId, chain.assets)
    }
    if (chain.ibcChannels?.length) {
      const existing = this.ibcMap.get(chain.chainId) ?? []
      existing.push(...chain.ibcChannels)
      this.ibcMap.set(chain.chainId, existing)
    }
  }

  /**
   * Remove a chain and its associated assets and IBC channels.
   * @returns true if chain was removed, false if not found
   */
  removeChain(chainId: string): boolean {
    this.assetMap.delete(chainId)
    this.ibcMap.delete(chainId)
    return this.chains.delete(chainId)
  }

  /**
   * Add assets for a chain. Merges with existing assets (dedup by denom).
   */
  addAssets(chainId: string, assets: AssetInfo[]): void {
    const existing = this.assetMap.get(chainId) ?? []
    const denomSet = new Set(existing.map(a => a.denom))
    for (const asset of assets) {
      if (denomSet.has(asset.denom)) {
        const idx = existing.findIndex(a => a.denom === asset.denom)
        existing[idx] = asset
      } else {
        existing.push(asset)
        denomSet.add(asset.denom)
      }
    }
    this.assetMap.set(chainId, existing)
  }

  /**
   * Add asset list from flexible input (supports snake_case/camelCase).
   * @param input - JSON string or AssetListInput with dual-case fields
   */
  addAssetList(input: AssetListInput | string): void {
    const data: AssetListInput =
      typeof input === 'string' ? (parseJson(input, 'addAssetList()') as AssetListInput) : input
    const chainId = String(data.chainId ?? data.chain_id ?? '')
    if (!chainId)
      throw new ValidationError('input', 'chainId or chain_id is required in asset list input')
    const assets = data.assets.map(a => normalizeAssetInput(a, chainId))
    this.addAssets(chainId, assets)
  }

  /**
   * Add an IBC channel for a chain.
   * Accepts normalized IbcChannelInfo or flexible Record input.
   */
  addIbcChannel(chainId: string, channel: IbcChannelInfo | Record<string, unknown>): void {
    const normalized =
      'chainId' in channel && 'portId' in channel && 'channelId' in channel && 'version' in channel
        ? (channel as IbcChannelInfo)
        : normalizeIbcChannelInput(channel)
    const existing = this.ibcMap.get(chainId) ?? []
    existing.push(normalized)
    this.ibcMap.set(chainId, existing)
  }

  // === Bridge ===

  get bridge(): Bridge {
    if (!this._bridge) {
      if (this.chains.size === 0) {
        throw new ValidationError(
          'input',
          'Cannot access bridge on empty CustomProvider — add at least one chain first.'
        )
      }
      const firstChain = this.chains.values().next().value as ChainInfo
      const network = firstChain.network
      const routerUrl =
        network === 'mainnet' || network === 'testnet'
          ? ROUTER_URLS[network as 'mainnet' | 'testnet']
          : undefined
      if (!this.createTransport) {
        throw new ValidationError(
          'input',
          'createTransport not set — bridge requires transport injection. Use a typed context factory (e.g., createInitiaContext).'
        )
      }
      this._bridge = new Bridge(this, this.createTransport, routerUrl)
    }
    return this._bridge
  }

  // === ChainInfoProvider methods (preserved) ===

  getChainInfo<T extends ChainType = ChainType>(chainId: string): ChainInfoForType<T> | undefined {
    return this.chains.get(chainId) as ChainInfoForType<T> | undefined
  }

  listChains(): ChainInfo[] {
    return Array.from(this.chains.values())
  }

  hasChain(chainId: string): boolean {
    return this.chains.has(chainId)
  }

  // === Asset methods ===

  // eslint-disable-next-line @typescript-eslint/require-await
  async getAssets(chainId: string): Promise<AssetInfo[]> {
    return this.assetMap.get(chainId) ?? []
  }

  // eslint-disable-next-line @typescript-eslint/require-await
  async getRawAssetList(_chainId: string): Promise<AssetList | CosmosAssetList | undefined> {
    return undefined // CustomProvider stores normalized data, no raw format
  }

  async findAsset(denom: string, chainId?: string): Promise<AssetInfo | undefined> {
    if (chainId) {
      const assets = await this.getAssets(chainId)
      return assets.find(a => a.denom === denom)
    }
    for (const cid of this.chains.keys()) {
      const assets = await this.getAssets(cid)
      const found = assets.find(a => a.denom === denom)
      if (found) return found
    }
    return undefined
  }

  async findAssetBySymbol(symbol: string, chainId?: string): Promise<AssetInfo[]> {
    const upper = symbol.toUpperCase()
    if (chainId) {
      const assets = await this.getAssets(chainId)
      return assets.filter(a => a.symbol.toUpperCase() === upper)
    }
    const results: AssetInfo[] = []
    for (const cid of this.chains.keys()) {
      const assets = await this.getAssets(cid)
      results.push(...assets.filter(a => a.symbol.toUpperCase() === upper))
    }
    return results
  }

  async listAssets(options?: ListAssetsOptions): Promise<AssetInfo[]> {
    if (options?.chainId) {
      const assets = await this.getAssets(options.chainId)
      if (options.symbol) {
        const upper = options.symbol.toUpperCase()
        return assets.filter(a => a.symbol.toUpperCase() === upper)
      }
      return assets
    }
    const all: AssetInfo[] = []
    for (const cid of this.chains.keys()) {
      all.push(...(await this.getAssets(cid)))
    }
    if (options?.symbol) {
      const upper = options.symbol.toUpperCase()
      return all.filter(a => a.symbol.toUpperCase() === upper)
    }
    return all
  }

  // === IBC methods ===

  getIbcChannels(chainId: string): IbcChannelInfo[] {
    return this.ibcMap.get(chainId) ?? []
  }

  getIbcChannel(fromChainId: string, toChainId: string): IbcChannelInfo | undefined {
    const channels = this.getIbcChannels(fromChainId)
    return channels.find(ch => ch.chainId === toChainId)
  }

  getTransferPath(
    fromChainId: string,
    toChainId: string,
    _denom?: string
  ): TransferPath | undefined {
    const channel = this.getIbcChannel(fromChainId, toChainId)
    if (!channel || channel.version !== 'ics20-1') return undefined
    return {
      sourceChainId: fromChainId,
      destChainId: toChainId,
      channel: channel.channelId,
      port: channel.portId,
    }
  }

  getOpBridge(_l2ChainId: string): OpBridgeInfo | undefined {
    return undefined // CustomProvider doesn't support OP Bridge
  }

  // === Resolution methods ===

  resolveChainId(chainName: string, network?: NetworkType): string | undefined {
    const lower = chainName.toLowerCase()
    for (const chain of this.chains.values()) {
      if (chain.chainName.toLowerCase() === lower) {
        if (!network || chain.network === network) return chain.chainId
      }
    }
    return undefined
  }

  getChainName(chainId: string): string | undefined {
    return this.chains.get(chainId)?.chainName
  }
}
