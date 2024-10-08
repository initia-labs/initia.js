import { BcsTypeOptions, bcs as mystenBcs } from '@mysten/bcs'
import { AccAddress, BigNumber, num } from '../core'
import { hexFromBytes, bytesFromHex } from './polyfill'

const initiaAddress = (
  options?: BcsTypeOptions<Uint8Array, Iterable<number>>
) =>
  mystenBcs.bytes(32, options).transform({
    input: (val: string) => {
      if (val.startsWith('init1')) {
        val = AccAddress.toHex(val)
      }

      if (val.startsWith('0x')) {
        val = val.slice(2).padStart(64, '0')
      }

      if (!val.match(/[0-9a-f]+$/i)) {
        throw new Error('invalid address')
      }

      return bytesFromHex(val)
    },
    output: (val) => `0x${hexFromBytes(val)}`,
  })

// initia specific types
const initiaBcs = {
  /**
   * Creates a BcsType that can be used to read and write an address.
   * @example
   * bcs.address().serialize('0x1') // in hex
   * bcs.address().serialize('init1qqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqpqr5e3d') // in bech32
   */
  address: initiaAddress,

  /**
   * Creates a BcsType that can be used to read and write an object.
   * @example
   * bcs.object().serialize('0x1') // in hex
   * bcs.object().serialize('init1qqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqpqr5e3d') // in bech32
   */
  object: initiaAddress,

  /**
   * Creates a BcsType that can be used to read and write a fixed_point32.
   * @example
   * bcs.fixed_point32().serialize('1.23')
   */
  fixed_point32: (options?: BcsTypeOptions<string, string | number | bigint>) =>
    mystenBcs.u64(options).transform({
      input: (val: number | string) => {
        const n = num(val).times(new BigNumber('4294967296'))

        return n.toFixed(0, BigNumber.ROUND_DOWN)
      },
      output: (val) => num(val).div(new BigNumber('4294967296')).toNumber(),
    }),

  /**
   * Creates a BcsType that can be used to read and write a fixed_point64.
   * @example
   * bcs.fixed_point64().serialize('1.23')
   */
  fixed_point64: (options?: BcsTypeOptions<string, string | number | bigint>) =>
    mystenBcs.u128(options).transform({
      input: (val: number | string) => {
        const n = num(val).times(new BigNumber('18446744073709551616'))

        return n.toFixed(0, BigNumber.ROUND_DOWN)
      },
      output: (val) =>
        num(val).div(new BigNumber('18446744073709551616')).toNumber(),
    }),

  /**
   * Creates a BcsType that can be used to read and write a decimal128.
   * @example
   * bcs.decimal128().serialize('1.23')
   */
  decimal128: (options?: BcsTypeOptions<string, string | number | bigint>) =>
    mystenBcs.u128(options).transform({
      input: (val: number | string) => {
        const n = num(val).times(new BigNumber('1000000000000000000'))

        return n.toFixed(0, BigNumber.ROUND_DOWN)
      },
      output: (val) =>
        num(val).div(new BigNumber('1000000000000000000')).toNumber(),
    }),

  /**
   * Creates a BcsType that can be used to read and write a decimal256.
   * @example
   * bcs.decimal256().serialize('1.23')
   */
  decimal256: (options?: BcsTypeOptions<string, string | number | bigint>) =>
    mystenBcs.u256(options).transform({
      input: (val: number | string) => {
        const n = num(val).times(new BigNumber('1000000000000000000'))

        return n.toFixed(0, BigNumber.ROUND_DOWN)
      },
      output: (val) =>
        num(val).div(new BigNumber('1000000000000000000')).toNumber(),
    }),

  /**
   * Creates a BcsType that can be used to read and write a biguint.
   * @example
   * bcs.biguint().serialize('123')
   */
  biguint: (options?: BcsTypeOptions<string, string | number | bigint>) =>
    mystenBcs.vector(mystenBcs.u8(options)).transform({
      input: (val: number | string | bigint) => {
        return toLittleEndian(BigInt(val))
      },
      output: (val) => {
        return fromLittleEndian(val)
      },
    }),

  /**
   * Creates a BcsType that can be used to read and write a bigdecimal.
   * @example
   * bcs.bigdecimal().serialize('1.23')
   */
  bigdecimal: (options?: BcsTypeOptions<string, string | number>) =>
    mystenBcs.vector(mystenBcs.u8(options)).transform({
      input: (val: number | string) => {
        const n = num(val).times(new BigNumber('1000000000000000000'))
        const biguint = n.toFixed(0, BigNumber.ROUND_DOWN)
        return toLittleEndian(BigInt(biguint))
      },
      output: (val) => {
        const biguint = fromLittleEndian(val).toString()
        return num(biguint).div(new BigNumber('1000000000000000000')).toNumber()
      },
    }),
}

export const bcs = {
  ...mystenBcs,
  ...initiaBcs,
}

function toLittleEndian(bigint: bigint): Uint8Array {
  const result = []
  while (bigint > 0) {
    result.push(Number(bigint % BigInt(256)))
    bigint = bigint / BigInt(256)
  }
  return new Uint8Array(result)
}

function fromLittleEndian(bytes: number[]): bigint {
  let result = 0n
  while (bytes.length > 0) {
    result = result * 256n + BigInt(bytes.pop() as number)
  }
  return result
}
