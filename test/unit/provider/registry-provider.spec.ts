import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import type { AssetList } from '@initia/initia-registry-types'
import type { RegistryProvider } from '../../../src/provider/registry-provider'
import { createRegistryProvider } from '../../../src/provider/registry-provider'
// AssetInfo, IbcChannelInfo, OpBridgeInfo — used indirectly via fixture typing

// Load fixtures
import chainsFixture from '../../fixtures/registry/chains.json'
import assetlistInitia from '../../fixtures/registry/assetlist-initia.json'
import assetlistMinievm from '../../fixtures/registry/assetlist-minievm.json'

// =============================================================================
// Helpers
// =============================================================================

function mockFetch() {
  const responses: Record<string, unknown> = {
    'https://registry.initia.xyz/chains.json': chainsFixture,
    'https://registry.testnet.initia.xyz/chains.json': [],
    'https://raw.example.com/initia/assetlist.json': assetlistInitia,
    'https://raw.example.com/minievm/assetlist.json': assetlistMinievm,
    'https://raw.example.com/minimove/assetlist.json': { chain_name: 'minimove', assets: [] },
  }

  return vi.fn(async (url: string | URL | Request) => {
    const urlStr = typeof url === 'string' ? url : url.toString()
    const body = responses[urlStr]
    if (body) {
      return new Response(JSON.stringify(body), { status: 200 })
    }
    return new Response('Not Found', { status: 404 })
  })
}

async function createTestProvider() {
  const fetchMock = mockFetch()
  vi.stubGlobal('fetch', fetchMock)
  const provider = await createRegistryProvider({ network: 'mainnet', timeout: 5000 })
  return { provider, fetchMock }
}

// =============================================================================
// Tests
// =============================================================================

