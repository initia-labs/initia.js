import { describe, it, expect, expectTypeOf } from 'vitest'
import { abi, evmAbi, moveAbi, wasmAbi } from '../../../src/contracts/abi-helpers'
import type { Abi } from 'abitype'
import type { ReadFunctions } from '../../../src/contracts/evm/types'
import type { ReadonlyMoveModuleAbi, MoveViewProxyTyped } from '../../../src/contracts/move/types'
import type {
  ReadonlyWasmContractSchema,
  TypedWasmContract,
} from '../../../src/contracts/wasm/types'

describe('evmAbi', () => {
  it('preserves literal types without as const', () => {
    const result = evmAbi([
      {
        type: 'function',
        name: 'balanceOf',
        inputs: [{ name: 'account', type: 'address' }],
        outputs: [{ name: '', type: 'uint256' }],
        stateMutability: 'view',
      },
    ])
    expect(result).toBeDefined()
    type Names = (typeof result)[number] extends { name: infer N } ? N : never
    expectTypeOf<Names>().toEqualTypeOf<'balanceOf'>()
  })

  it('validates against Abi constraint', () => {
    const result = evmAbi([
      {
        type: 'function',
        name: 'transfer',
        inputs: [
          { name: 'to', type: 'address' },
          { name: 'amount', type: 'uint256' },
        ],
        outputs: [{ name: '', type: 'bool' }],
        stateMutability: 'nonpayable',
      },
    ])
    expectTypeOf(result).toMatchTypeOf<Abi>()
  })

  it('is identity at runtime', () => {
    const input: Abi = [
      {
        type: 'function',
        name: 'name',
        inputs: [],
        outputs: [{ name: '', type: 'string' }],
        stateMutability: 'view',
      },
    ]
    const result = evmAbi(input)
    expect(result).toBe(input)
  })
})

describe('moveAbi', () => {
  it('preserves literal types without as const', () => {
    const result = moveAbi({
      address: '0x1',
      name: 'coin',
      friends: [],
      exposed_functions: [
        {
          name: 'balance',
          visibility: 'public',
          is_entry: false,
          is_view: true,
          generic_type_params: [],
          params: ['address'],
          return: ['u64'],
        },
      ],
      structs: [],
    })
    expect(result).toBeDefined()
    type FnNames = (typeof result)['exposed_functions'][number]['name']
    expectTypeOf<FnNames>().toEqualTypeOf<'balance'>()
  })

  it('validates against ReadonlyMoveModuleAbi constraint', () => {
    const result = moveAbi({
      address: '0x1',
      name: 'coin',
      friends: [],
      exposed_functions: [],
      structs: [],
    })
    expectTypeOf(result).toMatchTypeOf<ReadonlyMoveModuleAbi>()
  })

  it('is identity at runtime', () => {
    const input = {
      address: '0x1',
      name: 'coin',
      friends: [] as string[],
      exposed_functions: [] as ReadonlyMoveModuleAbi['exposed_functions'],
      structs: [] as ReadonlyMoveModuleAbi['structs'],
    }
    const result = moveAbi(input)
    expect(result).toBe(input)
  })
})

describe('wasmAbi', () => {
  it('preserves variant names without nested as const', () => {
    const result = wasmAbi({
      execute: {
        oneOf: [
          { required: ['transfer'], properties: { transfer: {} } },
          { required: ['burn'], properties: { burn: {} } },
        ],
      },
      query: {
        oneOf: [{ required: ['balance'], properties: { balance: {} } }],
      },
    })
    expect(result).toBeDefined()
    type ExecVariant = (typeof result)['execute'] extends { oneOf: infer O }
      ? O extends readonly { required: readonly [infer N, ...unknown[]] }[]
        ? N
        : never
      : never
    expectTypeOf<ExecVariant>().toEqualTypeOf<'transfer' | 'burn'>()
  })

  it('validates against ReadonlyWasmContractSchema constraint', () => {
    const result = wasmAbi({
      execute: {
        oneOf: [{ required: ['mint'], properties: { mint: {} } }],
      },
    })
    expectTypeOf(result).toMatchTypeOf<ReadonlyWasmContractSchema>()
  })

  it('is identity at runtime', () => {
    // TypeScript widens `required: ['transfer']` to `string[]` when assigned to a
    // variable. `as const` retains the literal tuple type. Inline literals do not need this.
    const input = {
      execute: {
        oneOf: [{ required: ['transfer'] as const, properties: { transfer: {} } }],
      },
    }
    const result = wasmAbi(input)
    expect(result).toBe(input)
  })
})

