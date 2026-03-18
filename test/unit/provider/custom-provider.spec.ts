/**
 * Unit tests for CustomProvider.
 *
 * Tests the custom chain data provider with programmatic and JSON input styles.
 */

import { describe, it, expect } from 'vitest'
import { CustomProvider } from '../../../src/provider/custom-provider'
import type { ChainInfo, AssetInfo, IbcChannelInfo } from '../../../src/provider/types'
import type { CustomChainConfig } from '../../../src/provider/custom-provider'

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

const ASSET_TOKEN: AssetInfo = {
  chainId: 'chain-a-1',
  denom: 'utoken',
  symbol: 'TOKEN',
  name: 'Token',
  display: 'token',
  denomUnits: [
    { denom: 'utoken', exponent: 0 },
    { denom: 'token', exponent: 6 },
  ],
  decimals: 6,
}

const ASSET_USDC: AssetInfo = {
  chainId: 'chain-a-1',
  denom: 'ibc/USDC_HASH',
  symbol: 'USDC',
  name: 'USD Coin',
  display: 'usdc',
  denomUnits: [
    { denom: 'ibc/USDC_HASH', exponent: 0 },
    { denom: 'usdc', exponent: 6 },
  ],
  decimals: 6,
  originChainId: 'noble-1',
  originDenom: 'uusdc',
  typeAsset: 'ics20',
}

const IBC_CHANNEL: IbcChannelInfo = {
  chainId: 'chain-b-1',
  portId: 'transfer',
  channelId: 'channel-0',
  version: 'ics20-1',
}

const IBC_CHANNEL_NFT: IbcChannelInfo = {
  chainId: 'chain-b-1',
  portId: 'nft-transfer',
  channelId: 'channel-1',
  version: 'ics721-1',
}

// =============================================================================
// Tests
// =============================================================================

