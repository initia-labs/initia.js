/**
 * Unit tests for CompositeProvider.
 *
 * Uses CustomProvider instances as mock ChainDataProviders
 * to test delegation, routing, dedup, and error handling.
 */

import { describe, it, expect, vi } from 'vitest'
import { CompositeProvider } from '../../../src/provider/composite-provider'
import { CustomProvider } from '../../../src/provider/custom-provider'
import { ChainNotFoundError } from '../../../src/errors'
import { coin } from '../../../src/core/coin'
import type { ChainInfo, AssetInfo, IbcChannelInfo } from '../../../src/provider/types'

// =============================================================================
// Test Fixtures
// =============================================================================

const CHAIN_A: ChainInfo = {
  chainId: 'chain-a-1',
  chainName: 'Chain A',
  chainType: 'initia',
  network: 'testnet',
  grpc: 'localhost:9090',
  nativeDenom: 'utoken',
  bech32Prefix: 'init',
}

const CHAIN_B: ChainInfo = {
  chainId: 'chain-b-1',
  chainName: 'Chain B',
  chainType: 'other',
  network: 'mainnet',
  grpc: 'grpc.chainb.io:443',
  nativeDenom: 'uatom',
  bech32Prefix: 'cosmos',
}

const ASSET_TOKEN_A: AssetInfo = {
  chainId: 'chain-a-1',
  denom: 'utoken',
  symbol: 'TOKEN',
  name: 'Token A',
  display: 'token',
  denomUnits: [
    { denom: 'utoken', exponent: 0 },
    { denom: 'token', exponent: 6 },
  ],
  decimals: 6,
}

const ASSET_USDC_A: AssetInfo = {
  chainId: 'chain-a-1',
  denom: 'ibc/USDC_ON_A',
  symbol: 'USDC',
  name: 'USD Coin on A',
  display: 'usdc',
  denomUnits: [
    { denom: 'ibc/USDC_ON_A', exponent: 0 },
    { denom: 'usdc', exponent: 6 },
  ],
  decimals: 6,
}

const ASSET_TOKEN_B: AssetInfo = {
  chainId: 'chain-b-1',
  denom: 'uatom',
  symbol: 'ATOM',
  name: 'Cosmos Hub',
  display: 'atom',
  denomUnits: [
    { denom: 'uatom', exponent: 0 },
    { denom: 'atom', exponent: 6 },
  ],
  decimals: 6,
}

const ASSET_USDC_B: AssetInfo = {
  chainId: 'chain-b-1',
  denom: 'ibc/USDC_ON_B',
  symbol: 'USDC',
  name: 'USD Coin on B',
  display: 'usdc',
  denomUnits: [
    { denom: 'ibc/USDC_ON_B', exponent: 0 },
    { denom: 'usdc', exponent: 6 },
  ],
  decimals: 6,
}

const IBC_A_TO_B: IbcChannelInfo = {
  chainId: 'chain-b-1',
  portId: 'transfer',
  channelId: 'channel-0',
  version: 'ics20-1',
}

const IBC_B_TO_A: IbcChannelInfo = {
  chainId: 'chain-a-1',
  portId: 'transfer',
  channelId: 'channel-5',
  version: 'ics20-1',
}

// =============================================================================
// Helper: create two-provider composite
// =============================================================================

function createTestComposite() {
  const providerA = new CustomProvider()
  providerA.addChain({
    ...CHAIN_A,
    assets: [ASSET_TOKEN_A, ASSET_USDC_A],
    ibcChannels: [IBC_A_TO_B],
  })

  const providerB = new CustomProvider()
  providerB.addChain({
    ...CHAIN_B,
    assets: [ASSET_TOKEN_B, ASSET_USDC_B],
    ibcChannels: [IBC_B_TO_A],
  })

  const composite = new CompositeProvider([providerA, providerB])
  return { composite, providerA, providerB }
}

// =============================================================================
// Tests
// =============================================================================

