import { describe, it, expect, beforeAll, afterAll } from 'vitest'
import { mkdirSync, writeFileSync, rmSync } from 'node:fs'
import { join } from 'node:path'
import type { LocalRegistryProvider } from '../../../src/provider/local-registry-provider'
import { createLocalRegistryProvider } from '../../../src/provider/local-registry-provider'

import chainsFixture from '../../fixtures/registry/chains.json'
import assetlistInitia from '../../fixtures/registry/assetlist-initia.json'
import assetlistMinievm from '../../fixtures/registry/assetlist-minievm.json'

// =============================================================================
// Test fixtures — create a temporary registry directory structure
// =============================================================================

const TMP_DIR = join(__dirname, '__tmp_registry__')

function setupTmpRegistry() {
  // mainnets/initia/
  const initiaDir = join(TMP_DIR, 'mainnets', 'initia')
  mkdirSync(initiaDir, { recursive: true })
  writeFileSync(join(initiaDir, 'chain.json'), JSON.stringify(chainsFixture[0]))
  writeFileSync(join(initiaDir, 'assetlist.json'), JSON.stringify(assetlistInitia))

  // mainnets/minievm/
  const minievmDir = join(TMP_DIR, 'mainnets', 'minievm')
  mkdirSync(minievmDir, { recursive: true })
  writeFileSync(join(minievmDir, 'chain.json'), JSON.stringify(chainsFixture[1]))
  writeFileSync(join(minievmDir, 'assetlist.json'), JSON.stringify(assetlistMinievm))

  // mainnets/minimove/ (no assetlist)
  const minimoveDir = join(TMP_DIR, 'mainnets', 'minimove')
  mkdirSync(minimoveDir, { recursive: true })
  writeFileSync(join(minimoveDir, 'chain.json'), JSON.stringify(chainsFixture[2]))

  // mainnets/_IBC/ (should be skipped)
  const ibcDir = join(TMP_DIR, 'mainnets', '_IBC')
  mkdirSync(ibcDir, { recursive: true })
  writeFileSync(join(ibcDir, 'chain.json'), '{"chain_id":"should-not-appear"}')

  // mainnets/bad-json/ — removed: invalid JSON now correctly throws instead of being silently skipped

  // testnets/ (empty, no chains)
  mkdirSync(join(TMP_DIR, 'testnets'), { recursive: true })
}

function cleanupTmpRegistry() {
  rmSync(TMP_DIR, { recursive: true, force: true })
}

// =============================================================================
// Tests
// =============================================================================

