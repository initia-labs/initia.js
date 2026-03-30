/**
 * Move BCS Encoding/Decoding Tests
 */

import { describe, it, expect } from 'vitest'
import {
  bcs,
  parseMoveType,
  stringifyType,
  getBcsType,
  encodeMoveArg,
  encodeMoveArgs,
  decodeMoveResult,
  decodeMoveResults,
  hexToBytes,
  bytesToHex,
} from '../../../../src/contracts/move/bcs'

describe('Move BCS', () => {
  describe('parseMoveType', () => {
    it('should parse primitive types', () => {
      expect(parseMoveType('u64')).toEqual({ base: 'u64', typeArgs: [] })
      expect(parseMoveType('bool')).toEqual({ base: 'bool', typeArgs: [] })
      expect(parseMoveType('address')).toEqual({ base: 'address', typeArgs: [] })
    })

    it('should parse simple generic types', () => {
      expect(parseMoveType('vector<u8>')).toEqual({
        base: 'vector',
        typeArgs: [{ base: 'u8', typeArgs: [] }],
      })
    })

    it('should parse nested generic types', () => {
      expect(parseMoveType('vector<vector<u8>>')).toEqual({
        base: 'vector',
        typeArgs: [
          {
            base: 'vector',
            typeArgs: [{ base: 'u8', typeArgs: [] }],
          },
        ],
      })
    })

    it('should parse module types', () => {
      expect(parseMoveType('0x1::coin::Coin')).toEqual({
        base: '0x1::coin::Coin',
        typeArgs: [],
      })
    })

    it('should parse module types with generics', () => {
      expect(parseMoveType('0x1::option::Option<u64>')).toEqual({
        base: '0x1::option::Option',
        typeArgs: [{ base: 'u64', typeArgs: [] }],
      })
    })

    it('should parse complex nested types', () => {
      const result = parseMoveType('0x1::coin::CoinStore<0x1::native_uinit::Coin>')
      expect(result.base).toBe('0x1::coin::CoinStore')
      expect(result.typeArgs).toHaveLength(1)
      expect(result.typeArgs[0].base).toBe('0x1::native_uinit::Coin')
    })

    it('should handle whitespace', () => {
      expect(parseMoveType('  u64  ')).toEqual({ base: 'u64', typeArgs: [] })
    })
  })

  describe('stringifyType', () => {
    it('should stringify primitive types', () => {
      expect(stringifyType({ base: 'u64', typeArgs: [] })).toBe('u64')
    })

    it('should stringify simple generic types', () => {
      expect(stringifyType({ base: 'vector', typeArgs: [{ base: 'u8', typeArgs: [] }] })).toBe(
        'vector<u8>'
      )
    })

    it('should stringify nested generic types', () => {
      expect(
        stringifyType({
          base: 'vector',
          typeArgs: [{ base: 'vector', typeArgs: [{ base: 'u8', typeArgs: [] }] }],
        })
      ).toBe('vector<vector<u8>>')
    })

    it('should stringify module types without type args', () => {
      expect(stringifyType({ base: '0x1::coin::Coin', typeArgs: [] })).toBe('0x1::coin::Coin')
    })

    it('should stringify module types with type args', () => {
      expect(
        stringifyType({
          base: '0x1::coin::CoinInfo',
          typeArgs: [{ base: '0x1::native_uinit::Coin', typeArgs: [] }],
        })
      ).toBe('0x1::coin::CoinInfo<0x1::native_uinit::Coin>')
    })

    it('should stringify multiple type args', () => {
      expect(
        stringifyType({
          base: '0x1::table::Table',
          typeArgs: [
            { base: 'address', typeArgs: [] },
            { base: 'u64', typeArgs: [] },
          ],
        })
      ).toBe('0x1::table::Table<address, u64>')
    })

    it('should round-trip with parseMoveType', () => {
      const inputs = [
        'u64',
        'vector<u8>',
        'vector<vector<u8>>',
        '0x1::coin::Coin',
        '0x1::option::Option<u64>',
        '0x1::coin::CoinStore<0x1::native_uinit::Coin>',
        '0x1::table::Table<address, u64>',
      ]
      for (const input of inputs) {
        expect(stringifyType(parseMoveType(input))).toBe(input)
      }
    })
  })

  describe('getBcsType', () => {
    it('should return correct type for primitives', () => {
      expect(getBcsType('bool')).toBeDefined()
      expect(getBcsType('u8')).toBeDefined()
      expect(getBcsType('u16')).toBeDefined()
      expect(getBcsType('u32')).toBeDefined()
      expect(getBcsType('u64')).toBeDefined()
      expect(getBcsType('u128')).toBeDefined()
      expect(getBcsType('u256')).toBeDefined()
      expect(getBcsType('address')).toBeDefined()
    })

    it('should return correct type for vector<u8>', () => {
      const type = getBcsType('vector<u8>')
      expect(type).toBeDefined()
    })

    it('should return correct type for string', () => {
      const type = getBcsType('string')
      expect(type).toBeDefined()
    })

    it('should return correct type for 0x1::string::String', () => {
      const type = getBcsType('0x1::string::String')
      expect(type).toBeDefined()
    })

    it('should throw for unsupported types', () => {
      expect(() => getBcsType('unknown_type')).toThrow('Unsupported Move type')
    })
  })

  describe('encodeMoveArg', () => {
    it('should encode bool', () => {
      const bytes = encodeMoveArg(true, 'bool')
      expect(bytes).toEqual(new Uint8Array([1]))

      const bytes2 = encodeMoveArg(false, 'bool')
      expect(bytes2).toEqual(new Uint8Array([0]))
    })

    it('should encode u8', () => {
      const bytes = encodeMoveArg(42, 'u8')
      expect(bytes).toEqual(new Uint8Array([42]))
    })

    it('should encode u64', () => {
      const bytes = encodeMoveArg(1000n, 'u64')
      expect(bytes.length).toBe(8)
      // 1000 = 0x3E8 in little-endian
      expect(bytes[0]).toBe(0xe8)
      expect(bytes[1]).toBe(0x03)
    })

    it('should encode string', () => {
      const bytes = encodeMoveArg('hello', 'string')
      // ULEB128 length (5) + 'hello'
      expect(bytes[0]).toBe(5)
      expect(bytes.slice(1)).toEqual(new TextEncoder().encode('hello'))
    })

    it('should encode address from hex', () => {
      const bytes = encodeMoveArg('0x1', 'address')
      expect(bytes.length).toBe(32)
      // 0x1 padded to 32 bytes
      expect(bytes[31]).toBe(1)
      expect(bytes[0]).toBe(0)
    })

    it('should encode address from bech32', () => {
      // init1... address should be converted
      const bytes = encodeMoveArg('init1qqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqpqr5e3d', 'address')
      expect(bytes.length).toBe(32)
    })

    it('should encode vector<u8>', () => {
      const bytes = encodeMoveArg([1, 2, 3], 'vector<u8>')
      // ULEB128 length (3) + bytes
      expect(bytes[0]).toBe(3)
      expect(bytes[1]).toBe(1)
      expect(bytes[2]).toBe(2)
      expect(bytes[3]).toBe(3)
    })
  })

  describe('encodeMoveArgs', () => {
    it('should encode multiple args', () => {
      const bytesArray = encodeMoveArgs([true, 42], ['bool', 'u8'])
      expect(bytesArray).toHaveLength(2)
      expect(bytesArray[0]).toEqual(new Uint8Array([1]))
      expect(bytesArray[1]).toEqual(new Uint8Array([42]))
    })

    it('should throw on mismatched lengths', () => {
      expect(() => encodeMoveArgs([1, 2], ['u8'])).toThrow('Argument count mismatch')
    })
  })

  describe('decodeMoveResult', () => {
    it('should decode bool', () => {
      expect(decodeMoveResult(new Uint8Array([1]), 'bool')).toBe(true)
      expect(decodeMoveResult(new Uint8Array([0]), 'bool')).toBe(false)
    })

    it('should decode u8', () => {
      expect(decodeMoveResult(new Uint8Array([42]), 'u8')).toBe(42)
    })

    it('should decode u64', () => {
      const bytes = new Uint8Array([0xe8, 0x03, 0, 0, 0, 0, 0, 0])
      const result = decodeMoveResult(bytes, 'u64')
      expect(result).toBe('1000')
    })

    it('should decode string', () => {
      const bytes = new Uint8Array([5, 104, 101, 108, 108, 111])
      expect(decodeMoveResult(bytes, 'string')).toBe('hello')
    })
  })

  describe('decodeMoveResults', () => {
    it('should decode multiple results', () => {
      const results = decodeMoveResults([new Uint8Array([1]), new Uint8Array([42])], ['bool', 'u8'])
      expect(results).toEqual([true, 42])
    })

    it('should throw on mismatched lengths', () => {
      expect(() => decodeMoveResults([new Uint8Array([1])], ['bool', 'u8'])).toThrow(
        'Result count mismatch'
      )
    })
  })

  describe('hexToBytes / bytesToHex', () => {
    it('should convert hex to bytes', () => {
      expect(hexToBytes('0x0102')).toEqual(new Uint8Array([1, 2]))
      expect(hexToBytes('0102')).toEqual(new Uint8Array([1, 2]))
    })

    it('should convert bytes to hex', () => {
      expect(bytesToHex(new Uint8Array([1, 2]))).toBe('0x0102')
    })

    it('should roundtrip', () => {
      const original = new Uint8Array([1, 2, 3, 255])
      const hex = bytesToHex(original)
      const back = hexToBytes(hex)
      expect(back).toEqual(original)
    })
  })

  describe('Initia-specific BCS types', () => {
    describe('fixed_point32', () => {
      it('should encode fixed_point32', () => {
        const type = bcs.fixed_point32()
        // 1.0 = 2^32 = 4294967296
        const bytes = type.serialize(1).toBytes()
        expect(bytes.length).toBe(8)
      })

      it('should roundtrip fixed_point32', () => {
        const type = bcs.fixed_point32()
        const encoded = type.serialize(1.5).toBytes()
        const decoded = type.parse(encoded)
        expect(parseFloat(decoded)).toBeCloseTo(1.5, 5)
      })
    })

    describe('decimal128', () => {
      it('should encode decimal128', () => {
        const type = bcs.decimal128()
        const bytes = type.serialize('1.5').toBytes()
        expect(bytes.length).toBe(16)
      })

      it('should roundtrip decimal128', () => {
        const type = bcs.decimal128()
        const encoded = type.serialize('1.5').toBytes()
        const decoded = type.parse(encoded)
        expect(decoded).toBe('1.5')
      })

      it('should handle whole numbers', () => {
        const type = bcs.decimal128()
        const encoded = type.serialize('100').toBytes()
        const decoded = type.parse(encoded)
        expect(decoded).toBe('100')
      })
    })

    describe('decimal256', () => {
      it('should encode decimal256', () => {
        const type = bcs.decimal256()
        const bytes = type.serialize('1.5').toBytes()
        expect(bytes.length).toBe(32)
      })

      it('should roundtrip decimal256', () => {
        const type = bcs.decimal256()
        const encoded = type.serialize('1.5').toBytes()
        const decoded = type.parse(encoded)
        expect(decoded).toBe('1.5')
      })
    })
  })
})
