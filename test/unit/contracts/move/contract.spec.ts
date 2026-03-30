/**
 * Move Contract Factory Tests
 */

import { describe, it, expect, expectTypeOf, vi, beforeEach } from 'vitest'
import {
  createMoveContract,
  createPublishMsg,
  createScriptMsg,
  createExecuteMsg,
  callViewFunction,
  buildMoveExecute,
  buildMoveView,
  queryResource,
  queryTableEntry,
} from '../../../../src/contracts/move/contract'
import { UpgradePolicy } from '../../../../src/contracts/move/types'
import type {
  ReadonlyMoveModuleAbi,
  MoveTypeToTs,
  MoveReturnToTs,
  FilterSigner,
  MoveViewProxyTyped,
  MoveExecuteProxyTyped,
  TypedMoveContract,
} from '../../../../src/contracts/move/types'
import { clearAbiCache } from '../../../../src/contracts/move/abi-fetcher'
import { AccAddress } from '../../../../src/util/address'
import { encodeMoveArg } from '../../../../src/contracts/move/bcs'
import type { MoveModuleAbi } from '../../../../src/contracts/move/types'
import type { HasMoveService } from '../../../../src/client/types'
import type { Message } from '../../../../src/msgs/types'

function fields(msg: Message): any {
  return msg.value
}

// =============================================================================
// Test Constants & Mock Helpers
// =============================================================================

const MOVE_HEX_ADDR = '0x1234567890123456789012345678901234567890'
const MOVE_BECH32_ADDR = AccAddress.fromHex(MOVE_HEX_ADDR)

function createMockContext(moveClient: ReturnType<typeof createDefaultMockMoveClient>) {
  return { client: { move: moveClient } } as unknown as HasMoveService
}

function createDefaultMockMoveClient() {
  return {
    module: vi.fn().mockResolvedValue({
      module: {
        abi: JSON.stringify({
          address: '0x1',
          name: 'coin',
          friends: [],
          exposed_functions: [
            {
              name: 'transfer',
              visibility: 'public',
              is_entry: true,
              is_view: false,
              generic_type_params: [{ constraints: [] }],
              params: ['&signer', 'address', 'u64'],
              return: [],
            },
            {
              name: 'balance',
              visibility: 'public',
              is_entry: false,
              is_view: true,
              generic_type_params: [{ constraints: [] }],
              params: ['address'],
              return: ['u64'],
            },
          ],
          structs: [],
        }),
      },
    }),
    viewJSON: vi.fn().mockResolvedValue({ data: '"1000000"' }),
    resource: vi.fn().mockResolvedValue({
      resource: { moveResource: '{"value":"1000000"}' },
    }),
    tableEntry: vi.fn().mockResolvedValue({
      tableEntry: { value: '{"key":"value"}' },
    }),
  }
}

function createViewMockClient(
  params: string[],
  returnTypes: string[],
  returnData: string,
  genericTypeParams: { constraints: string[] }[] = []
) {
  return {
    module: vi.fn().mockResolvedValue({
      module: {
        abi: JSON.stringify({
          address: '0x1',
          name: 'test',
          friends: [],
          exposed_functions: [
            {
              name: 'test_view',
              visibility: 'public',
              is_entry: false,
              is_view: true,
              generic_type_params: genericTypeParams,
              params,
              return: returnTypes,
            },
          ],
          structs: [],
        }),
      },
    }),
    viewJSON: vi.fn().mockResolvedValue({ data: returnData }),
    resource: vi.fn(),
    tableEntry: vi.fn(),
  }
}

function createTypedMockClient(
  params: string[],
  genericTypeParams: { constraints: string[] }[] = []
) {
  return {
    module: vi.fn().mockResolvedValue({
      module: {
        abi: JSON.stringify({
          address: '0x1',
          name: 'test',
          friends: [],
          exposed_functions: [
            {
              name: 'test_fn',
              visibility: 'public',
              is_entry: true,
              is_view: false,
              generic_type_params: genericTypeParams,
              params: ['&signer', ...params],
              return: [],
            },
          ],
          structs: [],
        }),
      },
    }),
    viewJSON: vi.fn().mockResolvedValue({ data: '"1000000"' }),
    resource: vi.fn(),
    tableEntry: vi.fn(),
  }
}

// =============================================================================
// Move Contract — Core Tests
// =============================================================================

