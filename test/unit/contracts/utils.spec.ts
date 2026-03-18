/**
 * Unit tests for contract utility functions.
 */

import { describe, it, expect } from 'vitest'
import { parseUnits, formatUnits } from '../../../src/contracts'

describe('parseUnits', () => {
  it('should parse integer amounts', () => {
    expect(parseUnits('1', 6)).toBe(1000000n)
    expect(parseUnits('100', 6)).toBe(100000000n)
    expect(parseUnits('1', 18)).toBe(1000000000000000000n)
  })

  it('should parse decimal amounts', () => {
    expect(parseUnits('1.5', 6)).toBe(1500000n)
    expect(parseUnits('0.1', 6)).toBe(100000n)
    expect(parseUnits('0.000001', 6)).toBe(1n)
    expect(parseUnits('1.5', 18)).toBe(1500000000000000000n)
  })

  it('should handle zero decimals', () => {
    expect(parseUnits('100', 0)).toBe(100n)
    expect(parseUnits('1', 0)).toBe(1n)
  })

  it('should handle maximum precision', () => {
    expect(parseUnits('0.123456', 6)).toBe(123456n)
    expect(parseUnits('1.123456789012345678', 18)).toBe(1123456789012345678n)
  })

  it('should handle zero', () => {
    expect(parseUnits('0', 6)).toBe(0n)
    expect(parseUnits('0.0', 6)).toBe(0n)
  })
})

describe('formatUnits', () => {
  it('should format integer amounts', () => {
    expect(formatUnits(1000000n, 6)).toBe('1')
    expect(formatUnits(100000000n, 6)).toBe('100')
    expect(formatUnits(1000000000000000000n, 18)).toBe('1')
  })

  it('should format decimal amounts', () => {
    expect(formatUnits(1500000n, 6)).toBe('1.5')
    expect(formatUnits(100000n, 6)).toBe('0.1')
    expect(formatUnits(1n, 6)).toBe('0.000001')
    expect(formatUnits(1500000000000000000n, 18)).toBe('1.5')
  })

  it('should handle zero decimals', () => {
    expect(formatUnits(100n, 0)).toBe('100')
    expect(formatUnits(1n, 0)).toBe('1')
  })

  it('should handle zero value', () => {
    expect(formatUnits(0n, 6)).toBe('0')
    expect(formatUnits(0n, 18)).toBe('0')
  })

  it('should preserve full precision', () => {
    expect(formatUnits(123456n, 6)).toBe('0.123456')
    expect(formatUnits(1123456789012345678n, 18)).toBe('1.123456789012345678')
  })
})
