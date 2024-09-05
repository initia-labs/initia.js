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
})