describe('Move Contract', () => {
  beforeEach(() => {
    clearAbiCache()
    vi.clearAllMocks()
  })

  describe('createMoveContract', () => {
    it('should create contract with fetched ABI', async () => {
      const mockMoveClient = createDefaultMockMoveClient()
      const contract = await createMoveContract(createMockContext(mockMoveClient), '0x1', 'coin')

      expect(contract.moduleAddress).toBe('0x1')
      expect(contract.moduleName).toBe('coin')
      expect(contract.abi).toBeDefined()
      expect(contract.abi.exposed_functions).toHaveLength(2)
    })

    it('should use provided ABI without fetching', async () => {
      const mockMoveClient = createDefaultMockMoveClient()
      const customAbi: MoveModuleAbi = {
        address: '0x2',
        name: 'custom',
        friends: [],
        exposed_functions: [],
        structs: [],
      }

      const contract = await createMoveContract(
        createMockContext(mockMoveClient),
        '0x2',
        'custom',
        {
          abi: customAbi,
        }
      )

      expect(mockMoveClient.module).not.toHaveBeenCalled()
      expect(contract.abi).toBe(customAbi)
    })

    it('should cache ABI by default', async () => {
      const mockMoveClient = createDefaultMockMoveClient()
      const ctx = createMockContext(mockMoveClient)

      await createMoveContract(ctx, '0x1', 'coin')
      await createMoveContract(ctx, '0x1', 'coin')

      expect(mockMoveClient.module).toHaveBeenCalledTimes(1)
    })

    it('should skip cache when useCache is false', async () => {
      const mockMoveClient = createDefaultMockMoveClient()
      const ctx = createMockContext(mockMoveClient)

      await createMoveContract(ctx, '0x1', 'coin')
      await createMoveContract(ctx, '0x1', 'coin', { useCache: false })

      expect(mockMoveClient.module).toHaveBeenCalledTimes(2)
    })
  })

  describe('execute proxy', () => {
    it('should create MsgExecute (BCS) for entry function with known types', async () => {
      const mockMoveClient = createDefaultMockMoveClient()
      const contract = await createMoveContract(createMockContext(mockMoveClient), '0x1', 'coin')

      const recipientHex = '0x0000000000000000000000000000000000000001'
      const msg = contract.execute.transfer('init1sender...', {
        typeArgs: ['0x1::native_uinit::Coin'],
        args: [recipientHex, '1000000'],
      })

      const v = fields(msg)
      expect(v.$typeName).toBe('initia.move.v1.MsgExecute')
      expect(v.sender).toBe('init1sender...')
      expect(v.moduleAddress).toBe('0x1')
      expect(v.moduleName).toBe('coin')
      expect(v.functionName).toBe('transfer')
      expect(v.typeArgs).toEqual(['0x1::native_uinit::Coin'])
      expect(v.args).toHaveLength(2)
      expect(v.args[0]).toBeInstanceOf(Uint8Array)
      expect(v.args[1]).toBeInstanceOf(Uint8Array)
    })

    it('should throw for non-existent function', async () => {
      const mockMoveClient = createDefaultMockMoveClient()
      const contract = await createMoveContract(createMockContext(mockMoveClient), '0x1', 'coin')

      expect(() => contract.execute.nonexistent('sender')).toThrow('Function not found')
    })

    it('should throw for non-entry function', async () => {
      const mockMoveClient = createDefaultMockMoveClient()
      const contract = await createMoveContract(createMockContext(mockMoveClient), '0x1', 'coin')

      expect(() => contract.execute.balance('sender')).toThrow('not an entry function')
    })

    it('should handle empty args', async () => {
      const mockClient = createTypedMockClient([])
      const contract = await createMoveContract(createMockContext(mockClient), '0x1', 'test')
      const msg = contract.execute.test_fn('sender')

      expect(fields(msg).args).toEqual([])
      expect(fields(msg).typeArgs).toEqual([])
    })
  })

  describe('view proxy', () => {
    it('should call viewJSON and return parsed result', async () => {
      const mockMoveClient = createDefaultMockMoveClient()
      const contract = await createMoveContract(createMockContext(mockMoveClient), '0x1', 'coin')

      const result = await contract.view.balance({
        typeArgs: ['0x1::native_uinit::Coin'],
        args: ['init1address...'],
      })

      expect(mockMoveClient.viewJSON).toHaveBeenCalledWith({
        address: '0x1',
        moduleName: 'coin',
        functionName: 'balance',
        typeArgs: ['0x1::native_uinit::Coin'],
        args: ['"init1address..."'],
      })
      // u64 return type auto-converts string to bigint (Phase 2)
      expect(result).toBe(1000000n)
    })

    it('should convert bech32 address to hex in view args', async () => {
      const mockClient = createTypedMockClient(['address'])
      // Override to add a view function
      mockClient.module.mockResolvedValue({
        module: {
          abi: JSON.stringify({
            address: '0x1',
            name: 'test',
            friends: [],
            exposed_functions: [
              {
                name: 'get_balance',
                visibility: 'public',
                is_entry: false,
                is_view: true,
                generic_type_params: [],
                params: ['address'],
                return: ['u64'],
              },
            ],
            structs: [],
          }),
        },
      })

      const contract = await createMoveContract(createMockContext(mockClient), '0x1', 'test')
      await contract.view.get_balance({ args: [MOVE_BECH32_ADDR] })

      expect(mockClient.viewJSON).toHaveBeenCalledWith({
        address: '0x1',
        moduleName: 'test',
        functionName: 'get_balance',
        typeArgs: [],
        args: [JSON.stringify(MOVE_HEX_ADDR)],
      })
    })

    it('should throw for non-existent function', async () => {
      const mockMoveClient = createDefaultMockMoveClient()
      const contract = await createMoveContract(createMockContext(mockMoveClient), '0x1', 'coin')

      await expect(contract.view.nonexistent()).rejects.toThrow('Function not found')
    })

    it('should throw for non-view function', async () => {
      const mockMoveClient = createDefaultMockMoveClient()
      const contract = await createMoveContract(createMockContext(mockMoveClient), '0x1', 'coin')

      await expect(contract.view.transfer()).rejects.toThrow('not a view function')
    })

    it('should return raw data if JSON parse fails', async () => {
      const mockMoveClient = createDefaultMockMoveClient()
      mockMoveClient.viewJSON.mockResolvedValue({ data: 'not-json' })
      const contract = await createMoveContract(createMockContext(mockMoveClient), '0x1', 'coin')

      const result = await contract.view.balance()
      expect(result).toBe('not-json')
    })
  })

  // --- Typed view response conversion (Phase 2) ---

  describe('typed view response conversion', () => {
    it('should return u8 as number unchanged', async () => {
      const mockClient = createViewMockClient([], ['u8'], '42')
      const contract = await createMoveContract(createMockContext(mockClient), '0x1', 'test')
      const result = await contract.view.test_view()
      expect(result).toBe(42)
      expect(typeof result).toBe('number')
    })

    it('should return bool as boolean unchanged', async () => {
      const mockClient = createViewMockClient([], ['bool'], 'true')
      const contract = await createMoveContract(createMockContext(mockClient), '0x1', 'test')
      const result = await contract.view.test_view()
      expect(result).toBe(true)
    })

    it('should return address as string unchanged', async () => {
      const mockClient = createViewMockClient([], ['address'], '"0x1234"')
      const contract = await createMoveContract(createMockContext(mockClient), '0x1', 'test')
      const result = await contract.view.test_view()
      expect(result).toBe('0x1234')
    })

    it('should return 0x1::string::String as string unchanged', async () => {
      const mockClient = createViewMockClient([], ['0x1::string::String'], '"hello"')
      const contract = await createMoveContract(createMockContext(mockClient), '0x1', 'test')
      const result = await contract.view.test_view()
      expect(result).toBe('hello')
    })

    it('should convert vector<u64> elements to bigint[]', async () => {
      const mockClient = createViewMockClient([], ['vector<u64>'], '["100","200","300"]')
      const contract = await createMoveContract(createMockContext(mockClient), '0x1', 'test')
      const result = await contract.view.test_view()
      expect(result).toEqual([100n, 200n, 300n])
    })

    it('should return vector<u8> as string unchanged (base64 passthrough)', async () => {
      const mockClient = createViewMockClient([], ['vector<u8>'], '"AQIDBA=="')
      const contract = await createMoveContract(createMockContext(mockClient), '0x1', 'test')
      const result = await contract.view.test_view()
      expect(result).toBe('AQIDBA==')
    })

    it('should convert Option<u64> Some to bigint', async () => {
      const mockClient = createViewMockClient([], ['0x1::option::Option<u64>'], '{"vec":["100"]}')
      const contract = await createMoveContract(createMockContext(mockClient), '0x1', 'test')
      const result = await contract.view.test_view()
      expect(result).toBe(100n)
    })

    it('should convert Option<u64> Some in natural format (raw value)', async () => {
      // Chain may return raw value instead of {"vec":[...]} for Some
      const mockClient = createViewMockClient([], ['0x1::option::Option<u64>'], '"999"')
      const contract = await createMoveContract(createMockContext(mockClient), '0x1', 'test')
      const result = await contract.view.test_view()
      expect(result).toBe(999n)
    })

    it('should convert Option<u64> None to null', async () => {
      const mockClient = createViewMockClient([], ['0x1::option::Option<u64>'], '{"vec":[]}')
      const contract = await createMoveContract(createMockContext(mockClient), '0x1', 'test')
      const result = await contract.view.test_view()
      expect(result).toBeNull()
    })

    it('should convert multiple returns to typed array', async () => {
      const mockClient = createViewMockClient([], ['u64', 'bool'], '["999",true]')
      const contract = await createMoveContract(createMockContext(mockClient), '0x1', 'test')
      const result = await contract.view.test_view()
      expect(result).toEqual([999n, true])
    })

    it('should fallback to raw JSON.parse for unknown return types', async () => {
      const mockClient = createViewMockClient([], ['0x1::custom::UnknownType'], '"some_value"')
      const contract = await createMoveContract(createMockContext(mockClient), '0x1', 'test')
      const result = await contract.view.test_view()
      expect(result).toBe('some_value')
    })

    it('should fallback to raw JSON.parse for generic return (T0)', async () => {
      const mockClient = createViewMockClient([], ['T0'], '"generic_value"', [{ constraints: [] }])
      const contract = await createMoveContract(createMockContext(mockClient), '0x1', 'test')
      const result = await contract.view.test_view()
      expect(result).toBe('generic_value')
    })
  })

  describe('resource query', () => {
    it('should query and parse resource', async () => {
      const mockMoveClient = createDefaultMockMoveClient()
      // Add CoinStore struct to ABI so conversion succeeds
      mockMoveClient.module.mockResolvedValue({
        module: {
          abi: JSON.stringify({
            address: '0x1',
            name: 'coin',
            friends: [],
            exposed_functions: [],
            structs: [
              {
                name: 'CoinStore',
                is_native: false,
                abilities: ['key'],
                generic_type_params: [{ constraints: [] }],
                fields: [{ name: 'value', type: 'u64' }],
              },
            ],
          }),
        },
      })
      const contract = await createMoveContract(createMockContext(mockMoveClient), '0x1', 'coin')

      const result = await contract.resource(
        'init1address...',
        '0x1::coin::CoinStore<0x1::native_uinit::Coin>'
      )

      expect(mockMoveClient.resource).toHaveBeenCalledWith({
        address: 'init1address...',
        structTag: '0x1::coin::CoinStore<0x1::native_uinit::Coin>',
      })
      expect(result).toEqual({ value: 1000000n })
    })

    it('should throw if resource not found', async () => {
      const mockMoveClient = createDefaultMockMoveClient()
      mockMoveClient.resource.mockResolvedValue({ resource: null })
      const contract = await createMoveContract(createMockContext(mockMoveClient), '0x1', 'coin')

      await expect(
        contract.resource('init1address...', '0x1::nonexistent::Resource')
      ).rejects.toThrow('Resource not found')
    })

    it('should auto-convert u64 fields when struct ABI is available', async () => {
      const mockMoveClient = createDefaultMockMoveClient()
      // Return a resource with a u64 field as string (chain JSON format)
      mockMoveClient.resource.mockResolvedValue({
        resource: { moveResource: '{"value":"12345"}' },
      })
      // Mock module to return ABI with a struct that has a u64 field
      mockMoveClient.module.mockResolvedValue({
        module: {
          abi: JSON.stringify({
            address: '0x1',
            name: 'coin',
            friends: [],
            exposed_functions: [],
            structs: [
              {
                name: 'CoinStore',
                is_native: false,
                abilities: ['key'],
                generic_type_params: [],
                fields: [{ name: 'value', type: 'u64' }],
              },
            ],
          }),
        },
      })

      const contract = await createMoveContract(createMockContext(mockMoveClient), '0x1', 'coin')
      const result = await contract.resource('init1address...', '0x1::coin::CoinStore')

      // u64 string "12345" should be converted to bigint 12345n
      expect(result).toEqual({ value: 12345n })
    })

    it('should skip opaque types like Table without resolving', async () => {
      const mockMoveClient = createDefaultMockMoveClient()
      // Resource with a Table field (should remain as-is)
      mockMoveClient.resource.mockResolvedValue({
        resource: {
          moveResource: JSON.stringify({
            balance: '999',
            ledger: { handle: '0xabc' },
          }),
        },
      })
      // Mock module returns struct with a u64 field and a Table field
      mockMoveClient.module.mockResolvedValue({
        module: {
          abi: JSON.stringify({
            address: '0x1',
            name: 'account',
            friends: [],
            exposed_functions: [],
            structs: [
              {
                name: 'Account',
                is_native: false,
                abilities: ['key'],
                generic_type_params: [],
                fields: [
                  { name: 'balance', type: 'u64' },
                  { name: 'ledger', type: '0x1::table::Table<address, u64>' },
                ],
              },
            ],
          }),
        },
      })

      const contract = await createMoveContract(createMockContext(mockMoveClient), '0x1', 'account')
      const result = await contract.resource('init1address...', '0x1::account::Account')

      // balance should be converted (u64), but Table should remain as-is
      expect(result).toEqual({
        balance: 999n,
        ledger: { handle: '0xabc' },
      })
    })

    it('should propagate conversion errors instead of silently returning raw data', async () => {
      const mockMoveClient = createDefaultMockMoveClient()
      mockMoveClient.resource.mockResolvedValue({
        resource: { moveResource: '{"value":"100"}' },
      })

      // First call succeeds (contract creation), subsequent calls fail (resource conversion)
      const contract = await createMoveContract(createMockContext(mockMoveClient), '0x1', 'coin')
      mockMoveClient.module.mockRejectedValue(new Error('gRPC unavailable'))

      await expect(contract.resource('init1address...', '0x1::other::Struct')).rejects.toThrow(
        'gRPC unavailable'
      )
    })
  })

  describe('CreateMoveContractOptions', () => {
    it('should accept opaqueTypes option', async () => {
      const mockMoveClient = createDefaultMockMoveClient()
      // Resource with a custom opaque field
      mockMoveClient.resource.mockResolvedValue({
        resource: {
          moveResource: JSON.stringify({
            value: '100',
            custom: { inner: 'data' },
          }),
        },
      })
      // Mock struct with u64 field and a custom struct field
      mockMoveClient.module.mockResolvedValue({
        module: {
          abi: JSON.stringify({
            address: '0x1',
            name: 'test',
            friends: [],
            exposed_functions: [],
            structs: [
              {
                name: 'MyResource',
                is_native: false,
                abilities: ['key'],
                generic_type_params: [],
                fields: [
                  { name: 'value', type: 'u64' },
                  { name: 'custom', type: '0x1::custom::Opaque' },
                ],
              },
            ],
          }),
        },
      })

      const contract = await createMoveContract(createMockContext(mockMoveClient), '0x1', 'test', {
        opaqueTypes: ['0x1::custom::Opaque'],
      })

      const result = await contract.resource('init1address...', '0x1::test::MyResource')

      // value converted, custom skipped because it's in opaqueTypes
      expect(result).toEqual({
        value: 100n,
        custom: { inner: 'data' },
      })
    })
  })

  describe('table entry query', () => {
    it('should query and parse table entry', async () => {
      const mockMoveClient = createDefaultMockMoveClient()
      const contract = await createMoveContract(createMockContext(mockMoveClient), '0x1', 'coin')

      const result = await contract.tableEntry('0xtablehandle', 'mykey', 'string')

      expect(mockMoveClient.tableEntry).toHaveBeenCalled()
      expect(result).toEqual({ key: 'value' })
    })

    it('should throw if table entry not found', async () => {
      const mockMoveClient = createDefaultMockMoveClient()
      mockMoveClient.tableEntry.mockResolvedValue({ tableEntry: null })
      const contract = await createMoveContract(createMockContext(mockMoveClient), '0x1', 'coin')

      await expect(contract.tableEntry('0xtable', 'key', 'string')).rejects.toThrow(
        'Table entry not found'
      )
    })

    it('should auto-convert u64 fields when valueType is provided', async () => {
      const mockMoveClient = createDefaultMockMoveClient()
      mockMoveClient.tableEntry.mockResolvedValue({
        tableEntry: { value: '{"amount":"100"}' },
      })
      // Mock module to return struct ABI with a u64 field
      mockMoveClient.module.mockResolvedValue({
        module: {
          abi: JSON.stringify({
            address: '0x1',
            name: 'some',
            friends: [],
            exposed_functions: [],
            structs: [
              {
                name: 'Type',
                is_native: false,
                abilities: ['key'],
                generic_type_params: [],
                fields: [{ name: 'amount', type: 'u64' }],
              },
            ],
          }),
        },
      })

      const contract = await createMoveContract(createMockContext(mockMoveClient), '0x1', 'some')

      const result = await contract.tableEntry(
        '0xtablehandle',
        'mykey',
        'string',
        '0x1::some::Type'
      )

      expect(result).toEqual({ amount: 100n })
    })

    it('should not convert values when valueType is not provided', async () => {
      const mockMoveClient = createDefaultMockMoveClient()
      mockMoveClient.tableEntry.mockResolvedValue({
        tableEntry: { value: '{"amount":"100"}' },
      })

      const contract = await createMoveContract(createMockContext(mockMoveClient), '0x1', 'coin')

      const result = await contract.tableEntry('0xtablehandle', 'mykey', 'string')

      // Without valueType, u64 string remains a string
      expect(result).toEqual({ amount: '100' })
    })
  })

  describe('createPublishMsg', () => {
    it('should create MsgPublish with default upgrade policy', () => {
      const msg = createPublishMsg({
        sender: 'init1sender...',
        codeBytes: [new Uint8Array([1, 2, 3])],
      })

      expect(msg.$typeName).toBe('initia.move.v1.MsgPublish')
      expect(msg.sender).toBe('init1sender...')
      expect(msg.codeBytes).toEqual([new Uint8Array([1, 2, 3])])
      expect(msg.upgradePolicy).toBe(UpgradePolicy.COMPATIBLE)
    })

    it('should create MsgPublish with custom upgrade policy', () => {
      const msg = createPublishMsg({
        sender: 'init1sender...',
        codeBytes: [new Uint8Array([1, 2, 3])],
        upgradePolicy: UpgradePolicy.IMMUTABLE,
      })

      expect(msg.upgradePolicy).toBe(UpgradePolicy.IMMUTABLE)
    })

    it('should handle multiple code bytes', () => {
      const msg = createPublishMsg({
        sender: 'init1sender...',
        codeBytes: [new Uint8Array([1]), new Uint8Array([2]), new Uint8Array([3])],
      })

      expect(msg.codeBytes).toHaveLength(3)
    })
  })

  describe('createScriptMsg', () => {
    it('should create MsgScriptJSON', () => {
      const msg = createScriptMsg({
        sender: 'init1sender...',
        codeBytes: new Uint8Array([1, 2, 3]),
        typeArgs: ['0x1::native_uinit::Coin'],
        args: [100, 'hello'],
      })

      expect(msg.$typeName).toBe('initia.move.v1.MsgScriptJSON')
      expect(msg.sender).toBe('init1sender...')
      expect(msg.codeBytes).toEqual(new Uint8Array([1, 2, 3]))
      expect(msg.typeArgs).toEqual(['0x1::native_uinit::Coin'])
      expect(msg.args).toEqual(['100', '"hello"'])
    })

    it('should handle empty args', () => {
      const msg = createScriptMsg({
        sender: 'init1sender...',
        codeBytes: new Uint8Array([1]),
      })

      expect(msg.args).toEqual([])
      expect(msg.typeArgs).toEqual([])
    })

    it('should handle Uint8Array args', () => {
      const msg = createScriptMsg({
        sender: 'init1sender...',
        codeBytes: new Uint8Array([1]),
        args: [new Uint8Array([1, 2, 3])],
      })

      expect(msg.args).toEqual(['[1,2,3]'])
    })

    it('should handle bigint args without crashing', () => {
      const msg = createScriptMsg({
        sender: 'sender',
        codeBytes: new Uint8Array([1]),
        typeArgs: [],
        args: [1000000n],
      })
      expect(msg.args[0]).toBe('"1000000"')
    })

    it('should preserve Uint8Array args after bigint fix', () => {
      const msg = createScriptMsg({
        sender: 'sender',
        codeBytes: new Uint8Array([1]),
        typeArgs: [],
        args: [new Uint8Array([1, 2, 3]), 1000000n],
      })
      expect(msg.args[0]).toBe('[1,2,3]')
      expect(msg.args[1]).toBe('"1000000"')
    })
  })

  describe('createExecuteMsg', () => {
    it('should create MsgExecuteJSON directly', () => {
      const msg = createExecuteMsg(
        'init1sender...',
        '0x1',
        'coin',
        'transfer',
        ['0x1::native_uinit::Coin'],
        ['init1recipient...', '1000000']
      )

      expect(msg.$typeName).toBe('initia.move.v1.MsgExecuteJSON')
      expect(msg.sender).toBe('init1sender...')
      expect(msg.moduleAddress).toBe('0x1')
      expect(msg.moduleName).toBe('coin')
      expect(msg.functionName).toBe('transfer')
      expect(msg.typeArgs).toEqual(['0x1::native_uinit::Coin'])
      expect(msg.args).toEqual(['"init1recipient..."', '"1000000"'])
    })

    it('should handle empty args', () => {
      const msg = createExecuteMsg('sender', '0x1', 'module', 'func')

      expect(msg.typeArgs).toEqual([])
      expect(msg.args).toEqual([])
    })

    it('should handle bigint args without crashing', () => {
      const msg = createExecuteMsg(
        'sender',
        '0x1',
        'coin',
        'transfer',
        ['0x1::native_uinit::Coin'],
        ['0xrecipient', 1000000n]
      )
      expect(msg.args[1]).toBe('"1000000"')
    })
  })

  describe('callViewFunction', () => {
    it('should call view function directly', async () => {
      const mockMoveClient = createDefaultMockMoveClient()

      const result = await callViewFunction(
        createMockContext(mockMoveClient),
        '0x1',
        'coin',
        'balance',
        ['0x1::native_uinit::Coin'],
        ['init1address...']
      )

      expect(mockMoveClient.viewJSON).toHaveBeenCalledWith({
        address: '0x1',
        moduleName: 'coin',
        functionName: 'balance',
        typeArgs: ['0x1::native_uinit::Coin'],
        args: ['"init1address..."'],
      })
      expect(result).toBe('1000000')
    })

    it('should handle bigint args without crashing', async () => {
      const mockClient = createDefaultMockMoveClient()
      const ctx = createMockContext(mockClient)

      await callViewFunction(ctx, '0x1', 'coin', 'balance', ['0x1::native_uinit::Coin'], [1000000n])

      expect(mockClient.viewJSON).toHaveBeenCalledWith(
        expect.objectContaining({
          args: ['"1000000"'],
        })
      )
    })
  })

  describe('queryResource', () => {
    it('should query resource directly', async () => {
      const mockMoveClient = createDefaultMockMoveClient()
      mockMoveClient.module.mockResolvedValue({
        module: {
          abi: JSON.stringify({
            address: '0x1',
            name: 'coin',
            friends: [],
            exposed_functions: [],
            structs: [
              {
                name: 'CoinStore',
                is_native: false,
                abilities: ['key'],
                generic_type_params: [{ constraints: [] }],
                fields: [{ name: 'value', type: 'u64' }],
              },
            ],
          }),
        },
      })

      const result = await queryResource(
        createMockContext(mockMoveClient),
        'init1address...',
        '0x1::coin::CoinStore<0x1::native_uinit::Coin>'
      )

      expect(result).toEqual({ value: 1000000n })
    })

    it('should throw if resource not found', async () => {
      const mockMoveClient = createDefaultMockMoveClient()
      mockMoveClient.resource.mockResolvedValue({ resource: null })

      await expect(
        queryResource(
          createMockContext(mockMoveClient),
          'init1address...',
          '0x1::nonexistent::Resource'
        )
      ).rejects.toThrow('Resource not found')
    })

    it('should auto-convert u64 strings to bigint by default', async () => {
      const mockMoveClient = createDefaultMockMoveClient()
      mockMoveClient.resource.mockResolvedValue({
        resource: { moveResource: '{"value":"12345"}' },
      })
      // Mock module to return struct ABI with u64 field
      mockMoveClient.module.mockResolvedValue({
        module: {
          abi: JSON.stringify({
            address: '0x1',
            name: 'coin',
            friends: [],
            exposed_functions: [],
            structs: [
              {
                name: 'CoinStore',
                is_native: false,
                abilities: ['key'],
                generic_type_params: [],
                fields: [{ name: 'value', type: 'u64' }],
              },
            ],
          }),
        },
      })

      const result = await queryResource(
        createMockContext(mockMoveClient),
        'init1address...',
        '0x1::coin::CoinStore'
      )

      // u64 string "12345" should be converted to bigint by default
      expect(result).toEqual({ value: 12345n })
    })

    it('should not convert values when convert: false', async () => {
      const mockMoveClient = createDefaultMockMoveClient()
      mockMoveClient.resource.mockResolvedValue({
        resource: { moveResource: '{"value":"12345"}' },
      })

      const result = await queryResource(
        createMockContext(mockMoveClient),
        'init1address...',
        '0x1::coin::CoinStore',
        { convert: false }
      )

      // With convert: false, u64 string remains a string
      expect(result).toEqual({ value: '12345' })
    })

    it('should respect opaqueTypes option when converting', async () => {
      const mockMoveClient = createDefaultMockMoveClient()
      mockMoveClient.resource.mockResolvedValue({
        resource: {
          moveResource: JSON.stringify({
            balance: '500',
            data: { inner: 'opaque' },
          }),
        },
      })
      // Mock module to return struct ABI
      mockMoveClient.module.mockResolvedValue({
        module: {
          abi: JSON.stringify({
            address: '0x1',
            name: 'test',
            friends: [],
            exposed_functions: [],
            structs: [
              {
                name: 'MyStruct',
                is_native: false,
                abilities: ['key'],
                generic_type_params: [],
                fields: [
                  { name: 'balance', type: 'u64' },
                  { name: 'data', type: '0x1::custom::Opaque' },
                ],
              },
            ],
          }),
        },
      })

      const result = await queryResource(
        createMockContext(mockMoveClient),
        'init1address...',
        '0x1::test::MyStruct',
        { convert: true, opaqueTypes: ['0x1::custom::Opaque'] }
      )

      // balance converted, custom opaque type skipped
      expect(result).toEqual({
        balance: 500n,
        data: { inner: 'opaque' },
      })
    })

    it('should propagate conversion errors instead of silently returning raw data', async () => {
      const mockMoveClient = createDefaultMockMoveClient()
      mockMoveClient.resource.mockResolvedValue({
        resource: { moveResource: '{"value":"100"}' },
      })
      mockMoveClient.module.mockRejectedValue(new Error('gRPC unavailable'))

      await expect(
        queryResource(createMockContext(mockMoveClient), 'init1address...', '0x1::other::Struct')
      ).rejects.toThrow('gRPC unavailable')
    })
  })

  describe('queryTableEntry', () => {
    it('should query table entry directly', async () => {
      const mockMoveClient = createDefaultMockMoveClient()

      const result = await queryTableEntry(
        createMockContext(mockMoveClient),
        '0xtable',
        'key',
        'string'
      )

      expect(result).toEqual({ key: 'value' })
    })

    it('should not convert values when valueType is not provided', async () => {
      const mockMoveClient = createDefaultMockMoveClient()
      mockMoveClient.tableEntry.mockResolvedValue({
        tableEntry: { value: '{"amount":"999"}' },
      })

      const result = await queryTableEntry(
        createMockContext(mockMoveClient),
        '0xtable',
        'mykey',
        'string'
      )

      // Without valueType, u64 string remains a string
      expect(result).toEqual({ amount: '999' })
    })

    it('should convert u64 strings to bigint when valueType is provided', async () => {
      const mockMoveClient = createDefaultMockMoveClient()
      mockMoveClient.tableEntry.mockResolvedValue({
        tableEntry: { value: '{"amount":"999"}' },
      })
      // Mock module to return struct ABI with u64 field
      mockMoveClient.module.mockResolvedValue({
        module: {
          abi: JSON.stringify({
            address: '0x1',
            name: 'stake',
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
          }),
        },
      })

      const result = await queryTableEntry(
        createMockContext(mockMoveClient),
        '0xtable',
        'mykey',
        'string',
        '0x1::stake::StakeInfo'
      )

      // u64 string "999" should be converted to bigint
      expect(result).toEqual({ amount: 999n })
    })

    it('should respect opaqueTypes option when converting', async () => {
      const mockMoveClient = createDefaultMockMoveClient()
      mockMoveClient.tableEntry.mockResolvedValue({
        tableEntry: { value: '{"balance":"100","data":{"inner":"opaque"}}' },
      })
      mockMoveClient.module.mockResolvedValue({
        module: {
          abi: JSON.stringify({
            address: '0x1',
            name: 'test',
            friends: [],
            exposed_functions: [],
            structs: [
              {
                name: 'Entry',
                is_native: false,
                abilities: ['key'],
                generic_type_params: [],
                fields: [
                  { name: 'balance', type: 'u64' },
                  { name: 'data', type: '0x1::custom::Opaque' },
                ],
              },
            ],
          }),
        },
      })

      const result = await queryTableEntry(
        createMockContext(mockMoveClient),
        '0xtable',
        'mykey',
        'string',
        '0x1::test::Entry',
        { opaqueTypes: ['0x1::custom::Opaque'] }
      )

      expect(result).toEqual({
        balance: 100n,
        data: { inner: 'opaque' },
      })
    })

    it('should propagate ABI fetch errors when valueType is provided', async () => {
      const mockMoveClient = createDefaultMockMoveClient()
      mockMoveClient.tableEntry.mockResolvedValue({
        tableEntry: { value: '{"amount":"100"}' },
      })
      mockMoveClient.module.mockRejectedValue(new Error('gRPC unavailable'))

      await expect(
        queryTableEntry(
          createMockContext(mockMoveClient),
          '0xtable',
          'mykey',
          'string',
          '0x1::stake::StakeInfo'
        )
      ).rejects.toThrow('gRPC unavailable')
    })
  })
})