describe('end-to-end type compatibility', () => {
  it('evmAbi output works with ReadFunctions', () => {
    const myAbi = evmAbi([
      {
        type: 'function',
        name: 'balanceOf',
        inputs: [{ name: 'account', type: 'address' }],
        outputs: [{ name: '', type: 'uint256' }],
        stateMutability: 'view',
      },
    ])
    expect(myAbi).toBeDefined()
    type Read = ReadFunctions<typeof myAbi>
    expectTypeOf<Read>().toHaveProperty('balanceOf')
  })

  it('moveAbi output works with MoveViewProxyTyped', () => {
    const myAbi = moveAbi({
      address: '0x1',
      name: 'coin',
      friends: [],
      exposed_functions: [
        {
          name: 'decimals',
          visibility: 'public',
          is_entry: false,
          is_view: true,
          generic_type_params: [],
          params: ['0x1::object::Object<0x1::fungible_asset::Metadata>'],
          return: ['u8'],
        },
      ],
      structs: [],
    })
    expect(myAbi).toBeDefined()
    type View = MoveViewProxyTyped<typeof myAbi>
    expectTypeOf<View>().toHaveProperty('decimals')
  })

  it('wasmAbi output works with TypedWasmContract', () => {
    const schema = wasmAbi({
      execute: {
        oneOf: [{ required: ['transfer'], properties: { transfer: {} } }],
      },
    })
    expect(schema).toBeDefined()
    type Contract = TypedWasmContract<typeof schema>
    expectTypeOf<Contract['execute']>().toHaveProperty('transfer')
  })
})

describe('abi (unified overload)', () => {
  it('dispatches array to EVM and preserves literal types', () => {
    // TypeScript widens string literals when assigned to a variable.
    // `as const` retains the literal type. Inline literals do not need this.
    const input = [
      {
        type: 'function' as const,
        name: 'balanceOf' as const,
        inputs: [{ name: 'account', type: 'address' }] as const,
        outputs: [{ name: '', type: 'uint256' }] as const,
        stateMutability: 'view' as const,
      },
    ]
    const result = abi(input)
    expect(result).toBe(input)
    expectTypeOf(result).toMatchTypeOf<Abi>()
  })

  it('dispatches object with address+name to Move and preserves literal types', () => {
    // TypeScript widens array literals to `never[]` when assigned to a variable.
    // Explicit type annotations retain the correct element types.
    const input = {
      address: '0x1',
      name: 'coin',
      friends: [] as string[],
      exposed_functions: [] as ReadonlyMoveModuleAbi['exposed_functions'],
      structs: [] as ReadonlyMoveModuleAbi['structs'],
    }
    const result = abi(input)
    expect(result).toBe(input)
    expectTypeOf(result).toMatchTypeOf<ReadonlyMoveModuleAbi>()
  })

  it('dispatches object with execute/query to Wasm and preserves literal types', () => {
    // TypeScript widens `required: ['transfer']` to `string[]` when assigned to a
    // variable. `as const` retains the literal tuple type. Inline literals do not need this.
    const input = {
      execute: {
        oneOf: [{ required: ['transfer'] as const, properties: { transfer: {} } }],
      },
    }
    const result = abi(input)
    expect(result).toBe(input)
    expectTypeOf(result).toMatchTypeOf<ReadonlyWasmContractSchema>()
  })
})
