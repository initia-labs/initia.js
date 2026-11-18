import { describe, it, expect } from 'vitest'
import { bcs } from './bcs'

describe('bcs', () => {
  it('bignumber test', () => {
    let biguint = 0n
    const sampleBytes = [1, 2, 4, 8, 16, 32, 64, 128, 255]
    const num = 0xff8040201008040201n
    for (let i = sampleBytes.length - 1; i >= 0; i--) {
      biguint = (biguint << 8n) + BigInt(sampleBytes[i])
    }

    expect(bcs.biguint().serialize(biguint).toBytes()).toEqual(
      bcs.vector(bcs.u8()).serialize(sampleBytes).toBytes()
    )

    expect(
      bcs.biguint().parse(bcs.biguint().serialize(biguint).toBytes())
    ).toEqual(num)

    const bigdecimal = '123.123456789012345678'

    expect(bcs.bigdecimal().serialize(bigdecimal).toBytes()).toEqual(
      bcs.biguint().serialize(bigdecimal.replace('.', '')).toBytes()
    )

    expect(
      bcs.bigdecimal().parse(bcs.bigdecimal().serialize(bigdecimal).toBytes())
    ).toEqual(Number(bigdecimal))
  })

  it.each([
    '0x1',
    `0x${'0'.repeat(63)}1`,
    'init1qqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqpqr5e3d',
  ])('serializes %s to the 0x1 address', (address) => {
    const address0x1 = new Uint8Array([...new Array(31).fill(0), 1])
    expect(bcs.address().serialize(address).toBytes()).toEqual(address0x1)
  })

  it('serializes an uppercase hex address', () => {
    const expected = new Uint8Array([
      ...new Array(29).fill(0),
      0xab,
      0xcd,
      0xef,
    ])
    expect(bcs.address().serialize('0xABCDEF').toBytes()).toEqual(expected)
  })

  it('rejects a long non-hex address without quadratic backtracking', () => {
    const input = `0x${'a'.repeat(100000)}z`
    const startedAt = performance.now()

    expect(() => bcs.address().serialize(input)).toThrow('invalid address')
    expect(performance.now() - startedAt).toBeLessThan(1000)
  })
})
