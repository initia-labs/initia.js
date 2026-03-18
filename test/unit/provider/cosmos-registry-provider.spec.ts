/**
 * Unit tests for CosmosRegistryProvider.
 *
 * Uses vi.mock to avoid chain-registry's broken module dependencies.
 * Tests the Cosmos ecosystem chain provider with fixture data.
 */

import { describe, it, expect, vi } from 'vitest'

// =============================================================================
// Mock chain-registry modules (vi.hoisted ensures availability during vi.mock)
// =============================================================================

const { MOCK_CHAINS, MOCK_TESTNET_CHAINS, MOCK_ASSET_LISTS, MOCK_IBC_DATA } = vi.hoisted(() => ({
  MOCK_CHAINS: [
    {
      chainName: 'osmosis',
      chainId: 'osmosis-1',
      chainType: 'cosmos',
      prettyName: 'Osmosis',
      networkType: 'mainnet',
      bech32Prefix: 'osmo',
      slip44: 118,
      fees: { feeTokens: [{ denom: 'uosmo' }] },
      staking: { stakingTokens: [{ denom: 'uosmo' }] },
      apis: {
        rpc: [{ address: 'https://rpc.osmosis.zone' }],
        rest: [{ address: 'https://rest.osmosis.zone' }],
        grpc: [{ address: 'grpc.osmosis.zone:443' }],
      },
      explorers: [{ url: 'https://mintscan.io/osmosis' }],
    },
    {
      chainName: 'noble',
      chainId: 'noble-1',
      chainType: 'cosmos',
      prettyName: 'Noble',
      networkType: 'mainnet',
      bech32Prefix: 'noble',
      slip44: 118,
      fees: { feeTokens: [{ denom: 'uusdc' }] },
      apis: {
        rpc: [{ address: 'https://rpc.noble.xyz' }],
        rest: [{ address: 'https://rest.noble.xyz' }],
      },
    },
    {
      chainName: 'cosmoshub',
      chainId: 'cosmoshub-4',
      chainType: 'cosmos',
      prettyName: 'Cosmos Hub',
      networkType: 'mainnet',
      bech32Prefix: 'cosmos',
      slip44: 118,
      fees: { feeTokens: [{ denom: 'uatom' }] },
      staking: { stakingTokens: [{ denom: 'uatom' }] },
      apis: {
        rpc: [{ address: 'https://rpc.cosmos.network' }],
        rest: [{ address: 'https://rest.cosmos.network' }],
      },
    },
  ],
  MOCK_TESTNET_CHAINS: [
    {
      chainName: 'osmosis',
      chainId: 'osmo-test-5',
      chainType: 'cosmos',
      prettyName: 'Osmosis Testnet',
      networkType: 'testnet',
      bech32Prefix: 'osmo',
      slip44: 118,
      fees: { feeTokens: [{ denom: 'uosmo' }] },
      apis: {
        rpc: [{ address: 'https://rpc.testnet.osmosis.zone' }],
        rest: [{ address: 'https://rest.testnet.osmosis.zone' }],
      },
    },
  ],
  MOCK_ASSET_LISTS: [
    {
      chainName: 'osmosis',
      assets: [
        {
          base: 'uosmo',
          display: 'osmo',
          name: 'Osmosis',
          symbol: 'OSMO',
          denomUnits: [
            { denom: 'uosmo', exponent: 0 },
            { denom: 'osmo', exponent: 6 },
          ],
          typeAsset: 'sdk.coin',
          coingeckoId: 'osmosis',
          logoURIs: { png: 'https://logo.osmosis.zone/osmo.png' },
        },
        {
          base: 'ibc/USDC_HASH',
          display: 'usdc',
          name: 'USD Coin',
          symbol: 'USDC',
          denomUnits: [
            { denom: 'ibc/USDC_HASH', exponent: 0 },
            { denom: 'usdc', exponent: 6 },
          ],
          typeAsset: 'ics20',
          traces: [
            {
              type: 'ibc',
              counterparty: {
                chainName: 'noble',
                baseDenom: 'uusdc',
                channelId: 'channel-750',
              },
              chain: {
                channelId: 'channel-62',
              },
            },
          ],
          images: [{ png: 'https://logo.noble.xyz/usdc.png' }],
        },
      ],
    },
    {
      chainName: 'noble',
      assets: [
        {
          base: 'uusdc',
          display: 'usdc',
          name: 'USD Coin',
          symbol: 'USDC',
          denomUnits: [
            { denom: 'uusdc', exponent: 0 },
            { denom: 'usdc', exponent: 6 },
          ],
          typeAsset: 'sdk.coin',
          coingeckoId: 'usd-coin',
          logoURIs: { png: 'https://logo.noble.xyz/usdc.png' },
        },
      ],
    },
  ],
  MOCK_IBC_DATA: [
    {
      chain1: { chainName: 'noble', clientId: 'client-0', connectionId: 'connection-0' },
      chain2: { chainName: 'osmosis', clientId: 'client-1', connectionId: 'connection-1' },
      channels: [
        {
          chain1: { channelId: 'channel-1', portId: 'transfer' },
          chain2: { channelId: 'channel-750', portId: 'transfer' },
          ordering: 'unordered',
          version: 'ics20-1',
        },
      ],
    },
    {
      chain1: { chainName: 'cosmoshub', clientId: 'client-0', connectionId: 'connection-0' },
      chain2: { chainName: 'osmosis', clientId: 'client-2', connectionId: 'connection-2' },
      channels: [
        {
          chain1: { channelId: 'channel-141', portId: 'transfer' },
          chain2: { channelId: 'channel-0', portId: 'transfer' },
          ordering: 'unordered',
          version: 'ics20-1',
        },
        {
          chain1: { channelId: 'channel-200', portId: 'nft-transfer' },
          chain2: { channelId: 'channel-100', portId: 'nft-transfer' },
          ordering: 'ordered',
          version: 'ics721-1',
        },
      ],
    },
  ],
}))

