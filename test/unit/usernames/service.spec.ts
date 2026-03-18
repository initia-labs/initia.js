/**
 * Unit tests for UsernameService (createUsernameService).
 * Mocks HTTP layer to test caching, deduplication, and all public methods.
 */

import { describe, it, expect, vi, beforeEach } from 'vitest'
import { createUsernameService } from '../../../src/client/usernames/service'
import { createUsernameCache } from '../../../src/client/usernames/cache'
import type { UsernameMetadata, UsernameRecord } from '../../../src/client/usernames/types'

// Mock the HTTP module
vi.mock('../../../src/client/usernames/http', () => ({
  fetchUsernameRecord: vi.fn(),
  fetchAddressToName: vi.fn(),
  fetchNameToAddress: vi.fn(),
}))

import {
  fetchUsernameRecord,
  fetchAddressToName,
  fetchNameToAddress,
} from '../../../src/client/usernames/http'

const mockFetchUsernameRecord = vi.mocked(fetchUsernameRecord)
const mockFetchAddressToName = vi.mocked(fetchAddressToName)
const mockFetchNameToAddress = vi.mocked(fetchNameToAddress)

const TEST_RECORD: UsernameRecord = {
  name: 'pseudo',
  address: '0x69ad5b1a5e05a5e86645cf7ef4559b0f4e5e5d2c',
  expiresAt: Date.now() + 3_600_000,
}

const TEST_METADATA: UsernameMetadata = {
  name: 'pseudo',
  description: 'test',
  image: 'https://example.com/pseudo.png',
  image_data: '',
  attributes: [
    { trait_type: 'Expiration Date', value: Math.floor((Date.now() + 3_600_000) / 1000) },
  ],
}