describe('LocalRegistryProvider', () => {
  let provider: LocalRegistryProvider

  beforeAll(() => {
    setupTmpRegistry()
    provider = createLocalRegistryProvider({ registryPath: TMP_DIR })
  })

  afterAll(() => {
    cleanupTmpRegistry()
  })

  // === Construction ===

  describe('construction', () => {
    it('throws for non-existent path', () => {
      expect(() =>
        createLocalRegistryProvider({ registryPath: '/tmp/non-existent-path-12345' })
      ).toThrow('Registry path does not exist')
    })

    it('loads chains from mainnets/', () => {
      expect(provider.hasChain('interwoven-1')).toBe(true)
      expect(provider.hasChain('minievm-1')).toBe(true)
      expect(provider.hasChain('minimove-1')).toBe(true)
    })

    it('skips _ prefixed directories', () => {
      expect(provider.hasChain('should-not-appear')).toBe(false)
    })

    it('throws on invalid JSON files', () => {
      // Create a temporary registry with invalid JSON
      const badDir = join(TMP_DIR, 'mainnets', 'bad-json')
      mkdirSync(badDir, { recursive: true })
      writeFileSync(join(badDir, 'chain.json'), '{ invalid json }')
      try {
        expect(() => createLocalRegistryProvider({ registryPath: TMP_DIR })).toThrow(SyntaxError)
      } finally {
        rmSync(badDir, { recursive: true, force: true })
      }
    })
  })

  // === ChainInfoProvider ===

  describe('getChainInfo', () => {
    it('returns ChainInfo for known chain', () => {
      const info = provider.getChainInfo('interwoven-1')
      expect(info).toBeDefined()
      expect(info!.chainId).toBe('interwoven-1')
      expect(info!.chainType).toBe('initia')
      expect(info!.nativeDenom).toBe('uinit')
    })

    it('returns undefined for unknown chain', () => {
      expect(provider.getChainInfo('nonexistent')).toBeUndefined()
    })
  })

  describe('listChains', () => {
    it('returns all loaded chains', () => {
      const chains = provider.listChains()
      expect(chains.length).toBe(3)
      const ids = chains.map(c => c.chainId).sort()
      expect(ids).toEqual(['interwoven-1', 'minievm-1', 'minimove-1'])
    })
  })

  // === Assets (lazy loading) ===

  describe('getAssets', () => {
    it('lazily loads assets for initia', async () => {
      const assets = await provider.getAssets('interwoven-1')
      expect(assets.length).toBe(2)
      expect(assets[0].symbol).toBe('INIT')
    })

    it('returns empty for chain without assetlist', async () => {
      const assets = await provider.getAssets('minimove-1')
      expect(assets).toEqual([])
    })

    it('returns empty for unknown chain', async () => {
      const assets = await provider.getAssets('nonexistent')
      expect(assets).toEqual([])
    })
  })

  describe('findAsset', () => {
    it('finds asset by denom on specific chain', async () => {
      const asset = await provider.findAsset('uinit', 'interwoven-1')
      expect(asset).toBeDefined()
      expect(asset!.symbol).toBe('INIT')
    })

    it('finds asset across all chains', async () => {
      const asset = await provider.findAsset('uinit')
      expect(asset).toBeDefined()
      expect(asset!.chainId).toBe('interwoven-1')
    })

    it('returns undefined for nonexistent denom', async () => {
      expect(await provider.findAsset('nonexistent', 'interwoven-1')).toBeUndefined()
    })
  })

  describe('findAssetBySymbol', () => {
    it('finds by symbol (case-insensitive)', async () => {
      const assets = await provider.findAssetBySymbol('init')
      expect(assets.length).toBeGreaterThanOrEqual(1)
      expect(assets[0].symbol).toBe('INIT')
    })
  })

  // === IBC ===

  describe('getIbcChannels', () => {
    it('returns IBC channels for initia', () => {
      const channels = provider.getIbcChannels('interwoven-1')
      expect(channels.length).toBe(2)
      expect(channels[0].chainId).toBe('noble-1')
    })

    it('returns empty for unknown chain', () => {
      expect(provider.getIbcChannels('nonexistent')).toEqual([])
    })
  })

  describe('getTransferPath', () => {
    it('returns transfer path for ics20 channel', () => {
      const path = provider.getTransferPath('interwoven-1', 'noble-1')
      expect(path).toBeDefined()
      expect(path!.channel).toBe('channel-3')
      expect(path!.port).toBe('transfer')
    })

    it('returns undefined for non-ics20 channel', () => {
      // channel-99 is ics721-1 (NFT), not ics20-1
      const path = provider.getTransferPath('interwoven-1', 'minievm-1')
      expect(path).toBeUndefined()
    })
  })

  // === OP Bridge ===

  describe('getOpBridge', () => {
    it('returns OP bridge info for L2', () => {
      const bridge = provider.getOpBridge('minievm-1')
      expect(bridge).toBeDefined()
      expect(bridge!.bridgeId).toBe(42n)
      expect(bridge!.denoms).toEqual(['uinit', 'uusdc'])
    })

    it('returns undefined for L1', () => {
      expect(provider.getOpBridge('interwoven-1')).toBeUndefined()
    })
  })

  // === Resolution ===

  describe('resolveChainId', () => {
    it('resolves chain name to ID', () => {
      expect(provider.resolveChainId('initia')).toBe('interwoven-1')
    })

    it('returns undefined for unknown name', () => {
      expect(provider.resolveChainId('unknown')).toBeUndefined()
    })
  })

  describe('getChainName', () => {
    it('returns chain name for known ID', () => {
      expect(provider.getChainName('interwoven-1')).toBe('initia')
    })
  })

  // === Network filter ===

  describe('network filter', () => {
    it('filters by mainnet only', () => {
      const filtered = createLocalRegistryProvider({
        registryPath: TMP_DIR,
        network: 'mainnet',
      })
      expect(filtered.listChains().length).toBe(3)
    })

    it('filters by testnet only (empty in our fixture)', () => {
      const filtered = createLocalRegistryProvider({
        registryPath: TMP_DIR,
        network: 'testnet',
      })
      expect(filtered.listChains().length).toBe(0)
    })
  })

  // === Refresh ===

  describe('refresh', () => {
    it('reloads chains from disk', async () => {
      const p = createLocalRegistryProvider({ registryPath: TMP_DIR })
      expect(p.listChains().length).toBe(3)

      // Simulate a change: remove minievm chain.json
      const minievmChainJson = join(TMP_DIR, 'mainnets', 'minievm', 'chain.json')
      rmSync(minievmChainJson)

      await p.refresh()
      expect(p.listChains().length).toBe(2)
      expect(p.hasChain('minievm-1')).toBe(false)

      // Restore for other tests
      writeFileSync(minievmChainJson, JSON.stringify(chainsFixture[1]))
    })
  })
})
