import { BcsTypeOptions, bcs as mystenBcs } from '@mysten/bcs';
import { AccAddress, BigNumber, num } from '../core';

const initiaAddress = (
  options?: BcsTypeOptions<Uint8Array, Iterable<number>>
) =>
  mystenBcs.bytes(32, options).transform({
    input: (val: string) => {
      if (val.startsWith('init1')) {
        val = AccAddress.toHex(val);
      }

      if (val.startsWith('0x')) {
        val = val.slice(2).padStart(64, '0');
      }

      if (!val.match(/[0-9a-f]+$/i)) {
        throw new Error('invalid address');
      }

      return Buffer.from(val, 'hex');
    },
    output: val => `0x${Buffer.from(val).toString('hex')}`,
  });

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
        const n = num(val).times(new BigNumber('4294967296'));

        return n.toFixed(0, BigNumber.ROUND_DOWN);
      },
      output: val => num(val).div(new BigNumber('4294967296')).toNumber(),
    }),

  /**
   * Creates a BcsType that can be used to read and write a fixed_point64.
   * @example
   * bcs.fixed_point64().serialize('1.23')
   */
  fixed_point64: (options?: BcsTypeOptions<string, string | number | bigint>) =>
    mystenBcs.u128(options).transform({
      input: (val: number | string) => {
        const n = num(val).times(new BigNumber('18446744073709551616'));

        return n.toFixed(0, BigNumber.ROUND_DOWN);
      },
      output: val =>
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
        const n = num(val).times(new BigNumber('1000000000000000000'));

        return n.toFixed(0, BigNumber.ROUND_DOWN);
      },
      output: val =>
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
        const n = num(val).times(new BigNumber('1000000000000000000'));

        return n.toFixed(0, BigNumber.ROUND_DOWN);
      },
      output: val =>
        num(val).div(new BigNumber('1000000000000000000')).toNumber(),
    }),
};

export const bcs = {
  ...mystenBcs,
  ...initiaBcs,
};