// =============================================================================
// BCS Execute Proxy — Type Encoding & Address Handling
// =============================================================================

describe('BCS execute proxy', () => {
  beforeEach(() => {
    clearAbiCache()
    vi.clearAllMocks()
  })

  // --- Address encoding ---

  it('should convert bech32 address to BCS bytes', async () => {
    const mockClient = createTypedMockClient([
      'address',
      '0x1::object::Object<0x1::fungible_asset::Metadata>',
      'u64',
    ])
    const contract = await createMoveContract(createMockContext(mockClient), '0x1', 'test')

    const msg = contract.execute.test_fn('init1sender', {
      args: [MOVE_BECH32_ADDR, MOVE_HEX_ADDR, '10000'],
    })

    expect(fields(msg).$typeName).toBe('initia.move.v1.MsgExecute')
    const expectedAddrBytes = encodeMoveArg(MOVE_HEX_ADDR, 'address')
    expect(fields(msg).args[0]).toEqual(expectedAddrBytes)
  })

  it('should convert bech32 in Object<T> param to BCS bytes', async () => {
    const mockClient = createTypedMockClient([
      'address',
      '0x1::object::Object<0x1::fungible_asset::Metadata>',
      'u64',
    ])
    const contract = await createMoveContract(createMockContext(mockClient), '0x1', 'test')

    const msg = contract.execute.test_fn('init1sender', {
      args: [MOVE_BECH32_ADDR, MOVE_BECH32_ADDR, '10000'],
    })

    const expectedAddrBytes = encodeMoveArg(MOVE_HEX_ADDR, 'address')
    expect(fields(msg).args[0]).toEqual(expectedAddrBytes)
    expect(fields(msg).args[1]).toEqual(expectedAddrBytes)
  })

  it('should handle cross-chain bech32 addresses (noble1, cosmos1)', async () => {
    const mockClient = createTypedMockClient(['address'])
    const contract = await createMoveContract(createMockContext(mockClient), '0x1', 'test')

    const nobleAddr = AccAddress.fromHex(MOVE_HEX_ADDR, { prefix: 'noble' })
    const cosmosAddr = AccAddress.fromHex(MOVE_HEX_ADDR, { prefix: 'cosmos' })

    const msgNoble = contract.execute.test_fn('sender', { args: [nobleAddr] })
    const msgCosmos = contract.execute.test_fn('sender', { args: [cosmosAddr] })
    const msgHex = contract.execute.test_fn('sender', { args: [MOVE_HEX_ADDR] })

    expect(fields(msgNoble).args[0]).toEqual(fields(msgHex).args[0])
    expect(fields(msgCosmos).args[0]).toEqual(fields(msgHex).args[0])
  })

  // --- Type encoding ---

  it('should encode primitive types: bool, u8, u64, u128, u256', async () => {
    const mockClient = createTypedMockClient(['bool', 'u8', 'u64', 'u128', 'u256'])
    const contract = await createMoveContract(createMockContext(mockClient), '0x1', 'test')

    const msg = contract.execute.test_fn('sender', {
      args: [true, 42, '1000000', '99999999999999999999', '1234567890'],
    })

    const v = fields(msg)
    expect(v.$typeName).toBe('initia.move.v1.MsgExecute')
    expect(v.args).toHaveLength(5)
    expect(v.args[0]).toEqual(encodeMoveArg(true, 'bool'))
    expect(v.args[1]).toEqual(encodeMoveArg(42, 'u8'))
    expect(v.args[2]).toEqual(encodeMoveArg('1000000', 'u64'))
    expect(v.args[3]).toEqual(encodeMoveArg('99999999999999999999', 'u128'))
    expect(v.args[4]).toEqual(encodeMoveArg('1234567890', 'u256'))
  })

  it('should encode 0x1::string::String as BCS string', async () => {
    const mockClient = createTypedMockClient(['0x1::string::String'])
    const contract = await createMoveContract(createMockContext(mockClient), '0x1', 'test')

    const msg = contract.execute.test_fn('sender', { args: ['hello world'] })

    const v = fields(msg)
    expect(v.$typeName).toBe('initia.move.v1.MsgExecute')
    expect(v.args[0]).toEqual(encodeMoveArg('hello world', '0x1::string::String'))
  })

  it('should encode vector<u8> as BCS byteVector', async () => {
    const mockClient = createTypedMockClient(['vector<u8>'])
    const contract = await createMoveContract(createMockContext(mockClient), '0x1', 'test')

    const bytes = new Uint8Array([1, 2, 3, 4, 5])
    const msg = contract.execute.test_fn('sender', { args: [bytes] })

    const v = fields(msg)
    expect(v.$typeName).toBe('initia.move.v1.MsgExecute')
    expect(v.args[0]).toEqual(encodeMoveArg(bytes, 'vector<u8>'))
  })

  it('should encode Option<u64> as BCS option', async () => {
    const mockClient = createTypedMockClient(['0x1::option::Option<u64>'])
    const contract = await createMoveContract(createMockContext(mockClient), '0x1', 'test')

    const msg = contract.execute.test_fn('sender', { args: ['1000'] })

    const v = fields(msg)
    expect(v.$typeName).toBe('initia.move.v1.MsgExecute')
    expect(v.args[0]).toEqual(encodeMoveArg('1000', '0x1::option::Option<u64>'))
  })

  // --- JSON fallback ---

  it('should fall back to MsgExecuteJSON for generic params (T0)', async () => {
    const mockClient = createTypedMockClient(['T0', 'u64'], [{ constraints: [] }])
    const contract = await createMoveContract(createMockContext(mockClient), '0x1', 'test')

    const msg = contract.execute.test_fn('sender', {
      typeArgs: ['0x1::native_uinit::Coin'],
      args: ['some_value', '1000'],
    })

    const v = fields(msg)
    expect(v.$typeName).toBe('initia.move.v1.MsgExecuteJSON')
    expect(v.args).toEqual(['"some_value"', '"1000"'])
  })

  it('should fall back to MsgExecuteJSON for unknown module types', async () => {
    const mockClient = createTypedMockClient(['0x1::custom_module::CustomStruct'])
    const contract = await createMoveContract(createMockContext(mockClient), '0x1', 'test')

    const msg = contract.execute.test_fn('sender', { args: ['custom_value'] })

    const v = fields(msg)
    expect(v.$typeName).toBe('initia.move.v1.MsgExecuteJSON')
    expect(v.args).toEqual(['"custom_value"'])
  })
})

