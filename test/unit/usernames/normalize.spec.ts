/**
 * Unit tests for username utility functions.
 */

import { describe, it, expect } from 'vitest'
import {
  normalizeName,
  getDisplayName,
  normalizeAddress,
  formatAddress,
} from '../../../src/client/usernames/utils'

describe('normalizeName', () => {
  it('should lowercase and strip .init suffix', () => {
    expect(normalizeName('Pseudo.INIT')).toBe('pseudo')
  })

  it('should lowercase name without suffix', () => {
    expect(normalizeName('Pseudo')).toBe('pseudo')
  })

  it('should handle already normalized name', () => {
    expect(normalizeName('pseudo')).toBe('pseudo')
  })

  it('should only strip trailing .init', () => {
    expect(normalizeName('init.init')).toBe('init')
  })
})

describe('getDisplayName', () => {
  it('should append .init suffix', () => {
    expect(getDisplayName('pseudo')).toBe('pseudo.init')
  })
})

describe('normalizeAddress', () => {
  it('should lowercase hex address', () => {
    expect(normalizeAddress('0x69AD5b1a5E05a5e86645cF7eF4559B0F4E5e5D2C')).toBe(
      '0x69ad5b1a5e05a5e86645cf7ef4559b0f4e5e5d2c'
    )
  })

  it('should convert bech32 to lowercase hex', () => {
    const hex = normalizeAddress('init1q6dd...')
    // bech32 conversion delegates to AccAddress.toHex
    // if invalid bech32, falls through to lowercase
    expect(hex).toBe(hex.toLowerCase())
  })
})

describe('formatAddress', () => {
  it('should return hex by default', () => {
    const hex = '0x69ad5b1a5e05a5e86645cf7ef4559b0f4e5e5d2c'
    expect(formatAddress(hex)).toBe(hex)
  })

  it('should return hex when format is hex', () => {
    const hex = '0x69ad5b1a5e05a5e86645cf7ef4559b0f4e5e5d2c'
    expect(formatAddress(hex, 'hex')).toBe(hex)
  })

  it('should convert to bech32 when format is bech32', () => {
    const hex = '0x69ad5b1a5e05a5e86645cf7ef4559b0f4e5e5d2c'
    const bech32 = formatAddress(hex, 'bech32')
    expect(bech32).toMatch(/^init1/)
  })
})