describe('createUsernameService', () => {
  let cache: ReturnType<typeof createUsernameCache>

  beforeEach(() => {
    vi.clearAllMocks()
    cache = createUsernameCache()
  })

  function createService(opts?: { defaultCacheTtl?: number }) {
    return createUsernameService({
      network: 'mainnet',
      cache,
      ...opts,
    })
  }

  describe('getAddress', () => {
    it('should resolve name to address', async () => {
      mockFetchUsernameRecord.mockResolvedValue({ record: TEST_RECORD, metadata: TEST_METADATA })
      const service = createService()
      const addr = await service.getAddress('pseudo')
      expect(addr).toBe(TEST_RECORD.address)
    })

    it('should return undefined for unknown name', async () => {
      mockFetchUsernameRecord.mockResolvedValue(undefined)
      const service = createService()
      expect(await service.getAddress('unknown')).toBeUndefined()
    })

    it('should format as bech32 when requested', async () => {
      mockFetchUsernameRecord.mockResolvedValue({ record: TEST_RECORD, metadata: TEST_METADATA })
      const service = createService()
      const addr = await service.getAddress('pseudo', { format: 'bech32' })
      expect(addr).toMatch(/^init1/)
    })
  })

  describe('resolve', () => {
    it('should resolve username to address', async () => {
      mockFetchUsernameRecord.mockResolvedValue({ record: TEST_RECORD, metadata: TEST_METADATA })
      const service = createService()
      const addr = await service.resolve('pseudo')
      expect(addr).toBe(TEST_RECORD.address)
    })

    it('should return input as-is when not a username', async () => {
      mockFetchUsernameRecord.mockResolvedValue(undefined)
      const service = createService()
      const addr = await service.resolve('0x69ad5b1a5e05a5e86645cf7ef4559b0f4e5e5d2c')
      expect(addr).toBe('0x69ad5b1a5e05a5e86645cf7ef4559b0f4e5e5d2c')
    })

    it('should format as bech32 when requested', async () => {
      mockFetchUsernameRecord.mockResolvedValue({ record: TEST_RECORD, metadata: TEST_METADATA })
      const service = createService()
      const addr = await service.resolve('pseudo', { format: 'bech32' })
      expect(addr).toMatch(/^init1/)
    })
  })

  describe('getName', () => {
    it('should resolve address to display name', async () => {
      mockFetchAddressToName.mockResolvedValue('pseudo')
      const service = createService()
      const name = await service.getName(TEST_RECORD.address)
      expect(name).toBe('pseudo.init')
    })

    it('should return undefined when no primary name', async () => {
      mockFetchAddressToName.mockResolvedValue(null)
      const service = createService()
      expect(await service.getName(TEST_RECORD.address)).toBeUndefined()
    })
  })

  describe('getRecord', () => {
    it('should return full record', async () => {
      mockFetchUsernameRecord.mockResolvedValue({ record: TEST_RECORD, metadata: TEST_METADATA })
      const service = createService()
      const record = await service.getRecord('pseudo')
      expect(record).toEqual(TEST_RECORD)
    })
  })

  describe('getMetadata', () => {
    it('should return metadata via getRecord', async () => {
      mockFetchUsernameRecord.mockResolvedValue({ record: TEST_RECORD, metadata: TEST_METADATA })
      const service = createService()
      const meta = await service.getMetadata('pseudo')
      expect(meta).toEqual(TEST_METADATA)
    })
  })

  describe('getImageUrl', () => {
    it('should return image URL', () => {
      const service = createService()
      expect(service.getImageUrl('Pseudo')).toBe('https://usernames-api.initia.xyz/image/pseudo')
    })
  })

  describe('isAvailable', () => {
    it('should return true when name is not found', async () => {
      mockFetchNameToAddress.mockResolvedValue(null)
      const service = createService()
      expect(await service.isAvailable('available-name')).toBe(true)
    })

    it('should return false when name is taken', async () => {
      mockFetchNameToAddress.mockResolvedValue('0xabc')
      const service = createService()
      expect(await service.isAvailable('taken-name')).toBe(false)
    })
  })

  describe('caching', () => {
    it('should cache getRecord results', async () => {
      mockFetchUsernameRecord.mockResolvedValue({ record: TEST_RECORD, metadata: TEST_METADATA })
      const service = createService()

      await service.getRecord('pseudo')
      await service.getRecord('pseudo')

      expect(mockFetchUsernameRecord).toHaveBeenCalledTimes(1)
    })

    it('should skip cache when skipCache is true', async () => {
      mockFetchUsernameRecord.mockResolvedValue({ record: TEST_RECORD, metadata: TEST_METADATA })
      const service = createService()

      await service.getRecord('pseudo')
      await service.getRecord('pseudo', { skipCache: true })

      expect(mockFetchUsernameRecord).toHaveBeenCalledTimes(2)
    })

    it('should not cache when cacheTtl is 0', async () => {
      mockFetchUsernameRecord.mockResolvedValue({ record: TEST_RECORD, metadata: TEST_METADATA })
      const service = createService()

      await service.getRecord('pseudo', { cacheTtl: 0 })
      await service.getRecord('pseudo', { cacheTtl: 0 })

      // First call: no cache → fetch. Second call: skipCache not set but ttl=0 prevented caching → fetch again
      expect(mockFetchUsernameRecord).toHaveBeenCalledTimes(2)
    })

    it('should cache getName results', async () => {
      mockFetchAddressToName.mockResolvedValue('pseudo')
      const service = createService()

      await service.getName(TEST_RECORD.address)
      await service.getName(TEST_RECORD.address)

      expect(mockFetchAddressToName).toHaveBeenCalledTimes(1)
    })

    it('should not cache getName null results', async () => {
      mockFetchAddressToName.mockResolvedValue(null)
      const service = createService()

      await service.getName(TEST_RECORD.address)
      await service.getName(TEST_RECORD.address)

      // null is never cached → 2 API calls
      expect(mockFetchAddressToName).toHaveBeenCalledTimes(2)
    })
  })

  describe('deduplication', () => {
    it('should deduplicate concurrent getRecord calls', async () => {
      mockFetchUsernameRecord.mockImplementation(
        () =>
          new Promise(resolve =>
            setTimeout(() => resolve({ record: TEST_RECORD, metadata: TEST_METADATA }), 50)
          )
      )
      const service = createService()

      const [r1, r2] = await Promise.all([service.getRecord('pseudo'), service.getRecord('pseudo')])

      expect(r1).toEqual(TEST_RECORD)
      expect(r2).toEqual(TEST_RECORD)
      expect(mockFetchUsernameRecord).toHaveBeenCalledTimes(1)
    })

    it('should deduplicate concurrent getName calls', async () => {
      mockFetchAddressToName.mockImplementation(
        () => new Promise(resolve => setTimeout(() => resolve('pseudo'), 50))
      )
      const service = createService()

      const [n1, n2] = await Promise.all([
        service.getName(TEST_RECORD.address),
        service.getName(TEST_RECORD.address),
      ])

      expect(n1).toBe('pseudo.init')
      expect(n2).toBe('pseudo.init')
      expect(mockFetchAddressToName).toHaveBeenCalledTimes(1)
    })
  })

  describe('invalidation', () => {
    it('should invalidate cache by name', async () => {
      mockFetchUsernameRecord.mockResolvedValue({ record: TEST_RECORD, metadata: TEST_METADATA })
      const service = createService()

      await service.getRecord('pseudo')
      service.invalidateCache('pseudo')
      await service.getRecord('pseudo')

      expect(mockFetchUsernameRecord).toHaveBeenCalledTimes(2)
    })

    it('should clear all cache', async () => {
      mockFetchUsernameRecord.mockResolvedValue({ record: TEST_RECORD, metadata: TEST_METADATA })
      mockFetchAddressToName.mockResolvedValue('pseudo')
      const service = createService()

      await service.getRecord('pseudo')
      await service.getName(TEST_RECORD.address)
      service.clearCache()
      await service.getRecord('pseudo')
      await service.getName(TEST_RECORD.address)

      expect(mockFetchUsernameRecord).toHaveBeenCalledTimes(2)
      expect(mockFetchAddressToName).toHaveBeenCalledTimes(2)
    })
  })

  describe('getKnownNames', () => {
    it('should return known names from cache', async () => {
      mockFetchUsernameRecord.mockResolvedValue({ record: TEST_RECORD, metadata: TEST_METADATA })
      const service = createService()

      await service.getRecord('pseudo')
      const names = service.getKnownNames(TEST_RECORD.address)
      expect(names).toContain('pseudo.init')
    })

    it('should return empty for unknown address', () => {
      const service = createService()
      expect(service.getKnownNames('0xunknown')).toEqual([])
    })
  })
})
