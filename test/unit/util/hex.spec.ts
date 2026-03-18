/**
 * Unit tests for hexToBytes utility.
 */

import { describe, it, expect } from 'vitest'
import { hexToBytes } from '../../../src/util/hex'
import { ValidationError } from '../../../src/errors'

describe('hexToBytes', () => {
  it('should convert valid hex string to bytes', () => {
    expect(hexToBytes('0102030405')).toEqual(new Uint8Array([1, 2, 3, 4, 5]))
  })

  it('should handle 0x prefix', () => {
    expect(hexToBytes('0x0a0b0c')).toEqual(new Uint8Array([10, 11, 12]))
  })

  it('should handle uppercase hex', () => {
    expect(hexToBytes('0xFF')).toEqual(new Uint8Array([255]))
  })

  it('should handle empty string', () => {
    expect(hexToBytes('')).toEqual(new Uint8Array([]))
  })

  it('should handle 0x only', () => {
    expect(hexToBytes('0x')).toEqual(new Uint8Array([]))
  })

  it('should throw ValidationError for odd-length hex', () => {
    expect(() => hexToBytes('0x123')).toThrow(ValidationError)
    expect(() => hexToBytes('0x123')).toThrow('Odd-length hex string')
  })

  it('should throw ValidationError for invalid hex characters', () => {
    expect(() => hexToBytes('0xGG')).toThrow(ValidationError)
    expect(() => hexToBytes('0xGG')).toThrow('Invalid hex characters')
  })
})
