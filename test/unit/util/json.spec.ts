import { describe, it, expect } from 'vitest'
import { jsonStringifyArg } from '../../../src/util/json'

describe('jsonStringifyArg', () => {
  it('bigint produces quoted string', () => {
    expect(jsonStringifyArg(1000000n)).toBe('"1000000"')
  })

  it('0n produces quoted zero', () => {
    expect(jsonStringifyArg(0n)).toBe('"0"')
  })

  it('large u128 bigint produces correct decimal string', () => {
    const large = 340282366920938463463374607431768211455n
    expect(jsonStringifyArg(large)).toBe(`"${large.toString()}"`)
  })

  it('string passes through JSON.stringify', () => {
    expect(jsonStringifyArg('hello')).toBe('"hello"')
  })

  it('number passes through JSON.stringify', () => {
    expect(jsonStringifyArg(42)).toBe('42')
  })

  it('null produces null', () => {
    expect(jsonStringifyArg(null)).toBe('null')
  })

  it('boolean produces bare value', () => {
    expect(jsonStringifyArg(true)).toBe('true')
  })

  it('undefined throws', () => {
    expect(() => jsonStringifyArg(undefined)).toThrow('Cannot serialize undefined')
  })

  it('NaN throws', () => {
    expect(() => jsonStringifyArg(NaN)).toThrow('NaN and Infinity')
  })

  it('Infinity throws', () => {
    expect(() => jsonStringifyArg(Infinity)).toThrow('NaN and Infinity')
  })
})
