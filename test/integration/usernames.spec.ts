/**
 * Integration tests for Username Service.
 *
 * These tests connect to the actual Initia usernames API (testnet).
 * They may fail if the network is unavailable.
 *
 * Skip with: SKIP_INTEGRATION_TESTS=true npm test
 */

import { describe, it, expect } from 'vitest'
import { createUsernameService } from '../../src/client/usernames/service'
import type { UsernameService } from '../../src/client/usernames/service'

const SKIP = process.env.SKIP_INTEGRATION_TESTS === 'true'

describe.skipIf(SKIP)('UsernameService (Integration)', () => {
  // Use testnet to avoid depending on mainnet data
  const service: UsernameService = createUsernameService({ network: 'testnet', timeout: 15_000 })

  it('should have correct baseUrl', () => {
    expect(service.baseUrl).toBe('https://usernames-api.testnet.initia.xyz')
    expect(service.network).toBe('testnet')
  })

  it('should return image URL without API call', () => {
    const url = service.getImageUrl('test')
    expect(url).toBe('https://usernames-api.testnet.initia.xyz/image/test')
  })

  it('should check name availability', async () => {
    // A very unlikely name that should be available
    const available = await service.isAvailable('zzz_nonexistent_test_12345678')
    expect(available).toBe(true)
  }, 15_000)

  it('should return undefined for nonexistent name', async () => {
    const addr = await service.getAddress('zzz_nonexistent_test_12345678')
    expect(addr).toBeUndefined()
  }, 15_000)

  it('should return undefined getName for zero address', async () => {
    const name = await service.getName('0x0000000000000000000000000000000000000000')
    expect(name).toBeUndefined()
  }, 15_000)

  it('should return empty knownNames for unknown address', () => {
    const names = service.getKnownNames('0x0000000000000000000000000000000000000000')
    expect(names).toEqual([])
  })

  it('should clear cache without error', () => {
    expect(() => service.clearCache()).not.toThrow()
  })
})