describe('CompositeProvider', () => {
  // ---------------------------------------------------------------------------
  // Constructor & basic
  // ---------------------------------------------------------------------------

  describe('constructor', () => {
    it('should create composite with no providers', () => {
      const composite = new CompositeProvider([])
      expect(composite.listChains()).toHaveLength(0)
      expect(composite.providerCount).toBe(0)
    })

    it('should create composite with multiple providers', () => {
      const { composite } = createTestComposite()
      expect(composite.providerCount).toBe(2)
      expect(composite.listChains()).toHaveLength(2)
    })
  })

  // ---------------------------------------------------------------------------
  // ChainInfoProvider methods
  // ---------------------------------------------------------------------------

  describe('ChainInfoProvider methods', () => {
    it('getChainInfo should route to correct provider', () => {
      const { composite } = createTestComposite()

      const chainA = composite.getChainInfo('chain-a-1')
      expect(chainA).toBeDefined()
      expect(chainA?.chainName).toBe('Chain A')

      const chainB = composite.getChainInfo('chain-b-1')
      expect(chainB).toBeDefined()
      expect(chainB?.chainName).toBe('Chain B')
    })

    it('getChainInfo should return undefined for unknown chain', () => {
      const { composite } = createTestComposite()
      expect(composite.getChainInfo('unknown-1')).toBeUndefined()
    })

    it('listChains should return chains from all providers', () => {
      const { composite } = createTestComposite()
      const chains = composite.listChains()
      const ids = chains.map(c => c.chainId)
      expect(ids).toContain('chain-a-1')
      expect(ids).toContain('chain-b-1')
    })

    it('hasChain should work for all providers', () => {
      const { composite } = createTestComposite()
      expect(composite.hasChain('chain-a-1')).toBe(true)
      expect(composite.hasChain('chain-b-1')).toBe(true)
      expect(composite.hasChain('unknown-1')).toBe(false)
    })
  })

  // ---------------------------------------------------------------------------
  // First-wins priority
  // ---------------------------------------------------------------------------

  describe('first-wins priority', () => {
    it('should use first provider when chain IDs overlap', () => {
      const provider1 = new CustomProvider([{ ...CHAIN_A, chainName: 'Provider1 Chain A' }])
      const provider2 = new CustomProvider([{ ...CHAIN_A, chainName: 'Provider2 Chain A' }])

      const composite = new CompositeProvider([provider1, provider2])

      expect(composite.getChainInfo('chain-a-1')?.chainName).toBe('Provider1 Chain A')
      expect(composite.listChains()).toHaveLength(1)
    })

    it('should use first provider assets for overlapping chains', async () => {
      const provider1 = new CustomProvider()
      provider1.addChain({ ...CHAIN_A, assets: [ASSET_TOKEN_A] })

      const provider2 = new CustomProvider()
      provider2.addChain({ ...CHAIN_A, assets: [ASSET_USDC_A] })

      const composite = new CompositeProvider([provider1, provider2])

      // Should get provider1's assets for chain-a-1
      const assets = await composite.getAssets('chain-a-1')
      expect(assets).toHaveLength(1)
      expect(assets[0].denom).toBe('utoken')
    })
  })

  // ---------------------------------------------------------------------------
  // Asset delegation methods
  // ---------------------------------------------------------------------------

  describe('asset delegation', () => {
    it('getAssets should delegate to correct provider', async () => {
      const { composite } = createTestComposite()

      const assetsA = await composite.getAssets('chain-a-1')
      expect(assetsA).toHaveLength(2)
      expect(assetsA.map(a => a.symbol)).toEqual(['TOKEN', 'USDC'])

      const assetsB = await composite.getAssets('chain-b-1')
      expect(assetsB).toHaveLength(2)
      expect(assetsB.map(a => a.symbol)).toEqual(['ATOM', 'USDC'])
    })

    it('getAssets should return empty for unknown chain', async () => {
      const { composite } = createTestComposite()
      const assets = await composite.getAssets('unknown-1')
      expect(assets).toEqual([])
    })

    it('findAsset with chainId should delegate to correct provider', async () => {
      const { composite } = createTestComposite()

      const asset = await composite.findAsset('utoken', 'chain-a-1')
      expect(asset).toBeDefined()
      expect(asset?.symbol).toBe('TOKEN')

      // Should not find chain-a asset on chain-b
      const notFound = await composite.findAsset('utoken', 'chain-b-1')
      expect(notFound).toBeUndefined()
    })

    it('findAsset with chainId should return undefined for unknown chain', async () => {
      const { composite } = createTestComposite()
      const asset = await composite.findAsset('utoken', 'unknown-1')
      expect(asset).toBeUndefined()
    })

    it('findAsset without chainId should search all providers', async () => {
      const { composite } = createTestComposite()

      // utoken exists only on chain-a
      const tokenA = await composite.findAsset('utoken')
      expect(tokenA).toBeDefined()
      expect(tokenA?.chainId).toBe('chain-a-1')

      // uatom exists only on chain-b
      const tokenB = await composite.findAsset('uatom')
      expect(tokenB).toBeDefined()
      expect(tokenB?.chainId).toBe('chain-b-1')
    })

    it('findAsset without chainId should return first match', async () => {
      const { composite } = createTestComposite()

      // Both providers have USDC (different denoms), first provider wins
      const usdc = await composite.findAsset('ibc/USDC_ON_A')
      expect(usdc).toBeDefined()
      expect(usdc?.chainId).toBe('chain-a-1')
    })

    it('findAsset without chainId should return undefined if not found anywhere', async () => {
      const { composite } = createTestComposite()
      const asset = await composite.findAsset('nonexistent-denom')
      expect(asset).toBeUndefined()
    })

    it('findAssets should delegate to correct provider', async () => {
      const { composite } = createTestComposite()

      const result = await composite.findAssets(
        ['utoken', 'ibc/USDC_ON_A', 'nonexistent'],
        'chain-a-1'
      )
      expect(result.get('utoken')).toBeDefined()
      expect(result.get('ibc/USDC_ON_A')).toBeDefined()
      expect(result.get('nonexistent')).toBeUndefined()
    })

    it('findAssets should return all-undefined map for unknown chain', async () => {
      const { composite } = createTestComposite()

      const result = await composite.findAssets(['utoken', 'uatom'], 'unknown-1')
      expect(result.get('utoken')).toBeUndefined()
      expect(result.get('uatom')).toBeUndefined()
      expect(result.size).toBe(2)
    })
  })

  // ---------------------------------------------------------------------------
  // Cross-provider asset methods (with dedup)
  // ---------------------------------------------------------------------------

  describe('cross-provider asset methods', () => {
    it('findAssetBySymbol with chainId should delegate', async () => {
      const { composite } = createTestComposite()

      const usdc = await composite.findAssetBySymbol('USDC', 'chain-a-1')
      expect(usdc).toHaveLength(1)
      expect(usdc[0].chainId).toBe('chain-a-1')
    })

    it('findAssetBySymbol with chainId should return empty for unknown chain', async () => {
      const { composite } = createTestComposite()
      expect(await composite.findAssetBySymbol('USDC', 'unknown-1')).toEqual([])
    })

    it('findAssetBySymbol without chainId should collect from all providers', async () => {
      const { composite } = createTestComposite()

      const usdc = await composite.findAssetBySymbol('USDC')
      expect(usdc).toHaveLength(2)
      // Both chains have USDC
      const chainIds = usdc.map(a => a.chainId)
      expect(chainIds).toContain('chain-a-1')
      expect(chainIds).toContain('chain-b-1')
    })

    it('findAssetBySymbol should dedup by chainId:denom', async () => {
      // Two providers that both contain chain-a-1 USDC
      const provider1 = new CustomProvider()
      provider1.addChain({ ...CHAIN_A, assets: [ASSET_USDC_A] })

      const provider2 = new CustomProvider()
      provider2.addChain({ ...CHAIN_A, assets: [ASSET_USDC_A] })

      const composite = new CompositeProvider([provider1, provider2])

      const usdc = await composite.findAssetBySymbol('USDC')
      expect(usdc).toHaveLength(1) // Deduped
    })

    it('listAssets with chainId should delegate', async () => {
      const { composite } = createTestComposite()

      const assets = await composite.listAssets({ chainId: 'chain-a-1' })
      expect(assets).toHaveLength(2)
      expect(assets.every(a => a.chainId === 'chain-a-1')).toBe(true)
    })

    it('listAssets with chainId should return empty for unknown chain', async () => {
      const { composite } = createTestComposite()
      expect(await composite.listAssets({ chainId: 'unknown-1' })).toEqual([])
    })

    it('listAssets without options should collect from all providers', async () => {
      const { composite } = createTestComposite()

      const all = await composite.listAssets()
      expect(all).toHaveLength(4) // 2 from A + 2 from B
    })

    it('listAssets should dedup by chainId:denom', async () => {
      const provider1 = new CustomProvider()
      provider1.addChain({ ...CHAIN_A, assets: [ASSET_TOKEN_A, ASSET_USDC_A] })

      const provider2 = new CustomProvider()
      // Provider2 also has chain-a-1 with same assets
      provider2.addChain({ ...CHAIN_A, assets: [ASSET_TOKEN_A, ASSET_USDC_A] })

      const composite = new CompositeProvider([provider1, provider2])

      const all = await composite.listAssets()
      expect(all).toHaveLength(2) // Deduped
    })

    it('listAssets with symbol filter should work cross-provider', async () => {
      const { composite } = createTestComposite()

      const usdc = await composite.listAssets({ symbol: 'USDC' })
      expect(usdc).toHaveLength(2)
    })
  })

  // ---------------------------------------------------------------------------
  // IBC delegation
  // ---------------------------------------------------------------------------

  describe('IBC delegation', () => {
    it('getIbcChannels should delegate to correct provider', () => {
      const { composite } = createTestComposite()

      const channelsA = composite.getIbcChannels('chain-a-1')
      expect(channelsA).toHaveLength(1)
      expect(channelsA[0].channelId).toBe('channel-0')

      const channelsB = composite.getIbcChannels('chain-b-1')
      expect(channelsB).toHaveLength(1)
      expect(channelsB[0].channelId).toBe('channel-5')
    })

    it('getIbcChannels should return empty for unknown chain', () => {
      const { composite } = createTestComposite()
      expect(composite.getIbcChannels('unknown-1')).toEqual([])
    })

    it('getIbcChannel should find channel between chains', () => {
      const { composite } = createTestComposite()

      const ch = composite.getIbcChannel('chain-a-1', 'chain-b-1')
      expect(ch).toBeDefined()
      expect(ch?.channelId).toBe('channel-0')
    })

    it('getIbcChannel should return undefined for unknown source', () => {
      const { composite } = createTestComposite()
      expect(composite.getIbcChannel('unknown-1', 'chain-b-1')).toBeUndefined()
    })

    it('getTransferPath should delegate', () => {
      const { composite } = createTestComposite()

      const path = composite.getTransferPath('chain-a-1', 'chain-b-1')
      expect(path).toBeDefined()
      expect(path?.channel).toBe('channel-0')
      expect(path?.port).toBe('transfer')
    })

    it('getTransferPath should return undefined for unknown chain', () => {
      const { composite } = createTestComposite()
      expect(composite.getTransferPath('unknown-1', 'chain-b-1')).toBeUndefined()
    })
  })

  // ---------------------------------------------------------------------------
  // Amount delegation + ChainNotFoundError
  // ---------------------------------------------------------------------------

  describe('amount delegation', () => {
    it('toDisplayAmount should delegate to correct provider', async () => {
      const { composite } = createTestComposite()
      const result = await composite.toDisplayAmount(coin('utoken', '1000000'), 'chain-a-1')
      expect(result).toBe('1')
    })

    it('toDisplayAmount should throw ChainNotFoundError for unknown chain', async () => {
      const { composite } = createTestComposite()
      await expect(
        composite.toDisplayAmount(coin('utoken', '1000000'), 'unknown-1')
      ).rejects.toThrow(ChainNotFoundError)
    })

    it('toBaseAmount should delegate to correct provider', async () => {
      const { composite } = createTestComposite()
      const result = await composite.toBaseAmount('1', 'utoken', 'chain-a-1')
      expect(result).toBe('1000000')
    })

    it('toBaseAmount should throw ChainNotFoundError for unknown chain', async () => {
      const { composite } = createTestComposite()
      await expect(composite.toBaseAmount('1', 'utoken', 'unknown-1')).rejects.toThrow(
        ChainNotFoundError
      )
    })

    it('convertAmount should delegate to correct provider', async () => {
      const { composite } = createTestComposite()
      const result = await composite.convertAmount('1', 'token', 'utoken', 'chain-a-1')
      expect(result).toBe('1000000')
    })

    it('convertAmount should throw ChainNotFoundError for unknown chain', async () => {
      const { composite } = createTestComposite()
      await expect(composite.convertAmount('1', 'token', 'utoken', 'unknown-1')).rejects.toThrow(
        ChainNotFoundError
      )
    })

    it('formatAmount should delegate to correct provider', async () => {
      const { composite } = createTestComposite()
      const result = await composite.formatAmount(coin('utoken', '1000000'), 'chain-a-1')
      expect(result).toBe('1 TOKEN')
    })

    it('formatAmount should throw ChainNotFoundError for unknown chain', async () => {
      const { composite } = createTestComposite()
      await expect(composite.formatAmount(coin('utoken', '1000000'), 'unknown-1')).rejects.toThrow(
        ChainNotFoundError
      )
    })
  })

  // ---------------------------------------------------------------------------
  // Resolution methods
  // ---------------------------------------------------------------------------

  describe('resolution methods', () => {
    it('resolveChainId should search all providers', () => {
      const { composite } = createTestComposite()

      // CustomProvider uses chainName for resolveChainId
      expect(composite.resolveChainId('Chain A')).toBe('chain-a-1')
      expect(composite.resolveChainId('Chain B')).toBe('chain-b-1')
    })

    it('resolveChainId should return first match across providers', () => {
      const provider1 = new CustomProvider([{ ...CHAIN_A, chainName: 'Shared Name' }])
      const provider2 = new CustomProvider([{ ...CHAIN_B, chainName: 'Shared Name' }])

      const composite = new CompositeProvider([provider1, provider2])
      // First provider wins
      expect(composite.resolveChainId('Shared Name')).toBe('chain-a-1')
    })

    it('resolveChainId should return undefined if not found', () => {
      const { composite } = createTestComposite()
      expect(composite.resolveChainId('NonExistent')).toBeUndefined()
    })

    it('resolveChainId with network filter should work', () => {
      const { composite } = createTestComposite()

      expect(composite.resolveChainId('Chain A', 'testnet')).toBe('chain-a-1')
      expect(composite.resolveChainId('Chain A', 'mainnet')).toBeUndefined()
    })

    it('getChainName should delegate to correct provider', () => {
      const { composite } = createTestComposite()

      expect(composite.getChainName('chain-a-1')).toBe('Chain A')
      expect(composite.getChainName('chain-b-1')).toBe('Chain B')
    })

    it('getChainName should return undefined for unknown chain', () => {
      const { composite } = createTestComposite()
      expect(composite.getChainName('unknown-1')).toBeUndefined()
    })
  })

  // ---------------------------------------------------------------------------
  // refresh()
  // ---------------------------------------------------------------------------

  describe('refresh', () => {
    it('should call refresh on all child providers', async () => {
      const { composite, providerA, providerB } = createTestComposite()

      const spyA = vi.spyOn(providerA, 'refresh')
      const spyB = vi.spyOn(providerB, 'refresh')

      await composite.refresh()

      expect(spyA).toHaveBeenCalledOnce()
      expect(spyB).toHaveBeenCalledOnce()
    })

    it('should rebuild cache after refresh', async () => {
      const { composite, providerA } = createTestComposite()

      expect(composite.listChains()).toHaveLength(2)

      // Add a chain to providerA after construction
      providerA.addChain({
        chainId: 'chain-c-1',
        chainName: 'Chain C',
        chainType: 'other',
        network: 'mainnet',
      })

      // Before refresh, cache is stale
      expect(composite.hasChain('chain-c-1')).toBe(false)

      // After refresh, cache is rebuilt
      await composite.refresh()
      expect(composite.hasChain('chain-c-1')).toBe(true)
      expect(composite.listChains()).toHaveLength(3)
    })

    it('should throw AggregateError when all providers fail to refresh', async () => {
      const { composite, providerA, providerB } = createTestComposite()

      vi.spyOn(providerA, 'refresh').mockRejectedValue(new Error('A failed'))
      vi.spyOn(providerB, 'refresh').mockRejectedValue(new Error('B failed'))

      await expect(composite.refresh()).rejects.toThrow('All providers failed to refresh')
    })

    it('should return partial errors when some providers fail to refresh', async () => {
      const { composite, providerA, providerB } = createTestComposite()

      vi.spyOn(providerA, 'refresh').mockRejectedValue(new Error('A failed'))
      vi.spyOn(providerB, 'refresh').mockResolvedValue({})

      const result = await composite.refresh() // should not throw

      expect(result.errors).toHaveLength(1)
      expect(result.errors![0].message).toBe('A failed')
    })
  })

  // ---------------------------------------------------------------------------
  // Edge cases & advanced scenarios
  // ---------------------------------------------------------------------------

  describe('edge cases', () => {
    it('should handle single provider', () => {
      const provider = new CustomProvider([CHAIN_A])
      const composite = new CompositeProvider([provider])

      expect(composite.listChains()).toHaveLength(1)
      expect(composite.getChainInfo('chain-a-1')).toBeDefined()
    })

    it('should handle providers with no chains', () => {
      const empty1 = new CustomProvider()
      const empty2 = new CustomProvider()
      const composite = new CompositeProvider([empty1, empty2])

      expect(composite.listChains()).toHaveLength(0)
      expect(composite.providerCount).toBe(2)
    })
  })

  // ---------------------------------------------------------------------------
  // 3+ provider routing
  // ---------------------------------------------------------------------------

  describe('3+ provider routing', () => {
    const CHAIN_C: ChainInfo = {
      chainId: 'chain-c-1',
      chainName: 'Chain C',
      chainType: 'minievm',
      network: 'testnet',
      grpc: 'localhost:9092',
      nativeDenom: 'aETH',
      bech32Prefix: 'init',
    }

    const ASSET_ETH_C: AssetInfo = {
      chainId: 'chain-c-1',
      denom: 'aETH',
      symbol: 'ETH',
      name: 'Ether on C',
      display: 'eth',
      denomUnits: [
        { denom: 'aETH', exponent: 0 },
        { denom: 'eth', exponent: 18 },
      ],
      decimals: 18,
    }

    function createThreeProviderComposite() {
      const pA = new CustomProvider()
      pA.addChain({ ...CHAIN_A, assets: [ASSET_TOKEN_A] })

      const pB = new CustomProvider()
      pB.addChain({ ...CHAIN_B, assets: [ASSET_TOKEN_B] })

      const pC = new CustomProvider()
      pC.addChain({ ...CHAIN_C, assets: [ASSET_ETH_C] })

      return new CompositeProvider([pA, pB, pC])
    }

    it('should route getChainInfo to the correct provider among 3', () => {
      const composite = createThreeProviderComposite()
      expect(composite.listChains()).toHaveLength(3)
      expect(composite.getChainInfo('chain-c-1')?.chainType).toBe('minievm')
    })

    it('should route asset queries across 3 providers', async () => {
      const composite = createThreeProviderComposite()
      const ethAssets = await composite.getAssets('chain-c-1')
      expect(ethAssets).toHaveLength(1)
      expect(ethAssets[0].decimals).toBe(18)
    })

    it('should find assets by symbol from any of 3 providers', async () => {
      const composite = createThreeProviderComposite()
      const ethResults = await composite.findAssetBySymbol('ETH')
      expect(ethResults).toHaveLength(1)
      expect(ethResults[0].chainId).toBe('chain-c-1')
    })

    it('should collect listAssets from all 3 providers', async () => {
      const composite = createThreeProviderComposite()
      const all = await composite.listAssets()
      expect(all).toHaveLength(3) // TOKEN_A + ATOM_B + ETH_C
    })

    it('should convert amounts on third provider', async () => {
      const composite = createThreeProviderComposite()
      const display = await composite.toDisplayAmount(
        coin('aETH', '1000000000000000000'),
        'chain-c-1'
      )
      expect(display).toBe('1')
    })
  })

  // ---------------------------------------------------------------------------
  // Dynamic mutation + refresh
  // ---------------------------------------------------------------------------

  describe('dynamic mutation + refresh', () => {
    it('should pick up new assets after provider mutation + refresh', async () => {
      const { composite, providerA } = createTestComposite()

      // Initially chain-a-1 has 2 assets
      expect(await composite.getAssets('chain-a-1')).toHaveLength(2)

      // Mutate providerA: add a new asset
      providerA.addAssets('chain-a-1', [
        {
          chainId: 'chain-a-1',
          denom: 'unew',
          symbol: 'NEW',
          name: 'New Token',
          display: 'new',
          denomUnits: [
            { denom: 'unew', exponent: 0 },
            { denom: 'new', exponent: 6 },
          ],
          decimals: 6,
        },
      ])

      // After refresh, composite should see the new asset
      await composite.refresh()
      const assets = await composite.getAssets('chain-a-1')
      expect(assets).toHaveLength(3)
      expect(assets.find(a => a.denom === 'unew')).toBeDefined()
    })

    it('should remove chains from cache after provider mutation + refresh', async () => {
      const { composite, providerA } = createTestComposite()
      expect(composite.hasChain('chain-a-1')).toBe(true)

      providerA.removeChain('chain-a-1')
      await composite.refresh()

      expect(composite.hasChain('chain-a-1')).toBe(false)
      expect(composite.listChains()).toHaveLength(1)
    })
  })

  // ---------------------------------------------------------------------------
  // findAsset global search priority
  // ---------------------------------------------------------------------------

  describe('findAsset global priority', () => {
    it('should return first provider match when same denom exists in multiple providers', async () => {
      // Both providers have 'utoken' on different chains
      const p1 = new CustomProvider()
      p1.addChain({
        ...CHAIN_A,
        assets: [
          {
            ...ASSET_TOKEN_A,
            name: 'Token from P1',
          },
        ],
      })

      const p2 = new CustomProvider()
      p2.addChain({
        ...CHAIN_B,
        assets: [
          {
            ...ASSET_TOKEN_B,
            denom: 'utoken', // same denom as p1
            name: 'Token from P2',
          },
        ],
      })

      const composite = new CompositeProvider([p1, p2])

      // Without chainId: first provider wins
      const found = await composite.findAsset('utoken')
      expect(found).toBeDefined()
      expect(found?.name).toBe('Token from P1')
    })
  })
})
