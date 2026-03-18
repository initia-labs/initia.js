/**
 * API-based chain data provider.
 *
 * Fetches chain and asset information from the Initia registry API.
 * - Mainnet: https://registry.initia.xyz
 * - Testnet: https://registry.testnet.initia.xyz
 *
 * Use createRegistryProvider() factory function for initialization.
 */

import type { Chain, AssetList } from '@initia/initia-registry-types'
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
  RefreshResult,
} from './types'
import { BaseChainDataProvider } from './base-provider'
import { DEFAULT_REGISTRY_TIMEOUT_MS } from '../constants'
import { toChainInfo, toAssetInfo } from './chain-utils'
import { fetchWithTimeout } from '../util/fetch'
import { InitiaError } from '../errors'
import { Bridge } from '../bridge/bridge'
import { ROUTER_URLS } from '../bridge/constants'

/**
 * Registry URLs by network type.
 */
const REGISTRY_URLS: Record<'mainnet' | 'testnet', string> = {
  mainnet: 'https://registry.initia.xyz',
  testnet: 'https://registry.testnet.initia.xyz',
}

/** Default concurrency limit for batch asset fetching */
const BATCH_CONCURRENCY = 10

/**
 * Options for creating a RegistryProvider.
 */
export interface RegistryProviderOptions {
  /** Filter by network type. If not specified, fetches from all networks. */
  network?: 'mainnet' | 'testnet'
  /** Request timeout in milliseconds (default: 10000) */
  timeout?: number
  /**
   * Prefetch asset lists during initialization.
   * - true: prefetch all chains
   * - string[]: prefetch specific chain IDs
   * - false/undefined: lazy load on demand (default)
   */
  prefetchAssets?: boolean | string[]
}

// =============================================================================
// Network Helpers (module-level)
// =============================================================================

/**
 * Fetch chains from a specific registry URL.
 * Throws on network errors and non-OK HTTP responses.
 */
async function fetchChains(registryUrl: string, timeout: number): Promise<Chain[]> {
  const url = `${registryUrl}/chains.json`
  const response = await fetchWithTimeout(url, { timeoutMs: timeout })
  if (!response.ok) {
    throw new InitiaError(`Registry returned HTTP ${response.status} for ${url}`)
  }
  return (await response.json()) as Chain[]
}

/**
 * Fetch chains from multiple networks with partial-failure tolerance.
 * Throws if all fetches fail; warns on partial failure.
 */
interface FetchChainsResult {
  chains: Chain[]
  errors?: Error[]
}

async function fetchChainsFromNetworks(
  networks: Array<'mainnet' | 'testnet'>,
  timeout: number
): Promise<FetchChainsResult> {
  const results = await Promise.allSettled(
    networks.map(net => fetchChains(REGISTRY_URLS[net], timeout))
  )

  const chains: Chain[] = []
  const failures: Array<{ network: string; error: Error }> = []

  for (let i = 0; i < results.length; i++) {
    const result = results[i]
    if (result.status === 'fulfilled') {
      chains.push(...result.value)
    } else {
      const reason: unknown = result.reason
      failures.push({
        network: networks[i],
        error: reason instanceof Error ? reason : new Error(String(reason)),
      })
    }
  }

  if (chains.length === 0 && failures.length > 0) {
    const names = failures.map(f => f.network).join(', ')
    throw new InitiaError(
      `Failed to fetch chains from ${names} registry: ${failures[0].error.message}`
    )
  }

  const errors = failures.length > 0 ? failures.map(f => f.error) : undefined

  return { chains, errors }
}

/**
 * Fetch a single asset list from URL.
 */
async function fetchAssetList(url: string, timeout: number): Promise<AssetList | null> {
  try {
    const response = await fetchWithTimeout(url, { timeoutMs: timeout })
    if (!response.ok) return null
    return (await response.json()) as AssetList
  } catch (err) {
    if (err instanceof DOMException && err.name === 'AbortError') throw err
    return null
  }
}