describe('CustomProvider', () => {
  // ---------------------------------------------------------------------------
  // Constructor
  // ---------------------------------------------------------------------------

  describe('constructor', () => {
    it('should create empty provider', () => {
      const provider = new CustomProvider()
      expect(provider.listChains()).toEqual([])
    })

    it('should create provider with ChainInfo array', () => {
      const provider = new CustomProvider([CHAIN_A, CHAIN_B])
      expect(provider.listChains()).toHaveLength(2)
      expect(provider.hasChain('chain-a-1')).toBe(true)
    })

    it('should create provider with CustomChainConfig (inline assets/ibcChannels)', () => {
      const config: CustomChainConfig = {
        ...CHAIN_A,
        assets: [ASSET_TOKEN],
        ibcChannels: [IBC_CHANNEL],
      }
      const provider = new CustomProvider([config])
      expect(provider.hasChain('chain-a-1')).toBe(true)
    })

    it('should populate assetMap from inline assets', async () => {
      const config: CustomChainConfig = {
        ...CHAIN_A,
        assets: [ASSET_TOKEN, ASSET_USDC],
      }
      const provider = new CustomProvider([config])
      const assets = await provider.getAssets('chain-a-1')
      expect(assets).toHaveLength(2)
      expect(assets[0].symbol).toBe('TOKEN')
    })

    it('should populate ibcMap from inline ibcChannels', () => {
      const config: CustomChainConfig = {
        ...CHAIN_A,
        ibcChannels: [IBC_CHANNEL],
      }
      const provider = new CustomProvider([config])
      const channels = provider.getIbcChannels('chain-a-1')
      expect(channels).toHaveLength(1)
      expect(channels[0].channelId).toBe('channel-0')
    })
  })

  // ---------------------------------------------------------------------------
  // from() (JSON input)
  // ---------------------------------------------------------------------------

  describe('from()', () => {
    const CHAIN_INPUT = {
      chain_id: 'my-chain-1',
      chain_name: 'my-chain',
      pretty_name: 'My Chain',
      network_type: 'testnet' as const,
      bech32_prefix: 'init',
      apis: { grpc: [{ address: 'localhost:9090' }] },
      fees: { fee_tokens: [{ denom: 'utoken' }] },
    }

    it('should create from object', () => {
      const provider = CustomProvider.from(CHAIN_INPUT)
      expect(provider.hasChain('my-chain-1')).toBe(true)
      const info = provider.getChainInfo('my-chain-1')!
      expect(info.chainName).toBe('My Chain')
      expect(info.network).toBe('testnet')
      expect(info.grpc).toBe('localhost:9090')
    })

    it('should create from JSON string', () => {
      const provider = CustomProvider.from(JSON.stringify(CHAIN_INPUT))
      expect(provider.hasChain('my-chain-1')).toBe(true)
    })

    it('should create from array', () => {
      const provider = CustomProvider.from([CHAIN_INPUT, { ...CHAIN_INPUT, chain_id: 'other-1' }])
      expect(provider.listChains()).toHaveLength(2)
    })

    it('should normalize inline assets (snake_case)', async () => {
      const provider = CustomProvider.from({
        ...CHAIN_INPUT,
        assets: [
          {
            denom: 'utoken',
            symbol: 'TOKEN',
            name: 'Token',
            denom_units: [
              { denom: 'utoken', exponent: 0 },
              { denom: 'token', exponent: 6 },
            ],
            display: 'token',
            type_asset: 'sdk.coin',
            logo_URIs: { png: 'https://example.com/logo.png' },
            coingecko_id: 'my-token',
          },
        ],
      })
      const assets = await provider.getAssets('my-chain-1')
      expect(assets).toHaveLength(1)
      expect(assets[0].denom).toBe('utoken')
      expect(assets[0].decimals).toBe(6)
      expect(assets[0].typeAsset).toBe('sdk.coin')
      expect(assets[0].logoUrl).toBe('https://example.com/logo.png')
      expect(assets[0].coingeckoId).toBe('my-token')
    })

    it('should normalize inline assets (camelCase)', async () => {
      const provider = CustomProvider.from({
        ...CHAIN_INPUT,
        assets: [
          {
            denom: 'utoken',
            symbol: 'TOKEN',
            name: 'Token',
            denomUnits: [
              { denom: 'utoken', exponent: 0 },
              { denom: 'token', exponent: 6 },
            ],
            display: 'token',
            typeAsset: 'sdk.coin',
            logoURIs: { png: 'https://example.com/logo.png' },
            coingeckoId: 'my-token',
          },
        ],
      })
      const assets = await provider.getAssets('my-chain-1')
      expect(assets).toHaveLength(1)
      expect(assets[0].decimals).toBe(6)
      expect(assets[0].typeAsset).toBe('sdk.coin')
      expect(assets[0].logoUrl).toBe('https://example.com/logo.png')
      expect(assets[0].coingeckoId).toBe('my-token')
    })

    it('should normalize inline assets (minimal format with decimals)', async () => {
      const provider = CustomProvider.from({
        ...CHAIN_INPUT,
        assets: [{ denom: 'utoken', symbol: 'TOKEN', name: 'Token', decimals: 6 }],
      })
      const assets = await provider.getAssets('my-chain-1')
      expect(assets[0].decimals).toBe(6)
      expect(assets[0].denomUnits).toEqual([])
    })

    it('should normalize inline IBC channels (snake_case)', () => {
      const provider = CustomProvider.from({
        ...CHAIN_INPUT,
        ibc_channels: [{ chain_id: 'noble-1', port_id: 'transfer', channel_id: 'channel-3' }],
      })
      const channels = provider.getIbcChannels('my-chain-1')
      expect(channels).toHaveLength(1)
      expect(channels[0].chainId).toBe('noble-1')
      expect(channels[0].portId).toBe('transfer')
      expect(channels[0].channelId).toBe('channel-3')
      expect(channels[0].version).toBe('ics20-1') // default
    })

    it('should detect chain type from metadata', () => {
      const initia = CustomProvider.from({
        ...CHAIN_INPUT,
        metadata: { is_l1: true },
      })
      expect(initia.getChainInfo('my-chain-1')!.chainType).toBe('initia')

      const evm = CustomProvider.from({
        ...CHAIN_INPUT,
        metadata: { minitia: { type: 'minievm' as const } },
      })
      expect(evm.getChainInfo('my-chain-1')!.chainType).toBe('minievm')
    })

    it('should map slip44', () => {
      const provider = CustomProvider.from({ ...CHAIN_INPUT, slip44: 60 })
      expect(provider.getChainInfo('my-chain-1')!.slip44).toBe(60)
    })
  })

  // ---------------------------------------------------------------------------
  // Mutation: addChain / removeChain
  // ---------------------------------------------------------------------------

  describe('addChain', () => {
    it('should add a plain ChainInfo', () => {
      const provider = new CustomProvider()
      provider.addChain(CHAIN_A)
      expect(provider.hasChain('chain-a-1')).toBe(true)
    })

    it('should add CustomChainConfig with inline assets', async () => {
      const provider = new CustomProvider()
      provider.addChain({ ...CHAIN_A, assets: [ASSET_TOKEN] })
      const assets = await provider.getAssets('chain-a-1')
      expect(assets).toHaveLength(1)
    })

    it('should add CustomChainConfig with inline ibcChannels', () => {
      const provider = new CustomProvider()
      provider.addChain({ ...CHAIN_A, ibcChannels: [IBC_CHANNEL] })
      expect(provider.getIbcChannels('chain-a-1')).toHaveLength(1)
    })

    it('should overwrite existing chain', () => {
      const provider = new CustomProvider([CHAIN_A])
      provider.addChain({ ...CHAIN_A, chainName: 'Updated Name' })
      expect(provider.getChainInfo('chain-a-1')!.chainName).toBe('Updated Name')
    })
  })

  describe('removeChain', () => {
    it('should remove chain and return true', () => {
      const provider = new CustomProvider([CHAIN_A])
      expect(provider.removeChain('chain-a-1')).toBe(true)
      expect(provider.hasChain('chain-a-1')).toBe(false)
    })

    it('should return false for non-existent chain', () => {
      const provider = new CustomProvider()
      expect(provider.removeChain('unknown')).toBe(false)
    })

    it('should clean up assetMap and ibcMap', async () => {
      const config: CustomChainConfig = {
        ...CHAIN_A,
        assets: [ASSET_TOKEN],
        ibcChannels: [IBC_CHANNEL],
      }
      const provider = new CustomProvider([config])
      expect(await provider.getAssets('chain-a-1')).toHaveLength(1)
      expect(provider.getIbcChannels('chain-a-1')).toHaveLength(1)

      provider.removeChain('chain-a-1')
      expect(await provider.getAssets('chain-a-1')).toEqual([])
      expect(provider.getIbcChannels('chain-a-1')).toEqual([])
    })
  })

  // ---------------------------------------------------------------------------
  // Mutation: addAssets / addAssetList
  // ---------------------------------------------------------------------------

  describe('addAssets', () => {
    it('should add assets for a chain', async () => {
      const provider = new CustomProvider([CHAIN_A])
      provider.addAssets('chain-a-1', [ASSET_TOKEN])
      const assets = await provider.getAssets('chain-a-1')
      expect(assets).toHaveLength(1)
    })

    it('should merge and dedup by denom', async () => {
      const provider = new CustomProvider([CHAIN_A])
      provider.addAssets('chain-a-1', [ASSET_TOKEN])
      // Add again with updated name — should replace, not duplicate
      const updated = { ...ASSET_TOKEN, name: 'Updated Token' }
      provider.addAssets('chain-a-1', [updated])
      const assets = await provider.getAssets('chain-a-1')
      expect(assets).toHaveLength(1)
      expect(assets[0].name).toBe('Updated Token')
    })

    it('should add new denoms alongside existing', async () => {
      const provider = new CustomProvider([CHAIN_A])
      provider.addAssets('chain-a-1', [ASSET_TOKEN])
      provider.addAssets('chain-a-1', [ASSET_USDC])
      const assets = await provider.getAssets('chain-a-1')
      expect(assets).toHaveLength(2)
    })
  })

  describe('addAssetList', () => {
    it('should accept AssetListInput with camelCase chainId', async () => {
      const provider = new CustomProvider([CHAIN_A])
      provider.addAssetList({
        chainId: 'chain-a-1',
        assets: [{ denom: 'utoken', symbol: 'TOKEN', name: 'Token', decimals: 6 }],
      })
      const assets = await provider.getAssets('chain-a-1')
      expect(assets).toHaveLength(1)
      expect(assets[0].symbol).toBe('TOKEN')
    })

    it('should accept AssetListInput with snake_case chain_id', async () => {
      const provider = new CustomProvider([CHAIN_A])
      provider.addAssetList({
        chain_id: 'chain-a-1',
        assets: [{ denom: 'utoken', symbol: 'TOKEN', name: 'Token', decimals: 6 }],
      })
      const assets = await provider.getAssets('chain-a-1')
      expect(assets).toHaveLength(1)
    })

    it('should accept JSON string', async () => {
      const provider = new CustomProvider([CHAIN_A])
      provider.addAssetList(
        JSON.stringify({
          chainId: 'chain-a-1',
          assets: [{ denom: 'utoken', symbol: 'TOKEN', name: 'Token', decimals: 6 }],
        })
      )
      const assets = await provider.getAssets('chain-a-1')
      expect(assets).toHaveLength(1)
    })

    it('should normalize snake_case asset fields', async () => {
      const provider = new CustomProvider([CHAIN_A])
      provider.addAssetList({
        chainId: 'chain-a-1',
        assets: [
          {
            base: 'utoken',
            symbol: 'TOKEN',
            name: 'Token',
            denom_units: [
              { denom: 'utoken', exponent: 0 },
              { denom: 'token', exponent: 6 },
            ],
            display: 'token',
            type_asset: 'sdk.coin',
            logo_URIs: { png: 'https://logo.png' },
            coingecko_id: 'my-token',
            origin_chain_id: 'other-1',
            origin_denom: 'uother',
          },
        ],
      })
      const assets = await provider.getAssets('chain-a-1')
      expect(assets[0].denom).toBe('utoken') // from 'base'
      expect(assets[0].decimals).toBe(6)
      expect(assets[0].typeAsset).toBe('sdk.coin')
      expect(assets[0].logoUrl).toBe('https://logo.png')
      expect(assets[0].coingeckoId).toBe('my-token')
      expect(assets[0].originChainId).toBe('other-1')
      expect(assets[0].originDenom).toBe('uother')
    })

    it('should throw if chainId missing', () => {
      const provider = new CustomProvider()
      expect(() =>
        provider.addAssetList({ assets: [{ denom: 'x', symbol: 'X', name: 'X' }] })
      ).toThrow('chainId or chain_id is required')
    })
  })

  // ---------------------------------------------------------------------------
  // Mutation: addIbcChannel
  // ---------------------------------------------------------------------------

  describe('addIbcChannel', () => {
    it('should add normalized IbcChannelInfo', () => {
      const provider = new CustomProvider([CHAIN_A])
      provider.addIbcChannel('chain-a-1', IBC_CHANNEL)
      const channels = provider.getIbcChannels('chain-a-1')
      expect(channels).toHaveLength(1)
      expect(channels[0]).toEqual(IBC_CHANNEL)
    })

    it('should accept snake_case Record input', () => {
      const provider = new CustomProvider([CHAIN_A])
      provider.addIbcChannel('chain-a-1', {
        chain_id: 'chain-b-1',
        port_id: 'transfer',
        channel_id: 'channel-5',
        version: 'ics20-1',
      })
      const channels = provider.getIbcChannels('chain-a-1')
      expect(channels[0].chainId).toBe('chain-b-1')
      expect(channels[0].channelId).toBe('channel-5')
    })

    it('should accumulate multiple channels', () => {
      const provider = new CustomProvider([CHAIN_A])
      provider.addIbcChannel('chain-a-1', IBC_CHANNEL)
      provider.addIbcChannel('chain-a-1', IBC_CHANNEL_NFT)
      expect(provider.getIbcChannels('chain-a-1')).toHaveLength(2)
    })
  })

  // ---------------------------------------------------------------------------
  // ChainInfoProvider (preserved)
  // ---------------------------------------------------------------------------

  describe('getChainInfo', () => {
    it('should return chain info for known chain', () => {
      const provider = new CustomProvider([CHAIN_A])
      expect(provider.getChainInfo('chain-a-1')!.chainId).toBe('chain-a-1')
    })

    it('should return undefined for unknown chain', () => {
      const provider = new CustomProvider()
      expect(provider.getChainInfo('unknown')).toBeUndefined()
    })
  })

  describe('hasChain / listChains', () => {
    it('should work correctly', () => {
      const provider = new CustomProvider([CHAIN_A, CHAIN_B])
      expect(provider.hasChain('chain-a-1')).toBe(true)
      expect(provider.hasChain('unknown')).toBe(false)
      expect(provider.listChains()).toHaveLength(2)
    })
  })

  // ---------------------------------------------------------------------------
  // Asset methods
  // ---------------------------------------------------------------------------

  describe('getAssets', () => {
    it('should return assets for chain', async () => {
      const provider = new CustomProvider([{ ...CHAIN_A, assets: [ASSET_TOKEN, ASSET_USDC] }])
      expect(await provider.getAssets('chain-a-1')).toHaveLength(2)
    })

    it('should return empty for chain without assets', async () => {
      const provider = new CustomProvider([CHAIN_A])
      expect(await provider.getAssets('chain-a-1')).toEqual([])
    })

    it('should return empty for unknown chain', async () => {
      const provider = new CustomProvider()
      expect(await provider.getAssets('unknown')).toEqual([])
    })
  })

  describe('findAsset', () => {
    it('should find by denom on specific chain', async () => {
      const provider = new CustomProvider([{ ...CHAIN_A, assets: [ASSET_TOKEN, ASSET_USDC] }])
      const found = await provider.findAsset('utoken', 'chain-a-1')
      expect(found?.symbol).toBe('TOKEN')
    })

    it('should search all chains when no chainId', async () => {
      const provider = new CustomProvider([
        { ...CHAIN_A, assets: [ASSET_TOKEN] },
        { ...CHAIN_B, assets: [{ ...ASSET_USDC, chainId: 'chain-b-1' }] },
      ])
      const found = await provider.findAsset('ibc/USDC_HASH')
      expect(found?.chainId).toBe('chain-b-1')
    })

    it('should return undefined if not found', async () => {
      const provider = new CustomProvider([{ ...CHAIN_A, assets: [ASSET_TOKEN] }])
      expect(await provider.findAsset('nonexistent', 'chain-a-1')).toBeUndefined()
    })
  })

  describe('findAssetBySymbol', () => {
    it('should find case-insensitively', async () => {
      const provider = new CustomProvider([{ ...CHAIN_A, assets: [ASSET_TOKEN] }])
      const results = await provider.findAssetBySymbol('token', 'chain-a-1')
      expect(results).toHaveLength(1)
      expect(results[0].denom).toBe('utoken')
    })

    it('should search all chains', async () => {
      const provider = new CustomProvider([
        { ...CHAIN_A, assets: [ASSET_USDC] },
        { ...CHAIN_B, assets: [{ ...ASSET_USDC, chainId: 'chain-b-1', denom: 'uusdc' }] },
      ])
      const results = await provider.findAssetBySymbol('USDC')
      expect(results).toHaveLength(2)
    })
  })

  describe('listAssets', () => {
    it('should list all assets', async () => {
      const provider = new CustomProvider([
        { ...CHAIN_A, assets: [ASSET_TOKEN] },
        { ...CHAIN_B, assets: [{ ...ASSET_USDC, chainId: 'chain-b-1' }] },
      ])
      expect(await provider.listAssets()).toHaveLength(2)
    })

    it('should filter by chainId', async () => {
      const provider = new CustomProvider([
        { ...CHAIN_A, assets: [ASSET_TOKEN, ASSET_USDC] },
        { ...CHAIN_B, assets: [{ ...ASSET_USDC, chainId: 'chain-b-1' }] },
      ])
      expect(await provider.listAssets({ chainId: 'chain-a-1' })).toHaveLength(2)
    })

    it('should filter by symbol', async () => {
      const provider = new CustomProvider([{ ...CHAIN_A, assets: [ASSET_TOKEN, ASSET_USDC] }])
      expect(await provider.listAssets({ symbol: 'USDC' })).toHaveLength(1)
    })

    it('should filter by chainId + symbol', async () => {
      const provider = new CustomProvider([{ ...CHAIN_A, assets: [ASSET_TOKEN, ASSET_USDC] }])
      expect(await provider.listAssets({ chainId: 'chain-a-1', symbol: 'TOKEN' })).toHaveLength(1)
    })
  })

  // ---------------------------------------------------------------------------
  // IBC methods
  // ---------------------------------------------------------------------------

  describe('getIbcChannels', () => {
    it('should return channels for chain', () => {
      const provider = new CustomProvider([
        { ...CHAIN_A, ibcChannels: [IBC_CHANNEL, IBC_CHANNEL_NFT] },
      ])
      expect(provider.getIbcChannels('chain-a-1')).toHaveLength(2)
    })

    it('should return empty for unknown chain', () => {
      const provider = new CustomProvider()
      expect(provider.getIbcChannels('unknown')).toEqual([])
    })
  })

  describe('getIbcChannel', () => {
    it('should find channel by counterparty chainId', () => {
      const provider = new CustomProvider([{ ...CHAIN_A, ibcChannels: [IBC_CHANNEL] }])
      const ch = provider.getIbcChannel('chain-a-1', 'chain-b-1')
      expect(ch?.channelId).toBe('channel-0')
    })

    it('should return undefined for no match', () => {
      const provider = new CustomProvider([{ ...CHAIN_A, ibcChannels: [IBC_CHANNEL] }])
      expect(provider.getIbcChannel('chain-a-1', 'unknown')).toBeUndefined()
    })
  })

  describe('getTransferPath', () => {
    it('should return path for ics20-1 channel', () => {
      const provider = new CustomProvider([{ ...CHAIN_A, ibcChannels: [IBC_CHANNEL] }])
      const path = provider.getTransferPath('chain-a-1', 'chain-b-1')
      expect(path).toEqual({
        sourceChainId: 'chain-a-1',
        destChainId: 'chain-b-1',
        channel: 'channel-0',
        port: 'transfer',
      })
    })

    it('should return undefined for non-ics20-1 channel', () => {
      const provider = new CustomProvider([{ ...CHAIN_A, ibcChannels: [IBC_CHANNEL_NFT] }])
      expect(provider.getTransferPath('chain-a-1', 'chain-b-1')).toBeUndefined()
    })

    it('should return undefined for unknown route', () => {
      const provider = new CustomProvider([CHAIN_A])
      expect(provider.getTransferPath('chain-a-1', 'unknown')).toBeUndefined()
    })
  })

  // ---------------------------------------------------------------------------
  // Resolution methods
  // ---------------------------------------------------------------------------

  describe('resolveChainId', () => {
    it('should resolve by chain name (case-insensitive)', () => {
      const provider = new CustomProvider([CHAIN_A])
      expect(provider.resolveChainId('chain a')).toBe('chain-a-1')
      expect(provider.resolveChainId('Chain A')).toBe('chain-a-1')
    })

    it('should filter by network', () => {
      const provider = new CustomProvider([CHAIN_A, CHAIN_B])
      expect(provider.resolveChainId('Chain A', 'testnet')).toBe('chain-a-1')
      expect(provider.resolveChainId('Chain A', 'mainnet')).toBeUndefined()
    })

    it('should return undefined for unknown name', () => {
      const provider = new CustomProvider([CHAIN_A])
      expect(provider.resolveChainId('unknown')).toBeUndefined()
    })
  })

  describe('getChainName', () => {
    it('should return chain name', () => {
      const provider = new CustomProvider([CHAIN_A])
      expect(provider.getChainName('chain-a-1')).toBe('Chain A')
    })

    it('should return undefined for unknown chain', () => {
      const provider = new CustomProvider()
      expect(provider.getChainName('unknown')).toBeUndefined()
    })
  })

  // ---------------------------------------------------------------------------
  // normalizeAssetInput edge cases (tested via addAssetList)
  // ---------------------------------------------------------------------------

  describe('normalizeAssetInput via addAssetList', () => {
    it('should use "base" field as denom fallback', async () => {
      const provider = new CustomProvider([CHAIN_A])
      provider.addAssetList({
        chainId: 'chain-a-1',
        assets: [{ base: 'uosmo', symbol: 'OSMO', name: 'Osmosis', decimals: 6 }],
      })
      const assets = await provider.getAssets('chain-a-1')
      expect(assets[0].denom).toBe('uosmo')
    })

    it('should extract logo from images fallback', async () => {
      const provider = new CustomProvider([CHAIN_A])
      provider.addAssetList({
        chainId: 'chain-a-1',
        assets: [
          {
            denom: 'utoken',
            symbol: 'TOKEN',
            name: 'Token',
            decimals: 6,
            images: [{ png: 'https://fallback.png' }],
          },
        ],
      })
      const assets = await provider.getAssets('chain-a-1')
      expect(assets[0].logoUrl).toBe('https://fallback.png')
    })

    it('should handle contractAddress / contract_address / address', async () => {
      const provider = new CustomProvider([CHAIN_A])

      // camelCase
      provider.addAssetList({
        chainId: 'chain-a-1',
        assets: [{ denom: 'a', symbol: 'A', name: 'A', decimals: 0, contractAddress: '0xAAA' }],
      })
      expect((await provider.getAssets('chain-a-1'))[0].contractAddress).toBe('0xAAA')

      // snake_case
      provider.addAssetList({
        chainId: 'chain-a-1',
        assets: [{ denom: 'b', symbol: 'B', name: 'B', decimals: 0, contract_address: '0xBBB' }],
      })
      expect((await provider.findAsset('b', 'chain-a-1'))?.contractAddress).toBe('0xBBB')

      // "address" field
      provider.addAssetList({
        chainId: 'chain-a-1',
        assets: [{ denom: 'c', symbol: 'C', name: 'C', decimals: 0, address: '0xCCC' }],
      })
      expect((await provider.findAsset('c', 'chain-a-1'))?.contractAddress).toBe('0xCCC')
    })
  })
})
