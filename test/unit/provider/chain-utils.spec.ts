import { describe, it, expect } from 'vitest'
import type { Chain, Asset } from '@initia/initia-registry-types'
import {
  normalizeEndpoint,
  deriveWssFromRpc,
  detectChainType,
  mapNetworkType,
  parseIbcChannels,
  toChainInfo,
  toAssetInfo,
} from '../../../src/provider/chain-utils'

import chainsFixture from '../../fixtures/registry/chains.json'
import assetlistInitia from '../../fixtures/registry/assetlist-initia.json'

const chains = chainsFixture as unknown as Chain[]
const initiaChain = chains[0] // is_l1: true
const minievmChain = chains[1] // minitia.type: minievm
const minimoveChain = chains[2] // minitia.type: minimove

describe('chain-utils', () => {
  // ==========================================================================
  // normalizeEndpoint
  // ==========================================================================
  describe('normalizeEndpoint', () => {
    it('returns undefined for falsy input', () => {
      expect(normalizeEndpoint(undefined)).toBeUndefined()
      expect(normalizeEndpoint('')).toBeUndefined()
    })

    it('preserves http:// URLs', () => {
      expect(normalizeEndpoint('http://grpc.example.com:9090')).toBe('http://grpc.example.com:9090')
    })

    it('preserves https:// URLs', () => {
      expect(normalizeEndpoint('https://grpc.example.com')).toBe('https://grpc.example.com')
    })

    it('adds https:// to scheme-less endpoints', () => {
      expect(normalizeEndpoint('grpc.example.com:443')).toBe('https://grpc.example.com:443')
    })
  })

  // ==========================================================================
  // deriveWssFromRpc
  // ==========================================================================
  describe('deriveWssFromRpc', () => {
    it('returns undefined for falsy input', () => {
      expect(deriveWssFromRpc(undefined)).toBeUndefined()
    })

    it('converts https to wss and appends /websocket', () => {
      const result = deriveWssFromRpc('https://rpc.initia.xyz')
      expect(result).toBe('wss://rpc.initia.xyz/websocket')
    })

    it('converts http to ws', () => {
      const result = deriveWssFromRpc('http://localhost:26657')
      expect(result).toBe('ws://localhost:26657/websocket')
    })

    it('does not double-append /websocket', () => {
      const result = deriveWssFromRpc('https://rpc.initia.xyz/websocket')
      expect(result).toBe('wss://rpc.initia.xyz/websocket')
    })

    it('returns undefined for invalid URL', () => {
      expect(deriveWssFromRpc('not-a-url')).toBeUndefined()
    })
  })

  // ==========================================================================
  // detectChainType
  // ==========================================================================
  describe('detectChainType', () => {
    it('detects L1 (initia)', () => {
      expect(detectChainType(initiaChain)).toBe('initia')
    })

    it('detects minievm', () => {
      expect(detectChainType(minievmChain)).toBe('minievm')
    })

    it('detects minimove', () => {
      expect(detectChainType(minimoveChain)).toBe('minimove')
    })

    it('returns "other" for unknown type', () => {
      const chain = { metadata: {} } as unknown as Chain
      expect(detectChainType(chain)).toBe('other')
    })
  })

  // ==========================================================================
  // mapNetworkType
  // ==========================================================================
  describe('mapNetworkType', () => {
    it('maps mainnet', () => {
      expect(mapNetworkType('mainnet')).toBe('mainnet')
    })

    it('maps testnet', () => {
      expect(mapNetworkType('testnet')).toBe('testnet')
    })

    it('maps unknown to local', () => {
      expect(mapNetworkType('devnet' as never)).toBe('local')
    })
  })

  // ==========================================================================
  // parseIbcChannels
  // ==========================================================================
  describe('parseIbcChannels', () => {
    it('returns empty array for undefined metadata', () => {
      expect(parseIbcChannels(undefined)).toEqual([])
    })

    it('returns empty array for missing ibc_channels', () => {
      expect(parseIbcChannels({})).toEqual([])
    })

    it('parses IBC channels from metadata', () => {
      const metadata = initiaChain.metadata as Record<string, unknown>
      const channels = parseIbcChannels(metadata)
      expect(channels).toHaveLength(2)
      expect(channels[0]).toEqual({
        chainId: 'noble-1',
        portId: 'transfer',
        channelId: 'channel-3',
        version: 'ics20-1',
      })
    })
  })

  // ==========================================================================
  // toChainInfo
  // ==========================================================================
  describe('toChainInfo', () => {
    it('converts Initia L1 chain', () => {
      const info = toChainInfo(initiaChain)
      expect(info.chainId).toBe('interwoven-1')
      expect(info.chainName).toBe('Initia')
      expect(info.chainType).toBe('initia')
      expect(info.network).toBe('mainnet')
      expect(info.rpc).toBe('https://rpc.initia.xyz')
      expect(info.rest).toBe('https://rest.initia.xyz')
      expect(info.grpc).toBe('https://grpc.initia.xyz:443')
      expect(info.nativeDenom).toBe('uinit')
      expect(info.bech32Prefix).toBe('init')
      expect(info.explorerUrl).toBe('https://scan.initia.xyz')
      expect(info.ibcChannels).toHaveLength(2)
    })

    it('converts minievm rollup with OP bridge', () => {
      const info = toChainInfo(minievmChain)
      expect(info.chainType).toBe('minievm')
      expect(info.evmChainId).toBe(1234567)
      expect(info.opBridgeId).toBe(42n)
      expect(info.opDenoms).toEqual(['uinit', 'uusdc'])
      expect(info.executorUri).toBe('https://executor.minievm.xyz')
      expect(info.evmRpc).toBe('https://json-rpc.minievm.xyz')
    })

    it('derives wss from rpc when not explicit', () => {
      const info = toChainInfo(initiaChain)
      expect(info.wss).toBe('wss://rpc.initia.xyz/websocket')
    })

    it('normalizes grpc endpoints', () => {
      const info = toChainInfo(minievmChain)
      // grpc.minievm.xyz:9090 → https://grpc.minievm.xyz:9090
      expect(info.grpc).toBe('https://grpc.minievm.xyz:9090')
    })
  })

  // ==========================================================================
  // toAssetInfo
  // ==========================================================================
  describe('toAssetInfo', () => {
    const initAsset = assetlistInitia.assets[0] as unknown as Asset
    const usdcAsset = assetlistInitia.assets[1] as unknown as Asset

    it('converts native asset', () => {
      const info = toAssetInfo(initAsset, 'interwoven-1')
      expect(info.chainId).toBe('interwoven-1')
      expect(info.denom).toBe('uinit')
      expect(info.symbol).toBe('INIT')
      expect(info.decimals).toBe(6)
      expect(info.logoUrl).toBe('https://logo.initia.xyz/init.png')
      expect(info.coingeckoId).toBe('initia')
      expect(info.originChainId).toBeUndefined()
    })

    it('converts IBC asset with origin trace', () => {
      const info = toAssetInfo(usdcAsset, 'interwoven-1')
      expect(info.denom).toBe('ibc/USDC_HASH')
      expect(info.symbol).toBe('USDC')
      expect(info.originChainId).toBe('noble-1')
      expect(info.originDenom).toBe('uusdc')
      expect(info.typeAsset).toBe('ics20')
      // logo_URIs missing → fallback to images[0].png
      expect(info.logoUrl).toBe('https://logo.noble.xyz/usdc.png')
    })

    it('includes aliases in denomUnits', () => {
      const info = toAssetInfo(initAsset, 'interwoven-1')
      const displayUnit = info.denomUnits.find(u => u.denom === 'INIT')
      expect(displayUnit?.aliases).toEqual(['init'])
    })
  })
})
