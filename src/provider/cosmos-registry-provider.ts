/**
 * Cosmos Registry Provider.
 *
 * Uses the chain-registry npm package for Cosmos ecosystem chain data.
 * Provides access to all chains in the Cosmos ecosystem (Osmosis, Noble, Cosmos Hub, etc.).
 *
 * @see https://github.com/cosmos/chain-registry
 * @see https://www.npmjs.com/package/chain-registry
 */

import { chains as mainnetChains } from 'chain-registry/mainnet'
import { chains as testnetChains } from 'chain-registry/testnet'
import _mainnetAssetLists from 'chain-registry/mainnet/asset-lists'
import _testnetAssetLists from 'chain-registry/testnet/asset-lists'
import _mainnetIbcData from 'chain-registry/mainnet/ibc-data'
import _testnetIbcData from 'chain-registry/testnet/ibc-data'

// chain-registry uses ESM default exports — unwrap if needed
// eslint-disable-next-line @typescript-eslint/no-explicit-any, @typescript-eslint/no-unsafe-member-access
const unwrap = <T>(mod: any): T[] => (Array.isArray(mod) ? mod : (mod?.default ?? [])) as T[]
const mainnetAssetLists = unwrap<CosmosAssetList>(_mainnetAssetLists)
const testnetAssetLists = unwrap<CosmosAssetList>(_testnetAssetLists)
const mainnetIbcData = unwrap<IBCData>(_mainnetIbcData)
const testnetIbcData = unwrap<IBCData>(_testnetIbcData)
import type {
  Chain,
  Asset as CosmosAsset,
  AssetList as CosmosAssetList,
  IBCData,
} from '@chain-registry/types'
import type { AssetList as InitiaAssetList } from '@initia/initia-registry-types'
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

/**
 * Options for CosmosRegistryProvider.
 */
export interface CosmosRegistryProviderOptions {
  /**
   * Include mainnet chains (default: true)
   */
  mainnet?: boolean

  /**
   * Include testnet chains (default: true)
   */
  testnet?: boolean

  /**
   * Filter chains by name (optional).
   * If provided, only chains with matching chain_name will be included.
   * @example ['osmosis', 'noble', 'cosmoshub']
   */
  chainNames?: string[]
}

const DEFAULT_OPTIONS: Required<Omit<CosmosRegistryProviderOptions, 'chainNames'>> = {
  mainnet: true,
  testnet: true,
}

// =============================================================================
// Helper Functions (module-level)
// =============================================================================

/**
 * Derive gas price string from Cosmos chain-registry fee token data (camelCase).
 */
function deriveGasPriceCosmos(
  feeToken:
    | { denom: string; fixedMinGasPrice?: number; lowGasPrice?: number; averageGasPrice?: number }
    | undefined
): string | undefined {
  if (!feeToken) return undefined
  const price = feeToken.averageGasPrice ?? feeToken.lowGasPrice ?? feeToken.fixedMinGasPrice
  if (price == null) return undefined
  return `${price}${feeToken.denom}`
}

/**
 * Convert chain-registry Chain to ChainInfo.
 * chain-registry v2 uses camelCase property names.
 */
function toChainInfo(chain: Chain & { chainId: string }): ChainInfo {
  return {
    chainId: chain.chainId,
    chainName: chain.prettyName ?? chain.chainName,
    chainType: 'other' as ChainType, // All Cosmos chains are 'other' (non-Initia)
    network: mapNetworkType(chain.networkType),
    rpc: chain.apis?.rpc?.[0]?.address,
    rest: chain.apis?.rest?.[0]?.address,
    grpc: chain.apis?.grpc?.[0]?.address,
    grpcWeb: chain.apis?.grpcWeb?.[0]?.address,
    wss: chain.apis?.wss?.[0]?.address,
    nativeDenom: chain.fees?.feeTokens?.[0]?.denom ?? chain.staking?.stakingTokens?.[0]?.denom,
    gasPrice: deriveGasPriceCosmos(chain.fees?.feeTokens?.[0]),
    bech32Prefix: chain.bech32Prefix,
    slip44: chain.slip44,
    explorerUrl: chain.explorers?.[0]?.url,
  }
}

