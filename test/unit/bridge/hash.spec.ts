/**
 * Unit tests for calculateWithdrawalHash.
 */

import { describe, it, expect } from 'vitest'
import { calculateWithdrawalHash } from '../../../src/bridge/hash'
import { bytesToHex } from '@noble/hashes/utils.js'

describe('calculateWithdrawalHash', () => {
  it('should return a 32-byte Uint8Array', () => {
    const hash = calculateWithdrawalHash(1n, 1n, 'init1sender', 'init1receiver', 'uinit', 1000000n)

    expect(hash).toBeInstanceOf(Uint8Array)
    expect(hash.length).toBe(32)
  })

  it('should be deterministic (same inputs → same hash)', () => {
    const args = [3n, 42n, 'init1abc', 'init1xyz', 'uinit', 1000000n] as const
    const hash1 = calculateWithdrawalHash(...args)
    const hash2 = calculateWithdrawalHash(...args)

    expect(bytesToHex(hash1)).toBe(bytesToHex(hash2))
  })

  it('should produce different hashes for different inputs', () => {
    const hash1 = calculateWithdrawalHash(1n, 1n, 'init1a', 'init1b', 'uinit', 100n)
    const hash2 = calculateWithdrawalHash(1n, 2n, 'init1a', 'init1b', 'uinit', 100n)

    expect(bytesToHex(hash1)).not.toBe(bytesToHex(hash2))
  })

  it('should accept number inputs and produce same hash as bigint', () => {
    const hashBigint = calculateWithdrawalHash(
      1n,
      42n,
      'init1sender',
      'init1receiver',
      'uinit',
      1000000n
    )
    const hashNumber = calculateWithdrawalHash(
      1,
      42,
      'init1sender',
      'init1receiver',
      'uinit',
      1000000
    )
    const hashMixed = calculateWithdrawalHash(
      1,
      42n,
      'init1sender',
      'init1receiver',
      'uinit',
      1000000n
    )

    expect(bytesToHex(hashNumber)).toBe(bytesToHex(hashBigint))
    expect(bytesToHex(hashMixed)).toBe(bytesToHex(hashBigint))
  })

  it('should be sensitive to all parameters', () => {
    const base = [3n, 42n, 'init1sender', 'init1receiver', 'uinit', 1000000n] as const
    const baseHash = bytesToHex(calculateWithdrawalHash(...base))

    // Change each parameter and verify hash changes
    expect(
      bytesToHex(
        calculateWithdrawalHash(4n, 42n, 'init1sender', 'init1receiver', 'uinit', 1000000n)
      )
    ).not.toBe(baseHash)
    expect(
      bytesToHex(
        calculateWithdrawalHash(3n, 43n, 'init1sender', 'init1receiver', 'uinit', 1000000n)
      )
    ).not.toBe(baseHash)
    expect(
      bytesToHex(calculateWithdrawalHash(3n, 42n, 'init1other', 'init1receiver', 'uinit', 1000000n))
    ).not.toBe(baseHash)
    expect(
      bytesToHex(calculateWithdrawalHash(3n, 42n, 'init1sender', 'init1other', 'uinit', 1000000n))
    ).not.toBe(baseHash)
    expect(
      bytesToHex(
        calculateWithdrawalHash(3n, 42n, 'init1sender', 'init1receiver', 'other', 1000000n)
      )
    ).not.toBe(baseHash)
    expect(
      bytesToHex(calculateWithdrawalHash(3n, 42n, 'init1sender', 'init1receiver', 'uinit', 999999n))
    ).not.toBe(baseHash)
  })
})
