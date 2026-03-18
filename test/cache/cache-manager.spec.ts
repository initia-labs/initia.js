// test/cache/cache-manager.spec.ts
import { describe, it, expect, beforeEach } from 'vitest'
import { createCacheManager, type CacheManager } from '../../src/cache/cache-manager'
import {
  cacheKeys,
  pendingKeys,
  normalizeMoveAddress,
  normalizeEvmAddress,
} from '../../src/cache/keys'

const TEST_CHAIN_ID = 'initiation-2'

// =============================================================================
// normalizeMoveAddress Tests
// =============================================================================

describe('normalizeMoveAddress', () => {
  it('should pad short addresses to 64 hex chars', () => {
    expect(normalizeMoveAddress('0x1')).toBe(
      '0x0000000000000000000000000000000000000000000000000000000000000001'
    )
  })

  it('should lowercase addresses', () => {
    expect(normalizeMoveAddress('0xABC')).toBe(
      '0x0000000000000000000000000000000000000000000000000000000000000abc'
    )
  })

  it('should handle full-length addresses', () => {
    const full = '0x' + '1'.repeat(64)
    expect(normalizeMoveAddress(full)).toBe(full.toLowerCase())
  })

  it('should handle addresses without 0x prefix', () => {
    expect(normalizeMoveAddress('1')).toBe(
      '0x0000000000000000000000000000000000000000000000000000000000000001'
    )
  })

  it('should handle mixed case', () => {
    expect(normalizeMoveAddress('0xAbCdEf')).toBe(
      '0x0000000000000000000000000000000000000000000000000000000000abcdef'
    )
  })

  it('should handle uppercase 0X prefix', () => {
    expect(normalizeMoveAddress('0X1')).toBe(
      '0x0000000000000000000000000000000000000000000000000000000000000001'
    )
  })

  // Input validation tests
  describe('input validation', () => {
    it('should throw on empty address', () => {
      expect(() => normalizeMoveAddress('')).toThrow(
        "Validation failed for 'address': Cannot be empty"
      )
    })

    it('should throw on only 0x prefix', () => {
      expect(() => normalizeMoveAddress('0x')).toThrow(
        "Validation failed for 'address': Cannot be empty (only 0x prefix)"
      )
    })

    it('should throw on invalid hex characters', () => {
      expect(() => normalizeMoveAddress('0xGHIJ')).toThrow(
        "Validation failed for 'address': Invalid hex characters"
      )
    })

    it('should throw on non-hex characters', () => {
      expect(() => normalizeMoveAddress('0xabc_xyz')).toThrow(
        "Validation failed for 'address': Invalid hex characters"
      )
    })

    it('should throw on address exceeding 64 hex chars', () => {
      const tooLong = '0x' + '1'.repeat(65)
      expect(() => normalizeMoveAddress(tooLong)).toThrow('Move address exceeds 64 hex chars')
    })
  })
})

// =============================================================================
// normalizeEvmAddress Tests
// =============================================================================

describe('normalizeEvmAddress', () => {
  it('should lowercase EVM address', () => {
    const addr = '0x' + 'aB'.repeat(20)
    expect(normalizeEvmAddress(addr)).toBe('0x' + 'ab'.repeat(20))
  })

  it('should preserve already lowercase addresses', () => {
    const addr = '0x' + 'ab'.repeat(20)
    expect(normalizeEvmAddress(addr)).toBe(addr)
  })

  it('should handle mixed case addresses', () => {
    expect(normalizeEvmAddress('0xAbCdEf1234567890AbCdEf1234567890AbCdEf12')).toBe(
      '0xabcdef1234567890abcdef1234567890abcdef12'
    )
  })

  // Input validation tests
  describe('input validation', () => {
    it('should throw on empty address', () => {
      expect(() => normalizeEvmAddress('')).toThrow(
        "Validation failed for 'address': Cannot be empty"
      )
    })

    it('should throw on only 0x prefix', () => {
      expect(() => normalizeEvmAddress('0x')).toThrow(
        "Validation failed for 'address': Cannot be empty (only 0x prefix)"
      )
    })

    it('should throw on invalid hex characters', () => {
      const invalidAddr = '0x' + 'GH'.repeat(20)
      expect(() => normalizeEvmAddress(invalidAddr)).toThrow(
        "Validation failed for 'address': Invalid hex characters"
      )
    })

    it('should throw on address shorter than 40 hex chars', () => {
      const shortAddr = '0x' + 'ab'.repeat(19) // 38 chars
      expect(() => normalizeEvmAddress(shortAddr)).toThrow(
        'EVM address must be exactly 40 hex chars'
      )
    })

    it('should throw on address longer than 40 hex chars', () => {
      const longAddr = '0x' + 'ab'.repeat(21) // 42 chars
      expect(() => normalizeEvmAddress(longAddr)).toThrow(
        'EVM address must be exactly 40 hex chars'
      )
    })
  })
})

// =============================================================================
// cacheKeys Tests
// =============================================================================

