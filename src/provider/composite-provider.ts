/**
 * Composite chain data provider.
 *
 * Combines multiple ChainDataProvider instances into a single unified provider.
 * Uses delegation pattern — routes each chainId to the responsible child provider.
 * First provider wins for duplicate chain IDs.
 */

import type { AssetList } from '@initia/initia-registry-types'
import type { AssetList as CosmosAssetList } from '@chain-registry/types'
import type { ChainType, NetworkType } from '../client/types'
import type { Coin } from '../core/coin'
import { ChainNotFoundError } from '../errors'
import type {
  ChainInfo,
  ChainInfoForType,
  AssetInfo,
  IbcChannelInfo,
  ListAssetsOptions,
  OpBridgeInfo,
  TransferPath,
  ChainDataProvider,
  RefreshResult,
} from './types'

/**
 * Composite provider that combines multiple chain data providers.
 *
 * When multiple providers have the same chain ID, the first provider wins.
 * This allows for overriding chain configurations by ordering providers.
 *
 * All ChainDataProvider methods are delegated to the child provider that owns
 * the chain. Amount methods throw ChainNotFoundError if no provider matches.
 *
 * @example
 * ```typescript
 * const provider = new CompositeProvider([
 *   new RegistryProvider(registryData),   // Initia chains
 *   new CosmosRegistryProvider(),         // Cosmos ecosystem
 *   new CustomProvider([localChain]),     // Custom chains
 * ])
 *
 * // Routes to the correct child provider automatically
 * const osmosis = provider.getChainInfo('osmosis-1')
 * const assets = await provider.getAssets('noble-1')
 * const display = await provider.toDisplayAmount(coin, 'interwoven-1')
 * ```
 */
export class CompositeProvider implements ChainDataProvider {
  private providers: ChainDataProvider[]
  private chainCache: Map<string, ChainInfo>
  private chainToProvider: Map<string, ChainDataProvider>

  constructor(providers: ChainDataProvider[]) {
    this.providers = [...providers]
    this.chainCache = new Map()
    this.chainToProvider = new Map()
    this.rebuildCache()
  }

  /**
   * Build chain cache and provider routing from all providers.
   * First provider wins for duplicate chain IDs.
   */
  private rebuildCache(): void {
    this.chainCache.clear()
    this.chainToProvider.clear()

    for (const provider of this.providers) {
      for (const chain of provider.listChains()) {
        if (!this.chainCache.has(chain.chainId)) {
          this.chainCache.set(chain.chainId, chain)
          this.chainToProvider.set(chain.chainId, provider)
        }
      }
    }
  }

  // === ChainInfoProvider methods ===

  getChainInfo<T extends ChainType = ChainType>(chainId: string): ChainInfoForType<T> | undefined {
    return this.chainCache.get(chainId) as ChainInfoForType<T> | undefined
  }

  listChains(): ChainInfo[] {
    return Array.from(this.chainCache.values())
  }

  hasChain(chainId: string): boolean {
    return this.chainCache.has(chainId)
  }

  /**
   * Get the number of providers in this composite.
   */
  get providerCount(): number {
    return this.providers.length
  }

  // === Asset methods (delegation) ===

  async getAssets(chainId: string): Promise<AssetInfo[]> {
    const provider = this.chainToProvider.get(chainId)
    if (!provider) return []
    return provider.getAssets(chainId)
  }

  async getRawAssetList(chainId: string): Promise<AssetList | CosmosAssetList | undefined> {
    const provider = this.chainToProvider.get(chainId)
    if (!provider) return undefined
    return provider.getRawAssetList(chainId)
  }

  async findAsset(denom: string, chainId?: string): Promise<AssetInfo | undefined> {
    if (chainId) {
      const provider = this.chainToProvider.get(chainId)
      if (!provider) return undefined
      return provider.findAsset(denom, chainId)
    }
    // No chainId — search all providers in order
    for (const provider of this.providers) {
      const found = await provider.findAsset(denom)
      if (found) return found
    }
    return undefined
  }

  async findAssets(denoms: string[], chainId: string): Promise<Map<string, AssetInfo | undefined>> {
    const provider = this.chainToProvider.get(chainId)
    if (!provider) {
      // Return all-undefined map
      const result = new Map<string, AssetInfo | undefined>()
      for (const d of denoms) result.set(d, undefined)
      return result
    }
    return provider.findAssets(denoms, chainId)
  }