/**
 * Batch fetch asset lists with concurrency limit.
 */
async function batchFetchAssets(
  entries: Array<[chainId: string, url: string]>,
  timeout: number
): Promise<Map<string, AssetList>> {
  const result = new Map<string, AssetList>()

  for (let i = 0; i < entries.length; i += BATCH_CONCURRENCY) {
    const batch = entries.slice(i, i + BATCH_CONCURRENCY)
    const fetched = await Promise.all(
      batch.map(async ([chainId, url]) => {
        const assetList = await fetchAssetList(url, timeout)
        return [chainId, assetList] as const
      })
    )
    for (const [chainId, assetList] of fetched) {
      if (assetList) result.set(chainId, assetList)
    }
  }

  return result
}

// =============================================================================
// Build Helpers (module-level)
// =============================================================================

/**
 * Build internal maps from raw chains.
 */
function buildMaps(rawChains: Chain[]): {
  chains: Map<string, ChainInfo>
  assetlistUrls: Map<string, string>
  chainNameToIds: Map<string, string[]>
  chainIdToName: Map<string, string>
} {
  const chains = new Map<string, ChainInfo>()
  const assetlistUrls = new Map<string, string>()
  const chainNameToIds = new Map<string, string[]>()
  const chainIdToName = new Map<string, string>()

  for (const raw of rawChains) {
    const chainId = raw.chain_id
    // First occurrence wins (in case of duplicates across networks)
    if (chains.has(chainId)) continue

    chains.set(chainId, toChainInfo(raw))

    // Assetlist URL from metadata
    const assetlistUrl = (raw.metadata as Record<string, unknown> | undefined)?.assetlist as
      | string
      | undefined
    if (assetlistUrl) {
      assetlistUrls.set(chainId, assetlistUrl)
    }

    // Name mappings
    const name = raw.chain_name
    chainIdToName.set(chainId, name)
    const existing = chainNameToIds.get(name) ?? []
    existing.push(chainId)
    chainNameToIds.set(name, existing)
  }

  return { chains, assetlistUrls, chainNameToIds, chainIdToName }
}

/**
 * Prefetch assets based on options.
 */
async function prefetchIfNeeded(
  assetlistUrls: Map<string, string>,
  prefetchAssets: boolean | string[] | undefined,
  timeout: number
): Promise<Map<string, AssetList>> {
  if (!prefetchAssets) return new Map()

  if (prefetchAssets === true) {
    return batchFetchAssets(Array.from(assetlistUrls), timeout)
  }

  const entries: Array<[string, string]> = []
  for (const chainId of prefetchAssets) {
    const url = assetlistUrls.get(chainId)
    if (url) entries.push([chainId, url])
  }
  return batchFetchAssets(entries, timeout)
}

// =============================================================================
// RegistryProvider Class
// =============================================================================

/**
 * Registry-based chain data provider.
 *
 * Provides chain info, asset data, and IBC channel information
 * from the Initia registry API. Asset lists are lazily loaded on demand.
 *
 * This class is synchronous for chain info queries after initialization.
 * Asset queries may trigger lazy network requests on first call.
 * Use createRegistryProvider() to create an instance.
 */
export class RegistryProvider extends BaseChainDataProvider {
  private chains: Map<string, ChainInfo>
  private assetlistUrls: Map<string, string>
  private assetMap: Map<string, AssetList> = new Map()
  private assetInfoCache: Map<string, AssetInfo[]> = new Map()
  private chainNameToIds: Map<string, string[]>
  private chainIdToName: Map<string, string>
  private pendingFetches: Map<string, Promise<AssetList | null>> = new Map()
  private pendingAllLoad: Promise<void> | null = null
  private refreshOptions: RegistryProviderOptions
  private _bridge?: Bridge

