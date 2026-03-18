import { describe, it, expect } from 'vitest'
import type { AssetList } from '@initia/initia-registry-types'
import type { AssetList as CosmosAssetList } from '@chain-registry/types'
import type { NetworkType } from '../../../src/client/types'
import { BaseChainDataProvider } from '../../../src/provider/base-provider'
import { AssetNotFoundError } from '../../../src/errors'
import { coin } from '../../../src/core/coin'
import type {
  ChainInfo,
  AssetInfo,
  IbcChannelInfo,
  ListAssetsOptions,
  OpBridgeInfo,
  TransferPath,
} from '../../../src/provider/types'

// Mock subclass for testing
class TestProvider extends BaseChainDataProvider {
  private chains: ChainInfo[] = []
  private assets: Map<string, AssetInfo[]> = new Map()

  constructor(chains: ChainInfo[], assets: Map<string, AssetInfo[]>) {
    super()
    this.chains = chains
    this.assets = assets
  }

  getChainInfo(chainId: string) {
    return this.chains.find(c => c.chainId === chainId) as any
  }

  listChains(): ChainInfo[] {
    return this.chains
  }

  hasChain(chainId: string): boolean {
    return this.chains.some(c => c.chainId === chainId)
  }

  async getAssets(chainId: string): Promise<AssetInfo[]> {
    return this.assets.get(chainId) ?? []
  }

  async getRawAssetList(): Promise<AssetList | CosmosAssetList | undefined> {
    return undefined
  }

  async findAsset(denom: string, chainId?: string): Promise<AssetInfo | undefined> {
    if (chainId) {
      const chainAssets = this.assets.get(chainId) ?? []
      return chainAssets.find(a => a.denom === denom)
    }
    for (const assets of this.assets.values()) {
      const found = assets.find(a => a.denom === denom)
      if (found) return found
    }
    return undefined
  }

  async findAssetBySymbol(symbol: string, chainId?: string): Promise<AssetInfo[]> {
    const upper = symbol.toUpperCase()
    if (chainId) {
      return (this.assets.get(chainId) ?? []).filter(a => a.symbol.toUpperCase() === upper)
    }
    const results: AssetInfo[] = []
    for (const assets of this.assets.values()) {
      results.push(...assets.filter(a => a.symbol.toUpperCase() === upper))
    }
    return results
  }

  async listAssets(options?: ListAssetsOptions): Promise<AssetInfo[]> {
    if (options?.chainId) {
      const chainAssets = this.assets.get(options.chainId) ?? []
      if (options.symbol) {
        const upper = options.symbol.toUpperCase()
        return chainAssets.filter(a => a.symbol.toUpperCase() === upper)
      }
      return chainAssets
    }
    const all: AssetInfo[] = []
    for (const assets of this.assets.values()) {
      all.push(...assets)
    }
    if (options?.symbol) {
      const upper = options.symbol.toUpperCase()
      return all.filter(a => a.symbol.toUpperCase() === upper)
    }
    return all
  }

  getIbcChannels(): IbcChannelInfo[] {
    return []
  }

  getIbcChannel(): IbcChannelInfo | undefined {
    return undefined
  }

  getTransferPath(): TransferPath | undefined {
    return undefined
  }

  getOpBridge(): OpBridgeInfo | undefined {
    return undefined
  }

  resolveChainId(_chainName: string, _network?: NetworkType): string | undefined {
    return undefined
  }

  getChainName(): string | undefined {
    return undefined
  }
}

// Test fixtures
const INIT_ASSET: AssetInfo = {
  chainId: 'interwoven-1',
  denom: 'uinit',
  symbol: 'INIT',
  name: 'Initia',
  display: 'INIT',
  denomUnits: [
    { denom: 'uinit', exponent: 0 },
    { denom: 'INIT', exponent: 6, aliases: ['init'] },
  ],
  decimals: 6,
}

const ETH_ASSET: AssetInfo = {
  chainId: 'minievm-1',
  denom: 'aETH',
  symbol: 'ETH',
  name: 'Ethereum',
  display: 'ETH',
  denomUnits: [
    { denom: 'aETH', exponent: 0 },
    { denom: 'ETH', exponent: 18 },
  ],
  decimals: 18,
}

function createProvider() {
  const assets = new Map<string, AssetInfo[]>()
  assets.set('interwoven-1', [INIT_ASSET])
  assets.set('minievm-1', [ETH_ASSET])

  return new TestProvider(
    [
      { chainId: 'interwoven-1', chainName: 'Interwoven', chainType: 'initia', network: 'mainnet' },
      { chainId: 'minievm-1', chainName: 'MiniEVM', chainType: 'minievm', network: 'mainnet' },
    ],
    assets
  )
}