/**
 * Map chain-registry network type to our NetworkType.
 */
function mapNetworkType(networkType?: Chain['networkType']): NetworkType {
  if (networkType === 'mainnet') return 'mainnet'
  if (networkType === 'testnet') return 'testnet'
  // devnet maps to local
  return 'local'
}

/**
 * Convert a Cosmos chain-registry Asset to our normalized AssetInfo.
 * chain-registry uses camelCase fields (denomUnits, typeAsset, logoURIs, etc.).
 */
function cosmosAssetToAssetInfo(
  raw: CosmosAsset,
  chainId: string,
  chainNameToIds: Map<string, string[]>
): AssetInfo {
  // Find decimals from display unit
  const displayUnit = raw.denomUnits.find(u => u.denom === raw.display)
  const decimals = displayUnit?.exponent ?? 0

  // Extract origin from traces (first trace)
  let originChainId: string | undefined
  let originDenom: string | undefined
  if (raw.traces?.length) {
    const trace = raw.traces[0]
    // Cosmos chain-registry uses chainName in traces, need to resolve to chainId
    const counterpartyName = trace.counterparty.chainName
    const ids = chainNameToIds.get(counterpartyName)
    originChainId = ids?.[0]
    originDenom = trace.counterparty.baseDenom
  }

  // Logo URL: prefer logoURIs.png, fallback to first image
  const logoUrl = raw.logoURIs?.png ?? raw.images?.[0]?.png

  return {
    chainId,
    denom: raw.base,
    symbol: raw.symbol,
    name: raw.name,
    description: raw.description,
    display: raw.display,
    denomUnits: raw.denomUnits.map(u => ({
      denom: u.denom,
      exponent: u.exponent,
      ...(u.aliases?.length ? { aliases: u.aliases } : {}),
    })),
    decimals,
    contractAddress: raw.address,
    logoUrl,
    coingeckoId: raw.coingeckoId,
    originChainId,
    originDenom,
    typeAsset: raw.typeAsset,
  }
}

/**
 * Convert bilateral IBCData to flat IbcChannelInfo[] for a specific chain.
 *
 * IBCData is bilateral (chain1 ↔ chain2). We determine local/counterparty
 * based on localChainName, then extract channel info for each connection.
 */
function cosmosIbcToChannelInfo(
  ibcDataList: IBCData[],
  localChainName: string,
  chainNameToIds: Map<string, string[]>
): IbcChannelInfo[] {
  const channels: IbcChannelInfo[] = []

  for (const ibc of ibcDataList) {
    const isChain1 = ibc.chain1.chainName === localChainName
    const isChain2 = ibc.chain2.chainName === localChainName

    if (!isChain1 && !isChain2) continue

    const counterpartyName = isChain1 ? ibc.chain2.chainName : ibc.chain1.chainName
    const counterpartyIds = chainNameToIds.get(counterpartyName)
    if (!counterpartyIds?.length) continue

    for (const ch of ibc.channels) {
      const localChannel = isChain1 ? ch.chain1 : ch.chain2
      channels.push({
        chainId: counterpartyIds[0],
        portId: localChannel.portId,
        channelId: localChannel.channelId,
        version: ch.version,
      })
    }
  }

  return channels
}

// =============================================================================
// CosmosRegistryProvider Class
// =============================================================================