  /**
   * @internal Use createRegistryProvider() instead
   */
  constructor(init: {
    chains: Map<string, ChainInfo>
    assetlistUrls: Map<string, string>
    chainNameToIds: Map<string, string[]>
    chainIdToName: Map<string, string>
    assetMap: Map<string, AssetList>
    options: RegistryProviderOptions
  }) {
    super()
    this.chains = init.chains
    this.assetlistUrls = init.assetlistUrls
    this.chainNameToIds = init.chainNameToIds
    this.chainIdToName = init.chainIdToName
    this.assetMap = init.assetMap
    this.refreshOptions = init.options
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

  async getAssets(chainId: string): Promise<AssetInfo[]> {
    await this.ensureAssetLoaded(chainId)

    const cached = this.assetInfoCache.get(chainId)
    if (cached) return cached

    const raw = this.assetMap.get(chainId)
    if (!raw) return []

    const infos = raw.assets.map(a => toAssetInfo(a, chainId))
    this.assetInfoCache.set(chainId, infos)
    return infos
  }

  async getRawAssetList(chainId: string): Promise<AssetList | CosmosAssetList | undefined> {
    await this.ensureAssetLoaded(chainId)
    return this.assetMap.get(chainId)
  }

  async findAsset(denom: string, chainId?: string): Promise<AssetInfo | undefined> {
    if (chainId) {
      const assets = await this.getAssets(chainId)
      return assets.find(a => a.denom === denom)
    }
    // Search all chains
    await this.ensureAllAssetsLoaded()
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
    await this.ensureAllAssetsLoaded()
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
    await this.ensureAllAssetsLoaded()
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
    return this.chains.get(chainId)?.ibcChannels ?? []
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

  getOpBridge(l2ChainId: string): OpBridgeInfo | undefined {
    const chain = this.chains.get(l2ChainId)
    if (!chain?.opBridgeId) return undefined
    return {
      bridgeId: chain.opBridgeId,
      l2ChainId,
      denoms: chain.opDenoms ?? [],
      executorUri: chain.executorUri,
    }
  }

  // === Resolution methods ===

  resolveChainId(chainName: string, network?: NetworkType): string | undefined {
    const ids = this.chainNameToIds.get(chainName)
    if (!ids?.length) return undefined
    if (!network) return ids[0]
    return ids.find(id => this.chains.get(id)?.network === network)
  }

  getChainName(chainId: string): string | undefined {
    return this.chainIdToName.get(chainId)
  }

  // === Bridge ===

  get bridge(): Bridge {
    if (!this._bridge) {
      const network = this.refreshOptions.network
      const routerUrl = network ? ROUTER_URLS[network] : undefined
      if (!this.createTransport) {
        throw new InitiaError(
          'createTransport not set — bridge requires transport injection. Use a typed context factory (e.g., createInitiaContext).'
        )
      }
      this._bridge = new Bridge(this, this.createTransport, routerUrl)
    }
    return this._bridge
  }

  // === Provider management ===

  async refresh(): Promise<RefreshResult> {
    const options = this.refreshOptions
    const timeout = options.timeout ?? DEFAULT_REGISTRY_TIMEOUT_MS
    const networks: Array<'mainnet' | 'testnet'> = options.network
      ? [options.network]
      : ['mainnet', 'testnet']

    const { chains: rawChains, errors } = await fetchChainsFromNetworks(networks, timeout)

    // Rebuild all maps
    const { chains, assetlistUrls, chainNameToIds, chainIdToName } = buildMaps(rawChains)

    // Prefetch if configured
    const assetMap = await prefetchIfNeeded(assetlistUrls, options.prefetchAssets, timeout)

    // Replace internal state
    this.chains = chains
    this.assetlistUrls = assetlistUrls
    this.chainNameToIds = chainNameToIds
    this.chainIdToName = chainIdToName
    this.assetMap = assetMap
    this.assetInfoCache = new Map()
    this.pendingFetches = new Map()
    this.pendingAllLoad = null
    this._bridge = undefined
    return errors ? { errors } : {}
  }

  // === Lazy loading (private) ===

  private async ensureAssetLoaded(chainId: string): Promise<void> {
    if (this.assetMap.has(chainId)) return

    const url = this.assetlistUrls.get(chainId)
    if (!url) return // No assetlist URL → nothing to load

    // Deduplicate concurrent requests
    let pending = this.pendingFetches.get(chainId)
    if (!pending) {
      const timeout = this.refreshOptions.timeout ?? DEFAULT_REGISTRY_TIMEOUT_MS
      pending = fetchAssetList(url, timeout)
      this.pendingFetches.set(chainId, pending)
    }

    const result = await pending
    this.pendingFetches.delete(chainId)
    if (result) {
      this.assetMap.set(chainId, result)
    }
  }

  private async ensureAllAssetsLoaded(): Promise<void> {
    if (this.pendingAllLoad) {
      await this.pendingAllLoad
      return
    }

    // Find chains that haven't been loaded yet
    const missing: Array<[string, string]> = []
    for (const [chainId, url] of this.assetlistUrls) {
      if (!this.assetMap.has(chainId) && !this.pendingFetches.has(chainId)) {
        missing.push([chainId, url])
      }
    }

    if (missing.length === 0) return

    const timeout = this.refreshOptions.timeout ?? DEFAULT_REGISTRY_TIMEOUT_MS
    this.pendingAllLoad = (async () => {
      const fetched = await batchFetchAssets(missing, timeout)
      for (const [chainId, assetList] of fetched) {
        this.assetMap.set(chainId, assetList)
      }
      this.pendingAllLoad = null
    })()

    await this.pendingAllLoad
  }
}

// =============================================================================
// Factory Function
// =============================================================================

/**
 * Create a RegistryProvider by fetching chain metadata from the Initia registry API.
 *
 * Most users don't need to call this directly — typed factories handle it:
 * ```typescript
 * const ctx = await createInitiaContext({ network: 'testnet' })
 * ```
 *
 * Use this when you need to reuse a provider across multiple contexts or
 * inspect chain metadata before creating a context:
 *
 * ```typescript
 * const provider = await createRegistryProvider({ network: 'testnet' })
 * const chains = provider.listChains()
 *
 * const ctx = createInitiaContext(provider, 'initiation-2', { signer: key })
 * ```
 *
 * After creation, `getChainInfo()` and `listChains()` are synchronous.
 * Asset queries (`getAssets`, `findAsset`) may trigger a lazy fetch on first call
 * unless `prefetchAssets: true` is passed.
 *
 * @see createInitiaContext — Typed factory (recommended entry point)
 * @see createLocalRegistryProvider — Offline alternative (Node.js only)
 *
 * @example
 * ```typescript
 * // Fetch only testnet chains
 * const provider = await createRegistryProvider({ network: 'testnet' })
 *
 * // Prefetch all asset lists during init
 * const provider = await createRegistryProvider({ prefetchAssets: true })
 *
 * // List all available chains
 * const allChains = provider.listChains()
 * ```
 */
export async function createRegistryProvider(
  options: RegistryProviderOptions = {}
): Promise<RegistryProvider> {
  const timeout = options.timeout ?? DEFAULT_REGISTRY_TIMEOUT_MS
  const networks: Array<'mainnet' | 'testnet'> = options.network
    ? [options.network]
    : ['mainnet', 'testnet']

  const { chains: rawChains, errors: fetchErrors } = await fetchChainsFromNetworks(
    networks,
    timeout
  )
  if (fetchErrors) {
    const names = fetchErrors.map(e => e.message).join('; ')
    throw new InitiaError(
      `Failed to fetch all registries (${networks.join(', ')}): ${names}. ` +
        'Use { network: "mainnet" } or { network: "testnet" } to fetch a single network.'
    )
  }

  const { chains, assetlistUrls, chainNameToIds, chainIdToName } = buildMaps(rawChains)

  // Prefetch assets if configured
  const assetMap = await prefetchIfNeeded(assetlistUrls, options.prefetchAssets, timeout)

  return new RegistryProvider({
    chains,
    assetlistUrls,
    chainNameToIds,
    chainIdToName,
    assetMap,
    options,
  })
}
