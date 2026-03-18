/**
 * Unit tests for username cache.
 */

import { describe, it, expect, beforeEach } from 'vitest'
import {
  createUsernameCache,
  calculateEffectiveTtl,
  CACHE_TTL,
} from '../../../src/client/usernames/cache'

describe('calculateEffectiveTtl', () => {
  it('should return defaultTtl when no expiresAt', () => {
    expect(calculateEffectiveTtl(60_000, undefined)).toBe(60_000)
  })

  it('should return 0 when already expired', () => {
    const past = Date.now() - 1000
    expect(calculateEffectiveTtl(60_000, past)).toBe(0)
  })

  it('should return min of defaultTtl and time until expiry', () => {
    const soon = Date.now() + 10_000
    expect(calculateEffectiveTtl(60_000, soon)).toBeLessThanOrEqual(10_000)
  })

  it('should return defaultTtl when expiry is far away', () => {
    const far = Date.now() + 1_000_000
    expect(calculateEffectiveTtl(60_000, far)).toBe(60_000)
  })
})

describe('CACHE_TTL', () => {
  it('should have DEFAULT of 60s', () => {
    expect(CACHE_TTL.DEFAULT).toBe(60_000)
  })
})

describe('createUsernameCache', () => {
  const record = {
    name: 'pseudo',
    address: '0x69ad5b1a5e05a5e86645cf7ef4559b0f4e5e5d2c',
    expiresAt: Date.now() + 3_600_000,
  }
  const metadata = { name: 'pseudo', description: '', image: '', image_data: '', attributes: [] }

  let cache: ReturnType<typeof createUsernameCache>

  beforeEach(() => {
    cache = createUsernameCache()
  })

  describe('byName', () => {
    it('should return undefined for unknown name', () => {
      expect(cache.getByName('unknown')).toBeUndefined()
    })

    it('should store and retrieve by name', () => {
      cache.setByName(record, metadata)
      const entry = cache.getByName('pseudo')
      expect(entry).toBeDefined()
      expect(entry!.record.name).toBe('pseudo')
      expect(entry!.metadata).toBe(metadata)
    })

    it('should normalize name on lookup', () => {
      cache.setByName(record)
      expect(cache.getByName('Pseudo')).toBeDefined()
      expect(cache.getByName('pseudo.init')).toBeDefined() // normalizeName strips .init → matches 'pseudo'
    })

    it('should not cache expired records', () => {
      const expired = { ...record, expiresAt: Date.now() - 1000 }
      cache.setByName(expired)
      expect(cache.getByName('pseudo')).toBeUndefined()
    })
  })

  describe('byAddress', () => {
    it('should return undefined for unknown address', () => {
      expect(cache.getPrimaryByAddress('0xabcd')).toBeUndefined()
    })

    it('should store and retrieve primary by address', () => {
      cache.setPrimaryByAddress(record.address, 'pseudo')
      expect(cache.getPrimaryByAddress(record.address)).toBe('pseudo')
    })

    it('should store null primary (no username found)', () => {
      cache.setPrimaryByAddress(record.address, null)
      expect(cache.getPrimaryByAddress(record.address)).toBeNull()
    })
  })

  describe('knownNames', () => {
    it('should return empty for unknown address', () => {
      expect(cache.getKnownNames('0xabcd')).toEqual([])
    })

    it('should track names through setByName', () => {
      cache.setByName(record)
      const names = cache.getKnownNames(record.address)
      expect(names).toContain('pseudo')
    })

    it('should lazy-clean stale references', () => {
      cache.setByName(record)
      // Invalidate byName but leave byAddress reference
      cache.invalidateByName('pseudo')
      // getKnownNames should remove stale reference
      expect(cache.getKnownNames(record.address)).toEqual([])
    })
  })

  describe('invalidation', () => {
    it('should invalidate by name', () => {
      cache.setByName(record)
      cache.invalidateByName('pseudo')
      expect(cache.getByName('pseudo')).toBeUndefined()
    })

    it('should invalidate by address (clears related names)', () => {
      cache.setByName(record)
      cache.setPrimaryByAddress(record.address, 'pseudo')
      cache.invalidateByAddress(record.address)
      expect(cache.getPrimaryByAddress(record.address)).toBeUndefined()
      expect(cache.getByName('pseudo')).toBeUndefined()
    })

    it('should clear all', () => {
      cache.setByName(record)
      cache.setPrimaryByAddress(record.address, 'pseudo')
      cache.clear()
      expect(cache.getByName('pseudo')).toBeUndefined()
      expect(cache.getPrimaryByAddress(record.address)).toBeUndefined()
    })
  })
})