describe('BaseChainDataProvider', () => {
  describe('toDisplayAmount', () => {
    it('should convert base to display amount', async () => {
      const provider = createProvider()
      const result = await provider.toDisplayAmount(coin('uinit', '1000000'), 'interwoven-1')
      expect(result).toBe('1')
    })

    it('should handle fractional results', async () => {
      const provider = createProvider()
      const result = await provider.toDisplayAmount(coin('uinit', '1500000'), 'interwoven-1')
      expect(result).toBe('1.5')
    })

    it('should handle 18 decimals', async () => {
      const provider = createProvider()
      const result = await provider.toDisplayAmount(
        coin('aETH', '1000000000000000000'),
        'minievm-1'
      )
      expect(result).toBe('1')
    })

    it('should handle negative amounts', async () => {
      const provider = createProvider()
      const result = await provider.toDisplayAmount(coin('uinit', '-1500000'), 'interwoven-1')
      expect(result).toBe('-1.5')
    })

    it('should handle zero', async () => {
      const provider = createProvider()
      const result = await provider.toDisplayAmount(coin('uinit', '0'), 'interwoven-1')
      expect(result).toBe('0')
    })

    it('should throw AssetNotFoundError for unknown denom', async () => {
      const provider = createProvider()
      await expect(
        provider.toDisplayAmount(coin('unknown', '1000000'), 'interwoven-1')
      ).rejects.toThrow(AssetNotFoundError)
    })
  })

  describe('toBaseAmount', () => {
    it('should convert display to base amount', async () => {
      const provider = createProvider()
      const result = await provider.toBaseAmount('1', 'uinit', 'interwoven-1')
      expect(result).toBe('1000000')
    })

    it('should handle fractional input', async () => {
      const provider = createProvider()
      const result = await provider.toBaseAmount('1.5', 'uinit', 'interwoven-1')
      expect(result).toBe('1500000')
    })

    it('should handle negative input', async () => {
      const provider = createProvider()
      const result = await provider.toBaseAmount('-1.5', 'uinit', 'interwoven-1')
      expect(result).toBe('-1500000')
    })

    it('should handle excess decimal places via truncation', async () => {
      const provider = createProvider()
      // parseUnits truncates excess decimals (safer for blockchain amounts)
      const result = await provider.toBaseAmount('1.1234567', 'uinit', 'interwoven-1')
      expect(result).toBe('1123456')
    })

    it('should throw AssetNotFoundError for unknown denom', async () => {
      const provider = createProvider()
      await expect(provider.toBaseAmount('1', 'unknown', 'interwoven-1')).rejects.toThrow(
        AssetNotFoundError
      )
    })
  })

  describe('convertAmount', () => {
    it('should convert between denom units', async () => {
      const provider = createProvider()
      const result = await provider.convertAmount('1.5', 'INIT', 'uinit', 'interwoven-1')
      expect(result).toBe('1500000')
    })

    it('should convert using aliases', async () => {
      const provider = createProvider()
      const result = await provider.convertAmount('1', 'init', 'uinit', 'interwoven-1')
      expect(result).toBe('1000000')
    })

    it('should convert from small to large unit', async () => {
      const provider = createProvider()
      const result = await provider.convertAmount('1500000', 'uinit', 'INIT', 'interwoven-1')
      expect(result).toBe('1.5')
    })

    it('should throw for unmatched denom pair', async () => {
      const provider = createProvider()
      await expect(provider.convertAmount('1', 'FAKE', 'uinit', 'interwoven-1')).rejects.toThrow(
        AssetNotFoundError
      )
    })
  })

  describe('formatAmount', () => {
    it('should format with symbol', async () => {
      const provider = createProvider()
      const result = await provider.formatAmount(coin('uinit', '1000000'), 'interwoven-1')
      expect(result).toBe('1 INIT')
    })

    it('should format with options', async () => {
      const provider = createProvider()
      const result = await provider.formatAmount(coin('uinit', '1000000'), 'interwoven-1', {
        minDecimals: 2,
      })
      expect(result).toBe('1.00 INIT')
    })

    it('should format with maxDecimals', async () => {
      const provider = createProvider()
      const result = await provider.formatAmount(coin('aETH', '1234567890123456789'), 'minievm-1', {
        maxDecimals: 6,
      })
      expect(result).toBe('1.234567 ETH')
    })

    it('should throw AssetNotFoundError for unknown denom', async () => {
      const provider = createProvider()
      await expect(
        provider.formatAmount(coin('unknown', '1000000'), 'interwoven-1')
      ).rejects.toThrow(AssetNotFoundError)
    })
  })

  describe('findAssets', () => {
    it('should batch find assets', async () => {
      const provider = createProvider()
      const result = await provider.findAssets(['uinit'], 'interwoven-1')
      expect(result.get('uinit')).toBeDefined()
      expect(result.get('uinit')?.symbol).toBe('INIT')
    })

    it('should return undefined for missing denoms', async () => {
      const provider = createProvider()
      const result = await provider.findAssets(['uinit', 'unknown'], 'interwoven-1')
      expect(result.get('uinit')).toBeDefined()
      expect(result.get('unknown')).toBeUndefined()
    })

    it('should return empty results for unknown chain', async () => {
      const provider = createProvider()
      const result = await provider.findAssets(['uinit'], 'unknown-chain')
      expect(result.get('uinit')).toBeUndefined()
    })

    it('should batch find assets across both chains', async () => {
      const provider = createProvider()
      const initResult = await provider.findAssets(['uinit'], 'interwoven-1')
      const ethResult = await provider.findAssets(['aETH'], 'minievm-1')
      expect(initResult.get('uinit')?.decimals).toBe(6)
      expect(ethResult.get('aETH')?.decimals).toBe(18)
    })
  })

  // ---------------------------------------------------------------------------
  // Amount edge cases
  // ---------------------------------------------------------------------------

  describe('amount edge cases', () => {
    it('should handle amounts exceeding MAX_SAFE_INTEGER', async () => {
      const provider = createProvider()
      // 9007199254740992 > Number.MAX_SAFE_INTEGER (9007199254740991)
      const result = await provider.toDisplayAmount(
        coin('aETH', '9007199254740992000000000000'),
        'minievm-1'
      )
      expect(result).toBe('9007199254.740992')
    })

    it('should preserve full 18-decimal precision for ETH', async () => {
      const provider = createProvider()
      const result = await provider.toDisplayAmount(coin('aETH', '123456789012345678'), 'minievm-1')
      expect(result).toBe('0.123456789012345678')
    })

    it('should round-trip display↔base for 6-decimal asset', async () => {
      const provider = createProvider()
      const display = await provider.toDisplayAmount(coin('uinit', '1234567'), 'interwoven-1')
      const base = await provider.toBaseAmount(display, 'uinit', 'interwoven-1')
      expect(base).toBe('1234567')
    })

    it('should round-trip display↔base for 18-decimal asset', async () => {
      const provider = createProvider()
      const display = await provider.toDisplayAmount(
        coin('aETH', '1000000000000000001'),
        'minievm-1'
      )
      const base = await provider.toBaseAmount(display, 'aETH', 'minievm-1')
      expect(base).toBe('1000000000000000001')
    })

    it('should format zero amount correctly', async () => {
      const provider = createProvider()
      const result = await provider.formatAmount(coin('uinit', '0'), 'interwoven-1')
      expect(result).toBe('0 INIT')
    })

    it('should format with minDecimals and maxDecimals together', async () => {
      const provider = createProvider()
      const result = await provider.formatAmount(coin('aETH', '1000000000000000000'), 'minievm-1', {
        minDecimals: 4,
        maxDecimals: 4,
      })
      expect(result).toBe('1.0000 ETH')
    })
  })

  // ---------------------------------------------------------------------------
  // convertAmount: alias and cross-unit tests
  // ---------------------------------------------------------------------------

  describe('convertAmount advanced', () => {
    it('should convert between alias and base denom', async () => {
      const provider = createProvider()
      // 'init' is an alias for 'INIT' (exponent 6) in INIT_ASSET denomUnits
      const result = await provider.convertAmount('1000000', 'uinit', 'init', 'interwoven-1')
      expect(result).toBe('1')
    })

    it('should convert between two non-base denom units via alias', async () => {
      const provider = createProvider()
      // 'init' alias (exp 6) → 'INIT' (exp 6): same exponent
      const result = await provider.convertAmount('5', 'init', 'INIT', 'interwoven-1')
      expect(result).toBe('5')
    })

    it('should throw AssetNotFoundError when no asset matches both denoms', async () => {
      const provider = createProvider()
      // 'uinit' exists on interwoven-1, 'aETH' exists on minievm-1
      // No single asset has both → should throw
      await expect(provider.convertAmount('1', 'uinit', 'aETH', 'interwoven-1')).rejects.toThrow(
        AssetNotFoundError
      )
    })
  })
})
