/**
 * Integration tests for CompositeProvider.
 *
 * Tests combining RegistryProvider (Initia ecosystem) with
 * CosmosRegistryProvider (Cosmos ecosystem) for multi-ecosystem support.
 *
 * Skip with: SKIP_INTEGRATION_TESTS=true npm test
 */

import { describe, it, expect, beforeAll } from 'vitest'
import type { RegistryProvider } from '../../src/provider/registry-provider'
import { createRegistryProvider } from '../../src/provider/registry-provider'
import { CosmosRegistryProvider } from '../../src/provider/cosmos-registry-provider'
import { CompositeProvider } from '../../src/provider/composite-provider'
import { CustomProvider } from '../../src/provider/custom-provider'
import { createClient } from '../../src/entry.node'
import type { BaseClient } from '../../src/client/types'

// Skip integration tests if environment variable is set
const SKIP = process.env.SKIP_INTEGRATION_TESTS === 'true'

describe.skipIf(SKIP)('CompositeProvider Integration', () => {
  let registryProvider: RegistryProvider
  let cosmosProvider: CosmosRegistryProvider
  let compositeProvider: CompositeProvider

  beforeAll(async () => {
    // Initia ecosystem provider (async initialization — fetches from registry)
    registryProvider = await createRegistryProvider({ network: 'mainnet' })

    // Cosmos ecosystem provider (selected chains only for faster tests)
    cosmosProvider = new CosmosRegistryProvider({
      chainNames: ['osmosis', 'noble'],
      testnet: false,
    })

    // Combined provider: Initia first, then Cosmos ecosystem
    compositeProvider = new CompositeProvider([registryProvider, cosmosProvider])
  }, 30000)

  // ==========================================================================
  // Provider Combination Tests
  // ==========================================================================

  describe('Provider Combination', () => {
    it('should combine RegistryProvider and CosmosRegistryProvider', () => {
      expect(compositeProvider).toBeDefined()
      expect(compositeProvider.providerCount).toBe(2)
    })

    it('should list chains from both providers', () => {
      const allChains = compositeProvider.listChains()

      // Should have chains from both providers
      expect(allChains.length).toBeGreaterThan(0)

      // Get chain IDs
      const chainIds = allChains.map(c => c.chainId)

      // Should include Cosmos chains
      expect(chainIds).toContain('osmosis-1')
      expect(chainIds).toContain('noble-1')
    })

    it('should have more chains than either provider alone', () => {
      const registryChains = registryProvider.listChains()
      const cosmosChains = cosmosProvider.listChains()
      const compositeChains = compositeProvider.listChains()

      // Composite should have at least as many chains as the larger provider
      const maxSingle = Math.max(registryChains.length, cosmosChains.length)
      expect(compositeChains.length).toBeGreaterThanOrEqual(maxSingle)
    })
  })

  // ==========================================================================
  // Chain Access Tests
  // ==========================================================================

  describe('Chain Access from Multiple Ecosystems', () => {
    it('should access Initia chains from RegistryProvider', () => {
      // Find an Initia chain
      const initiaChain = compositeProvider
        .listChains()
        .find(c => c.chainType === 'initia' || c.chainType === 'minievm')

      if (initiaChain) {
        const chain = compositeProvider.getChainInfo(initiaChain.chainId)
        expect(chain).toBeDefined()
        expect(['initia', 'minievm', 'miniwasm', 'minimove']).toContain(chain?.chainType)
      }
    })

    it('should access Osmosis from CosmosRegistryProvider', () => {
      const osmosis = compositeProvider.getChainInfo('osmosis-1')

      expect(osmosis).toBeDefined()
      expect(osmosis?.chainId).toBe('osmosis-1')
      expect(osmosis?.bech32Prefix).toBe('osmo')
      expect(osmosis?.chainType).toBe('other')
    })

    it('should access Noble from CosmosRegistryProvider', () => {
      const noble = compositeProvider.getChainInfo('noble-1')

      expect(noble).toBeDefined()
      expect(noble?.chainId).toBe('noble-1')
      expect(noble?.bech32Prefix).toBe('noble')
    })

    it('should return undefined for non-existent chain', () => {
      const nonExistent = compositeProvider.getChainInfo('non-existent-chain-12345')

      expect(nonExistent).toBeUndefined()
    })

    it('should correctly report hasChain for all ecosystems', () => {
      // Cosmos chains
      expect(compositeProvider.hasChain('osmosis-1')).toBe(true)
      expect(compositeProvider.hasChain('noble-1')).toBe(true)

      // Non-existent
      expect(compositeProvider.hasChain('fake-chain-999')).toBe(false)
    })
  })

  // ==========================================================================
  // Chain Type Distribution Tests
  // ==========================================================================

  describe('Chain Type Distribution', () => {
    it('should have different chain types from different providers', () => {
      const allChains = compositeProvider.listChains()
      const chainTypes = new Set(allChains.map(c => c.chainType))

      // Should include 'other' from Cosmos chains
      expect(chainTypes.has('other')).toBe(true)
    })

    it('should correctly categorize chain types', () => {
      // Cosmos ecosystem chains should be 'other'
      const osmosis = compositeProvider.getChainInfo('osmosis-1')
      const noble = compositeProvider.getChainInfo('noble-1')

      expect(osmosis?.chainType).toBe('other')
      expect(noble?.chainType).toBe('other')
    })
  })

  // ==========================================================================
  // Network Connectivity Tests (Multi-Ecosystem)
  // ==========================================================================

  describe('Multi-Ecosystem Network Connectivity', () => {
    it('should query Osmosis via composite provider', async () => {
      const osmosis = compositeProvider.getChainInfo('osmosis-1')!
      const client = createClient(osmosis) as BaseClient

      const response = await client.tendermint.getLatestBlock({})

      expect(response).toBeDefined()
      expect(response.block?.header?.chainId).toBe('osmosis-1')
    }, 30000)

    it('should query Noble via composite provider', async () => {
      const noble = compositeProvider.getChainInfo('noble-1')!
      const client = createClient(noble) as BaseClient

      const response = await client.tendermint.getLatestBlock({})

      expect(response).toBeDefined()
      expect(response.block?.header?.chainId).toBe('noble-1')
    }, 30000)

    it('should query multiple ecosystems in parallel', async () => {
      // Get chain infos
      const osmosis = compositeProvider.getChainInfo('osmosis-1')!
      const noble = compositeProvider.getChainInfo('noble-1')!

      // Create clients
      const osmosisClient = createClient(osmosis) as BaseClient
      const nobleClient = createClient(noble) as BaseClient

      // Query in parallel
      const [osmosisBlock, nobleBlock] = await Promise.all([
        osmosisClient.tendermint.getLatestBlock({}),
        nobleClient.tendermint.getLatestBlock({}),
      ])

      // Verify responses
      expect(osmosisBlock.block?.header?.chainId).toBe('osmosis-1')
      expect(nobleBlock.block?.header?.chainId).toBe('noble-1')
    }, 60000)
  })

  // ==========================================================================
  // Provider Priority Tests
  // ==========================================================================

  describe('Provider Priority (First Provider Wins)', () => {
    it('should give priority to first provider for duplicate chain IDs', () => {
      // Create two providers with potentially overlapping chains
      const provider1 = new CosmosRegistryProvider({
        chainNames: ['osmosis'],
        testnet: false,
      })

      const provider2 = new CosmosRegistryProvider({
        chainNames: ['osmosis'],
        testnet: false,
      })

      // Composite with provider1 first
      const composite = new CompositeProvider([provider1, provider2])

      // Should have osmosis-1
      expect(composite.hasChain('osmosis-1')).toBe(true)

      // Should only have one entry for osmosis-1
      const osmosisChains = composite.listChains().filter(c => c.chainId === 'osmosis-1')
      expect(osmosisChains.length).toBe(1)
    })

    it('should allow custom provider to override registry', () => {
      // Create custom provider with modified Osmosis config
      const customProvider = new CustomProvider([
        {
          chainId: 'osmosis-1',
          chainName: 'Custom Osmosis',
          chainType: 'other',
          network: 'mainnet',
          rest: 'https://custom-lcd.example.com',
          nativeDenom: 'uosmo',
          bech32Prefix: 'osmo',
        },
      ])

      // Custom first, then CosmosRegistry
      const composite = new CompositeProvider([customProvider, cosmosProvider])

      // Should get custom version
      const osmosis = composite.getChainInfo('osmosis-1')
      expect(osmosis?.chainName).toBe('Custom Osmosis')
      expect(osmosis?.rest).toBe('https://custom-lcd.example.com')
    })
  })

  // ==========================================================================
  // Use Case: Multi-Ecosystem Application
  // ==========================================================================

  describe('Use Case: Multi-Ecosystem Application', () => {
    it('should support typical multi-ecosystem workflow', async () => {
      // Scenario: Application that needs to work with both Initia and Cosmos chains

      // 1. Create combined provider (reuse existing registryProvider)
      const provider = new CompositeProvider([
        registryProvider, // Initia ecosystem
        new CosmosRegistryProvider({ testnet: false }), // Cosmos ecosystem
      ])

      // 2. List available chains
      const chains = provider.listChains()
      expect(chains.length).toBeGreaterThan(0)

      // 3. Get specific Cosmos chain
      const osmosis = provider.getChainInfo('osmosis-1')
      expect(osmosis).toBeDefined()

      // 4. Create client and query
      const client = createClient(osmosis!) as BaseClient
      const nodeInfo = await client.tendermint.getNodeInfo({})

      expect(nodeInfo.defaultNodeInfo).toBeDefined()
    }, 30000)

    it('should work with chain filtering by ecosystem', () => {
      const allChains = compositeProvider.listChains()

      // Filter Initia ecosystem chains
      const initiaChains = allChains.filter(c =>
        ['initia', 'minievm', 'miniwasm', 'minimove'].includes(c.chainType)
      )

      // Filter Cosmos ecosystem chains (type 'other')
      const cosmosChains = allChains.filter(c => c.chainType === 'other')

      // Both should exist
      expect(initiaChains.length).toBeGreaterThan(0)
      expect(cosmosChains.length).toBeGreaterThan(0)

      // Cosmos chains should include our test chains
      const cosmosChainIds = cosmosChains.map(c => c.chainId)
      expect(cosmosChainIds).toContain('osmosis-1')
      expect(cosmosChainIds).toContain('noble-1')
    })
  })
})
