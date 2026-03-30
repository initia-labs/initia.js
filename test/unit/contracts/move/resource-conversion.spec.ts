/**
 * Resource Conversion Tests
 *
 * Tests for parseStructTag(), DEFAULT_OPAQUE_TYPES, createAbiResolver(),
 * convertResourceValue(), and related types.
 */

import { describe, it, expect, vi, beforeEach } from 'vitest'
import {
  parseStructTag,
  DEFAULT_OPAQUE_TYPES,
  createAbiResolver,
  convertResourceValue,
  type ParsedStructTag,
  type AbiResolver,
} from '../../../../src/contracts/move/resource-conversion'
import { parseMoveType } from '../../../../src/contracts/move/bcs'
import { getModuleAbi, findStruct } from '../../../../src/contracts/move/abi-fetcher'
import type { HasMoveService } from '../../../../src/client/types'
import type { MoveModuleAbi, MoveFieldAbi } from '../../../../src/contracts/move/types'

vi.mock('../../../../src/contracts/move/abi-fetcher', () => ({
  getModuleAbi: vi.fn(),
  findStruct: vi.fn(),
}))

describe('Resource Conversion', () => {
  describe('parseStructTag', () => {
    it('should parse a simple struct tag without type args', () => {
      const result = parseStructTag('0x1::coin::Coin')
      expect(result).toEqual({
        address: '0x1',
        module: 'coin',
        name: 'Coin',
        typeArgs: [],
      })
    })

    it('should parse a struct tag with a single type arg', () => {
      const result = parseStructTag('0x1::coin::CoinInfo<0x1::native_uinit::Coin>')
      expect(result).toEqual({
        address: '0x1',
        module: 'coin',
        name: 'CoinInfo',
        typeArgs: [{ base: '0x1::native_uinit::Coin', typeArgs: [] }],
      })
    })

    it('should parse a struct tag with multiple type args', () => {
      const result = parseStructTag('0x1::table::Table<address, u64>')
      expect(result).toEqual({
        address: '0x1',
        module: 'table',
        name: 'Table',
        typeArgs: [
          { base: 'address', typeArgs: [] },
          { base: 'u64', typeArgs: [] },
        ],
      })
    })

    it('should parse a struct tag with nested type args', () => {
      const result = parseStructTag('0x1::coin::CoinInfo<0x1::option::Option<u64>>')
      expect(result).toEqual({
        address: '0x1',
        module: 'coin',
        name: 'CoinInfo',
        typeArgs: [
          {
            base: '0x1::option::Option',
            typeArgs: [{ base: 'u64', typeArgs: [] }],
          },
        ],
      })
    })

    it('should throw on invalid format with single part', () => {
      expect(() => parseStructTag('invalid')).toThrow(
        'Invalid struct tag: invalid. Expected format: address::module::name'
      )
    })

    it('should throw on invalid format with two parts', () => {
      expect(() => parseStructTag('0x1::coin')).toThrow(
        'Invalid struct tag: 0x1::coin. Expected format: address::module::name'
      )
    })
  })

  describe('DEFAULT_OPAQUE_TYPES', () => {
    it('should contain 0x1::table::Table', () => {
      expect(DEFAULT_OPAQUE_TYPES.has('0x1::table::Table')).toBe(true)
    })

    it('should contain 0x1::object::ExtendRef', () => {
      expect(DEFAULT_OPAQUE_TYPES.has('0x1::object::ExtendRef')).toBe(true)
    })
  })

  describe('type exports', () => {
    it('should export AbiResolver interface (compile-time check)', () => {
      // Type-level verification: AbiResolver has resolveStruct method
      const _resolver: AbiResolver = {
        resolveStruct: async (_addr, _mod, _struct) => undefined,
      }
      expect(_resolver).toBeDefined()
    })

    it('should export ParsedStructTag interface (compile-time check)', () => {
      const _tag: ParsedStructTag = {
        address: '0x1',
        module: 'coin',
        name: 'Coin',
        typeArgs: [],
      }
      expect(_tag).toBeDefined()
    })
  })

  describe('createAbiResolver', () => {
    const mockContext = { client: { move: {} } } as unknown as HasMoveService
    const mockGetModuleAbi = vi.mocked(getModuleAbi)
    const mockFindStruct = vi.mocked(findStruct)

    const coinFields: MoveFieldAbi[] = [{ name: 'value', type: 'u64' }]

    const coinAbi: MoveModuleAbi = {
      address: '0x1',
      name: 'coin',
      friends: [],
      exposed_functions: [],
      structs: [
        {
          name: 'CoinInfo',
          is_native: false,
          abilities: ['key'],
          generic_type_params: [],
          fields: coinFields,
        },
      ],
    }

    beforeEach(() => {
      vi.clearAllMocks()
    })

    it('should return struct fields when module and struct exist', async () => {
      mockGetModuleAbi.mockResolvedValue(coinAbi)
      mockFindStruct.mockReturnValue(coinAbi.structs[0])

      const resolver = createAbiResolver(mockContext)
      const fields = await resolver.resolveStruct('0x1', 'coin', 'CoinInfo')

      expect(fields).toEqual(coinFields)
      expect(mockGetModuleAbi).toHaveBeenCalledWith(mockContext, '0x1', 'coin')
      expect(mockFindStruct).toHaveBeenCalledWith(coinAbi, 'CoinInfo')
    })

    it('should return undefined when struct is not found in module', async () => {
      mockGetModuleAbi.mockResolvedValue(coinAbi)
      mockFindStruct.mockReturnValue(undefined)

      const resolver = createAbiResolver(mockContext)
      const fields = await resolver.resolveStruct('0x1', 'coin', 'NonExistent')

      expect(fields).toBeUndefined()
    })

    it('should propagate errors when getModuleAbi throws', async () => {
      mockGetModuleAbi.mockRejectedValue(new Error('Module not found'))

      const resolver = createAbiResolver(mockContext)

      await expect(resolver.resolveStruct('0x1', 'missing', 'Foo')).rejects.toThrow(
        'Module not found'
      )
    })

    it('should deduplicate concurrent requests for the same module', async () => {
      mockGetModuleAbi.mockResolvedValue(coinAbi)
      mockFindStruct.mockReturnValue(coinAbi.structs[0])

      const resolver = createAbiResolver(mockContext)

      // Fire two concurrent requests for the same module
      const [result1, result2] = await Promise.all([
        resolver.resolveStruct('0x1', 'coin', 'CoinInfo'),
        resolver.resolveStruct('0x1', 'coin', 'CoinInfo'),
      ])

      expect(result1).toEqual(coinFields)
      expect(result2).toEqual(coinFields)
      // Only one gRPC call should have been made
      expect(mockGetModuleAbi).toHaveBeenCalledTimes(1)
    })

    it('should make separate requests for different modules', async () => {
      const stakingAbi: MoveModuleAbi = {
        address: '0x1',
        name: 'staking',
        friends: [],
        exposed_functions: [],
        structs: [
          {
            name: 'StakeInfo',
            is_native: false,
            abilities: ['key'],
            generic_type_params: [],
            fields: [{ name: 'amount', type: 'u64' }],
          },
        ],
      }

      mockGetModuleAbi.mockResolvedValueOnce(coinAbi).mockResolvedValueOnce(stakingAbi)
      mockFindStruct
        .mockReturnValueOnce(coinAbi.structs[0])
        .mockReturnValueOnce(stakingAbi.structs[0])

      const resolver = createAbiResolver(mockContext)

      const [fields1, fields2] = await Promise.all([
        resolver.resolveStruct('0x1', 'coin', 'CoinInfo'),
        resolver.resolveStruct('0x1', 'staking', 'StakeInfo'),
      ])

      expect(fields1).toEqual(coinFields)
      expect(fields2).toEqual([{ name: 'amount', type: 'u64' }])
      expect(mockGetModuleAbi).toHaveBeenCalledTimes(2)
    })
  })

  describe('convertResourceValue', () => {
    /**
     * Helper to create a mock AbiResolver from a struct name → fields map.
     * No mocking of getModuleAbi needed — the resolver is the direct interface.
     */
    function createMockResolver(structs: Record<string, MoveFieldAbi[]>): AbiResolver {
      return {
        async resolveStruct(_addr, _mod, name) {
          return structs[name]
        },
      }
    }

    const emptyResolver = createMockResolver({})
    const emptyOpaqueTypes = new Set<string>()

    // ---------------------------------------------------------------
    // Primitive conversions
    // ---------------------------------------------------------------

    it('should convert u64 string to bigint', async () => {
      const result = await convertResourceValue(
        '12345',
        parseMoveType('u64'),
        emptyResolver,
        emptyOpaqueTypes
      )
      expect(result).toBe(12345n)
    })

    it('should convert u128 string to bigint', async () => {
      const result = await convertResourceValue(
        '99999999999999999999',
        parseMoveType('u128'),
        emptyResolver,
        emptyOpaqueTypes
      )
      expect(result).toBe(99999999999999999999n)
    })

    it('should convert u256 string to bigint', async () => {
      const result = await convertResourceValue(
        '42',
        parseMoveType('u256'),
        emptyResolver,
        emptyOpaqueTypes
      )
      expect(result).toBe(42n)
    })

    it('should pass through bool values unchanged', async () => {
      const result = await convertResourceValue(
        true,
        parseMoveType('bool'),
        emptyResolver,
        emptyOpaqueTypes
      )
      expect(result).toBe(true)
    })

    it('should pass through string values for 0x1::string::String', async () => {
      const result = await convertResourceValue(
        'hello',
        parseMoveType('0x1::string::String'),
        emptyResolver,
        emptyOpaqueTypes
      )
      expect(result).toBe('hello')
    })

    it('should pass through number values for u8', async () => {
      const result = await convertResourceValue(
        42,
        parseMoveType('u8'),
        emptyResolver,
        emptyOpaqueTypes
      )
      expect(result).toBe(42)
    })

    it('should defensively convert u8/u16/u32 string values to number', async () => {
      const r8 = await convertResourceValue(
        '42',
        parseMoveType('u8'),
        emptyResolver,
        emptyOpaqueTypes
      )
      expect(r8).toBe(42)
      expect(typeof r8).toBe('number')

      const r16 = await convertResourceValue(
        '1000',
        parseMoveType('u16'),
        emptyResolver,
        emptyOpaqueTypes
      )
      expect(r16).toBe(1000)

      const r32 = await convertResourceValue(
        '65535',
        parseMoveType('u32'),
        emptyResolver,
        emptyOpaqueTypes
      )
      expect(r32).toBe(65535)
    })

    // ---------------------------------------------------------------
    // vector conversions
    // ---------------------------------------------------------------

    it('should convert vector<u64> elements to bigint', async () => {
      const result = await convertResourceValue(
        ['1', '2', '3'],
        parseMoveType('vector<u64>'),
        emptyResolver,
        emptyOpaqueTypes
      )
      expect(result).toEqual([1n, 2n, 3n])
    })

    it('should handle empty vector', async () => {
      const result = await convertResourceValue(
        [],
        parseMoveType('vector<u64>'),
        emptyResolver,
        emptyOpaqueTypes
      )
      expect(result).toEqual([])
    })

    it('should handle nested vector<vector<u64>>', async () => {
      const result = await convertResourceValue(
        [['1', '2'], ['3']],
        parseMoveType('vector<vector<u64>>'),
        emptyResolver,
        emptyOpaqueTypes
      )
      expect(result).toEqual([[1n, 2n], [3n]])
    })

    // ---------------------------------------------------------------
    // Option conversions
    // ---------------------------------------------------------------

    it('should convert Option<u64> with a value', async () => {
      const result = await convertResourceValue(
        { vec: ['42'] },
        parseMoveType('0x1::option::Option<u64>'),
        emptyResolver,
        emptyOpaqueTypes
      )
      expect(result).toBe(42n)
    })

    it('should convert empty Option<u64> to null', async () => {
      const result = await convertResourceValue(
        { vec: [] },
        parseMoveType('0x1::option::Option<u64>'),
        emptyResolver,
        emptyOpaqueTypes
      )
      expect(result).toBeNull()
    })

    // ---------------------------------------------------------------
    // Opaque type handling
    // ---------------------------------------------------------------

    it('should return opaque types as-is without ABI resolution', async () => {
      const tableValue = { handle: '0x123' }
      const opaqueTypes = new Set(['0x1::table::Table'])

      const result = await convertResourceValue(
        tableValue,
        parseMoveType('0x1::table::Table<address, u64>'),
        emptyResolver,
        opaqueTypes
      )
      expect(result).toEqual({ handle: '0x123' })
    })

    // ---------------------------------------------------------------
    // Custom struct with field conversion
    // ---------------------------------------------------------------

    it('should convert custom struct fields using ABI', async () => {
      const resolver = createMockResolver({
        CoinStore: [{ name: 'value', type: 'u64' }],
      })

      const result = await convertResourceValue(
        { value: '100' },
        parseMoveType('0x1::coin::CoinStore'),
        resolver,
        emptyOpaqueTypes
      )
      expect(result).toEqual({ value: 100n })
    })

    it('should handle nested structs recursively', async () => {
      const resolver = createMockResolver({
        Outer: [{ name: 'coin', type: '0x1::coin::Inner' }],
        Inner: [{ name: 'value', type: 'u64' }],
      })

      const result = await convertResourceValue(
        { coin: { value: '50' } },
        parseMoveType('0x1::coin::Outer'),
        resolver,
        emptyOpaqueTypes
      )
      expect(result).toEqual({ coin: { value: 50n } })
    })

    it('should resolve generic type params in struct fields', async () => {
      // CoinInfo<T0> has field { name: 'value', type: 'T0' }
      // When instantiated as CoinInfo<u64>, T0 → u64
      const resolver = createMockResolver({
        CoinInfo: [{ name: 'value', type: 'T0' }],
      })

      const result = await convertResourceValue(
        { value: '99' },
        parseMoveType('0x1::coin::CoinInfo<u64>'),
        resolver,
        emptyOpaqueTypes
      )
      expect(result).toEqual({ value: 99n })
    })

    it('should resolve multiple generic type params', async () => {
      const resolver = createMockResolver({
        Pair: [
          { name: 'first', type: 'T0' },
          { name: 'second', type: 'T1' },
        ],
      })

      const result = await convertResourceValue(
        { first: '10', second: true },
        parseMoveType('0x1::util::Pair<u64, bool>'),
        resolver,
        emptyOpaqueTypes
      )
      expect(result).toEqual({ first: 10n, second: true })
    })

    // ---------------------------------------------------------------
    // Graceful fallback
    // ---------------------------------------------------------------

    it('should throw when struct is not found in ABI', async () => {
      await expect(
        convertResourceValue(
          { value: '100' },
          parseMoveType('0x1::unknown::Mystery'),
          emptyResolver,
          emptyOpaqueTypes
        )
      ).rejects.toThrow("Struct 'Mystery' not found in ABI for module 0x1::unknown")
    })

    it('should throw for object value with non-struct type', async () => {
      await expect(
        convertResourceValue(
          { some: 'data' },
          parseMoveType('SomeType'),
          emptyResolver,
          emptyOpaqueTypes
        )
      ).rejects.toThrow("Unexpected object value for non-struct type 'SomeType'")
    })

    // ---------------------------------------------------------------
    // Extra fields preserved
    // ---------------------------------------------------------------

    it('should preserve extra fields not in the ABI', async () => {
      const resolver = createMockResolver({
        CoinStore: [{ name: 'value', type: 'u64' }],
      })

      const result = await convertResourceValue(
        { value: '100', extra: 'keep', another: 42 },
        parseMoveType('0x1::coin::CoinStore'),
        resolver,
        emptyOpaqueTypes
      )
      expect(result).toEqual({ value: 100n, extra: 'keep', another: 42 })
    })

    // ---------------------------------------------------------------
    // Complex / edge cases
    // ---------------------------------------------------------------

    it('should handle struct with Option field', async () => {
      const resolver = createMockResolver({
        Config: [
          { name: 'enabled', type: 'bool' },
          { name: 'limit', type: '0x1::option::Option<u64>' },
        ],
      })

      const result = await convertResourceValue(
        { enabled: true, limit: { vec: ['1000'] } },
        parseMoveType('0x1::config::Config'),
        resolver,
        emptyOpaqueTypes
      )
      expect(result).toEqual({ enabled: true, limit: 1000n })
    })

    it('should handle Option<CustomStruct> with ABI resolution on inner type', async () => {
      const resolver = createMockResolver({
        Wrapper: [{ name: 'inner', type: '0x1::option::Option<0x1::coin::Balance>' }],
        Balance: [{ name: 'amount', type: 'u64' }],
      })

      const result = await convertResourceValue(
        { inner: { vec: [{ amount: '500' }] } },
        parseMoveType('0x1::coin::Wrapper'),
        resolver,
        emptyOpaqueTypes
      )
      expect(result).toEqual({ inner: { amount: 500n } })
    })

    it('should handle empty Option<CustomStruct>', async () => {
      const resolver = createMockResolver({
        Wrapper: [{ name: 'inner', type: '0x1::option::Option<0x1::coin::Balance>' }],
        Balance: [{ name: 'amount', type: 'u64' }],
      })

      const result = await convertResourceValue(
        { inner: { vec: [] } },
        parseMoveType('0x1::coin::Wrapper'),
        resolver,
        emptyOpaqueTypes
      )
      expect(result).toEqual({ inner: null })
    })

    it('should handle struct with vector field', async () => {
      const resolver = createMockResolver({
        Pool: [{ name: 'amounts', type: 'vector<u64>' }],
      })

      const result = await convertResourceValue(
        { amounts: ['100', '200'] },
        parseMoveType('0x1::pool::Pool'),
        resolver,
        emptyOpaqueTypes
      )
      expect(result).toEqual({ amounts: [100n, 200n] })
    })

    it('should handle null value', async () => {
      const result = await convertResourceValue(
        null,
        parseMoveType('u64'),
        emptyResolver,
        emptyOpaqueTypes
      )
      // null is not a string, convertJsonValue returns it as-is for u64
      expect(result).toBeNull()
    })
  })
})
