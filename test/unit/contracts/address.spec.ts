/**
 * Unit tests for EVM address utilities.
 */

import { describe, it, expect } from 'vitest'
import { AccAddress, isValidEvmAddress, toChecksumAddress } from '../../../src/util'

describe('EVM Address Utilities', () => {
  describe('isValidEvmAddress', () => {
    it('should return true for valid EVM addresses', () => {
      expect(isValidEvmAddress('0x1234567890123456789012345678901234567890')).toBe(true)
      // viem's isAddress is strict about checksum for mixed case
      expect(isValidEvmAddress('0xabcdef0123456789abcdef0123456789abcdef01')).toBe(true)
    })

    it('should return true for checksummed addresses', () => {
      expect(isValidEvmAddress('0x5aAeb6053F3E94C9b9A09f33669435E7Ef1BeAed')).toBe(true)
    })

    it('should return false for invalid addresses', () => {
      // Too short
      expect(isValidEvmAddress('0x1234')).toBe(false)
      // Too long
      expect(isValidEvmAddress('0x12345678901234567890123456789012345678901234')).toBe(false)
      // Missing 0x prefix
      expect(isValidEvmAddress('1234567890123456789012345678901234567890')).toBe(false)
      // Invalid characters
      expect(isValidEvmAddress('0xGGGG567890123456789012345678901234567890')).toBe(false)
    })

    it('should return false for bech32 addresses', () => {
      expect(isValidEvmAddress('init1qqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqpqr5e3d')).toBe(false)
    })
  })

  describe('toChecksumAddress', () => {
    it('should convert to EIP-55 checksum format', () => {
      const address = '0x5aaeb6053f3e94c9b9a09f33669435e7ef1beaed'
      const checksummed = toChecksumAddress(address)
      expect(checksummed).toBe('0x5aAeb6053F3E94C9b9A09f33669435E7Ef1BeAed')
    })

    it('should preserve already checksummed address', () => {
      const address = '0x5aAeb6053F3E94C9b9A09f33669435E7Ef1BeAed'
      const result = toChecksumAddress(address)
      expect(result).toBe(address)
    })

    it('should convert all lowercase address', () => {
      const address = '0xfb6916095ca1df60bb79ce92ce3ea74c37c5d359'
      const result = toChecksumAddress(address)
      // Verify it has mixed case (checksummed)
      expect(result).not.toBe(address.toLowerCase())
      expect(result.toLowerCase()).toBe(address.toLowerCase())
    })

    it('should throw for invalid address', () => {
      expect(() => toChecksumAddress('0x1234')).toThrow()
      expect(() => toChecksumAddress('not-an-address')).toThrow()
    })
  })
})

describe('AccAddress EVM integration', () => {
  describe('fromHex', () => {
    it('should convert hex address to bech32 with default prefix', () => {
      const hex = '0x1234567890123456789012345678901234567890'
      const bech32 = AccAddress.fromHex(hex)
      expect(bech32.startsWith('init1')).toBe(true)
    })

    it('should convert hex address with custom prefix', () => {
      const hex = '0x1234567890123456789012345678901234567890'
      const bech32 = AccAddress.fromHex(hex, { prefix: 'noble' })
      expect(bech32.startsWith('noble1')).toBe(true)
    })

    it('should convert hex address using chainInfo', () => {
      const hex = '0x1234567890123456789012345678901234567890'
      const chainInfo = {
        bech32Prefix: 'cosmos',
        chainType: 'initia' as const,
      }
      const bech32 = AccAddress.fromHex(hex, { chainInfo })
      expect(bech32.startsWith('cosmos1')).toBe(true)
    })

    it('should prefer explicit prefix over chainInfo', () => {
      const hex = '0x1234567890123456789012345678901234567890'
      const bech32 = AccAddress.fromHex(hex, {
        prefix: 'noble',
        chainInfo: { bech32Prefix: 'cosmos', chainType: 'initia' as const },
      })
      expect(bech32.startsWith('noble1')).toBe(true)
    })

    it('should handle hex without 0x prefix', () => {
      const hex = '1234567890123456789012345678901234567890'
      const bech32 = AccAddress.fromHex(hex)
      expect(bech32.startsWith('init1')).toBe(true)
    })

    it('should handle Move addresses with leading zeros', () => {
      // Address 0x1 gets padded to 20 bytes (standard EVM address length)
      const hex = '0x1'
      const bech32 = AccAddress.fromHex(hex)
      expect(bech32.startsWith('init1')).toBe(true)
      // Should roundtrip correctly
      const backToHex = AccAddress.toHex(bech32)
      expect(backToHex).toBe('0x0000000000000000000000000000000000000001')
    })

    it('should handle full 32-byte Move addresses', () => {
      // Use a hex that's > 40 chars to trigger 64-char padding
      const hex = '0x0102030405060708091011121314151617181920212223242526272829303132'
      const bech32 = AccAddress.fromHex(hex)
      expect(bech32.startsWith('init1')).toBe(true)
      // 32-byte addresses have 63 character length
      expect(bech32.length).toBe(63)
    })
  })

  describe('toHex', () => {
    it('should convert bech32 to hex', () => {
      const bech32 = 'init1qqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqpqr5e3d'
      const hex = AccAddress.toHex(bech32)
      expect(hex.startsWith('0x')).toBe(true)
      expect(hex.length).toBe(42) // 0x + 40 hex chars
    })

    it('should roundtrip correctly', () => {
      const originalHex = '0x1234567890123456789012345678901234567890'
      const bech32 = AccAddress.fromHex(originalHex)
      const resultHex = AccAddress.toHex(bech32)
      expect(resultHex.toLowerCase()).toBe(originalHex.toLowerCase())
    })
  })

  describe('isValidBech32', () => {
    it('should return true for valid init address', () => {
      expect(AccAddress.isValidBech32('init1qqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqpqr5e3d')).toBe(true)
    })

    it('should return true for valid address with custom prefix', () => {
      // Generate a valid noble address from hex
      const hex = '0x1234567890123456789012345678901234567890'
      const nobleAddr = AccAddress.fromHex(hex, { prefix: 'noble' })
      expect(AccAddress.isValidBech32(nobleAddr, 'noble')).toBe(true)
    })

    it('should return false for wrong prefix', () => {
      expect(AccAddress.isValidBech32('noble1qqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqq9f9yte', 'init')).toBe(
        false
      )
    })

    it('should return false for invalid bech32', () => {
      expect(AccAddress.isValidBech32('not-a-bech32-address')).toBe(false)
      expect(AccAddress.isValidBech32('')).toBe(false)
    })
  })
})
