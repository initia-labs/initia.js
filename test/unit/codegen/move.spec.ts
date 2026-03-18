import { describe, it, expect, vi } from 'vitest'
import {
  generateMoveAbiString,
  generateMoveAbiBatch,
  generateMoveAbiAll,
} from '../../../src/codegen/move'
import type { HasMoveService } from '../../../src/client/types'

// Minimal valid Move module ABI JSON (coin module)
const VALID_ABI_JSON = JSON.stringify({
  address: '0x1',
  name: 'coin',
  friends: [],
  exposed_functions: [
    {
      name: 'balance',
      visibility: 'public',
      is_entry: false,
      is_view: true,
      generic_type_params: [{ constraints: [] }],
      params: ['address'],
      return: ['u64'],
    },
    {
      name: 'transfer',
      visibility: 'public',
      is_entry: true,
      is_view: false,
      generic_type_params: [{ constraints: [] }],
      params: ['&signer', 'address', 'u64'],
      return: [],
    },
  ],
  structs: [
    {
      name: 'CoinStore',
      is_native: false,
      abilities: ['key'],
      generic_type_params: [{ constraints: [] }],
      fields: [
        { name: 'coin', type: '0x1::coin::Coin<T0>' },
        { name: 'frozen', type: 'bool' },
      ],
    },
  ],
})

describe('generateMoveAbiString', () => {
  it('should generate valid TypeScript with import, export, and type assertion', () => {
    const result = generateMoveAbiString(VALID_ABI_JSON)

    // Header comment
    expect(result).toContain('// Move module: 0x1::coin')
    expect(result).toContain('// This file is auto-generated. Do not edit manually.')

    // Import statement
    expect(result).toContain("import type { ReadonlyMoveModuleAbi } from 'initia.js/move'")

    // Export with derived name (coin -> COIN_ABI)
    expect(result).toContain('export const COIN_ABI =')

    // Type assertion
    expect(result).toContain('as const satisfies ReadonlyMoveModuleAbi')

    // Contains function names from the ABI
    expect(result).toContain("'balance'")
    expect(result).toContain("'transfer'")

    // Contains struct name
    expect(result).toContain("'CoinStore'")

    // Uses single quotes (from formatObjectLiteral)
    expect(result).toContain("'0x1'")
    expect(result).toContain("'coin'")
  })

  it('should use custom export name when provided', () => {
    const result = generateMoveAbiString(VALID_ABI_JSON, { exportName: 'MY_COIN' })

    expect(result).toContain('export const MY_COIN =')
    // Should not contain the derived name
    expect(result).not.toContain('COIN_ABI')
  })

  it('should derive UPPER_SNAKE_CASE export name from module name', () => {
    const abiWithCamelCase = JSON.stringify({
      address: '0x1',
      name: 'fungibleAsset',
      friends: [],
      exposed_functions: [],
      structs: [],
    })

    const result = generateMoveAbiString(abiWithCamelCase)
    expect(result).toContain('export const FUNGIBLE_ASSET_ABI =')
  })

  it('should throw on invalid JSON', () => {
    expect(() => generateMoveAbiString('not valid json')).toThrow()
  })

  it('should throw when address is missing', () => {
    const noAddress = JSON.stringify({
      name: 'coin',
      friends: [],
      exposed_functions: [],
      structs: [],
    })
    expect(() => generateMoveAbiString(noAddress)).toThrow()
  })

  it('should throw when name is missing', () => {
    const noName = JSON.stringify({
      address: '0x1',
      friends: [],
      exposed_functions: [],
      structs: [],
    })
    expect(() => generateMoveAbiString(noName)).toThrow()
  })

  it('should handle modules with empty functions and structs', () => {
    const emptyModule = JSON.stringify({
      address: '0x1',
      name: 'empty',
      friends: [],
      exposed_functions: [],
      structs: [],
    })

    const result = generateMoveAbiString(emptyModule)
    expect(result).toContain('export const EMPTY_ABI =')
    expect(result).toContain("'empty'")
    expect(result).toContain('exposed_functions: []')
    expect(result).toContain('structs: []')
  })

  it('should preserve all ABI fields in output', () => {
    const result = generateMoveAbiString(VALID_ABI_JSON)

    // Verify key structural fields are present
    expect(result).toContain('exposed_functions:')
    expect(result).toContain('visibility:')
    expect(result).toContain('is_entry:')
    expect(result).toContain('is_view:')
    expect(result).toContain('generic_type_params:')
    expect(result).toContain('params:')
    expect(result).toContain('return:')
    expect(result).toContain('structs:')
    expect(result).toContain('abilities:')
    expect(result).toContain('fields:')
  })
})