vi.mock('chain-registry/mainnet', () => ({
  chains: MOCK_CHAINS,
}))

vi.mock('chain-registry/testnet', () => ({
  chains: MOCK_TESTNET_CHAINS,
}))

vi.mock('chain-registry/mainnet/asset-lists', () => ({
  default: MOCK_ASSET_LISTS,
}))

vi.mock('chain-registry/testnet/asset-lists', () => ({
  default: [],
}))

vi.mock('chain-registry/mainnet/ibc-data', () => ({
  default: MOCK_IBC_DATA,
}))

vi.mock('chain-registry/testnet/ibc-data', () => ({
  default: [],
}))

// Import after mocks are set up
import { CosmosRegistryProvider } from '../../../src/provider/cosmos-registry-provider'

// =============================================================================
// Tests
// =============================================================================

describe('CosmosRegistryProvider', () => {
  // ---------------------------------------------------------------------------
  // Constructor & ChainInfoProvider (preserved)
  // ---------------------------------------------------------------------------

  describe('constructor', () => {
    it('should create provider with default options', () => {
      const provider = new CosmosRegistryProvider()
      expect(provider).toBeDefined()
      expect(provider.listChains().length).toBeGreaterThan(0)
    })

    it('should include both mainnet and testnet by default', () => {
      const provider = new CosmosRegistryProvider()
      const chains = provider.listChains()
      const hasMainnet = chains.some(c => c.network === 'mainnet')
      const hasTestnet = chains.some(c => c.network === 'testnet')
      expect(hasMainnet).toBe(true)
      expect(hasTestnet).toBe(true)
    })

    it('should filter to mainnet only when testnet is disabled', () => {
      const provider = new CosmosRegistryProvider({ testnet: false })
      const chains = provider.listChains()
      expect(chains.every(c => c.network === 'mainnet')).toBe(true)
    })

    it('should filter to testnet only when mainnet is disabled', () => {
      const provider = new CosmosRegistryProvider({ mainnet: false })
      const chains = provider.listChains()
      expect(chains.every(c => c.network === 'testnet')).toBe(true)
    })

    it('should filter by chain names when provided', () => {
      const provider = new CosmosRegistryProvider({ chainNames: ['osmosis'] })
      const chains = provider.listChains()
      for (const chain of chains) {
        expect(chain.chainId.toLowerCase()).toContain('osmo')
      }
    })
  })

  describe('getChainInfo', () => {
    it('should return chain info for known chain', () => {
      const provider = new CosmosRegistryProvider()
      const osmosis = provider.getChainInfo('osmosis-1')
      expect(osmosis).toBeDefined()
      expect(osmosis!.chainId).toBe('osmosis-1')
      expect(osmosis!.bech32Prefix).toBe('osmo')
      expect(osmosis!.chainType).toBe('other')
      expect(osmosis!.network).toBe('mainnet')
    })

    it('should return undefined for unknown chain', () => {
      const provider = new CosmosRegistryProvider()
      expect(provider.getChainInfo('unknown')).toBeUndefined()
    })
  })

  describe('toChainInfo extended fields', () => {
    it('should map slip44', () => {
      const provider = new CosmosRegistryProvider()
      expect(provider.getChainInfo('osmosis-1')!.slip44).toBe(118)
    })

    it('should map explorerUrl', () => {
      const provider = new CosmosRegistryProvider()
      expect(provider.getChainInfo('osmosis-1')!.explorerUrl).toBe('https://mintscan.io/osmosis')
    })

    it('should map nativeDenom from feeTokens', () => {
      const provider = new CosmosRegistryProvider()
      expect(provider.getChainInfo('osmosis-1')!.nativeDenom).toBe('uosmo')
    })
  })

  describe('hasChain', () => {
    it('should return true/false correctly', () => {
      const provider = new CosmosRegistryProvider()
      expect(provider.hasChain('osmosis-1')).toBe(true)
      expect(provider.hasChain('unknown')).toBe(false)
    })
  })

  describe('listChains', () => {
    it('should list all chains', () => {
      const provider = new CosmosRegistryProvider()
      const chains = provider.listChains()
      expect(chains.length).toBe(4) // 3 mainnet + 1 testnet
    })
  })

  // ---------------------------------------------------------------------------
  // Convenience methods (preserved)
  // ---------------------------------------------------------------------------

  describe('getChainByName', () => {
    it('should find chain by name (case-insensitive)', () => {
      const provider = new CosmosRegistryProvider()
      const osmosis = provider.getChainByName('osmosis')
      expect(osmosis).toBeDefined()
      expect(osmosis!.chainId).toBe('osmosis-1')
    })

    it('should return undefined for unknown', () => {
      const provider = new CosmosRegistryProvider()
      expect(provider.getChainByName('unknown')).toBeUndefined()
    })
  })

  describe('listChainsByNetwork', () => {
    it('should filter by network type', () => {
      const provider = new CosmosRegistryProvider()
      const mainnet = provider.listChainsByNetwork('mainnet')
      expect(mainnet.length).toBe(3)
      expect(mainnet.every(c => c.network === 'mainnet')).toBe(true)
    })
  })

  // ---------------------------------------------------------------------------
  // Asset methods (new)
  // ---------------------------------------------------------------------------

  describe('getAssets', () => {
    it('should return assets for known chain', async () => {
      const provider = new CosmosRegistryProvider()
      const assets = await provider.getAssets('osmosis-1')
      expect(assets).toHaveLength(2)
    })

    it('should return empty for chain without assets', async () => {
      const provider = new CosmosRegistryProvider()
      const assets = await provider.getAssets('cosmoshub-4')
      expect(assets).toEqual([])
    })

    it('should return empty for unknown chain', async () => {
      const provider = new CosmosRegistryProvider()
      const assets = await provider.getAssets('unknown')
      expect(assets).toEqual([])
    })

    it('should cache results', async () => {
      const provider = new CosmosRegistryProvider()
      const a = await provider.getAssets('osmosis-1')
      const b = await provider.getAssets('osmosis-1')
      expect(a).toBe(b) // Same reference
    })
  })

  describe('cosmosAssetToAssetInfo normalization', () => {
    it('should normalize native token', async () => {
      const provider = new CosmosRegistryProvider()
      const assets = await provider.getAssets('osmosis-1')
      const osmo = assets.find(a => a.denom === 'uosmo')!
      expect(osmo).toBeDefined()
      expect(osmo.chainId).toBe('osmosis-1')
      expect(osmo.symbol).toBe('OSMO')
      expect(osmo.decimals).toBe(6)
      expect(osmo.denomUnits).toEqual([
        { denom: 'uosmo', exponent: 0 },
        { denom: 'osmo', exponent: 6 },
      ])
      expect(osmo.coingeckoId).toBe('osmosis')
      expect(osmo.logoUrl).toBe('https://logo.osmosis.zone/osmo.png')
      expect(osmo.originChainId).toBeUndefined()
    })

    it('should extract origin from IBC traces (chainName → chainId)', async () => {
      const provider = new CosmosRegistryProvider()
      const assets = await provider.getAssets('osmosis-1')
      const usdc = assets.find(a => a.denom === 'ibc/USDC_HASH')!
      expect(usdc).toBeDefined()
      // traces use chainName 'noble', resolved to chainId 'noble-1'
      expect(usdc.originChainId).toBe('noble-1')
      expect(usdc.originDenom).toBe('uusdc')
      expect(usdc.typeAsset).toBe('ics20')
    })

    it('should fallback logoUrl to images[0].png', async () => {
      const provider = new CosmosRegistryProvider()
      const assets = await provider.getAssets('osmosis-1')
      const usdc = assets.find(a => a.denom === 'ibc/USDC_HASH')!
      expect(usdc.logoUrl).toBe('https://logo.noble.xyz/usdc.png')
    })
  })

  describe('getRawAssetList', () => {
    it('should return raw CosmosAssetList', async () => {
      const provider = new CosmosRegistryProvider()
      const raw = await provider.getRawAssetList('osmosis-1')
      expect(raw).toBeDefined()
      expect((raw as any).chainName).toBe('osmosis')
    })

    it('should return undefined for unknown chain', async () => {
      const provider = new CosmosRegistryProvider()
      expect(await provider.getRawAssetList('unknown')).toBeUndefined()
    })
  })

  describe('findAsset', () => {
    it('should find by denom on specific chain', async () => {
      const provider = new CosmosRegistryProvider()
      const asset = await provider.findAsset('uosmo', 'osmosis-1')
      expect(asset).toBeDefined()
      expect(asset!.symbol).toBe('OSMO')
    })

    it('should search all chains when no chainId', async () => {
      const provider = new CosmosRegistryProvider()
      const asset = await provider.findAsset('uusdc')
      expect(asset).toBeDefined()
      expect(asset!.chainId).toBe('noble-1')
    })

    it('should return undefined for missing denom', async () => {
      const provider = new CosmosRegistryProvider()
      expect(await provider.findAsset('nonexistent', 'osmosis-1')).toBeUndefined()
    })
  })

  describe('findAssetBySymbol', () => {
    it('should find by symbol case-insensitively', async () => {
      const provider = new CosmosRegistryProvider()
      const results = await provider.findAssetBySymbol('osmo', 'osmosis-1')
      expect(results).toHaveLength(1)
      expect(results[0].denom).toBe('uosmo')
    })

    it('should search all chains', async () => {
      const provider = new CosmosRegistryProvider()
      const results = await provider.findAssetBySymbol('USDC')
      // Noble uusdc + Osmosis ibc/USDC_HASH + Testnet Osmosis ibc/USDC_HASH = 3
      // (testnet osmosis shares chainName 'osmosis' → same asset list)
      expect(results).toHaveLength(3)
    })
  })

  describe('listAssets', () => {
    it('should list all assets', async () => {
      const provider = new CosmosRegistryProvider()
      const all = await provider.listAssets()
      // osmosis-1: 2 + noble-1: 1 + osmo-test-5: 2 = 5
      // (testnet osmosis shares chainName 'osmosis' → same asset list)
      expect(all).toHaveLength(5)
    })

    it('should filter by chainId', async () => {
      const provider = new CosmosRegistryProvider()
      const assets = await provider.listAssets({ chainId: 'osmosis-1' })
      expect(assets).toHaveLength(2)
    })

    it('should filter by symbol', async () => {
      const provider = new CosmosRegistryProvider()
      const assets = await provider.listAssets({ symbol: 'OSMO' })
      // osmosis-1 + osmo-test-5 (shared chainName 'osmosis')
      expect(assets).toHaveLength(2)
    })
  })

  // ---------------------------------------------------------------------------
  // IBC methods (new)
  // ---------------------------------------------------------------------------

  describe('getIbcChannels', () => {
    it('should return IBC channels from bilateral data', () => {
      const provider = new CosmosRegistryProvider()
      const channels = provider.getIbcChannels('osmosis-1')
      // noble-osmosis (1 channel) + cosmoshub-osmosis (2 channels) = 3
      expect(channels).toHaveLength(3)
    })

    it('should correctly extract local channel info', () => {
      const provider = new CosmosRegistryProvider()
      const channels = provider.getIbcChannels('osmosis-1')
      const nobleChannel = channels.find(c => c.chainId === 'noble-1')
      expect(nobleChannel).toBeDefined()
      // Osmosis is chain2, so channel should be chain2's channel-750
      expect(nobleChannel!.channelId).toBe('channel-750')
      expect(nobleChannel!.portId).toBe('transfer')
      expect(nobleChannel!.version).toBe('ics20-1')
    })

    it('should work from the other side too', () => {
      const provider = new CosmosRegistryProvider()
      const channels = provider.getIbcChannels('noble-1')
      const osmosisChannel = channels.find(c => c.chainId === 'osmosis-1')
      expect(osmosisChannel).toBeDefined()
      // Noble is chain1, so channel should be chain1's channel-1
      expect(osmosisChannel!.channelId).toBe('channel-1')
    })

    it('should return empty for unknown chain', () => {
      const provider = new CosmosRegistryProvider()
      expect(provider.getIbcChannels('unknown')).toEqual([])
    })
  })

  describe('getIbcChannel', () => {
    it('should find specific channel', () => {
      const provider = new CosmosRegistryProvider()
      const channel = provider.getIbcChannel('osmosis-1', 'noble-1')
      expect(channel).toBeDefined()
      expect(channel!.channelId).toBe('channel-750')
    })

    it('should return undefined for no match', () => {
      const provider = new CosmosRegistryProvider()
      expect(provider.getIbcChannel('osmosis-1', 'unknown')).toBeUndefined()
    })
  })

  describe('getTransferPath', () => {
    it('should return path for ics20-1 channel', () => {
      const provider = new CosmosRegistryProvider()
      const path = provider.getTransferPath('osmosis-1', 'noble-1')
      expect(path).toBeDefined()
      expect(path!.sourceChainId).toBe('osmosis-1')
      expect(path!.destChainId).toBe('noble-1')
      expect(path!.channel).toBe('channel-750')
      expect(path!.port).toBe('transfer')
    })

    it('should return undefined for non-ics20-1 channel', () => {
      // cosmoshub↔osmosis has ics721-1 as second channel
      // But first channel is ics20-1, so getIbcChannel returns that one first
      // This specific test would need direct control over which channel is first
      // TODO: implement test with controlled channel ordering
    })

    it('should return undefined for unknown route', () => {
      const provider = new CosmosRegistryProvider()
      expect(provider.getTransferPath('osmosis-1', 'unknown')).toBeUndefined()
    })
  })

  // ---------------------------------------------------------------------------
  // OP Bridge
  // ---------------------------------------------------------------------------

  describe('getOpBridge', () => {
    it('should always return undefined (no OP Bridge in Cosmos)', () => {
      const provider = new CosmosRegistryProvider()
      expect(provider.getOpBridge('osmosis-1')).toBeUndefined()
      expect(provider.getOpBridge('noble-1')).toBeUndefined()
    })
  })

  // ---------------------------------------------------------------------------
  // Resolution methods (new)
  // ---------------------------------------------------------------------------

  describe('resolveChainId', () => {
    it('should resolve chain name to chain id', () => {
      const provider = new CosmosRegistryProvider()
      expect(provider.resolveChainId('osmosis')).toBe('osmosis-1')
      expect(provider.resolveChainId('noble')).toBe('noble-1')
    })

    it('should filter by network', () => {
      const provider = new CosmosRegistryProvider()
      expect(provider.resolveChainId('osmosis', 'mainnet')).toBe('osmosis-1')
      expect(provider.resolveChainId('osmosis', 'testnet')).toBe('osmo-test-5')
    })

    it('should return undefined for unknown name', () => {
      const provider = new CosmosRegistryProvider()
      expect(provider.resolveChainId('unknown')).toBeUndefined()
    })
  })

  describe('getChainName', () => {
    it('should return chain name for known chain', () => {
      const provider = new CosmosRegistryProvider()
      expect(provider.getChainName('osmosis-1')).toBe('osmosis')
      expect(provider.getChainName('noble-1')).toBe('noble')
    })

    it('should return undefined for unknown chain', () => {
      const provider = new CosmosRegistryProvider()
      expect(provider.getChainName('unknown')).toBeUndefined()
    })
  })

  // ---------------------------------------------------------------------------
  // Amount conversion (inherited from BaseChainDataProvider)
  // ---------------------------------------------------------------------------

  describe('amount conversion (inherited)', () => {
    it('should convert base to display amount', async () => {
      const { coin } = await import('../../../src/core/coin')
      const provider = new CosmosRegistryProvider()
      const result = await provider.toDisplayAmount(coin('uosmo', '1000000'), 'osmosis-1')
      expect(result).toBe('1')
    })

    it('should format amount with symbol', async () => {
      const { coin } = await import('../../../src/core/coin')
      const provider = new CosmosRegistryProvider()
      const result = await provider.formatAmount(coin('uosmo', '1500000'), 'osmosis-1')
      expect(result).toBe('1.5 OSMO')
    })
  })
})
