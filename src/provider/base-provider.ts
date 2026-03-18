import type { AssetList } from '@initia/initia-registry-types'
import type { AssetList as CosmosAssetList } from '@chain-registry/types'
import type { ChainType, NetworkType } from '../client/types'
import type { Coin } from '../core/coin'
import { AssetNotFoundError } from '../errors'
import { formatUnits, parseUnits } from '../util/units'
import { convertDenomAmount } from './utils'
import { formatTokenAmount } from '../util/amount'
import type { TransportFactory } from '../client/transport-common'
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
 * Base class for ChainDataProvider implementations.
 * Provides shared implementations for amount conversion methods.
 *
 * @internal SDK internal use. Users should use ChainDataProvider interface or CustomProvider.
 * Direct subclassing requires implementing 14 abstract methods.
 */
export abstract class BaseChainDataProvider implements ChainDataProvider {
  createTransport?: TransportFactory

  // === Abstract methods (subclasses must implement) ===

  abstract getChainInfo<T extends ChainType = ChainType>(
    chainId: string
  ): ChainInfoForType<T> | undefined
  abstract listChains(): ChainInfo[]
  abstract hasChain(chainId: string): boolean
  abstract getAssets(chainId: string): Promise<AssetInfo[]>
  abstract getRawAssetList(chainId: string): Promise<AssetList | CosmosAssetList | undefined>
  abstract findAsset(denom: string, chainId?: string): Promise<AssetInfo | undefined>
  abstract findAssetBySymbol(symbol: string, chainId?: string): Promise<AssetInfo[]>
  abstract listAssets(options?: ListAssetsOptions): Promise<AssetInfo[]>
  abstract getIbcChannels(chainId: string): IbcChannelInfo[]
  abstract getIbcChannel(fromChainId: string, toChainId: string): IbcChannelInfo | undefined
  abstract getTransferPath(
    fromChainId: string,
    toChainId: string,
    denom?: string
  ): TransferPath | undefined
  abstract getOpBridge(l2ChainId: string): OpBridgeInfo | undefined
  abstract resolveChainId(chainName: string, network?: NetworkType): string | undefined
  abstract getChainName(chainId: string): string | undefined

  // === Shared implementations ===

  /**
   * Find multiple assets by denoms (batch operation).
   * Default: getAssets() once then match in loop.
   * Subclasses may override for optimized batch lookup.
   */
  async findAssets(denoms: string[], chainId: string): Promise<Map<string, AssetInfo | undefined>> {
    const result = new Map<string, AssetInfo | undefined>()
    const assets = await this.getAssets(chainId)
    for (const denom of denoms) {
      result.set(
        denom,
        assets.find(a => a.denom === denom)
      )
    }
    return result
  }

  /**
   * Refresh provider data. Default is no-op (for static providers).
   * RegistryProvider overrides this to re-fetch from API.
   */
  // eslint-disable-next-line @typescript-eslint/require-await
  async refresh(): Promise<RefreshResult> {
    // No-op for static data providers
    return {}
  }

  /**
   * Convert base amount to display amount.
   * @example toDisplayAmount(coin('uinit', '1000000'), 'interwoven-1') → '1'
   */
  async toDisplayAmount(coin: Coin, chainId: string): Promise<string> {
    const asset = await this.findAsset(coin.denom, chainId)
    if (!asset) throw new AssetNotFoundError(coin.denom, chainId)
    return formatUnits(BigInt(coin.amount), asset.decimals)
  }

  /**
   * Convert display amount to base amount.
   * Throws if amount has more decimal places than the asset's decimals.
   * @example toBaseAmount('1', 'uinit', 'interwoven-1') → '1000000'
   */
  async toBaseAmount(amount: string, denom: string, chainId: string): Promise<string> {
    const asset = await this.findAsset(denom, chainId)
    if (!asset) throw new AssetNotFoundError(denom, chainId)
    return parseUnits(amount, asset.decimals).toString()
  }

  /**
   * Convert amount between denom units.
   * @example convertAmount('1.5', 'INIT', 'uinit', 'interwoven-1') → '1500000'
   */
  async convertAmount(
    amount: string,
    fromDenom: string,
    toDenom: string,
    chainId: string
  ): Promise<string> {
    const assets = await this.getAssets(chainId)
    const asset = assets.find(
      a =>
        a.denomUnits.some(u => u.denom === fromDenom || u.aliases?.includes(fromDenom)) &&
        a.denomUnits.some(u => u.denom === toDenom || u.aliases?.includes(toDenom))
    )
    if (!asset) throw new AssetNotFoundError(`${fromDenom}→${toDenom}`, chainId)

    const fromUnit = asset.denomUnits.find(
      u => u.denom === fromDenom || u.aliases?.includes(fromDenom)
    )
    const toUnit = asset.denomUnits.find(u => u.denom === toDenom || u.aliases?.includes(toDenom))
    if (!fromUnit || !toUnit) throw new AssetNotFoundError(`${fromDenom}→${toDenom}`, chainId)

    return convertDenomAmount(amount, fromUnit.exponent - toUnit.exponent)
  }

  /**
   * Format base amount for display (with symbol).
   * @example formatAmount(coin('uinit', '1000000'), 'interwoven-1') → '1 INIT'
   */
  async formatAmount(
    coin: Coin,
    chainId: string,
    options?: {
      maxDecimals?: number
      minDecimals?: number
      trimTrailingZeros?: boolean
    }
  ): Promise<string> {
    const asset = await this.findAsset(coin.denom, chainId)
    if (!asset) throw new AssetNotFoundError(coin.denom, chainId)

    const formatted = formatTokenAmount(BigInt(coin.amount), asset.decimals, options ?? {})
    return `${formatted} ${asset.symbol}`
  }
}
