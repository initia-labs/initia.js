/**
 * Integration tests for RegistryProvider.
 *
 * These tests connect to the actual Initia testnet registry API.
 * They may fail if the network is unavailable.
 *
 * Skip with: SKIP_INTEGRATION_TESTS=true npm test
 */

import { describe, it, expect, beforeAll } from 'vitest'
import type { RegistryProvider } from '../../src/provider/registry-provider'
import { createRegistryProvider } from '../../src/provider/registry-provider'

// Skip integration tests if environment variable is set
const SKIP = process.env.SKIP_INTEGRATION_TESTS === 'true'

describe.skipIf(SKIP)('RegistryProvider (Integration)', () => {
  let provider: RegistryProvider

  beforeAll(async () => {
    // Fetch testnet chains from registry API
    provider = await createRegistryProvider({ network: 'testnet' })
  }, 30000) // 30s timeout for network request

  describe('createRegistryProvider', () => {
    it('should fetch chains from testnet registry', () => {
      const chains = provider.listChains()

      expect(chains).toBeDefined()
      expect(Array.isArray(chains)).toBe(true)
      expect(chains.length).toBeGreaterThan(0)
    })

    it('should have valid chain info structure', () => {
      const chains = provider.listChains()
      const firstChain = chains[0]

      expect(firstChain).toHaveProperty('chainId')
      expect(firstChain).toHaveProperty('chainName')
      expect(firstChain).toHaveProperty('chainType')
      expect(firstChain).toHaveProperty('network')
      expect(firstChain).toHaveProperty('rest')
    })
  })

  describe('listChains', () => {
    it('should list all available testnet chains', () => {
      const chains = provider.listChains()

      // Testnet should have at least one chain
      expect(chains.length).toBeGreaterThan(0)

      // All chains should be from testnet
      for (const chain of chains) {
        expect(chain.network).toBe('testnet')
      }
    })

    it('should include various chain types', () => {
      const chains = provider.listChains()
      const chainTypes = new Set(chains.map(c => c.chainType))

      // Testnet typically has initia L1 and some rollups
      expect(chainTypes.size).toBeGreaterThan(0)
    })
  })

  describe('getChainInfo', () => {
    it('should return chain info for valid chain ID', () => {
      const chains = provider.listChains()
      if (chains.length === 0) return // Skip if no chains

      const firstChainId = chains[0].chainId
      const chainInfo = provider.getChainInfo(firstChainId)

      expect(chainInfo).toBeDefined()
      expect(chainInfo?.chainId).toBe(firstChainId)
    })

    it('should return undefined for non-existent chain', () => {
      const chainInfo = provider.getChainInfo('non-existent-chain-12345')

      expect(chainInfo).toBeUndefined()
    })

    it('should return chain info with REST endpoint', () => {
      const chains = provider.listChains()
      if (chains.length === 0) return

      const chainInfo = provider.getChainInfo(chains[0].chainId)

      expect(chainInfo?.rest).toBeDefined()
      expect(chainInfo?.rest).toMatch(/^https?:\/\//)
    })
  })

  describe('hasChain', () => {
    it('should return true for existing chain', () => {
      const chains = provider.listChains()
      if (chains.length === 0) return

      const exists = provider.hasChain(chains[0].chainId)

      expect(exists).toBe(true)
    })

    it('should return false for non-existent chain', () => {
      const exists = provider.hasChain('non-existent-chain-12345')

      expect(exists).toBe(false)
    })
  })
})
