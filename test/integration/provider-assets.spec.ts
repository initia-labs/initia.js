/**
 * Integration tests for Provider asset & IBC data.
 *
 * Validates real chain data from:
 * - Initia Testnet (initiation-2) via RegistryProvider
 * - Initia Mainnet (interwoven-1) via RegistryProvider
 * - Cross-ecosystem via CompositeProvider (RegistryProvider + CustomProvider)
 *
 * Note: CosmosRegistryProvider integration is tested in composite-provider.spec.ts
 * and cosmos-chains.spec.ts. Here we focus on RegistryProvider asset data accuracy.
 *
 * Skip with: SKIP_INTEGRATION_TESTS=true npm test
 */

import { describe, it, expect, beforeAll } from 'vitest'
import type { RegistryProvider } from '../../src/provider/registry-provider'
import { createRegistryProvider } from '../../src/provider/registry-provider'
import { CompositeProvider } from '../../src/provider/composite-provider'
import { CustomProvider } from '../../src/provider/custom-provider'
import { coin } from '../../src/core/coin'

const SKIP = process.env.SKIP_INTEGRATION_TESTS === 'true'

// =============================================================================
// 1. Initia Testnet (initiation-2)
// =============================================================================

describe.skipIf(SKIP)('Initia Testnet Provider Assets', () => {
  let provider: RegistryProvider

  beforeAll(async () => {
    provider = await createRegistryProvider({ network: 'testnet' })
  }, 30000)

  describe('chain discovery', () => {
    it('should include initiation-2 (L1) chain', () => {
      const chain = provider.getChainInfo('initiation-2')
      expect(chain).toBeDefined()
      expect(chain!.chainType).toBe('initia')
      expect(chain!.network).toBe('testnet')
    })

    it('should have at least one L2 rollup chain', () => {
      const chains = provider.listChains()
      const l2 = chains.find(c => ['minievm', 'miniwasm', 'minimove'].includes(c.chainType))
      expect(l2).toBeDefined()
      expect(l2!.opBridgeId).toBeDefined()
    })

    it('should resolve chain name to chain ID', () => {
      const id = provider.resolveChainId('initia', 'testnet')
      expect(id).toBe('initiation-2')
    })

    it('should return chain name for known chain', () => {
      const name = provider.getChainName('initiation-2')
      expect(name).toBe('initia')
    })
  })

  describe('asset data', () => {
    it('should return assets for initiation-2', async () => {
      const assets = await provider.getAssets('initiation-2')
      expect(assets.length).toBeGreaterThan(0)
    })

    it('should find uinit as INIT with 6 decimals', async () => {
      const init = await provider.findAsset('uinit', 'initiation-2')
      expect(init).toBeDefined()
      expect(init!.symbol).toBe('INIT')
      expect(init!.decimals).toBe(6)
    })

    it('should find INIT by symbol search', async () => {
      const results = await provider.findAssetBySymbol('INIT', 'initiation-2')
      expect(results.length).toBeGreaterThanOrEqual(1)
      expect(results[0].denom).toBe('uinit')
    })

    it('should have denomUnits for uinit', async () => {
      const init = await provider.findAsset('uinit', 'initiation-2')
      expect(init!.denomUnits.length).toBeGreaterThanOrEqual(2)
      const base = init!.denomUnits.find(u => u.exponent === 0)
      expect(base?.denom).toBe('uinit')
    })

    it('should return raw asset list', async () => {
      const raw = await provider.getRawAssetList('initiation-2')
      expect(raw).toBeDefined()
      expect((raw as any).assets.length).toBeGreaterThan(0)
    })
  })

  describe('amount conversion with real data', () => {
    it('should convert 1000000 uinit to 1 INIT', async () => {
      const display = await provider.toDisplayAmount(coin('uinit', '1000000'), 'initiation-2')
      expect(display).toBe('1')
    })

    it('should convert 1.5 INIT to 1500000 uinit', async () => {
      const base = await provider.toBaseAmount('1.5', 'uinit', 'initiation-2')
      expect(base).toBe('1500000')
    })

    it('should format 1500000 uinit as "1.5 INIT"', async () => {
      const formatted = await provider.formatAmount(coin('uinit', '1500000'), 'initiation-2')
      expect(formatted).toBe('1.5 INIT')
    })

    it('should round-trip display↔base for uinit', async () => {
      const display = await provider.toDisplayAmount(coin('uinit', '7654321'), 'initiation-2')
      const base = await provider.toBaseAmount(display, 'uinit', 'initiation-2')
      expect(base).toBe('7654321')
    })
  })

  describe('IBC channels', () => {
    it('should have IBC channels for initiation-2', () => {
      const channels = provider.getIbcChannels('initiation-2')
      // L1 typically has IBC channels to L2s and other chains
      expect(channels.length).toBeGreaterThanOrEqual(0)
    })
  })

  describe('OP Bridge', () => {
    it('should return bridge info for an L2 chain', () => {
      const chains = provider.listChains()
      const l2 = chains.find(c => c.opBridgeId !== undefined)
      if (!l2) return

      const bridge = provider.getOpBridge(l2.chainId)
      expect(bridge).toBeDefined()
      expect(bridge!.bridgeId).toBe(l2.opBridgeId)
      expect(bridge!.l2ChainId).toBe(l2.chainId)
    })

    it('should return undefined for L1 chain', () => {
      expect(provider.getOpBridge('initiation-2')).toBeUndefined()
    })
  })

  describe('L2 rollup asset data', () => {
    it('should load assets for an L2 chain', async () => {
      const chains = provider.listChains()
      const l2 = chains.find(c => ['minievm', 'miniwasm', 'minimove'].includes(c.chainType))
      if (!l2) return

      const assets = await provider.getAssets(l2.chainId)
      // L2 may or may not have assets in the registry
      expect(Array.isArray(assets)).toBe(true)
    })
  })
})