// =============================================================================
// Generic Type Resolution (Phase 3)
// =============================================================================

describe('generic type resolution', () => {
  beforeEach(() => {
    clearAbiCache()
    vi.clearAllMocks()
  })

  // --- Execute proxy ---

  it('should resolve T0 to u64 and use BCS path', async () => {
    const mockClient = createTypedMockClient(['T0', 'u64'], [{ constraints: [] }])
    const contract = await createMoveContract(createMockContext(mockClient), '0x1', 'test')

    const msg = contract.execute.test_fn('sender', {
      typeArgs: ['u64'],
      args: ['1000', '2000'],
    })

    const v = fields(msg)
    expect(v.$typeName).toBe('initia.move.v1.MsgExecute')
    expect(v.args).toHaveLength(2)
    expect(v.args[0]).toEqual(encodeMoveArg('1000', 'u64'))
    expect(v.args[1]).toEqual(encodeMoveArg('2000', 'u64'))
  })

  it('should resolve T0 to address and convert bech32', async () => {
    const mockClient = createTypedMockClient(['T0'], [{ constraints: [] }])
    const contract = await createMoveContract(createMockContext(mockClient), '0x1', 'test')

    const msg = contract.execute.test_fn('sender', {
      typeArgs: ['address'],
      args: [MOVE_BECH32_ADDR],
    })

    const v = fields(msg)
    expect(v.$typeName).toBe('initia.move.v1.MsgExecute')
    expect(v.args[0]).toEqual(encodeMoveArg(MOVE_HEX_ADDR, 'address'))
  })

  it('should resolve vector<T0> to vector<u64> and use BCS path', async () => {
    const mockClient = createTypedMockClient(['vector<T0>'], [{ constraints: [] }])
    const contract = await createMoveContract(createMockContext(mockClient), '0x1', 'test')

    const msg = contract.execute.test_fn('sender', {
      typeArgs: ['u64'],
      args: [['100', '200']],
    })

    const v = fields(msg)
    expect(v.$typeName).toBe('initia.move.v1.MsgExecute')
    expect(v.args).toHaveLength(1)
    expect(v.args[0]).toBeInstanceOf(Uint8Array)
  })

  it('should fall back to JSON when T0 has no typeArgs', async () => {
    const mockClient = createTypedMockClient(['T0', 'u64'], [{ constraints: [] }])
    const contract = await createMoveContract(createMockContext(mockClient), '0x1', 'test')

    const msg = contract.execute.test_fn('sender', {
      args: ['some_value', '1000'],
    })

    const v = fields(msg)
    expect(v.$typeName).toBe('initia.move.v1.MsgExecuteJSON')
    expect(v.args).toEqual(['"some_value"', '"1000"'])
  })

  // --- View proxy ---

  it('should resolve T0 return to u64 and convert to bigint', async () => {
    const mockClient = createViewMockClient([], ['T0'], '"1000000"', [{ constraints: [] }])
    const contract = await createMoveContract(createMockContext(mockClient), '0x1', 'test')

    const result = await contract.view.test_view({
      typeArgs: ['u64'],
    })

    expect(result).toBe(1000000n)
  })

  it('should resolve T0 return to vector<u64> and convert elements to bigint', async () => {
    const mockClient = createViewMockClient([], ['vector<T0>'], '["100","200","300"]', [
      { constraints: [] },
    ])
    const contract = await createMoveContract(createMockContext(mockClient), '0x1', 'test')

    const result = await contract.view.test_view({
      typeArgs: ['u64'],
    })

    expect(result).toEqual([100n, 200n, 300n])
  })

  it('should resolve T0 param to address and convert bech32 in view args', async () => {
    const mockClient = createViewMockClient(['T0'], ['u64'], '"42"', [{ constraints: [] }])
    const contract = await createMoveContract(createMockContext(mockClient), '0x1', 'test')

    await contract.view.test_view({
      typeArgs: ['address'],
      args: [MOVE_BECH32_ADDR],
    })

    expect(mockClient.viewJSON).toHaveBeenCalledWith({
      address: '0x1',
      moduleName: 'test',
      functionName: 'test_view',
      typeArgs: ['address'],
      args: [JSON.stringify(MOVE_HEX_ADDR)],
    })
  })

  it('should fall back to JSON when T index exceeds typeArgs length', async () => {
    const mockClient = createTypedMockClient(
      ['T2', 'u64'],
      [{ constraints: [] }, { constraints: [] }, { constraints: [] }]
    )
    const contract = await createMoveContract(createMockContext(mockClient), '0x1', 'test')

    // T2 with only 1 typeArg → T2 remains unresolved → JSON fallback
    const msg = contract.execute.test_fn('sender', {
      typeArgs: ['u64'],
      args: ['val', '100'],
    })

    const v = fields(msg)
    expect(v.$typeName).toBe('initia.move.v1.MsgExecuteJSON')
  })
})

