/**
 * Local filesystem-based chain data provider.
 *
 * Reads chain data from a locally cloned initia-registry git repository.
 * Node.js only (uses node:fs). For browser, use RegistryProvider.
 *
 * @example
 * ```typescript
 * const provider = createLocalRegistryProvider({
 *   registryPath: '/path/to/initia-registry',
 * })
 * const chain = provider.getChainInfo('interwoven-1')
 * const assets = await provider.getAssets('interwoven-1')
 * ```
 */

import { ValidationError } from '../errors'
import { readFileSync, readdirSync, existsSync } from 'node:fs'
import { join, resolve } from 'node:path'
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
import { toChainInfo, toAssetInfo } from './chain-utils'

/**
 * Options for creating a LocalRegistryProvider.
 */
export interface LocalRegistryProviderOptions {
  /** Path to the cloned initia-registry git repository. */
  registryPath: string
  /** Filter by network type. If not specified, reads from all networks. */
  network?: 'mainnet' | 'testnet'
}

/** Network subdirectory names in the initia-registry repo. */
const NETWORK_DIRS: Record<'mainnet' | 'testnet', string> = {
  mainnet: 'mainnets',
  testnet: 'testnets',
}

/**
 * Verify that a resolved file path is within the allowed base directory.
 * Prevents path traversal via malicious directory/file names.
 */
function isWithinBase(filePath: string, basePath: string): boolean {
  const resolved = resolve(filePath)
  return resolved.startsWith(basePath + '/') || resolved === basePath
}

/**
 * Read and parse a JSON file. Returns null if file does not exist.
 * Throws on all other errors (parse errors, permission errors, etc.).
 */
function readJsonFile<T>(filePath: string): T | null {
  try {
    const content = readFileSync(filePath, 'utf-8')
    return JSON.parse(content) as T
  } catch (err) {
    if (err instanceof Error && 'code' in err && (err as NodeJS.ErrnoException).code === 'ENOENT') {
      return null
    }
    throw err
  }
}

/**
 * Local filesystem-based chain data provider.
 *
 * Reads chain and asset data from a locally cloned initia-registry
 * git repository. Node.js only (uses node:fs).
 *
 * Chain data is loaded synchronously at creation time.
 * Asset data is lazily loaded on first access and cached.
 */
export class LocalRegistryProvider extends BaseChainDataProvider {
  private readonly registryPath: string
  private readonly networkFilter?: 'mainnet' | 'testnet'
  private chains = new Map<string, ChainInfo>()
  private assetlistPaths = new Map<string, string>()
  private assetMap = new Map<string, AssetList>()
  private assetInfoCache = new Map<string, AssetInfo[]>()
  private chainNameToIds = new Map<string, string[]>()
  private chainIdToName = new Map<string, string>()

  constructor(options: LocalRegistryProviderOptions) {
    super()
    const resolvedPath = resolve(options.registryPath)
    if (!existsSync(resolvedPath)) {
      throw new ValidationError('registryPath', `Registry path does not exist: ${resolvedPath}`)
    }
    this.registryPath = resolvedPath
    this.networkFilter = options.network
    this.loadChains()
  }

  // === ChainInfoProvider (synchronous) ===

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
    this.ensureAssetLoaded(chainId)

    const cached = this.assetInfoCache.get(chainId)
    if (cached) return cached

    const raw = this.assetMap.get(chainId)
    if (!raw) return []

    const infos = raw.assets.map(a => toAssetInfo(a, chainId))
    this.assetInfoCache.set(chainId, infos)
    return infos
  }

  // eslint-disable-next-line @typescript-eslint/require-await
  async getRawAssetList(chainId: string): Promise<AssetList | CosmosAssetList | undefined> {
    this.ensureAssetLoaded(chainId)
    return this.assetMap.get(chainId)
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

  // === Provider management ===

  // eslint-disable-next-line @typescript-eslint/require-await
  async refresh(): Promise<RefreshResult> {
    this.chains.clear()
    this.assetlistPaths.clear()
    this.assetMap.clear()
    this.assetInfoCache.clear()
    this.chainNameToIds.clear()
    this.chainIdToName.clear()
    this.loadChains()
    return {}
  }

  // === Private helpers ===

  private loadChains(): void {
    const networkKeys: Array<'mainnet' | 'testnet'> = this.networkFilter
      ? [this.networkFilter]
      : ['mainnet', 'testnet']

    for (const networkKey of networkKeys) {
      const networkDir = join(this.registryPath, NETWORK_DIRS[networkKey])
      if (!existsSync(networkDir)) continue

      const entries = readdirSync(networkDir, { withFileTypes: true })

      for (const entry of entries) {
        // Skip non-directories and symlinks
        if (!entry.isDirectory()) continue
        // Skip _ prefixed directories (_IBC, _api, _packages, etc.)
        if (entry.name.startsWith('_')) continue

        const chainDir = join(networkDir, entry.name)
        // Path traversal check
        if (!isWithinBase(chainDir, this.registryPath)) continue

        const chainJsonPath = join(chainDir, 'chain.json')
        if (!existsSync(chainJsonPath)) continue

        const rawChain = readJsonFile<Chain>(chainJsonPath)
        if (!rawChain) continue

        // Validate required fields
        if (!rawChain.chain_id || !rawChain.apis || !rawChain.fees) continue

        const chainId = rawChain.chain_id
        // First occurrence wins
        if (this.chains.has(chainId)) continue

        this.chains.set(chainId, toChainInfo(rawChain))

        // Record assetlist path for lazy loading
        const assetlistPath = join(chainDir, 'assetlist.json')
        if (existsSync(assetlistPath) && isWithinBase(assetlistPath, this.registryPath)) {
          this.assetlistPaths.set(chainId, assetlistPath)
        }

        // Name mappings
        const name = rawChain.chain_name
        this.chainIdToName.set(chainId, name)
        const existing = this.chainNameToIds.get(name) ?? []
        existing.push(chainId)
        this.chainNameToIds.set(name, existing)
      }
    }
  }

  private ensureAssetLoaded(chainId: string): void {
    if (this.assetMap.has(chainId)) return

    const assetlistPath = this.assetlistPaths.get(chainId)
    if (!assetlistPath) return

    const assetList = readJsonFile<AssetList>(assetlistPath)
    if (assetList) {
      this.assetMap.set(chainId, assetList)
    }
  }
}

/**
 * Create a LocalRegistryProvider from a local initia-registry clone.
 *
 * @example
 * ```typescript
 * const provider = createLocalRegistryProvider({
 *   registryPath: '/home/dev/initia-registry',
 * })
 * const chains = provider.listChains()
 * ```
 */
export function createLocalRegistryProvider(
  options: LocalRegistryProviderOptions
): LocalRegistryProvider {
  return new LocalRegistryProvider(options)
}
