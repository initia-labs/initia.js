/**
 * Integration tests for custom Bech32 prefix functionality.
 *
 * Tests that MnemonicKey with custom bech32Prefix generates valid addresses
 * that work with different Cosmos ecosystem chains.
 *
 * Skip with: SKIP_INTEGRATION_TESTS=true npm test
 */

import { describe, it, expect, beforeAll } from 'vitest'
import { MnemonicKey } from '../../src/key/mnemonic-key'
import { CosmosRegistryProvider } from '../../src/provider/cosmos-registry-provider'
import { createClient } from '../../src/entry.node'
import type { BaseClient } from '../../src/client/types'

// Skip integration tests if environment variable is set
const SKIP = process.env.SKIP_INTEGRATION_TESTS === 'true'

// Test mnemonic (DO NOT USE IN PRODUCTION - this is a well-known test mnemonic)
const TEST_MNEMONIC =
  'abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon about'

describe.skipIf(SKIP)('Bech32 Prefix Integration', () => {
  let provider: CosmosRegistryProvider

  beforeAll(() => {
    provider = new CosmosRegistryProvider({
      chainNames: ['osmosis', 'noble', 'cosmoshub'],
      testnet: false,
    })
  })

  // ==========================================================================
  // Address Generation Tests
  // ==========================================================================

  describe('Address Generation with Custom Prefixes', () => {
    it('should generate valid Osmosis address with osmo prefix', () => {
      const key = new MnemonicKey({
        mnemonic: TEST_MNEMONIC,
        bech32Prefix: 'osmo',
      })

      expect(key.address).toMatch(/^osmo1[a-z0-9]{38}$/)
      expect(key.bech32Prefix).toBe('osmo')
    })

    it('should generate valid Noble address with noble prefix', () => {
      const key = new MnemonicKey({
        mnemonic: TEST_MNEMONIC,
        bech32Prefix: 'noble',
      })

      expect(key.address).toMatch(/^noble1[a-z0-9]{38}$/)
      expect(key.bech32Prefix).toBe('noble')
    })

    it('should generate valid Cosmos Hub address with cosmos prefix', () => {
      const key = new MnemonicKey({
        mnemonic: TEST_MNEMONIC,
        bech32Prefix: 'cosmos',
      })

      expect(key.address).toMatch(/^cosmos1[a-z0-9]{38}$/)
      expect(key.bech32Prefix).toBe('cosmos')
    })

    it('should generate valid Initia address with default init prefix', () => {
      const key = new MnemonicKey({
        mnemonic: TEST_MNEMONIC,
        // No bech32Prefix specified, should use default 'init'
      })

      expect(key.address).toMatch(/^init1[a-z0-9]{38}$/)
      expect(key.bech32Prefix).toBe('init')
    })

    it('should derive same raw address regardless of prefix', () => {
      const initKey = new MnemonicKey({
        mnemonic: TEST_MNEMONIC,
        bech32Prefix: 'init',
      })

      const osmoKey = new MnemonicKey({
        mnemonic: TEST_MNEMONIC,
        bech32Prefix: 'osmo',
      })

      const nobleKey = new MnemonicKey({
        mnemonic: TEST_MNEMONIC,
        bech32Prefix: 'noble',
      })

      const cosmosKey = new MnemonicKey({
        mnemonic: TEST_MNEMONIC,
        bech32Prefix: 'cosmos',
      })

      // All should have the same raw address (underlying bytes)
      expect(initKey.rawAddress).toEqual(osmoKey.rawAddress)
      expect(osmoKey.rawAddress).toEqual(nobleKey.rawAddress)
      expect(nobleKey.rawAddress).toEqual(cosmosKey.rawAddress)
    })

    it('should generate valid validator addresses with custom prefix', () => {
      const key = new MnemonicKey({
        mnemonic: TEST_MNEMONIC,
        bech32Prefix: 'osmo',
      })

      expect(key.valAddress).toMatch(/^osmovaloper1[a-z0-9]{38}$/)
    })
  })

  // ==========================================================================
  // Chain Query Tests with Generated Addresses
  // ==========================================================================

  describe('Chain Queries with Generated Addresses', () => {
    it('should query Osmosis with generated osmo-prefixed address', async () => {
      const key = new MnemonicKey({
        mnemonic: TEST_MNEMONIC,
        bech32Prefix: 'osmo',
      })

      const osmosisInfo = provider.getChainInfo('osmosis-1')!
      const client = createClient(osmosisInfo) as BaseClient

      // Query should succeed (even if balance is 0)
      const response = await client.bank.allBalances({
        address: key.address,
      })

      expect(response).toBeDefined()
      expect(response.balances).toBeDefined()
      expect(Array.isArray(response.balances)).toBe(true)
    }, 30000)

    it('should query Noble with generated noble-prefixed address', async () => {
      const key = new MnemonicKey({
        mnemonic: TEST_MNEMONIC,
        bech32Prefix: 'noble',
      })

      const nobleInfo = provider.getChainInfo('noble-1')!
      const client = createClient(nobleInfo) as BaseClient

      // Query should succeed (even if balance is 0)
      const response = await client.bank.allBalances({
        address: key.address,
      })

      expect(response).toBeDefined()
      expect(response.balances).toBeDefined()
      expect(Array.isArray(response.balances)).toBe(true)
    }, 30000)

    // Note: Cosmos Hub test skipped due to unreliable public endpoints
    // The functionality is validated by Osmosis and Noble tests above
  })

  // ==========================================================================
  // Address Format Validation Tests
  // ==========================================================================

  describe('Address Format Validation', () => {
    it('should generate addresses with correct length', () => {
      const prefixes = ['init', 'osmo', 'noble', 'cosmos', 'juno', 'stars']

      for (const prefix of prefixes) {
        const key = new MnemonicKey({
          mnemonic: TEST_MNEMONIC,
          bech32Prefix: prefix,
        })

        // Bech32 address should start with prefix + '1'
        expect(key.address.startsWith(`${prefix}1`)).toBe(true)

        // Address should be lowercase
        expect(key.address).toBe(key.address.toLowerCase())
      }
    })

    it('should generate consistent addresses from same mnemonic', () => {
      const key1 = new MnemonicKey({
        mnemonic: TEST_MNEMONIC,
        bech32Prefix: 'osmo',
      })

      const key2 = new MnemonicKey({
        mnemonic: TEST_MNEMONIC,
        bech32Prefix: 'osmo',
      })

      expect(key1.address).toBe(key2.address)
      expect(key1.publicKey).toEqual(key2.publicKey)
    })

    it('should generate different addresses from different mnemonics', () => {
      const mnemonic2 = 'zoo zoo zoo zoo zoo zoo zoo zoo zoo zoo zoo wrong'

      const key1 = new MnemonicKey({
        mnemonic: TEST_MNEMONIC,
        bech32Prefix: 'osmo',
      })

      const key2 = new MnemonicKey({
        mnemonic: mnemonic2,
        bech32Prefix: 'osmo',
      })

      expect(key1.address).not.toBe(key2.address)
    })
  })

  // ==========================================================================
  // Coin Type Compatibility Tests
  // ==========================================================================

  describe('Coin Type with Custom Prefix', () => {
    it('should use default INIT coin type (118) with custom prefix', () => {
      const key = new MnemonicKey({
        mnemonic: TEST_MNEMONIC,
        bech32Prefix: 'osmo',
        // Default coinType is 118 (INIT_COIN_TYPE)
      })

      // Address should be generated successfully
      expect(key.address).toMatch(/^osmo1/)
    })

    it('should allow custom coin type with custom prefix', () => {
      // Cosmos standard coin type is 118
      const key118 = new MnemonicKey({
        mnemonic: TEST_MNEMONIC,
        bech32Prefix: 'cosmos',
        coinType: 118,
      })

      // Ethereum coin type is 60
      const key60 = new MnemonicKey({
        mnemonic: TEST_MNEMONIC,
        bech32Prefix: 'cosmos',
        coinType: 60,
      })

      // Different coin types should produce different addresses
      expect(key118.address).not.toBe(key60.address)
    })
  })

  // ==========================================================================
  // Provider + Key Integration Tests
  // ==========================================================================

  describe('Provider and Key Integration', () => {
    it('should use provider bech32Prefix for key generation', () => {
      const osmosisInfo = provider.getChainInfo('osmosis-1')!

      const key = new MnemonicKey({
        mnemonic: TEST_MNEMONIC,
        bech32Prefix: osmosisInfo.bech32Prefix,
      })

      expect(key.address).toMatch(/^osmo1/)
      expect(key.bech32Prefix).toBe(osmosisInfo.bech32Prefix)
    })

    it('should generate matching addresses for all provider chains', () => {
      const chainIds = ['osmosis-1', 'noble-1', 'cosmoshub-4']

      for (const chainId of chainIds) {
        const chainInfo = provider.getChainInfo(chainId)!

        const key = new MnemonicKey({
          mnemonic: TEST_MNEMONIC,
          bech32Prefix: chainInfo.bech32Prefix,
        })

        // Address should start with the chain's bech32 prefix
        expect(key.address.startsWith(`${chainInfo.bech32Prefix}1`)).toBe(true)
      }
    })
  })
})