describe('cacheKeys', () => {
  describe('moveAbi', () => {
    it('should generate correct key with chainId and normalized address', () => {
      const key = cacheKeys.moveAbi(TEST_CHAIN_ID, '0x1', 'coin')
      expect(key).toBe(
        `${TEST_CHAIN_ID}:move:0x0000000000000000000000000000000000000000000000000000000000000001:coin`
      )
    })

    it('should throw on empty chainId', () => {
      expect(() => cacheKeys.moveAbi('', '0x1', 'coin')).toThrow(
        "Validation failed for 'chainId': Cannot be empty"
      )
    })

    it('should throw on empty module name', () => {
      expect(() => cacheKeys.moveAbi(TEST_CHAIN_ID, '0x1', '')).toThrow(
        "Validation failed for 'module': Cannot be empty"
      )
    })

    it('should throw on invalid address', () => {
      expect(() => cacheKeys.moveAbi(TEST_CHAIN_ID, '', 'coin')).toThrow(
        "Validation failed for 'address': Cannot be empty"
      )
    })
  })

  describe('denomToContract', () => {
    it('should generate correct key with chainId', () => {
      const key = cacheKeys.denomToContract(TEST_CHAIN_ID, 'uinit')
      expect(key).toBe(`${TEST_CHAIN_ID}:d2c:uinit`)
    })

    it('should throw on empty chainId', () => {
      expect(() => cacheKeys.denomToContract('', 'uinit')).toThrow(
        "Validation failed for 'chainId': Cannot be empty"
      )
    })

    it('should throw on empty denom', () => {
      expect(() => cacheKeys.denomToContract(TEST_CHAIN_ID, '')).toThrow(
        "Validation failed for 'denom': Cannot be empty"
      )
    })
  })

  describe('contractToDenom', () => {
    it('should generate correct key with chainId and normalized address', () => {
      const addr = '0x' + 'AB'.repeat(20)
      const key = cacheKeys.contractToDenom(TEST_CHAIN_ID, addr)
      expect(key).toBe(`${TEST_CHAIN_ID}:c2d:0x` + 'ab'.repeat(20))
    })

    it('should throw on empty chainId', () => {
      const addr = '0x' + 'ab'.repeat(20)
      expect(() => cacheKeys.contractToDenom('', addr)).toThrow(
        "Validation failed for 'chainId': Cannot be empty"
      )
    })

    it('should throw on invalid address', () => {
      expect(() => cacheKeys.contractToDenom(TEST_CHAIN_ID, '')).toThrow(
        "Validation failed for 'address': Cannot be empty"
      )
    })
  })
})

// =============================================================================
// pendingKeys Tests
// =============================================================================

describe('pendingKeys', () => {
  it('should generate moveAbi pending key with chainId', () => {
    const key = pendingKeys.moveAbi(TEST_CHAIN_ID, '0x1', 'coin')
    expect(key).toBe(
      `${TEST_CHAIN_ID}:move:0x0000000000000000000000000000000000000000000000000000000000000001:coin`
    )
  })

  it('should generate denomMapping pending key with chainId', () => {
    const key = pendingKeys.denomMapping(TEST_CHAIN_ID, 'uinit')
    expect(key).toBe(`${TEST_CHAIN_ID}:denom:uinit`)
  })

  it('should throw on empty chainId for moveAbi', () => {
    expect(() => pendingKeys.moveAbi('', '0x1', 'coin')).toThrow(
      "Validation failed for 'chainId': Cannot be empty"
    )
  })

  it('should throw on empty chainId for denomMapping', () => {
    expect(() => pendingKeys.denomMapping('', 'uinit')).toThrow(
      "Validation failed for 'chainId': Cannot be empty"
    )
  })
})

// =============================================================================
// CacheManager Tests
// =============================================================================

describe('CacheManager', () => {
  let cache: CacheManager

  beforeEach(() => {
    cache = createCacheManager()
  })

  describe('moveAbi cache', () => {
    it('should store and retrieve objects directly (no JSON serialization)', () => {
      const key = cacheKeys.moveAbi(TEST_CHAIN_ID, '0x1', 'coin')
      const value = { name: 'coin', functions: [] }

      cache.moveAbi.set(key, value)
      const retrieved = cache.moveAbi.get(key)

      // Should be the same object reference (not a JSON copy)
      expect(retrieved).toBe(value)
    })

    it('should return undefined for missing keys', () => {
      expect(cache.moveAbi.get('nonexistent')).toBeUndefined()
    })

    it('should evict LRU entries when full', () => {
      // Fill cache beyond capacity (500)
      for (let i = 0; i < 600; i++) {
        cache.moveAbi.set(`key-${i}`, { index: i })
      }

      // First entries should be evicted
      expect(cache.moveAbi.get('key-0')).toBeUndefined()
      // Recent entries should exist
      expect(cache.moveAbi.get('key-599')).toEqual({ index: 599 })
    })
  })

  describe('denomToContract cache', () => {
    it('should store and retrieve values', () => {
      const key = cacheKeys.denomToContract(TEST_CHAIN_ID, 'uinit')
      const value = '0x' + '1'.repeat(40)

      cache.denomToContract.set(key, value)
      expect(cache.denomToContract.get(key)).toBe(value)
    })
  })

  describe('contractToDenom cache', () => {
    it('should store and retrieve values', () => {
      const key = cacheKeys.contractToDenom(TEST_CHAIN_ID, '0x' + '1'.repeat(40))
      const value = 'uinit'

      cache.contractToDenom.set(key, value)
      expect(cache.contractToDenom.get(key)).toBe(value)
    })
  })

  describe('clear functionality', () => {
    it('should clear specific cache without affecting others', () => {
      cache.moveAbi.set('key1', { value: 1 })
      cache.denomToContract.set('key2', 'value2')
      cache.contractToDenom.set('key3', 'value3')

      cache.moveAbi.clear()

      expect(cache.moveAbi.get('key1')).toBeUndefined()
      expect(cache.denomToContract.get('key2')).toBe('value2')
      expect(cache.contractToDenom.get('key3')).toBe('value3')
    })
  })

  describe('cache independence', () => {
    it('should maintain separate caches', () => {
      // Same key in different caches should not conflict
      cache.moveAbi.set('same-key', { type: 'move' })
      cache.denomToContract.set('same-key', 'denom-value')

      expect(cache.moveAbi.get('same-key')).toEqual({ type: 'move' })
      expect(cache.denomToContract.get('same-key')).toBe('denom-value')
    })
  })
})
