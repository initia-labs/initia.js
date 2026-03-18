import { describe, it, expect } from 'vitest'
import { convertDenomAmount } from '../../../src/provider/utils'

describe('convertDenomAmount', () => {
  describe('no conversion (exponentDiff === 0)', () => {
    it('should return amount unchanged', () => {
      expect(convertDenomAmount('1000000', 0)).toBe('1000000')
    })

    it('should return decimal unchanged', () => {
      expect(convertDenomAmount('1.5', 0)).toBe('1.5')
    })
  })

  describe('larger to smaller unit (exponentDiff > 0)', () => {
    it('should convert INIT to uinit', () => {
      expect(convertDenomAmount('1', 6)).toBe('1000000')
    })

    it('should convert with decimal input', () => {
      expect(convertDenomAmount('1.5', 6)).toBe('1500000')
    })

    it('should handle zero', () => {
      expect(convertDenomAmount('0', 6)).toBe('0')
    })

    it('should handle negative', () => {
      expect(convertDenomAmount('-1.5', 6)).toBe('-1500000')
    })

    it('should handle large exponent diff (18 decimals)', () => {
      expect(convertDenomAmount('1', 18)).toBe('1000000000000000000')
    })
  })

  describe('smaller to larger unit (exponentDiff < 0)', () => {
    it('should convert uinit to INIT', () => {
      expect(convertDenomAmount('1500000', -6)).toBe('1.5')
    })

    it('should preserve precision', () => {
      expect(convertDenomAmount('500', -6)).toBe('0.0005')
    })

    it('should handle zero', () => {
      expect(convertDenomAmount('0', -6)).toBe('0')
    })

    it('should handle negative', () => {
      expect(convertDenomAmount('-1500000', -6)).toBe('-1.5')
    })

    it('should handle exact conversion', () => {
      expect(convertDenomAmount('1000000', -6)).toBe('1')
    })
  })

  describe('edge cases', () => {
    it('should handle very large numbers', () => {
      expect(convertDenomAmount('999999999999999999', -18)).toBe('0.999999999999999999')
    })

    it('should handle excess decimals via truncation', () => {
      // parseUnits truncates excess decimals (safer for blockchain amounts)
      const result = convertDenomAmount('1.1234567', 6)
      expect(result).toBe('1123456')
    })
  })
})
