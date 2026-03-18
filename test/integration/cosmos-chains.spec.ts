/**
 * Integration tests for Cosmos ecosystem chain connectivity.
 *
 * Tests that CosmosRegistryProvider provides working endpoints
 * for major Cosmos chains (Osmosis, Noble, Cosmos Hub).
 *
 * Skip with: SKIP_INTEGRATION_TESTS=true npm test
 */

import { describe, it, expect, beforeAll } from 'vitest'
import { CosmosRegistryProvider } from '../../src/provider/cosmos-registry-provider'
import { MnemonicKey } from '../../src/key/mnemonic-key'
import { createClient } from '../../src/entry.node'
import type { ChainInfo } from '../../src/provider/types'
import type { BaseClient } from '../../src/client/types'

// Skip integration tests if environment variable is set
const SKIP = process.env.SKIP_INTEGRATION_TESTS === 'true'

// Test mnemonic for generating valid addresses (DO NOT USE IN PRODUCTION)
const TEST_MNEMONIC =
  'abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon about'

describe.skipIf(SKIP)('Cosmos Chain Connectivity (Integration)', () => {
  let provider: CosmosRegistryProvider

  beforeAll(() => {
    provider = new CosmosRegistryProvider({
      chainNames: ['osmosis', 'noble'],
      testnet: false, // mainnet only for reliability
    })
  })

  // ==========================================================================
  // Osmosis Mainnet Tests
  // ==========================================================================

  describe('Osmosis Mainnet', () => {
    let osmosisInfo: ChainInfo
    let client: BaseClient
    let testAddress: string

    beforeAll(() => {
      const info = provider.getChainInfo('osmosis-1')
      if (!info) {
        throw new Error('Osmosis chain not found in provider')
      }
      osmosisInfo = info
      client = createClient(osmosisInfo) as BaseClient

      // Generate valid test address
      const key = new MnemonicKey({
        mnemonic: TEST_MNEMONIC,
        bech32Prefix: 'osmo',
      })
      testAddress = key.address
    })

    it('should have correct chain configuration', () => {
      expect(osmosisInfo.chainId).toBe('osmosis-1')
      expect(osmosisInfo.bech32Prefix).toBe('osmo')
      expect(osmosisInfo.nativeDenom).toBe('uosmo')
      expect(osmosisInfo.chainType).toBe('other')
      expect(osmosisInfo.network).toBe('mainnet')
    })

    it('should have valid REST endpoint', () => {
      expect(osmosisInfo.rest).toBeDefined()
      expect(osmosisInfo.rest).toMatch(/^https?:\/\//)
    })

    it('should query balance on Osmosis', async () => {
      const response = await client.bank.balance({
        address: testAddress,
        denom: 'uosmo',
      })

      expect(response).toBeDefined()
      expect(response.balance).toBeDefined()
      expect(response.balance?.denom).toBe('uosmo')
    }, 30000)

    it('should query all balances on Osmosis', async () => {
      const response = await client.bank.allBalances({
        address: testAddress,
      })

      expect(response).toBeDefined()
      expect(response.balances).toBeDefined()
      expect(Array.isArray(response.balances)).toBe(true)
    }, 30000)

    it('should query latest block on Osmosis', async () => {
      const response = await client.tendermint.getLatestBlock({})

      expect(response).toBeDefined()
      expect(response.block).toBeDefined()
      expect(response.block?.header).toBeDefined()
      expect(response.block?.header?.chainId).toBe('osmosis-1')
    }, 30000)

    it('should get node info on Osmosis', async () => {
      const response = await client.tendermint.getNodeInfo({})

      expect(response).toBeDefined()
      expect(response.defaultNodeInfo).toBeDefined()
      expect(response.defaultNodeInfo?.network).toBe('osmosis-1')
    }, 30000)

    it('should get syncing status on Osmosis', async () => {
      const response = await client.tendermint.getSyncing({})

      expect(response).toBeDefined()
      expect(typeof response.syncing).toBe('boolean')
    }, 30000)
  })

  // ==========================================================================
  // Noble Mainnet Tests
  // ==========================================================================

  describe('Noble Mainnet', () => {
    let nobleInfo: ChainInfo
    let client: BaseClient
    let testAddress: string

    beforeAll(() => {
      const info = provider.getChainInfo('noble-1')
      if (!info) {
        throw new Error('Noble chain not found in provider')
      }
      nobleInfo = info
      client = createClient(nobleInfo) as BaseClient

      // Generate valid test address
      const key = new MnemonicKey({
        mnemonic: TEST_MNEMONIC,
        bech32Prefix: 'noble',
      })
      testAddress = key.address
    })

    it('should have correct chain configuration', () => {
      expect(nobleInfo.chainId).toBe('noble-1')
      expect(nobleInfo.bech32Prefix).toBe('noble')
      expect(nobleInfo.chainType).toBe('other')
      expect(nobleInfo.network).toBe('mainnet')
    })

    it('should have valid REST endpoint', () => {
      expect(nobleInfo.rest).toBeDefined()
      expect(nobleInfo.rest).toMatch(/^https?:\/\//)
    })

    it('should query USDC balance on Noble', async () => {
      const response = await client.bank.balance({
        address: testAddress,
        denom: 'uusdc', // Native USDC on Noble
      })

      expect(response).toBeDefined()
      expect(response.balance).toBeDefined()
    }, 30000)

    it('should query all balances on Noble', async () => {
      const response = await client.bank.allBalances({
        address: testAddress,
      })

      expect(response).toBeDefined()
      expect(response.balances).toBeDefined()
      expect(Array.isArray(response.balances)).toBe(true)
    }, 30000)

    it('should query latest block on Noble', async () => {
      const response = await client.tendermint.getLatestBlock({})

      expect(response).toBeDefined()
      expect(response.block).toBeDefined()
      expect(response.block?.header).toBeDefined()
      expect(response.block?.header?.chainId).toBe('noble-1')
    }, 30000)

    it('should get node info on Noble', async () => {
      const response = await client.tendermint.getNodeInfo({})

      expect(response).toBeDefined()
      expect(response.defaultNodeInfo).toBeDefined()
    }, 30000)
  })

  // ==========================================================================
  // Cross-Chain Query Tests
  // ==========================================================================

  describe('Cross-Chain Queries', () => {
    it('should query multiple chains in parallel', async () => {
      const osmosis = provider.getChainInfo('osmosis-1')!
      const noble = provider.getChainInfo('noble-1')!

      const osmosisClient = createClient(osmosis) as BaseClient
      const nobleClient = createClient(noble) as BaseClient

      // Query latest block from each chain
      const [osmosisBlock, nobleBlock] = await Promise.all([
        osmosisClient.tendermint.getLatestBlock({}),
        nobleClient.tendermint.getLatestBlock({}),
      ])

      // Verify each chain returns correct chain ID
      expect(osmosisBlock.block?.header?.chainId).toBe('osmosis-1')
      expect(nobleBlock.block?.header?.chainId).toBe('noble-1')
    }, 60000)
  })
})