// =============================================================================
// Static ABI Type Inference (Phase 4)
// =============================================================================

const STATIC_ABI = {
  address: '0x1',
  name: 'coin',
  friends: [],
  exposed_functions: [
    {
      name: 'transfer',
      visibility: 'public',
      is_entry: true,
      is_view: false,
      generic_type_params: [{ constraints: [] }],
      params: ['&signer', 'address', 'u64'],
      return: [],
    },
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
      name: 'decimals',
      visibility: 'public',
      is_entry: false,
      is_view: true,
      generic_type_params: [],
      params: ['0x1::string::String'],
      return: ['u8'],
    },
    {
      name: 'name',
      visibility: 'public',
      is_entry: false,
      is_view: true,
      generic_type_params: [],
      params: [],
      return: ['0x1::string::String'],
    },
    {
      name: 'multi_return',
      visibility: 'public',
      is_entry: false,
      is_view: true,
      generic_type_params: [],
      params: ['address'],
      return: ['bool', 'u64'],
    },
  ],
  structs: [],
} as const satisfies ReadonlyMoveModuleAbi

describe('static ABI type inference (Phase 4)', () => {
  // -------------------------------------------------------------------------
  // Type-level tests (compile-time only — no runtime assertions)
  // -------------------------------------------------------------------------

  it('1. MoveTypeToTs maps Move primitives to TS types', () => {
    expectTypeOf<MoveTypeToTs<'bool'>>().toEqualTypeOf<boolean>()
    expectTypeOf<MoveTypeToTs<'u8'>>().toEqualTypeOf<number>()
    expectTypeOf<MoveTypeToTs<'u16'>>().toEqualTypeOf<number>()
    expectTypeOf<MoveTypeToTs<'u32'>>().toEqualTypeOf<number>()
    expectTypeOf<MoveTypeToTs<'u64'>>().toEqualTypeOf<bigint>()
    expectTypeOf<MoveTypeToTs<'u128'>>().toEqualTypeOf<bigint>()
    expectTypeOf<MoveTypeToTs<'u256'>>().toEqualTypeOf<bigint>()
    expectTypeOf<MoveTypeToTs<'address'>>().toEqualTypeOf<`0x${string}`>()
    expectTypeOf<MoveTypeToTs<'0x1::string::String'>>().toEqualTypeOf<string>()
    expectTypeOf<MoveTypeToTs<'vector<u8>'>>().toEqualTypeOf<number[]>()
    expectTypeOf<MoveTypeToTs<'0x1::object::Object<T0>'>>().toEqualTypeOf<`0x${string}`>()
    expectTypeOf<MoveTypeToTs<'0x1::option::Option<u64>'>>().toEqualTypeOf<bigint | null>()
    // Unknown type → unknown
    expectTypeOf<MoveTypeToTs<'SomeCustomStruct'>>().toEqualTypeOf<unknown>()
  })

  it('2. MoveReturnToTs handles void, single, and multi returns', () => {
    expectTypeOf<MoveReturnToTs<readonly []>>().toEqualTypeOf<void>()
    expectTypeOf<MoveReturnToTs<readonly ['u64']>>().toEqualTypeOf<bigint>()
    // Multi-return: verify individual element types (avoids readonly/mutable tuple compat issue)
    type MultiReturn = MoveReturnToTs<readonly ['bool', 'u64']>
    expectTypeOf<MultiReturn[0]>().toEqualTypeOf<boolean>()
    expectTypeOf<MultiReturn[1]>().toEqualTypeOf<bigint>()
  })

  it('3. FilterSigner removes &signer from params', () => {
    // Verify element types individually (avoids readonly/mutable tuple compat issue)
    type Filtered = FilterSigner<readonly ['&signer', 'address', 'u64']>
    expectTypeOf<Filtered[0]>().toEqualTypeOf<'address'>()
    expectTypeOf<Filtered[1]>().toEqualTypeOf<'u64'>()
    // No signer → unchanged
    type NoSigner = FilterSigner<readonly ['address', 'u64']>
    expectTypeOf<NoSigner[0]>().toEqualTypeOf<'address'>()
    expectTypeOf<NoSigner[1]>().toEqualTypeOf<'u64'>()
    // Multiple signers
    type MultiSigner = FilterSigner<readonly ['&signer', '&signer', 'u64']>
    expectTypeOf<MultiSigner[0]>().toEqualTypeOf<'u64'>()
  })

  it('4. MoveViewProxyTyped: non-generic → typed, generic → unknown', () => {
    type ViewProxy = MoveViewProxyTyped<typeof STATIC_ABI>

    // Non-generic 'decimals' → typed return (number from u8)
    type DecimalsReturn = Awaited<ReturnType<ViewProxy['decimals']>>
    expectTypeOf<DecimalsReturn>().toEqualTypeOf<number>()

    // Non-generic 'name' → typed return (string from 0x1::string::String)
    type NameReturn = Awaited<ReturnType<ViewProxy['name']>>
    expectTypeOf<NameReturn>().toEqualTypeOf<string>()

    // Non-generic 'multi_return' → tuple [boolean, bigint]
    type MultiReturn = Awaited<ReturnType<ViewProxy['multi_return']>>
    expectTypeOf<MultiReturn[0]>().toEqualTypeOf<boolean>()
    expectTypeOf<MultiReturn[1]>().toEqualTypeOf<bigint>()

    // Generic 'balance' → unknown (has generic_type_params)
    type BalanceReturn = Awaited<ReturnType<ViewProxy['balance']>>
    expectTypeOf<BalanceReturn>().toEqualTypeOf<unknown>()
  })

  it('5. MoveExecuteProxyTyped: only entry functions appear as keys', () => {
    type ExecProxy = MoveExecuteProxyTyped<typeof STATIC_ABI>

    // 'transfer' is entry → should be a key
    expectTypeOf<ExecProxy>().toHaveProperty('transfer')

    // 'balance' is view-only → should NOT be a key
    type HasBalance = 'balance' extends keyof ExecProxy ? true : false
    expectTypeOf<HasBalance>().toEqualTypeOf<false>()

    // 'decimals' is view-only → should NOT be a key
    type HasDecimals = 'decimals' extends keyof ExecProxy ? true : false
    expectTypeOf<HasDecimals>().toEqualTypeOf<false>()
  })

  it('6. TypedMoveContract has typed execute + view proxies', () => {
    type Contract = TypedMoveContract<typeof STATIC_ABI>

    // Has execute proxy with 'transfer'
    expectTypeOf<Contract['execute']>().toHaveProperty('transfer')

    // Has view proxy with 'decimals', 'balance', 'name'
    expectTypeOf<Contract['view']>().toHaveProperty('decimals')
    expectTypeOf<Contract['view']>().toHaveProperty('balance')
    expectTypeOf<Contract['view']>().toHaveProperty('name')

    // abi is the static ABI type
    expectTypeOf<Contract['abi']>().toEqualTypeOf<typeof STATIC_ABI>()

    // Still has non-proxy members
    expectTypeOf<Contract>().toHaveProperty('moduleAddress')
    expectTypeOf<Contract>().toHaveProperty('moduleName')
    expectTypeOf<Contract>().toHaveProperty('resource')
  })

  it('7. @ts-expect-error: wrong return type assignment', () => {
    type ViewProxy = MoveViewProxyTyped<typeof STATIC_ABI>
    type DecimalsReturn = Awaited<ReturnType<ViewProxy['decimals']>>

    // number is correct
    expectTypeOf<DecimalsReturn>().toMatchTypeOf<number>()

    // string should NOT match number
    // @ts-expect-error — string is not assignable to number
    expectTypeOf<DecimalsReturn>().toEqualTypeOf<string>()
  })

  it('8. @ts-expect-error: wrong arg count in typed call options', () => {
    type ViewProxy = MoveViewProxyTyped<typeof STATIC_ABI>

    // 'decimals' expects args: [string] (from '0x1::string::String')
    // Passing wrong type should be caught at compile time
    type DecimalsFn = ViewProxy['decimals']
    type ExpectedArgs = Parameters<DecimalsFn>[0]['args']
    // Single arg of type string (from '0x1::string::String')
    expectTypeOf<ExpectedArgs[0]>().toEqualTypeOf<string>()

    // Wrong length should fail
    // @ts-expect-error — [string, string] is not assignable to single-element args
    expectTypeOf<[string, string]>().toEqualTypeOf<ExpectedArgs>()
  })

  // -------------------------------------------------------------------------
  // Runtime tests
  // -------------------------------------------------------------------------

  it('9. createMoveContract with static ABI returns sync (not Promise)', () => {
    const mockClient = createDefaultMockMoveClient()
    const ctx = createMockContext(mockClient)

    const contract = createMoveContract(ctx, STATIC_ABI)

    // Sync — not a Promise
    expect(contract).not.toBeInstanceOf(Promise)
    expect(contract.moduleAddress).toBe('0x1')
    expect(contract.moduleName).toBe('coin')
    expect(contract.abi).toEqual(STATIC_ABI)
  })

  it('10. static ABI execute proxy creates correct MsgExecute', () => {
    const mockClient = createDefaultMockMoveClient()
    const ctx = createMockContext(mockClient)
    const contract = createMoveContract(ctx, STATIC_ABI)

    const msg = contract.execute.transfer(MOVE_BECH32_ADDR, {
      typeArgs: ['0x1::native_uinit::Coin'],
      args: [MOVE_HEX_ADDR, 1000000n],
    })

    expect(fields(msg).moduleName).toBe('coin')
    expect(fields(msg).functionName).toBe('transfer')
    expect(fields(msg).typeArgs).toEqual(['0x1::native_uinit::Coin'])
  })

  it('11. static ABI view proxy returns response', async () => {
    const mockClient = createDefaultMockMoveClient()
    const ctx = createMockContext(mockClient)
    const contract = createMoveContract(ctx, STATIC_ABI)

    const result = await contract.view.balance({
      typeArgs: ['0x1::native_uinit::Coin'],
      args: [MOVE_HEX_ADDR],
    })

    // viewJSON mock returns '"1000000"' → typed conversion: bigint
    expect(result).toBe(1000000n)
    expect(mockClient.viewJSON).toHaveBeenCalledWith({
      address: '0x1',
      moduleName: 'coin',
      functionName: 'balance',
      typeArgs: ['0x1::native_uinit::Coin'],
      args: [JSON.stringify(MOVE_HEX_ADDR)],
    })
  })
})

