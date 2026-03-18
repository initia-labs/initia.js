import { describe, it, expect } from 'vitest'
import { formatTokenAmount } from '../../../src/util/amount'

describe('formatTokenAmount', () => {
  describe('basic formatting', () => {
    it('should format with 6 decimals', () => {
      expect(formatTokenAmount('1000000', 6)).toBe('1')
    })

    it('should format with fractional result', () => {
      expect(formatTokenAmount('1500000', 6)).toBe('1.5')
    })

    it('should format with 18 decimals', () => {
      expect(formatTokenAmount('1000000000000000000', 18)).toBe('1')
    })

    it('should format with 0 decimals', () => {
      expect(formatTokenAmount('42', 0)).toBe('42')
    })

    it('should handle zero amount', () => {
      expect(formatTokenAmount('0', 6)).toBe('0')
    })

    it('should handle zero amount with 0 decimals', () => {
      expect(formatTokenAmount('0', 0)).toBe('0')
    })

    it('should handle bigint input', () => {
      expect(formatTokenAmount(1000000n, 6)).toBe('1')
    })

    it('should handle large numbers', () => {
      expect(formatTokenAmount('123456789012345678901234567890', 18)).toBe(
        '123456789012.34567890123456789'
      )
    })
  })

  describe('negative amounts', () => {
    it('should handle negative amount', () => {
      expect(formatTokenAmount('-1500000', 6)).toBe('-1.5')
    })

    it('should handle negative bigint', () => {
      expect(formatTokenAmount(-1000000n, 6)).toBe('-1')
    })
  })

  describe('maxDecimals option', () => {
    it('should truncate to maxDecimals', () => {
      expect(formatTokenAmount('1234567890123456789', 18, { maxDecimals: 4 })).toBe('1.2345')
    })

    it('should not add decimals when maxDecimals exceeds actual', () => {
      expect(formatTokenAmount('1500000', 6, { maxDecimals: 10 })).toBe('1.5')
    })

    it('should handle maxDecimals 0', () => {
      expect(formatTokenAmount('1500000', 6, { maxDecimals: 0 })).toBe('1')
    })
  })

  describe('minDecimals option', () => {
    it('should pad to minDecimals', () => {
      expect(formatTokenAmount('1000000', 6, { minDecimals: 2 })).toBe('1.00')
    })

    it('should pad integer result', () => {
      expect(formatTokenAmount('1000000', 6, { minDecimals: 4 })).toBe('1.0000')
    })

    it('should pad when actual is less than minDecimals', () => {
      // '1.5' has 1 fractional digit, minDecimals: 2 → pad to '1.50'
      expect(formatTokenAmount('1500000', 6, { minDecimals: 2 })).toBe('1.50')
    })
  })

  describe('trimTrailingZeros option', () => {
    it('should trim trailing zeros by default', () => {
      expect(formatTokenAmount('1000000', 6)).toBe('1')
    })

    it('should keep trailing zeros when disabled', () => {
      expect(formatTokenAmount('1000000', 6, { trimTrailingZeros: false })).toBe('1.000000')
    })

    it('should keep trailing zeros with minDecimals', () => {
      // minDecimals pads after trimming
      expect(formatTokenAmount('1000000', 6, { trimTrailingZeros: true, minDecimals: 3 })).toBe(
        '1.000'
      )
    })
  })

  describe('combined options', () => {
    it('should apply maxDecimals and minDecimals together', () => {
      // 1 ETH = '1000000000000000000' (18 dec) → '1' → maxDecimals:4 → '1' → minDecimals:2 → '1.00'
      expect(formatTokenAmount('1000000000000000000', 18, { maxDecimals: 4, minDecimals: 2 })).toBe(
        '1.00'
      )
    })

    it('should truncate then pad', () => {
      // '1.234567' → maxDecimals:4 → '1.2345' → minDecimals:2 → '1.2345' (already > 2)
      expect(formatTokenAmount('1234567', 6, { maxDecimals: 4, minDecimals: 2 })).toBe('1.2345')
    })
  })
})
