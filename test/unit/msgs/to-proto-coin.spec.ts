/**
 * I1: Unit tests for toProtoCoin validation.
 */

import { describe, it, expect } from 'vitest'
import { toProtoCoin, toProtoCoins } from '../../../src/msgs/types'
import { coin } from '../../../src/core/coin'
import { ValidationError } from '../../../src/errors'

describe('toProtoCoin', () => {
  it('should convert a valid Coin', () => {
    const result = toProtoCoin(coin('uinit', '1000'))
    expect(result.denom).toBe('uinit')
    expect(result.amount).toBe('1000')
  })

  it('should convert numeric amount to string', () => {
    const result = toProtoCoin({ denom: 'uinit', amount: 500 } as never)
    expect(result.amount).toBe('500')
  })

  it('should throw for null input', () => {
    expect(() => toProtoCoin(null as never)).toThrow(ValidationError)
    expect(() => toProtoCoin(null as never)).toThrow('Expected a Coin object')
  })

  it('should throw for undefined input', () => {
    expect(() => toProtoCoin(undefined as never)).toThrow(ValidationError)
  })

  it('should throw for empty denom', () => {
    expect(() => toProtoCoin({ denom: '', amount: '100' } as never)).toThrow(ValidationError)
    expect(() => toProtoCoin({ denom: '', amount: '100' } as never)).toThrow('non-empty "denom"')
  })

  it('should throw for missing denom', () => {
    expect(() => toProtoCoin({ amount: '100' } as never)).toThrow(ValidationError)
  })

  it('should throw for missing amount', () => {
    expect(() => toProtoCoin({ denom: 'uinit' } as never)).toThrow(ValidationError)
    expect(() => toProtoCoin({ denom: 'uinit' } as never)).toThrow('"amount"')
  })

  it('should throw for NaN amount (I4)', () => {
    expect(() => toProtoCoin({ denom: 'uinit', amount: NaN } as never)).toThrow(ValidationError)
    expect(() => toProtoCoin({ denom: 'uinit', amount: NaN } as never)).toThrow(
      'non-negative safe integer'
    )
  })

  it('should throw for object amount (I4)', () => {
    expect(() => toProtoCoin({ denom: 'uinit', amount: {} } as never)).toThrow(ValidationError)
  })

  it('should throw for array amount (I4)', () => {
    expect(() => toProtoCoin({ denom: 'uinit', amount: [] } as never)).toThrow(ValidationError)
  })

  it('should throw for negative amount', () => {
    expect(() => toProtoCoin({ denom: 'uinit', amount: '-100' } as never)).toThrow(ValidationError)
    expect(() => toProtoCoin({ denom: 'uinit', amount: '-100' } as never)).toThrow(
      'non-negative integer'
    )
  })

  it('should throw for decimal amount', () => {
    expect(() => toProtoCoin({ denom: 'uinit', amount: '1.5' } as never)).toThrow(ValidationError)
  })

  it('should throw for Infinity amount', () => {
    expect(() => toProtoCoin({ denom: 'uinit', amount: Infinity } as never)).toThrow(
      ValidationError
    )
  })
})

describe('toProtoCoins', () => {
  it('should return empty array for undefined', () => {
    expect(toProtoCoins(undefined)).toEqual([])
  })

  it('should wrap single coin in array', () => {
    const result = toProtoCoins(coin('uinit', '100'))
    expect(result).toHaveLength(1)
    expect(result[0].denom).toBe('uinit')
  })

  it('should convert array of coins', () => {
    const result = toProtoCoins([coin('uinit', '100'), coin('uatom', '200')])
    expect(result).toHaveLength(2)
    expect(result[0].denom).toBe('uinit')
    expect(result[1].denom).toBe('uatom')
  })
})