// =============================================================================
// Batch functions
// =============================================================================

const ORACLE_ABI_JSON = JSON.stringify({
  address: '0x1',
  name: 'oracle',
  friends: [],
  exposed_functions: [
    {
      name: 'get_price',
      visibility: 'public',
      is_entry: false,
      is_view: true,
      generic_type_params: [],
      params: ['0x1::string::String'],
      return: ['u256', 'u64', 'u64'],
    },
  ],
  structs: [],
})

function createMockContext(moduleAbis: Record<string, string>) {
  return {
    client: {
      move: {
        module: vi.fn(async ({ moduleName }: { moduleName: string }) => {
          const abi = moduleAbis[moduleName]
          if (!abi) throw new Error(`Module not found: ${moduleName}`)
          return { module: { abi, moduleName } }
        }),
        modules: vi.fn(async () => ({
          modules: Object.entries(moduleAbis).map(([name, abi]) => ({
            moduleName: name,
            abi,
          })),
        })),
      },
    },
  } as unknown as HasMoveService
}

describe('generateMoveAbiBatch', () => {
  it('should generate multiple modules', async () => {
    const ctx = createMockContext({
      coin: VALID_ABI_JSON,
      oracle: ORACLE_ABI_JSON,
    })

    const results = await generateMoveAbiBatch(ctx, '0x1', ['coin', 'oracle'])

    expect(results).toHaveLength(2)
    expect(results[0].moduleName).toBe('coin')
    expect(results[0].exportName).toBe('COIN_ABI')
    expect(results[0].content).toContain('export const COIN_ABI =')
    expect(results[1].moduleName).toBe('oracle')
    expect(results[1].exportName).toBe('ORACLE_ABI')
    expect(results[1].content).toContain('export const ORACLE_ABI =')
  })

  it('should throw if a module is not found', async () => {
    const ctx = createMockContext({ coin: VALID_ABI_JSON })

    await expect(generateMoveAbiBatch(ctx, '0x1', ['coin', 'nonexistent'])).rejects.toThrow(
      'Module not found'
    )
  })
})

describe('generateMoveAbiAll', () => {
  it('should generate all modules from an address', async () => {
    const ctx = createMockContext({
      coin: VALID_ABI_JSON,
      oracle: ORACLE_ABI_JSON,
    })

    const results = await generateMoveAbiAll(ctx, '0x1')

    expect(results).toHaveLength(2)
    expect(results.map(r => r.moduleName).sort()).toEqual(['coin', 'oracle'])
    expect(ctx.client.move.modules).toHaveBeenCalledWith({ address: '0x1' })
  })

  it('should skip modules without ABI', async () => {
    const ctx = {
      client: {
        move: {
          module: vi.fn(),
          modules: vi.fn(async () => ({
            modules: [
              { moduleName: 'coin', abi: VALID_ABI_JSON },
              { moduleName: 'native', abi: '' },
              { moduleName: 'oracle', abi: ORACLE_ABI_JSON },
            ],
          })),
        },
      },
    } as unknown as HasMoveService

    const results = await generateMoveAbiAll(ctx, '0x1')

    expect(results).toHaveLength(2)
    expect(results.map(r => r.moduleName).sort()).toEqual(['coin', 'oracle'])
  })
})