/**
 * Cosmos Registry Provider.
 *
 * Provides chain information from the chain-registry npm package.
 * This gives access to all Cosmos ecosystem chains like Osmosis, Noble,
 * Cosmos Hub, Juno, Stargaze, and many more.
 *
 * Data is bundled at build time from the chain-registry, so no network
 * requests are needed at runtime.
 *
 * @example Basic usage
 * ```typescript
 * const provider = new CosmosRegistryProvider()
 *
 * // Get Osmosis mainnet
 * const osmosis = provider.getChainInfo('osmosis-1')
 *
 * // Get Noble mainnet
 * const noble = provider.getChainInfo('noble-1')
 *
 * // List all available chains
 * const allChains = provider.listChains()
 *
 * // Get assets for a chain
 * const assets = await provider.getAssets('noble-1')
 * ```
 *
 * @example With options
 * ```typescript
 * // Only mainnet chains
 * const mainnetProvider = new CosmosRegistryProvider({ testnet: false })
 *
 * // Only specific chains
 * const selectedProvider = new CosmosRegistryProvider({
 *   chainNames: ['osmosis', 'noble', 'cosmoshub']
 * })
 * ```
 *
 * @example Combined with Initia providers
 * ```typescript
 * import { CompositeProvider, createRegistryProvider } from 'initia.js/provider'
 * import { CosmosRegistryProvider } from 'initia.js/cosmos'
 *
 * // Support both Initia and Cosmos ecosystem chains
 * const initiaProvider = await createRegistryProvider()
 * const provider = new CompositeProvider([
 *   initiaProvider,                  // Initia chains
 *   new CosmosRegistryProvider(),    // Cosmos ecosystem chains
 * ])
 *
 * // Now you can access both ecosystems
 * const initia = provider.getChainInfo('initiation-2')  // Initia testnet
 * const osmosis = provider.getChainInfo('osmosis-1')    // Osmosis mainnet
 * ```
 */
export class CosmosRegistryProvider extends BaseChainDataProvider {
  private chainMap: Map<string, ChainInfo>
  private assetMap: Map<string, CosmosAssetList> = new Map()
  private assetInfoCache: Map<string, AssetInfo[]> = new Map()
  private ibcDataByChain: Map<string, IBCData[]> = new Map()
  private chainNameToIds: Map<string, string[]>
  private chainIdToName: Map<string, string>

  constructor(options: CosmosRegistryProviderOptions = {}) {
    super()
    const { mainnet, testnet } = { ...DEFAULT_OPTIONS, ...options }
    const chainNames = options.chainNames ? new Set(options.chainNames) : null

    this.chainMap = new Map()
    this.chainNameToIds = new Map()
    this.chainIdToName = new Map()

    // Build chain map
    const addChains = (chains: Chain[]) => {
      for (const chain of chains) {
        if (!chain.chainId) continue
        if (chainNames && !chainNames.has(chain.chainName)) continue
        if (this.chainMap.has(chain.chainId)) continue

        const info = toChainInfo(chain as Chain & { chainId: string })
        this.chainMap.set(chain.chainId, info)

        // Name mappings
        this.chainIdToName.set(chain.chainId, chain.chainName)
        const existing = this.chainNameToIds.get(chain.chainName) ?? []
        existing.push(chain.chainId)
        this.chainNameToIds.set(chain.chainName, existing)
      }
    }

    if (mainnet) addChains(mainnetChains)
    if (testnet) addChains(testnetChains)

    // Build asset map (keyed by chainName)
    const addAssets = (assetLists: CosmosAssetList[]) => {
      for (const al of assetLists) {
        if (chainNames && !chainNames.has(al.chainName)) continue
        if (this.assetMap.has(al.chainName)) continue
        this.assetMap.set(al.chainName, al)
      }
    }

    if (mainnet) addAssets(mainnetAssetLists)
    if (testnet) addAssets(testnetAssetLists)

    // Build IBC data map (keyed by chainName)
    const addIbc = (ibcDataList: IBCData[]) => {
      for (const ibc of ibcDataList) {
        // Index by both chain1 and chain2
        for (const name of [ibc.chain1.chainName, ibc.chain2.chainName]) {
          if (chainNames && !chainNames.has(name)) continue
          const existing = this.ibcDataByChain.get(name) ?? []
          existing.push(ibc)
          this.ibcDataByChain.set(name, existing)
        }
      }
    }

    if (mainnet) addIbc(mainnetIbcData)
    if (testnet) addIbc(testnetIbcData)
  }