  async findAssetBySymbol(symbol: string, chainId?: string): Promise<AssetInfo[]> {
    if (chainId) {
      const provider = this.chainToProvider.get(chainId)
      if (!provider) return []
      return provider.findAssetBySymbol(symbol, chainId)
    }
    // Cross-provider: collect all, dedup by chainId:denom (first provider wins)
    const seen = new Set<string>()
    const results: AssetInfo[] = []
    for (const provider of this.providers) {
      const assets = await provider.findAssetBySymbol(symbol)
      for (const a of assets) {
        const key = `${a.chainId}:${a.denom}`
        if (!seen.has(key)) {
          seen.add(key)
          results.push(a)
        }
      }
    }
    return results
  }

  async listAssets(options?: ListAssetsOptions): Promise<AssetInfo[]> {
    if (options?.chainId) {
      const provider = this.chainToProvider.get(options.chainId)
      if (!provider) return []
      return provider.listAssets(options)
    }
    // Cross-provider: collect all, dedup by chainId:denom (first provider wins)
    const seen = new Set<string>()
    const results: AssetInfo[] = []
    for (const provider of this.providers) {
      const assets = await provider.listAssets(options)
      for (const a of assets) {
        const key = `${a.chainId}:${a.denom}`
        if (!seen.has(key)) {
          seen.add(key)
          results.push(a)
        }
      }
    }
    return results
  }

  // === IBC methods (delegation) ===

  getIbcChannels(chainId: string): IbcChannelInfo[] {
    const provider = this.chainToProvider.get(chainId)
    if (!provider) return []
    return provider.getIbcChannels(chainId)
  }

  getIbcChannel(fromChainId: string, toChainId: string): IbcChannelInfo | undefined {
    const provider = this.chainToProvider.get(fromChainId)
    if (!provider) return undefined
    return provider.getIbcChannel(fromChainId, toChainId)
  }

  getTransferPath(
    fromChainId: string,
    toChainId: string,
    denom?: string
  ): TransferPath | undefined {
    const provider = this.chainToProvider.get(fromChainId)
    if (!provider) return undefined
    return provider.getTransferPath(fromChainId, toChainId, denom)
  }

  getOpBridge(l2ChainId: string): OpBridgeInfo | undefined {
    const provider = this.chainToProvider.get(l2ChainId)
    if (!provider) return undefined
    return provider.getOpBridge(l2ChainId)
  }

  // === Amount methods (delegation, throws on miss) ===

  async toDisplayAmount(coin: Coin, chainId: string): Promise<string> {
    const provider = this.chainToProvider.get(chainId)
    if (!provider) throw new ChainNotFoundError(chainId)
    return provider.toDisplayAmount(coin, chainId)
  }

  async toBaseAmount(amount: string, denom: string, chainId: string): Promise<string> {
    const provider = this.chainToProvider.get(chainId)
    if (!provider) throw new ChainNotFoundError(chainId)
    return provider.toBaseAmount(amount, denom, chainId)
  }

  async convertAmount(
    amount: string,
    fromDenom: string,
    toDenom: string,
    chainId: string
  ): Promise<string> {
    const provider = this.chainToProvider.get(chainId)
    if (!provider) throw new ChainNotFoundError(chainId)
    return provider.convertAmount(amount, fromDenom, toDenom, chainId)
  }

  async formatAmount(
    coin: Coin,
    chainId: string,
    options?: {
      maxDecimals?: number
      minDecimals?: number
      trimTrailingZeros?: boolean
    }
  ): Promise<string> {
    const provider = this.chainToProvider.get(chainId)
    if (!provider) throw new ChainNotFoundError(chainId)
    return provider.formatAmount(coin, chainId, options)
  }

  // === Resolution methods ===

  resolveChainId(chainName: string, network?: NetworkType): string | undefined {
    // Search all providers in order, return first match
    for (const provider of this.providers) {
      const id = provider.resolveChainId(chainName, network)
      if (id) return id
    }
    return undefined
  }

  getChainName(chainId: string): string | undefined {
    const provider = this.chainToProvider.get(chainId)
    if (!provider) return undefined
    return provider.getChainName(chainId)
  }

  // === Management ===

  async refresh(): Promise<RefreshResult> {
    const results = await Promise.allSettled(this.providers.map(p => p.refresh()))

    const errors: Error[] = []
    let successCount = 0

    for (const result of results) {
      if (result.status === 'rejected') {
        const reason: unknown = result.reason
        errors.push(reason instanceof Error ? reason : new Error(String(reason)))
      } else {
        successCount++
        // Propagate partial errors from child providers
        if (result.value.errors) {
          errors.push(...result.value.errors)
        }
      }
    }

    if (successCount === 0) {
      throw new AggregateError(errors, 'All providers failed to refresh')
    }

    this.rebuildCache()
    return errors.length > 0 ? { errors } : {}
  }
}