// =============================================================================
// Mid-Level Standalone Functions (Phase 5)
// =============================================================================

describe('mid-level standalone functions (Phase 5)', () => {
  // -------------------------------------------------------------------------
  // buildMoveExecute
  // -------------------------------------------------------------------------

  describe('buildMoveExecute', () => {
    it('1. JSON path (no paramTypes) creates MsgExecuteJSON', () => {
      const msg = buildMoveExecute('sender', {
        function: '0x1::coin::transfer',
        typeArgs: ['0x1::native_uinit::Coin'],
        args: ['0xrecipient', '1000000'],
      })

      expect(fields(msg).moduleAddress).toBe('0x1')
      expect(fields(msg).moduleName).toBe('coin')
      expect(fields(msg).functionName).toBe('transfer')
      expect(fields(msg).typeArgs).toEqual(['0x1::native_uinit::Coin'])
      // JSON path: args are JSON.stringify'd strings
      expect(fields(msg).args).toEqual(['"0xrecipient"', '"1000000"'])
    })

    it('2. BCS path (paramTypes, all resolvable) creates MsgExecute', () => {
      const msg = buildMoveExecute('sender', {
        function: '0x1::coin::transfer',
        args: [MOVE_HEX_ADDR, 1000000n],
        paramTypes: ['address', 'u64'],
      })

      expect(fields(msg).moduleAddress).toBe('0x1')
      expect(fields(msg).moduleName).toBe('coin')
      expect(fields(msg).functionName).toBe('transfer')
      // BCS path: args are Uint8Array
      expect(fields(msg).args[0]).toBeInstanceOf(Uint8Array)
      expect(fields(msg).args[1]).toBeInstanceOf(Uint8Array)
    })

    it('3. bech32 address conversion in BCS path', () => {
      const msg = buildMoveExecute('sender', {
        function: '0x1::coin::transfer',
        args: [MOVE_BECH32_ADDR, 1000000n],
        paramTypes: ['address', 'u64'],
      })

      // bech32 handled by encodeMoveArgs via initiaAddress BCS type
      expect(fields(msg).args[0]).toBeInstanceOf(Uint8Array)
      expect(fields(msg).args[0].length).toBe(32)
    })

    it('4. JSON fallback with unknown struct type', () => {
      const msg = buildMoveExecute('sender', {
        function: '0x1::test::call',
        args: ['some_value'],
        paramTypes: ['0x1::unknown_module::UnknownStruct'],
      })

      // Unknown struct → allTypesResolvable false → JSON fallback
      expect(typeof fields(msg).args[0]).toBe('string')
      expect(fields(msg).args[0]).toBe('"some_value"')
    })

    it('5. invalid function identifier throws ContractError', () => {
      expect(() => buildMoveExecute('sender', { function: 'invalid' })).toThrow(
        'Invalid Move function identifier'
      )

      expect(() => buildMoveExecute('sender', { function: '0x1::coin' })).toThrow(
        'Invalid Move function identifier'
      )
    })

    it('6. generic T0 resolution via typeArgs', () => {
      const msg = buildMoveExecute('sender', {
        function: '0x1::coin::transfer',
        typeArgs: ['u64'],
        args: [1000000n],
        paramTypes: ['T0'],
      })

      // T0 → resolved to 'u64' → allTypesResolvable true → BCS path
      expect(fields(msg).args[0]).toBeInstanceOf(Uint8Array)
    })

    it('7. JSON fallback: bigint u64 with unknown struct produces quoted string', () => {
      // Unknown struct forces allTypesResolvable → false → JSON fallback path
      const msg = buildMoveExecute('sender', {
        function: '0x1::test::call',
        args: [1000000n, '0xabc'],
        paramTypes: ['u64', '0x1::custom::UnknownStruct'],
      })
      expect(fields(msg).args[0]).toBe('"1000000"')
      expect(fields(msg).args[1]).toBe('"0xabc"')
    })

    it('8. JSON fallback: number u64 with unknown struct produces quoted string', () => {
      const msg = buildMoveExecute('sender', {
        function: '0x1::test::call',
        args: [1000000, '0xabc'],
        paramTypes: ['u64', '0x1::custom::UnknownStruct'],
      })
      expect(fields(msg).args[0]).toBe('"1000000"')
    })

    it('9. JSON fallback: bigint u128 max produces correct decimal', () => {
      const large = 340282366920938463463374607431768211455n // 2^128 - 1
      const msg = buildMoveExecute('sender', {
        function: '0x1::test::call',
        args: [large, 'foo'],
        paramTypes: ['u128', '0x1::custom::UnknownStruct'],
      })
      expect(fields(msg).args[0]).toBe(`"${large.toString()}"`)
    })

    it('10. JSON fallback: unsafe number 1e21 with uint paramType throws', () => {
      // 1e21 is not a safe integer (> 2^53-1), must use bigint
      expect(() =>
        buildMoveExecute('sender', {
          function: '0x1::test::call',
          args: [1e21, 'foo'],
          paramTypes: ['u64', '0x1::custom::UnknownStruct'],
        })
      ).toThrow('Unsafe number')
    })

    it('11. JSON fallback: bigint without known uint paramType produces quoted string', () => {
      const msg = buildMoveExecute('sender', {
        function: '0x1::test::call',
        args: [1000000n],
        paramTypes: ['0x1::custom::UnknownStruct'],
      })
      expect(fields(msg).args[0]).toBe('"1000000"')
    })

    it('12. JSON fallback: non-integer number with uint paramType throws', () => {
      expect(() =>
        buildMoveExecute('sender', {
          function: '0x1::test::call',
          args: [1.5, 'foo'],
          paramTypes: ['u64', '0x1::custom::UnknownStruct'],
        })
      ).toThrow('Unsafe number')
    })

    it('13. JSON fallback: unsafe integer with uint paramType throws', () => {
      expect(() =>
        buildMoveExecute('sender', {
          function: '0x1::test::call',
          args: [Number.MAX_SAFE_INTEGER + 2, 'foo'],
          paramTypes: ['u64', '0x1::custom::UnknownStruct'],
        })
      ).toThrow('Unsafe number')
    })

    it('14. JSON fallback: negative number with uint paramType throws', () => {
      expect(() =>
        buildMoveExecute('sender', {
          function: '0x1::test::call',
          args: [-1, 'foo'],
          paramTypes: ['u64', '0x1::custom::UnknownStruct'],
        })
      ).toThrow('Unsafe number')
    })

    it('15. JSON fallback: bigint overflow u64 max throws', () => {
      const u64Max = (1n << 64n) - 1n
      expect(() =>
        buildMoveExecute('sender', {
          function: '0x1::test::call',
          args: [u64Max + 1n, 'foo'],
          paramTypes: ['u64', '0x1::custom::UnknownStruct'],
        })
      ).toThrow('out of range')
    })

    it('16. JSON fallback: negative bigint with uint paramType throws', () => {
      expect(() =>
        buildMoveExecute('sender', {
          function: '0x1::test::call',
          args: [-1n, 'foo'],
          paramTypes: ['u64', '0x1::custom::UnknownStruct'],
        })
      ).toThrow('out of range')
    })

    it('17. JSON fallback: bigint at u128 max is accepted', () => {
      const u128Max = (1n << 128n) - 1n
      const msg = buildMoveExecute('sender', {
        function: '0x1::test::call',
        args: [u128Max, 'foo'],
        paramTypes: ['u128', '0x1::custom::UnknownStruct'],
      })
      expect(fields(msg).args[0]).toBe(`"${u128Max.toString()}"`)
    })

    it('18. JSON fallback: number 300 overflows u8 max throws', () => {
      expect(() =>
        buildMoveExecute('sender', {
          function: '0x1::test::call',
          args: [300, 'foo'],
          paramTypes: ['u8', '0x1::custom::UnknownStruct'],
        })
      ).toThrow('out of range')
    })

    it('19. JSON fallback: number 255 at u8 max is accepted', () => {
      const msg = buildMoveExecute('sender', {
        function: '0x1::test::call',
        args: [255, 'foo'],
        paramTypes: ['u8', '0x1::custom::UnknownStruct'],
      })
      expect(fields(msg).args[0]).toBe('"255"')
    })

    it('20. JSON fallback: non-numeric type for uint param throws', () => {
      expect(() =>
        buildMoveExecute('sender', {
          function: '0x1::test::call',
          args: [null, 'foo'],
          paramTypes: ['u64', '0x1::custom::UnknownStruct'],
        })
      ).toThrow('Invalid argument type')

      expect(() =>
        buildMoveExecute('sender', {
          function: '0x1::test::call',
          args: [true, 'foo'],
          paramTypes: ['u64', '0x1::custom::UnknownStruct'],
        })
      ).toThrow('Invalid argument type')
    })

    it('21. no paramTypes: bigint arg produces quoted string', () => {
      const msg = buildMoveExecute('sender', {
        function: '0x1::coin::transfer',
        typeArgs: ['0x1::native_uinit::Coin'],
        args: ['0xrecipient', 1000000n],
      })
      expect(fields(msg).args[1]).toBe('"1000000"')
    })
  })

  // -------------------------------------------------------------------------
  // buildMoveView
  // -------------------------------------------------------------------------

  describe('buildMoveView', () => {
    it('7. typed response with returns: [u64] converts to bigint', async () => {
      const mockClient = createDefaultMockMoveClient()
      const ctx = createMockContext(mockClient)

      const result = await buildMoveView(ctx, {
        function: '0x1::coin::balance',
        typeArgs: ['0x1::native_uinit::Coin'],
        args: ['0xaddress'],
        returns: ['u64'],
      })

      expect(result).toBe(1000000n)
      expect(mockClient.viewJSON).toHaveBeenCalledWith({
        address: '0x1',
        moduleName: 'coin',
        functionName: 'balance',
        typeArgs: ['0x1::native_uinit::Coin'],
        args: ['"0xaddress"'],
      })
    })

    it('8. multiple returns [bool, u64] converts to typed array', async () => {
      const mockClient = createDefaultMockMoveClient()
      mockClient.viewJSON.mockResolvedValueOnce({ data: '[true,"500"]' })
      const ctx = createMockContext(mockClient)

      const result = await buildMoveView(ctx, {
        function: '0x1::test::multi',
        args: [],
        returns: ['bool', 'u64'],
      })

      expect(result).toEqual([true, 500n])
    })

    it('9. no returns gives raw JSON.parse result', async () => {
      const mockClient = createDefaultMockMoveClient()
      const ctx = createMockContext(mockClient)

      const result = await buildMoveView(ctx, {
        function: '0x1::coin::balance',
        typeArgs: ['0x1::native_uinit::Coin'],
        args: ['0xaddress'],
      })

      // No returns → raw JSON.parse of '"1000000"' → "1000000" (string)
      expect(result).toBe('1000000')
    })

    it('10. bech32 args conversion with paramTypes', async () => {
      const mockClient = createDefaultMockMoveClient()
      const ctx = createMockContext(mockClient)

      await buildMoveView(ctx, {
        function: '0x1::coin::balance',
        typeArgs: ['0x1::native_uinit::Coin'],
        args: [MOVE_BECH32_ADDR],
        paramTypes: ['address'],
        returns: ['u64'],
      })

      // bech32 → hex conversion via convertArgToJson
      expect(mockClient.viewJSON).toHaveBeenCalledWith({
        address: '0x1',
        moduleName: 'coin',
        functionName: 'balance',
        typeArgs: ['0x1::native_uinit::Coin'],
        args: [JSON.stringify(MOVE_HEX_ADDR)],
      })
    })

    it('11. without paramTypes uses plain JSON.stringify', async () => {
      const mockClient = createDefaultMockMoveClient()
      const ctx = createMockContext(mockClient)

      await buildMoveView(ctx, {
        function: '0x1::coin::balance',
        args: ['0xaddress'],
      })

      // No paramTypes → plain JSON.stringify
      expect(mockClient.viewJSON).toHaveBeenCalledWith({
        address: '0x1',
        moduleName: 'coin',
        functionName: 'balance',
        typeArgs: [],
        args: ['"0xaddress"'],
      })
    })

    it('12. invalid function identifier throws', async () => {
      const mockClient = createDefaultMockMoveClient()
      const ctx = createMockContext(mockClient)

      await expect(buildMoveView(ctx, { function: 'invalid' })).rejects.toThrow(
        'Invalid Move function identifier'
      )
    })

    it('13. unresolvable returns falls back to raw JSON', async () => {
      const mockClient = createDefaultMockMoveClient()
      const ctx = createMockContext(mockClient)

      // returns: ['T0'] with no typeArgs → unresolved → raw JSON fallback
      const result = await buildMoveView(ctx, {
        function: '0x1::coin::balance',
        args: ['0xaddress'],
        returns: ['T0'],
      })

      // Raw JSON.parse of '"1000000"' → string "1000000"
      expect(result).toBe('1000000')
    })

    it('14. no paramTypes: bigint arg does not crash', async () => {
      const mockClient = createDefaultMockMoveClient()
      const ctx = createMockContext(mockClient)

      await buildMoveView(ctx, {
        function: '0x1::coin::balance',
        typeArgs: ['0x1::native_uinit::Coin'],
        args: [1000000n],
      })

      expect(mockClient.viewJSON).toHaveBeenCalledWith(
        expect.objectContaining({
          args: ['"1000000"'],
        })
      )
    })

    it('15. paramTypes + bigint u64 with unknown struct via buildMoveView', async () => {
      const mockClient = createDefaultMockMoveClient()
      const ctx = createMockContext(mockClient)

      await buildMoveView(ctx, {
        function: '0x1::test::call',
        args: [1000000n, '0xabc'],
        paramTypes: ['u64', '0x1::custom::UnknownStruct'],
      })

      expect(mockClient.viewJSON).toHaveBeenCalledWith(
        expect.objectContaining({
          args: ['"1000000"', '"0xabc"'],
        })
      )
    })
  })
})
