/**
 * Integration tests for account module.
 *
 * These tests connect to the actual Initia testnet.
 * They may fail if the network is unavailable.
 *
 * Skip with: SKIP_INTEGRATION_TESTS=true npm test
 */

import { describe, it, expect, beforeAll } from 'vitest'
import { createRegistryProvider } from '../../src/provider/registry-provider'
import { createClient } from '../../src/entry.node'
import { getAccount } from '../../src/core/account'
import type { ChainInfo } from '../../src/provider/types'
import type { Client } from '../../src/client/types'

// Skip integration tests if environment variable is set
const SKIP = process.env.SKIP_INTEGRATION_TESTS === 'true'

describe.skipIf(SKIP)('Account (Integration)', () => {
  let chainInfo: ChainInfo
  let client: Client

  // Valid testnet address with on-chain activity
  const existingAddress = 'init1q6dd2frhtlh27lhlset9ggq5x35ekj593qhee4'

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

  describe('getAccount', () => {
    it('should return account info for existing account', async () => {
      const account = await getAccount(client, existingAddress)

      expect(account).toBeDefined()
      expect(account.address).toBe(existingAddress)
      expect(typeof account.number).toBe('bigint')
      expect(typeof account.sequence).toBe('bigint')
      expect(account.number).toBeGreaterThanOrEqual(0n)
      expect(account.sequence).toBeGreaterThanOrEqual(0n)
    }, 30000)

    it('should return correct account structure', async () => {
      const account = await getAccount(client, existingAddress)

      // Verify structure
      expect(account).toHaveProperty('address')
      expect(account).toHaveProperty('number')
      expect(account).toHaveProperty('sequence')

      // Verify types
      expect(typeof account.address).toBe('string')
      expect(typeof account.number).toBe('bigint')
      expect(typeof account.sequence).toBe('bigint')
    }, 30000)
  })
})