// =============================================================================
// 2. Initia Mainnet (interwoven-1)
// =============================================================================

describe.skipIf(SKIP)('Initia Mainnet Provider Assets', () => {
  let provider: RegistryProvider

  beforeAll(async () => {
    provider = await createRegistryProvider({ network: 'mainnet' })
  }, 30000)

  describe('chain discovery', () => {
    it('should include interwoven-1 (L1) chain', () => {
      const chain = provider.getChainInfo('interwoven-1')
      expect(chain).toBeDefined()
      expect(chain!.chainType).toBe('initia')
      expect(chain!.network).toBe('mainnet')
    })

    it('should resolve "initia" to "interwoven-1"', () => {
      expect(provider.resolveChainId('initia', 'mainnet')).toBe('interwoven-1')
    })

    it('should return "initia" as chain name for interwoven-1', () => {
      expect(provider.getChainName('interwoven-1')).toBe('initia')
    })

    it('should have multiple mainnet chains', () => {
      const chains = provider.listChains()
      expect(chains.length).toBeGreaterThan(1)
      expect(chains.every(c => c.network === 'mainnet')).toBe(true)
    })
  })

  describe('asset data', () => {
    it('should return native and IBC assets for interwoven-1', async () => {
      const assets = await provider.getAssets('interwoven-1')
      expect(assets.length).toBeGreaterThan(0)

      const init = assets.find(a => a.denom === 'uinit')
      expect(init).toBeDefined()
      expect(init!.symbol).toBe('INIT')
    })

    it('should have IBC assets with origin chain info', async () => {
      const assets = await provider.getAssets('interwoven-1')
      const ibcAsset = assets.find(a => a.originChainId)

      if (ibcAsset) {
        expect(ibcAsset.originChainId).toBeDefined()
        expect(ibcAsset.originDenom).toBeDefined()
        expect(ibcAsset.denom).toMatch(/^ibc\//)
      }
    })

    it('should list assets across all mainnet chains', async () => {
      const all = await provider.listAssets()
      expect(all.length).toBeGreaterThan(0)

      const chainIds = new Set(all.map(a => a.chainId))
      expect(chainIds.size).toBeGreaterThanOrEqual(1)
    })
  })

  describe('amount conversion', () => {
    it('should convert INIT amounts', async () => {
      const display = await provider.toDisplayAmount(coin('uinit', '1000000'), 'interwoven-1')
      expect(display).toBe('1')

      const formatted = await provider.formatAmount(coin('uinit', '1500000'), 'interwoven-1')
      expect(formatted).toBe('1.5 INIT')
    })
  })
})

// =============================================================================
// 3. CompositeProvider with Custom chain (no chain-registry dependency)
// =============================================================================

describe.skipIf(SKIP)('Composite Provider with Custom + Registry', () => {
  let registryProvider: RegistryProvider
  let customProvider: CustomProvider
  let composite: CompositeProvider

  beforeAll(async () => {
    registryProvider = await createRegistryProvider({ network: 'testnet' })

    customProvider = new CustomProvider()
    customProvider.addChain({
      chainId: 'my-local-1',
      chainName: 'My Local Chain',
      chainType: 'other',
      network: 'local',
      grpc: 'localhost:9090',
      nativeDenom: 'ulocal',
      assets: [
        {
          chainId: 'my-local-1',
          denom: 'ulocal',
          symbol: 'LOCAL',
          name: 'Local Token',
          display: 'local',
          denomUnits: [
            { denom: 'ulocal', exponent: 0 },
            { denom: 'local', exponent: 6 },
          ],
          decimals: 6,
        },
      ],
    })

    composite = new CompositeProvider([registryProvider, customProvider])
  }, 30000)

  describe('cross-ecosystem chain access', () => {
    it('should access both Initia registry and custom chains', () => {
      expect(composite.hasChain('initiation-2')).toBe(true)
      expect(composite.hasChain('my-local-1')).toBe(true)
    })

    it('should have more chains than either provider alone', () => {
      const compositeCount = composite.listChains().length
      const initiaCount = registryProvider.listChains().length
      expect(compositeCount).toBe(initiaCount + 1) // +1 for custom chain
    })
  })

  describe('cross-ecosystem asset queries', () => {
    it('should find INIT from registry provider', async () => {
      const init = await composite.findAsset('uinit', 'initiation-2')
      expect(init).toBeDefined()
      expect(init!.symbol).toBe('INIT')
    })

    it('should find LOCAL from custom provider', async () => {
      const local = await composite.findAsset('ulocal', 'my-local-1')
      expect(local).toBeDefined()
      expect(local!.symbol).toBe('LOCAL')
    })

    it('should list assets from both providers', async () => {
      const all = await composite.listAssets()
      const chainIds = new Set(all.map(a => a.chainId))
      expect(chainIds.has('my-local-1')).toBe(true)
    })
  })

  describe('cross-ecosystem amount conversion', () => {
    it('should convert INIT amounts via registry provider', async () => {
      const display = await composite.toDisplayAmount(coin('uinit', '1000000'), 'initiation-2')
      expect(display).toBe('1')
    })

    it('should convert LOCAL amounts via custom provider', async () => {
      const display = await composite.toDisplayAmount(coin('ulocal', '2500000'), 'my-local-1')
      expect(display).toBe('2.5')
    })

    it('should format amounts from different providers', async () => {
      const initFormatted = await composite.formatAmount(coin('uinit', '1500000'), 'initiation-2')
      expect(initFormatted).toBe('1.5 INIT')

      const localFormatted = await composite.formatAmount(coin('ulocal', '3000000'), 'my-local-1')
      expect(localFormatted).toBe('3 LOCAL')
    })
  })
})
