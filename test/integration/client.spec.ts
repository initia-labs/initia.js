/**
 * Integration tests for gRPC Client.
 *
 * These tests connect to the actual Initia testnet.
 * They may fail if the network is unavailable.
 *
 * Skip with: SKIP_INTEGRATION_TESTS=true npm test
 */

import { describe, it, expect, beforeAll } from 'vitest'
import { ConnectError, Code } from '@connectrpc/connect'
import { createRegistryProvider } from '../../src/provider/registry-provider'
import { createClient } from '../../src/entry.node'
import type { ChainInfo } from '../../src/provider/types'
import type { Client } from '../../src/client/types'

// Skip integration tests if environment variable is set
const SKIP = process.env.SKIP_INTEGRATION_TESTS === 'true'

describe.skipIf(SKIP)('Client (Integration)', () => {
  let chainInfo: ChainInfo
  let client: Client

  beforeAll(async () => {
    // Get testnet chain info
    const provider = await createRegistryProvider({ network: 'testnet' })
    const chains = provider.listChains()

    // Find Initia L1 testnet
    const initiaChain = chains.find(c => c.chainType === 'initia')
    if (!initiaChain) {
      throw new Error('No Initia L1 testnet found')
    }

    chainInfo = initiaChain
    client = createClient(chainInfo)
  }, 30000)

  describe('createClient', () => {
    it('should create a client from chain info', () => {
      expect(client).toBeDefined()
    })

    it('should have bank service', () => {
      expect(client.bank).toBeDefined()
    })

    it('should have tendermint service', () => {
      expect(client.tendermint).toBeDefined()
    })

    it('should have auth service', () => {
      expect(client.auth).toBeDefined()
    })

    it('should have tx service', () => {
      expect(client.tx).toBeDefined()
    })
  })

  describe('client.bank', () => {
    // Valid testnet address
    const testAddress = 'init1q6dd2frhtlh27lhlset9ggq5x35ekj593qhee4'

    it('should query balance for an address', async () => {
      const response = await client.bank.balance({
        address: testAddress,
        denom: chainInfo.nativeDenom ?? 'uinit',
      })

      expect(response).toBeDefined()
      expect(response.balance).toBeDefined()
    }, 30000)

    it('should query all balances for an address', async () => {
      const response = await client.bank.allBalances({
        address: testAddress,
      })

      expect(response).toBeDefined()
      expect(response.balances).toBeDefined()
      expect(Array.isArray(response.balances)).toBe(true)
    }, 30000)
  })

  describe('client.tendermint', () => {
    it('should get node info', async () => {
      const response = await client.tendermint.getNodeInfo({})

      expect(response).toBeDefined()
      expect(response.defaultNodeInfo).toBeDefined()
    }, 30000)

    it('should get latest block', async () => {
      const response = await client.tendermint.getLatestBlock({})

      expect(response).toBeDefined()
      expect(response.block).toBeDefined()
      expect(response.block?.header).toBeDefined()
    }, 30000)

    it('should get syncing status', async () => {
      const response = await client.tendermint.getSyncing({})

      expect(response).toBeDefined()
      expect(typeof response.syncing).toBe('boolean')
    }, 30000)
  })

  describe('client.auth', () => {
    it('should query account (may return not found)', async () => {
      // Use a valid testnet address
      const testAddress = 'init1q6dd2frhtlh27lhlset9ggq5x35ekj593qhee4'

      try {
        const response = await client.auth.account({
          address: testAddress,
        })

        // If account exists, it should have account field
        expect(response).toBeDefined()
      } catch (error) {
        // Only "not found" is expected for unused addresses
        expect(error).toBeInstanceOf(ConnectError)
        expect((error as ConnectError).code).toBe(Code.NotFound)
      }
    }, 30000)
  })
})