describe('RegistryProvider', () => {
  let provider: RegistryProvider
  let fetchMock: ReturnType<typeof mockFetch>

  beforeEach(async () => {
    const result = await createTestProvider()
    provider = result.provider
    fetchMock = result.fetchMock
  })

  afterEach(() => {
    vi.restoreAllMocks()
  })

  // ---------------------------------------------------------------------------
  // ChainInfoProvider methods (preserved)
  // ---------------------------------------------------------------------------

  describe('getChainInfo', () => {
    it('should return chain info for known chain', () => {
      const info = provider.getChainInfo('interwoven-1')
      expect(info).toBeDefined()
      expect(info!.chainId).toBe('interwoven-1')
      expect(info!.chainName).toBe('Initia')
      expect(info!.chainType).toBe('initia')
      expect(info!.network).toBe('mainnet')
    })

    it('should return undefined for unknown chain', () => {
      expect(provider.getChainInfo('unknown')).toBeUndefined()
    })
  })

  describe('listChains', () => {
    it('should return all chains', () => {
      const chains = provider.listChains()
      expect(chains).toHaveLength(3)
      expect(chains.map(c => c.chainId).sort()).toEqual(['interwoven-1', 'minievm-1', 'minimove-1'])
    })
  })

  describe('hasChain', () => {
    it('should return true for known chain', () => {
      expect(provider.hasChain('interwoven-1')).toBe(true)
    })

    it('should return false for unknown chain', () => {
      expect(provider.hasChain('unknown')).toBe(false)
    })
  })

  // ---------------------------------------------------------------------------
  // toChainInfo extended fields
  // ---------------------------------------------------------------------------

  describe('toChainInfo extended fields', () => {
    it('should map ibcChannels from metadata', () => {
      const info = provider.getChainInfo('interwoven-1')!
      expect(info.ibcChannels).toBeDefined()
      expect(info.ibcChannels).toHaveLength(2)
      expect(info.ibcChannels![0]).toEqual({
        chainId: 'noble-1',
        portId: 'transfer',
        channelId: 'channel-3',
        version: 'ics20-1',
      })
    })

    it('should map evmChainId', () => {
      const info = provider.getChainInfo('minievm-1')!
      expect(info.evmChainId).toBe(1234567)
    })

    it('should map slip44', () => {
      const info = provider.getChainInfo('interwoven-1')!
      expect(info.slip44).toBe(118)
    })

    it('should map opDenoms', () => {
      const info = provider.getChainInfo('minievm-1')!
      expect(info.opDenoms).toEqual(['uinit', 'uusdc'])
    })

    it('should map explorerUrl', () => {
      const info = provider.getChainInfo('interwoven-1')!
      expect(info.explorerUrl).toBe('https://scan.initia.xyz')
    })

    it('should map api and indexer', () => {
      const info = provider.getChainInfo('interwoven-1')!
      expect(info.api).toBe('https://api.initia.xyz')
      expect(info.indexer).toBe('https://indexer.initia.xyz')
    })

    it('should handle chain without ibcChannels', () => {
      const info = provider.getChainInfo('minimove-1')!
      expect(info.ibcChannels).toBeUndefined()
    })

    it('should handle chain without evmChainId', () => {
      const info = provider.getChainInfo('interwoven-1')!
      // Fixture has evm_chain_id: null which should not be set
      expect(info.evmChainId).toBeUndefined()
    })
  })

  // ---------------------------------------------------------------------------
  // toAssetInfo (via getAssets)
  // ---------------------------------------------------------------------------

  describe('toAssetInfo normalization', () => {
    it('should normalize native token', async () => {
      const assets = await provider.getAssets('interwoven-1')
      const init = assets.find(a => a.denom === 'uinit')!
      expect(init).toBeDefined()
      expect(init.chainId).toBe('interwoven-1')
      expect(init.symbol).toBe('INIT')
      expect(init.name).toBe('Initia Native Token')
      expect(init.display).toBe('INIT')
      expect(init.decimals).toBe(6)
      expect(init.denomUnits).toEqual([
        { denom: 'uinit', exponent: 0 },
        { denom: 'INIT', exponent: 6, aliases: ['init'] },
      ])
      expect(init.coingeckoId).toBe('initia')
      expect(init.logoUrl).toBe('https://logo.initia.xyz/init.png')
      expect(init.originChainId).toBeUndefined()
      expect(init.originDenom).toBeUndefined()
    })

    it('should extract origin from IBC traces', async () => {
      const assets = await provider.getAssets('interwoven-1')
      const usdc = assets.find(a => a.denom === 'ibc/USDC_HASH')!
      expect(usdc).toBeDefined()
      expect(usdc.originChainId).toBe('noble-1')
      expect(usdc.originDenom).toBe('uusdc')
      expect(usdc.typeAsset).toBe('ics20')
    })

    it('should fallback logoUrl to images[0].png', async () => {
      const assets = await provider.getAssets('interwoven-1')
      const usdc = assets.find(a => a.denom === 'ibc/USDC_HASH')!
      expect(usdc.logoUrl).toBe('https://logo.noble.xyz/usdc.png')
    })

    it('should map ERC20 asset fields', async () => {
      const assets = await provider.getAssets('minievm-1')
      const eth = assets.find(a => a.denom === 'aETH')!
      expect(eth).toBeDefined()
      expect(eth.decimals).toBe(18)
      expect(eth.typeAsset).toBe('erc20')
      expect(eth.contractAddress).toBe('0x1234567890abcdef1234567890abcdef12345678')
      expect(eth.oracleSymbol).toBe('WETH')
    })

    it('should return decimals 0 when display unit not found', async () => {
      const assets = await provider.getAssets('minimove-1')
      // minimove fixture has empty assets
      expect(assets).toHaveLength(0)
    })
  })

  // ---------------------------------------------------------------------------
  // Asset query methods
  // ---------------------------------------------------------------------------

  describe('getAssets', () => {
    it('should return assets for known chain', async () => {
      const assets = await provider.getAssets('interwoven-1')
      expect(assets).toHaveLength(2)
    })

    it('should return empty for chain with no assetlist URL', async () => {
      // Add a chain without assetlist URL by mocking
      const assets = await provider.getAssets('unknown-chain')
      expect(assets).toEqual([])
    })

    it('should cache results', async () => {
      await provider.getAssets('interwoven-1')
      const fetchCountAfter1 = fetchMock.mock.calls.length
      await provider.getAssets('interwoven-1')
      const fetchCountAfter2 = fetchMock.mock.calls.length
      // Second call should not trigger additional fetch
      expect(fetchCountAfter2).toBe(fetchCountAfter1)
    })
  })

  describe('getRawAssetList', () => {
    it('should return raw AssetList', async () => {
      const raw = (await provider.getRawAssetList('interwoven-1')) as AssetList | undefined
      expect(raw).toBeDefined()
      expect(raw!.chain_name).toBe('initia')
      expect(raw!.assets).toHaveLength(2)
    })

    it('should return undefined for unknown chain', async () => {
      const raw = await provider.getRawAssetList('unknown')
      expect(raw).toBeUndefined()
    })
  })

  describe('findAsset', () => {
    it('should find asset by denom on specific chain', async () => {
      const asset = await provider.findAsset('uinit', 'interwoven-1')
      expect(asset).toBeDefined()
      expect(asset!.symbol).toBe('INIT')
    })

    it('should return undefined for missing denom', async () => {
      const asset = await provider.findAsset('nonexistent', 'interwoven-1')
      expect(asset).toBeUndefined()
    })

    it('should search all chains when no chainId', async () => {
      const asset = await provider.findAsset('aETH')
      expect(asset).toBeDefined()
      expect(asset!.symbol).toBe('ETH')
      expect(asset!.chainId).toBe('minievm-1')
    })
  })

  describe('findAssetBySymbol', () => {
    it('should find by symbol case-insensitively', async () => {
      const results = await provider.findAssetBySymbol('init', 'interwoven-1')
      expect(results).toHaveLength(1)
      expect(results[0].denom).toBe('uinit')
    })

    it('should search all chains when no chainId', async () => {
      const results = await provider.findAssetBySymbol('ETH')
      expect(results).toHaveLength(1)
      expect(results[0].chainId).toBe('minievm-1')
    })

    it('should return empty for no match', async () => {
      const results = await provider.findAssetBySymbol('NONEXISTENT')
      expect(results).toHaveLength(0)
    })
  })

  describe('listAssets', () => {
    it('should list all assets', async () => {
      const all = await provider.listAssets()
      // initia: 2 + minievm: 1 + minimove: 0 = 3
      expect(all).toHaveLength(3)
    })

    it('should filter by chainId', async () => {
      const assets = await provider.listAssets({ chainId: 'interwoven-1' })
      expect(assets).toHaveLength(2)
    })

    it('should filter by symbol', async () => {
      const assets = await provider.listAssets({ symbol: 'USDC' })
      expect(assets).toHaveLength(1)
      expect(assets[0].denom).toBe('ibc/USDC_HASH')
    })

    it('should filter by chainId and symbol', async () => {
      const assets = await provider.listAssets({
        chainId: 'interwoven-1',
        symbol: 'INIT',
      })
      expect(assets).toHaveLength(1)
    })
  })

  // ---------------------------------------------------------------------------
  // IBC methods
  // ---------------------------------------------------------------------------

  describe('getIbcChannels', () => {
    it('should return IBC channels for chain', () => {
      const channels = provider.getIbcChannels('interwoven-1')
      expect(channels).toHaveLength(2)
    })

    it('should return empty for chain without channels', () => {
      const channels = provider.getIbcChannels('minimove-1')
      expect(channels).toHaveLength(0)
    })

    it('should return empty for unknown chain', () => {
      const channels = provider.getIbcChannels('unknown')
      expect(channels).toHaveLength(0)
    })
  })

  describe('getIbcChannel', () => {
    it('should find channel between chains', () => {
      const channel = provider.getIbcChannel('interwoven-1', 'noble-1')
      expect(channel).toBeDefined()
      expect(channel!.channelId).toBe('channel-3')
      expect(channel!.portId).toBe('transfer')
    })

    it('should return undefined for no matching channel', () => {
      const channel = provider.getIbcChannel('interwoven-1', 'unknown')
      expect(channel).toBeUndefined()
    })
  })

  describe('getTransferPath', () => {
    it('should return transfer path for ics20-1 channel', () => {
      const path = provider.getTransferPath('interwoven-1', 'noble-1')
      expect(path).toBeDefined()
      expect(path!.sourceChainId).toBe('interwoven-1')
      expect(path!.destChainId).toBe('noble-1')
      expect(path!.channel).toBe('channel-3')
      expect(path!.port).toBe('transfer')
    })

    it('should return undefined for non-ics20-1 channel', () => {
      // channel-99 is ics721-1
      const path = provider.getTransferPath('interwoven-1', 'minievm-1')
      expect(path).toBeUndefined()
    })

    it('should return undefined for unknown route', () => {
      const path = provider.getTransferPath('interwoven-1', 'unknown')
      expect(path).toBeUndefined()
    })
  })

  // ---------------------------------------------------------------------------
  // OP Bridge
  // ---------------------------------------------------------------------------

  describe('getOpBridge', () => {
    it('should return bridge info for L2 chain', () => {
      const bridge = provider.getOpBridge('minievm-1')
      expect(bridge).toBeDefined()
      expect(bridge!.bridgeId).toBe(42n)
      expect(bridge!.l2ChainId).toBe('minievm-1')
      expect(bridge!.denoms).toEqual(['uinit', 'uusdc'])
      expect(bridge!.executorUri).toBe('https://executor.minievm.xyz')
    })

    it('should return undefined for L1 chain (no opBridgeId)', () => {
      const bridge = provider.getOpBridge('interwoven-1')
      expect(bridge).toBeUndefined()
    })

    it('should return undefined for unknown chain', () => {
      const bridge = provider.getOpBridge('unknown')
      expect(bridge).toBeUndefined()
    })
  })

  // ---------------------------------------------------------------------------
  // Resolution methods
  // ---------------------------------------------------------------------------

  describe('resolveChainId', () => {
    it('should resolve chain name to chain id', () => {
      const id = provider.resolveChainId('initia')
      expect(id).toBe('interwoven-1')
    })

    it('should return undefined for unknown name', () => {
      const id = provider.resolveChainId('unknown')
      expect(id).toBeUndefined()
    })

    it('should filter by network', () => {
      const id = provider.resolveChainId('initia', 'mainnet')
      expect(id).toBe('interwoven-1')
    })

    it('should return undefined when network does not match', () => {
      const id = provider.resolveChainId('initia', 'testnet')
      expect(id).toBeUndefined()
    })
  })

  describe('getChainName', () => {
    it('should return chain name for known chain', () => {
      expect(provider.getChainName('interwoven-1')).toBe('initia')
    })

    it('should return undefined for unknown chain', () => {
      expect(provider.getChainName('unknown')).toBeUndefined()
    })
  })

  // ---------------------------------------------------------------------------
  // Lazy loading & dedup
  // ---------------------------------------------------------------------------

  describe('lazy loading', () => {
    it('should lazy load assets on first getAssets call', async () => {
      const fetchCountBefore = fetchMock.mock.calls.length
      await provider.getAssets('interwoven-1')
      const fetchCountAfter = fetchMock.mock.calls.length
      // Should have made exactly 1 additional fetch (for the assetlist)
      expect(fetchCountAfter - fetchCountBefore).toBe(1)
    })

    it('should deduplicate concurrent requests for same chain', async () => {
      const fetchCountBefore = fetchMock.mock.calls.length
      // Fire two concurrent requests
      const [a, b] = await Promise.all([
        provider.getAssets('interwoven-1'),
        provider.getAssets('interwoven-1'),
      ])
      const fetchCountAfter = fetchMock.mock.calls.length
      // Only 1 fetch should have been made
      expect(fetchCountAfter - fetchCountBefore).toBe(1)
      expect(a).toEqual(b)
    })

    it('should load all assets for listAssets without chainId', async () => {
      const assets = await provider.listAssets()
      expect(assets.length).toBeGreaterThan(0)
      // Should have fetched assetlists for all chains with URLs
    })
  })

  // ---------------------------------------------------------------------------
  // refresh
  // ---------------------------------------------------------------------------

  describe('refresh', () => {
    it('should re-fetch and rebuild all data', async () => {
      // Initial state
      expect(provider.hasChain('interwoven-1')).toBe(true)
      await provider.getAssets('interwoven-1')

      // Refresh
      await provider.refresh()

      // Should still have the chain (re-fetched)
      expect(provider.hasChain('interwoven-1')).toBe(true)
    })
  })

  // ---------------------------------------------------------------------------
  // Amount conversion (inherited from BaseChainDataProvider)
  // ---------------------------------------------------------------------------

  describe('amount conversion (inherited)', () => {
    it('should convert base to display amount', async () => {
      const { coin } = await import('../../../src/core/coin')
      const result = await provider.toDisplayAmount(coin('uinit', '1000000'), 'interwoven-1')
      expect(result).toBe('1')
    })

    it('should format amount with symbol', async () => {
      const { coin } = await import('../../../src/core/coin')
      const result = await provider.formatAmount(coin('uinit', '1500000'), 'interwoven-1')
      expect(result).toBe('1.5 INIT')
    })
  })

  // ---------------------------------------------------------------------------
  // createRegistryProvider options
  // ---------------------------------------------------------------------------

  describe('createRegistryProvider', () => {
    it('should support prefetchAssets: true', async () => {
      vi.stubGlobal('fetch', mockFetch())
      const p = await createRegistryProvider({
        network: 'mainnet',
        timeout: 5000,
        prefetchAssets: true,
      })
      // Assets should already be loaded (no additional fetch on getAssets)
      const fetchCountBefore = vi.mocked(fetch).mock.calls.length
      await p.getAssets('interwoven-1')
      const fetchCountAfter = vi.mocked(fetch).mock.calls.length
      expect(fetchCountAfter).toBe(fetchCountBefore)
    })

    it('should support prefetchAssets: specific chain IDs', async () => {
      vi.stubGlobal('fetch', mockFetch())
      const p = await createRegistryProvider({
        network: 'mainnet',
        timeout: 5000,
        prefetchAssets: ['interwoven-1'],
      })
      // interwoven-1 should be pre-loaded
      const fetchCountBefore = vi.mocked(fetch).mock.calls.length
      await p.getAssets('interwoven-1')
      expect(vi.mocked(fetch).mock.calls.length).toBe(fetchCountBefore)

      // minievm-1 should NOT be pre-loaded (will trigger fetch)
      await p.getAssets('minievm-1')
      expect(vi.mocked(fetch).mock.calls.length).toBe(fetchCountBefore + 1)
    })
  })

  // ---------------------------------------------------------------------------
  // Fetch failure handling
  // ---------------------------------------------------------------------------

  describe('fetch failure handling', () => {
    it('should throw when chains.json fetch throws network error', async () => {
      vi.restoreAllMocks()
      vi.stubGlobal(
        'fetch',
        vi.fn(async () => {
          throw new Error('Network error')
        })
      )
      await expect(createRegistryProvider({ network: 'mainnet', timeout: 1000 })).rejects.toThrow(
        'Failed to fetch chains from mainnet registry'
      )
    })

    it('should throw when chains.json returns 500', async () => {
      vi.restoreAllMocks()
      vi.stubGlobal(
        'fetch',
        vi.fn(async () => {
          return new Response('Internal Server Error', { status: 500 })
        })
      )
      await expect(createRegistryProvider({ network: 'mainnet', timeout: 1000 })).rejects.toThrow(
        'Failed to fetch chains from mainnet registry'
      )
    })

    it('should return empty assets when assetlist fetch returns 404', async () => {
      // Use normal mock for chains but 404 for all assetlists
      vi.restoreAllMocks()
      const fm = mockFetch()
      // Override assetlist responses to 404
      vi.stubGlobal(
        'fetch',
        vi.fn(async (url: string | URL | Request) => {
          const urlStr = typeof url === 'string' ? url : url.toString()
          if (urlStr.includes('chains.json')) {
            return fm(url)
          }
          return new Response('Not Found', { status: 404 })
        })
      )
      const p = await createRegistryProvider({ network: 'mainnet', timeout: 5000 })
      expect(p.listChains().length).toBeGreaterThan(0)
      // Asset fetch should gracefully return empty
      const assets = await p.getAssets('interwoven-1')
      expect(assets).toEqual([])
    })

    it('should return empty assets when assetlist fetch throws', async () => {
      vi.restoreAllMocks()
      const fm = mockFetch()
      vi.stubGlobal(
        'fetch',
        vi.fn(async (url: string | URL | Request) => {
          const urlStr = typeof url === 'string' ? url : url.toString()
          if (urlStr.includes('chains.json')) {
            return fm(url)
          }
          throw new Error('Connection refused')
        })
      )
      const p = await createRegistryProvider({ network: 'mainnet', timeout: 5000 })
      const assets = await p.getAssets('interwoven-1')
      expect(assets).toEqual([])
    })
  })

  // ---------------------------------------------------------------------------
  // Chain without assetlist URL
  // ---------------------------------------------------------------------------

  describe('chain without assetlist URL', () => {
    it('should return empty assets for chain that has no assetlist metadata', async () => {
      // minimove-1 fixture has an assetlist URL but returns empty assets.
      // Test the case where a chain exists but has an empty asset list.
      const assets = await provider.getAssets('minimove-1')
      expect(assets).toHaveLength(0)
    })

    it('should not throw when calling findAsset on chain with no assets', async () => {
      const result = await provider.findAsset('nonexistent', 'minimove-1')
      expect(result).toBeUndefined()
    })
  })
})