  // === ChainInfoProvider methods (preserved) ===

  getChainInfo<T extends ChainType = ChainType>(chainId: string): ChainInfoForType<T> | undefined {
    return this.chainMap.get(chainId) as ChainInfoForType<T> | undefined
  }

  listChains(): ChainInfo[] {
    return Array.from(this.chainMap.values())
  }

  hasChain(chainId: string): boolean {
    return this.chainMap.has(chainId)
  }

  // === Asset methods ===

  // eslint-disable-next-line @typescript-eslint/require-await
  async getAssets(chainId: string): Promise<AssetInfo[]> {
    const cached = this.assetInfoCache.get(chainId)
    if (cached) return cached

    const chainName = this.chainIdToName.get(chainId)
    if (!chainName) return []

    const raw = this.assetMap.get(chainName)
    if (!raw) return []

    const infos = raw.assets.map(a => cosmosAssetToAssetInfo(a, chainId, this.chainNameToIds))
    this.assetInfoCache.set(chainId, infos)
    return infos
  }

  // eslint-disable-next-line @typescript-eslint/require-await
  async getRawAssetList(chainId: string): Promise<InitiaAssetList | CosmosAssetList | undefined> {
    const chainName = this.chainIdToName.get(chainId)
    if (!chainName) return undefined
    return this.assetMap.get(chainName)
  }

  async findAsset(denom: string, chainId?: string): Promise<AssetInfo | undefined> {
    if (chainId) {
      const assets = await this.getAssets(chainId)
      return assets.find(a => a.denom === denom)
    }
    for (const cid of this.chainMap.keys()) {
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
    for (const cid of this.chainMap.keys()) {
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
    for (const cid of this.chainMap.keys()) {
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
    const chainName = this.chainIdToName.get(chainId)
    if (!chainName) return []

    const ibcData = this.ibcDataByChain.get(chainName)
    if (!ibcData) return []

    return cosmosIbcToChannelInfo(ibcData, chainName, this.chainNameToIds)
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
    // Cosmos chains don't have OP Bridge
    return undefined
  }

  // === Resolution methods ===

  resolveChainId(chainName: string, network?: NetworkType): string | undefined {
    const ids = this.chainNameToIds.get(chainName)
    if (!ids?.length) return undefined
    if (!network) return ids[0]
    return ids.find(id => this.chainMap.get(id)?.network === network)
  }

  getChainName(chainId: string): string | undefined {
    return this.chainIdToName.get(chainId)
  }

  // === Convenience methods (preserved from original) ===

  /**
   * Get chain by chain name (not chain ID).
   *
   * Useful when you know the chain name but not the specific chain ID.
   * Note: Returns the first matching chain if multiple networks exist.
   *
   * @param chainName - The chain name (e.g., 'osmosis', 'noble')
   * @returns Chain info if found, undefined otherwise
   */
  getChainByName(chainName: string): ChainInfo | undefined {
    const searchName = chainName.toLowerCase()
    for (const chain of this.chainMap.values()) {
      // Match against chainName (could be pretty_name or chain_name)
      const chainNameLower = chain.chainName?.toLowerCase() ?? ''
      const chainIdLower = chain.chainId?.toLowerCase() ?? ''
      if (chainNameLower === searchName || chainIdLower.startsWith(searchName)) {
        return chain
      }
    }
    return undefined
  }

  /**
   * List chains filtered by network type.
   *
   * @param network - Network type to filter by
   * @returns Array of matching chain configurations
   */
  listChainsByNetwork(network: NetworkType): ChainInfo[] {
    return Array.from(this.chainMap.values()).filter(chain => chain.network === network)
  }
}
