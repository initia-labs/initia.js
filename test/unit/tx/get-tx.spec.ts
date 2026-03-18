/**
 * Unit tests for getTx with VM-aware arg decoding.
 *
 * Tests cover: core decode, Move enricher, EVM enricher, Wasm enricher,
 * composition/wiring, and ChainContext integration.
 */

import { describe, it, expect, vi } from 'vitest'
import { ConnectError, Code } from '@connectrpc/connect'
import { InitiaError } from '../../../src/errors'
import {
  getTx,
  createAbiRegistry,
  createNoopAbiRegistry,
  TxNotFoundError,
  type MessageEnricher,
} from '../../../src/tx/get-tx'
import { createMoveEnricher } from '../../../src/tx/enrichers/move'
import { createEvmEnricher } from '../../../src/tx/enrichers/evm'
import { createWasmEnricher } from '../../../src/tx/enrichers/wasm'
import type { Message } from '../../../src/msgs/types'
import type { Any } from '@bufbuild/protobuf/wkt'
import type { Abi } from 'abitype'

// =============================================================================
// Test Helpers
// =============================================================================

/** Create a mock Any message. Fields go into .value (matches proto message shape). */
function mockAny(typeUrl: string, fields?: Record<string, unknown>): Any {
  return { typeUrl, value: fields ?? {}, $typeName: 'google.protobuf.Any' } as unknown as Any
}

/** Create a mock GetTxResponse. */
function mockTxResponse(
  messages: Any[],
  overrides?: {
    txhash?: string
    code?: number
    height?: bigint
    gasUsed?: bigint
    gasWanted?: bigint
    rawLog?: string
    timestamp?: string
    events?: Array<{ type: string; attributes: Array<{ key: string; value: string }> }>
  }
) {
  return {
    tx: { body: { messages } },
    txResponse: {
      txhash: overrides?.txhash ?? 'ABCD1234',
      code: overrides?.code ?? 0,
      height: overrides?.height ?? 100n,
      gasUsed: overrides?.gasUsed ?? 50000n,
      gasWanted: overrides?.gasWanted ?? 100000n,
      rawLog: overrides?.rawLog ?? '',
      timestamp: overrides?.timestamp ?? '2026-03-08T12:00:00Z',
      events: overrides?.events ?? [],
    },
  }
}

function mockClient(response: ReturnType<typeof mockTxResponse>) {
  return { tx: { getTx: vi.fn().mockResolvedValue(response) } }
}

function mockClientError(error: Error) {
  return { tx: { getTx: vi.fn().mockRejectedValue(error) } }
}

/** Identity decode — returns the packed Any as a Message. */
function identityDecode(packed: Any): Message {
  return packed as unknown as Message
}

/** Decode that throws for unknown types. */
function strictDecode(knownTypes: Set<string>) {
  return (packed: Any): Message => {
    if (!knownTypes.has(packed.typeUrl)) {
      throw new Error(`Unknown typeUrl: ${packed.typeUrl}`)
    }
    return packed as unknown as Message
  }
}

// =============================================================================
// Core decode + fetch
// =============================================================================

describe('getTx core', () => {
  it('1. decodes non-VM message without enrichers', async () => {
    const any = mockAny('/cosmos.bank.v1beta1.MsgSend', { fromAddress: 'init1abc' })
    const client = mockClient(mockTxResponse([any]))

    const result = await getTx(client, identityDecode, 'HASH1', [])

    expect(result.messages).toHaveLength(1)
    expect(result.messages[0].typeUrl).toBe('/cosmos.bank.v1beta1.MsgSend')
    expect(result.messages[0].functionName).toBeUndefined()
    expect(result.messages[0].args).toBeUndefined()
    expect(result.messages[0].contractMsg).toBeUndefined()
  })

  it('2. raw contains original GetTxResponse', async () => {
    const response = mockTxResponse([mockAny('/cosmos.bank.v1beta1.MsgSend')])
    const client = mockClient(response)
    const result = await getTx(client, identityDecode, 'HASH2', [])
    expect(result.raw).toBe(response)
  })

  it('3. convenience fields match raw.txResponse values', async () => {
    const events = [{ type: 'transfer', attributes: [{ key: 'sender', value: 'init1abc' }] }]
    const response = mockTxResponse([mockAny('/cosmos.bank.v1beta1.MsgSend')], {
      txhash: 'HASH3',
      code: 0,
      height: 999n,
      gasUsed: 42000n,
      gasWanted: 80000n,
      rawLog: '',
      timestamp: '2026-01-01T00:00:00Z',
      events,
    })
    const result = await getTx(mockClient(response), identityDecode, 'HASH3', [])

    expect(result.txHash).toBe('HASH3')
    expect(result.code).toBe(0)
    expect(result.height).toBe(999n)
    expect(result.gasUsed).toBe(42000n)
    expect(result.gasWanted).toBe(80000n)
    expect(result.rawLog).toBe('')
    expect(result.timestamp).toBe('2026-01-01T00:00:00Z')
    expect(result.events).toEqual(events)
  })

  it('4. innerMessages is undefined for wrapper messages', async () => {
    const any = mockAny('/cosmos.authz.v1beta1.MsgExec')
    const result = await getTx(mockClient(mockTxResponse([any])), identityDecode, 'HASH4', [])
    expect(result.messages[0].innerMessages).toBeUndefined()
  })

  it('5. decode failure (best-effort) — decodeError: true, enrichment skipped', async () => {
    const any = mockAny('/unknown.v1.MsgFoo')
    const enricher: MessageEnricher = { canEnrich: () => true, enrich: vi.fn() }
    const failDecode = () => {
      throw new Error('Unknown type')
    }
    const result = await getTx(mockClient(mockTxResponse([any])), failDecode, 'HASH5', [enricher])

    expect(result.messages[0].decodeError).toBe(true)
    expect(result.messages[0].typeUrl).toBe('/unknown.v1.MsgFoo')
    expect(enricher.enrich).not.toHaveBeenCalled()
  })

  it('6. tx not found throws TxNotFoundError', async () => {
    const client = mockClientError(new ConnectError('not found', Code.NotFound))
    await expect(getTx(client, identityDecode, 'MISSING', [])).rejects.toThrow(TxNotFoundError)
    await expect(getTx(client, identityDecode, 'MISSING', [])).rejects.toThrow('MISSING')
  })

  it('7. network error propagates as ConnectError, not TxNotFoundError', async () => {
    const client = mockClientError(new ConnectError('unavailable', Code.Unavailable))
    await expect(getTx(client, identityDecode, 'HASH7', [])).rejects.toThrow(ConnectError)
    await expect(getTx(client, identityDecode, 'HASH7', [])).rejects.not.toThrow(TxNotFoundError)
  })

  it('8. unknown typeUrl (best-effort) — opaque message, no throw', async () => {
    const any = mockAny('/unknown.v1.MsgBar')
    const result = await getTx(mockClient(mockTxResponse([any])), identityDecode, 'HASH8', [])
    expect(result.messages[0].typeUrl).toBe('/unknown.v1.MsgBar')
    expect(result.messages[0].decodeError).toBeUndefined()
  })

  it('9. unknown typeUrl (strict) — throws decode error', async () => {
    const any = mockAny('/unknown.v1.MsgBaz')
    const decoder = strictDecode(new Set(['/cosmos.bank.v1beta1.MsgSend']))
    await expect(
      getTx(mockClient(mockTxResponse([any])), decoder, 'HASH9', [], { decodeArgs: 'strict' })
    ).rejects.toThrow('Unknown typeUrl')
  })
})

// =============================================================================
// Move enricher
// =============================================================================

describe('Move enricher', () => {
  const makeMoveMsg = (
    functionName: string,
    args: unknown[],
    typeUrl = '/initia.move.v1.MsgExecute'
  ) =>
    mockAny(typeUrl, {
      moduleAddress: '0x1',
      moduleName: 'coin',
      functionName,
      args,
    })

  it('10. MsgExecute — enricher sets functionName and args', async () => {
    const any = makeMoveMsg('transfer', [new Uint8Array([1])])
    const client = mockClient(mockTxResponse([any]))

    // Mock enricher that simulates BCS decode result
    const enricher: MessageEnricher = {
      canEnrich: t => t === '/initia.move.v1.MsgExecute',
      enrich: async msg => {
        const val = (msg.message as unknown as Record<string, unknown>).value as Record<
          string,
          unknown
        >
        msg.functionName = val.functionName as string
        msg.args = [42n]
      },
    }
    const result = await getTx(client, identityDecode, 'MOVE1', [enricher])

    expect(result.messages[0].functionName).toBe('transfer')
    expect(result.messages[0].args).toEqual([42n])
  })

  it('11. MsgExecuteJSON — args are JSON.parsed strings', async () => {
    const any = makeMoveMsg('transfer', ['"hello"', '42'], '/initia.move.v1.MsgExecuteJSON')
    const client = mockClient(mockTxResponse([any]))

    const enricher = createMoveEnricher({ module: vi.fn() } as any)
    const result = await getTx(client, identityDecode, 'MOVE2', [enricher])

    expect(result.messages[0].functionName).toBe('transfer')
    expect(result.messages[0].args).toEqual(['hello', 42])
    expect(result.messages[0].namedArgs).toBeUndefined()
  })

  it('12. MsgGovExecute — same as MsgExecute', async () => {
    const any = makeMoveMsg('set_price', [], '/initia.move.v1.MsgGovExecute')
    const client = mockClient(mockTxResponse([any]))

    const enricher = createMoveEnricher({ module: vi.fn() } as any)
    const result = await getTx(client, identityDecode, 'MOVE3', [enricher])

    expect(result.messages[0].functionName).toBe('set_price')
  })

  it('13. ABI failure (best-effort) — args undefined, enrichError set', async () => {
    const any = makeMoveMsg('foo', [new Uint8Array([1])])
    const client = mockClient(mockTxResponse([any]))

    const moveClient = { module: vi.fn().mockRejectedValue(new Error('ABI fetch failed')) }
    const enricher = createMoveEnricher(moveClient as any)
    const result = await getTx(client, identityDecode, 'MOVE4', [enricher])

    expect(result.messages[0].functionName).toBe('foo')
    expect(result.messages[0].args).toBeUndefined()
    expect(result.messages[0].enrichError).toBe('ABI fetch failed')
  })

  it('14. ABI failure (strict) — throws error', async () => {
    const any = makeMoveMsg('foo', [new Uint8Array([1])])
    const client = mockClient(mockTxResponse([any]))

    const moveClient = { module: vi.fn().mockRejectedValue(new Error('ABI fetch failed')) }
    const enricher = createMoveEnricher(moveClient as any)

    await expect(
      getTx(client, identityDecode, 'MOVE5', [enricher], { decodeArgs: 'strict' })
    ).rejects.toThrow('ABI fetch failed')
  })

  it('15. canEnrich excludes Script types', () => {
    const enricher = createMoveEnricher({ module: vi.fn() } as any)
    expect(enricher.canEnrich('/initia.move.v1.MsgScript')).toBe(false)
    expect(enricher.canEnrich('/initia.move.v1.MsgScriptJSON')).toBe(false)
    expect(enricher.canEnrich('/initia.move.v1.MsgGovScript')).toBe(false)
    expect(enricher.canEnrich('/initia.move.v1.MsgGovScriptJSON')).toBe(false)
  })

  it('16. MsgPublish — canEnrich returns false', () => {
    const enricher = createMoveEnricher({ module: vi.fn() } as any)
    expect(enricher.canEnrich('/initia.move.v1.MsgPublish')).toBe(false)
    expect(enricher.canEnrich('/initia.move.v1.MsgGovPublish')).toBe(false)
  })

  it('17. offline ABI via ctx.abis — skips on-chain fetch', async () => {
    const args = [new Uint8Array([1, 0, 0, 0, 0, 0, 0, 0])]
    const any = makeMoveMsg('transfer', args)
    const client = mockClient(mockTxResponse([any]))

    const offlineAbi = {
      name: 'coin',
      exposed_functions: [
        {
          name: 'transfer',
          params: ['&signer', 'u64'],
          return: [],
          is_entry: true,
          is_view: false,
          generic_type_params: [],
          visibility: 'public' as const,
        },
      ],
      structs: [],
    }

    const abis = createAbiRegistry<any>()
    abis.set('0x1::coin', offlineAbi)
    const moveClient = { module: vi.fn() }
    const enricher = createMoveEnricher(moveClient as any, abis)

    const result = await getTx(client, identityDecode, 'MOVE7', [enricher])
    expect(moveClient.module).not.toHaveBeenCalled()
    expect(result.messages[0].args).toBeDefined()
  })

  it('18. offline ABI via options.abis — one-time override', async () => {
    const args = [new Uint8Array([1, 0, 0, 0, 0, 0, 0, 0])]
    const any = makeMoveMsg('transfer', args)
    const client = mockClient(mockTxResponse([any]))

    const offlineAbi = {
      name: 'coin',
      exposed_functions: [
        {
          name: 'transfer',
          params: ['&signer', 'u64'],
          return: [],
          is_entry: true,
          is_view: false,
          generic_type_params: [],
          visibility: 'public' as const,
        },
      ],
      structs: [],
    }

    const moveClient = { module: vi.fn() }
    const enricher = createMoveEnricher(moveClient as any)

    const result = await getTx(client, identityDecode, 'MOVE8', [enricher], {
      abis: { '0x1::coin': offlineAbi },
    })
    expect(moveClient.module).not.toHaveBeenCalled()
    expect(result.messages[0].args).toBeDefined()
  })

  it('19. offline ABI decodes historical tx correctly', async () => {
    const args = [new Uint8Array([1, 0, 0, 0, 0, 0, 0, 0])] // u64 LE: 1
    const any = makeMoveMsg('transfer', args)
    const client = mockClient(mockTxResponse([any]))

    const historicalAbi = {
      name: 'coin',
      exposed_functions: [
        {
          name: 'transfer',
          params: ['&signer', 'u64'],
          return: [],
          is_entry: true,
          is_view: false,
          generic_type_params: [],
          visibility: 'public' as const,
        },
      ],
      structs: [],
    }

    const moveClient = { module: vi.fn() }
    const enricher = createMoveEnricher(moveClient as any)
    const result = await getTx(client, identityDecode, 'MOVE9', [enricher], {
      abis: { '0x1::coin': historicalAbi },
    })

    expect(result.messages[0].args).toHaveLength(1)
    // BCS u64 is coerced to bigint by Move enricher
    expect(result.messages[0].args![0]).toBe(1n)
  })
})

// =============================================================================
// EVM enricher
// =============================================================================

describe('EVM enricher', () => {
  const erc20Abi: Abi = [
    {
      type: 'function',
      name: 'transfer',
      inputs: [
        { name: 'to', type: 'address', internalType: 'address' },
        { name: 'amount', type: 'uint256', internalType: 'uint256' },
      ],
      outputs: [{ name: '', type: 'bool', internalType: 'bool' }],
      stateMutability: 'nonpayable',
    },
  ]

  // transfer(address,uint256) calldata: selector 0xa9059cbb + addr(1) + amount(100)
  const transferCalldata = new Uint8Array([
    0xa9, 0x05, 0x9c, 0xbb, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00,
    0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00,
    0x00, 0x00, 0x00, 0x01, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00,
    0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00,
    0x00, 0x00, 0x00, 0x64,
  ])

  const makeEvmCall = (addr: string, input: Uint8Array) =>
    mockAny('/minievm.evm.v1.MsgCall', { contractAddr: addr, input })

  it('20. registered ABI — functionName and args decoded', async () => {
    const any = makeEvmCall('0xABCD', transferCalldata)
    const client = mockClient(mockTxResponse([any]))

    const registry = createAbiRegistry<Abi>()
    registry.set('0xABCD', erc20Abi)
    const enricher = createEvmEnricher(registry)
    const result = await getTx(client, identityDecode, 'EVM1', [enricher])

    expect(result.messages[0].functionName).toBe('transfer')
    expect(result.messages[0].args).toBeDefined()
    expect(result.messages[0].args).toHaveLength(2)
  })

  it('21. without ABI — functionName = 4-byte hex, args undefined', async () => {
    const any = makeEvmCall('0xABCD', transferCalldata)
    const client = mockClient(mockTxResponse([any]))

    const enricher = createEvmEnricher(createAbiRegistry<Abi>())
    const result = await getTx(client, identityDecode, 'EVM2', [enricher])

    expect(result.messages[0].functionName).toBe('0xa9059cbb')
    expect(result.messages[0].args).toBeUndefined()
  })

  it('22. one-time options.abis — decoded without ctx.abis.set()', async () => {
    const any = makeEvmCall('0xABCD', transferCalldata)
    const client = mockClient(mockTxResponse([any]))

    const enricher = createEvmEnricher(createAbiRegistry<Abi>())
    const result = await getTx(client, identityDecode, 'EVM3', [enricher], {
      abis: { '0xabcd': erc20Abi },
    })

    expect(result.messages[0].functionName).toBe('transfer')
    expect(result.messages[0].args).toBeDefined()
  })

  it('23. one-time ABI priority — options.abis overrides ctx.abis', async () => {
    const wrongAbi: Abi = [
      {
        type: 'function',
        name: 'approve',
        inputs: [
          { name: 'spender', type: 'address', internalType: 'address' },
          { name: 'amount', type: 'uint256', internalType: 'uint256' },
        ],
        outputs: [{ name: '', type: 'bool', internalType: 'bool' }],
        stateMutability: 'nonpayable',
      },
    ]

    const any = makeEvmCall('0xABCD', transferCalldata)
    const client = mockClient(mockTxResponse([any]))

    const registry = createAbiRegistry<Abi>()
    registry.set('0xABCD', wrongAbi)
    const enricher = createEvmEnricher(registry)

    const result = await getTx(client, identityDecode, 'EVM4', [enricher], {
      abis: { '0xabcd': erc20Abi },
    })

    expect(result.messages[0].functionName).toBe('transfer')
  })

  it('24. MsgCreate — canEnrich true but enrich skips', async () => {
    const any = mockAny('/minievm.evm.v1.MsgCreate', { code: new Uint8Array([1, 2, 3]) })
    const client = mockClient(mockTxResponse([any]))

    const enricher = createEvmEnricher(createAbiRegistry<Abi>())
    expect(enricher.canEnrich('/minievm.evm.v1.MsgCreate')).toBe(true)

    const result = await getTx(client, identityDecode, 'EVM5', [enricher])
    expect(result.messages[0].functionName).toBeUndefined()
    expect(result.messages[0].args).toBeUndefined()
  })

  it('50. namedArgs populated from ABI input names', async () => {
    const any = makeEvmCall('0xABCD', transferCalldata)
    const client = mockClient(mockTxResponse([any]))

    const registry = createAbiRegistry<Abi>()
    registry.set('0xABCD', erc20Abi)
    const enricher = createEvmEnricher(registry)
    const result = await getTx(client, identityDecode, 'EVM_NA1', [enricher])

    expect(result.messages[0].namedArgs).toEqual({
      to: expect.any(String),
      amount: 100n,
    })
  })

  it('51. namedArgs undefined when ABI has unnamed inputs', async () => {
    const unnamedAbi: Abi = [
      {
        type: 'function',
        name: 'transfer',
        inputs: [
          { name: '', type: 'address', internalType: 'address' },
          { name: 'amount', type: 'uint256', internalType: 'uint256' },
        ],
        outputs: [{ name: '', type: 'bool', internalType: 'bool' }],
        stateMutability: 'nonpayable',
      },
    ]
    const any = makeEvmCall('0xABCD', transferCalldata)
    const client = mockClient(mockTxResponse([any]))

    const registry = createAbiRegistry<Abi>()
    registry.set('0xABCD', unnamedAbi)
    const enricher = createEvmEnricher(registry)
    const result = await getTx(client, identityDecode, 'EVM_NA2', [enricher])

    expect(result.messages[0].functionName).toBe('transfer')
    expect(result.messages[0].args).toBeDefined()
    expect(result.messages[0].namedArgs).toBeUndefined()
  })

  it('52. namedArgs undefined without ABI', async () => {
    const any = makeEvmCall('0xABCD', transferCalldata)
    const client = mockClient(mockTxResponse([any]))

    const enricher = createEvmEnricher(createAbiRegistry<Abi>())
    const result = await getTx(client, identityDecode, 'EVM_NA3', [enricher])

    expect(result.messages[0].namedArgs).toBeUndefined()
  })

  it('53. namedArgs undefined for MsgCreate', async () => {
    const any = mockAny('/minievm.evm.v1.MsgCreate', { code: new Uint8Array([1, 2, 3]) })
    const client = mockClient(mockTxResponse([any]))

    const enricher = createEvmEnricher(createAbiRegistry<Abi>())
    const result = await getTx(client, identityDecode, 'EVM_NA4', [enricher])

    expect(result.messages[0].namedArgs).toBeUndefined()
  })

  it('54. namedArgs undefined for zero-arg function', async () => {
    const nameAbi: Abi = [
      {
        type: 'function',
        name: 'name',
        inputs: [],
        outputs: [{ name: '', type: 'string', internalType: 'string' }],
        stateMutability: 'view',
      },
    ]
    // selector for name() = 0x06fdde03
    const nameCalldata = new Uint8Array([0x06, 0xfd, 0xde, 0x03])
    const any = makeEvmCall('0xABCD', nameCalldata)
    const client = mockClient(mockTxResponse([any]))

    const registry = createAbiRegistry<Abi>()
    registry.set('0xABCD', nameAbi)
    const enricher = createEvmEnricher(registry)
    const result = await getTx(client, identityDecode, 'EVM_NA5', [enricher])

    expect(result.messages[0].functionName).toBe('name')
    expect(result.messages[0].namedArgs).toBeUndefined()
  })

  it('25. mixed-case options.abis keys normalized to lowercase', async () => {
    const any = makeEvmCall('0xAbCd', transferCalldata)
    const client = mockClient(mockTxResponse([any]))

    const enricher = createEvmEnricher(createAbiRegistry<Abi>())
    const result = await getTx(client, identityDecode, 'EVM6', [enricher], {
      abis: { '0xAbCd': erc20Abi },
    })

    expect(result.messages[0].functionName).toBe('transfer')
  })
})

// =============================================================================
// Wasm enricher
// =============================================================================

describe('Wasm enricher', () => {
  const encoder = new TextEncoder()

  it('26. MsgExecuteContract — contractMsg = parsed JSON', async () => {
    const jsonMsg = { transfer: { recipient: 'init1abc', amount: '100' } }
    const any = mockAny('/cosmwasm.wasm.v1.MsgExecuteContract', {
      msg: encoder.encode(JSON.stringify(jsonMsg)),
    })
    const client = mockClient(mockTxResponse([any]))

    const enricher = createWasmEnricher()
    const result = await getTx(client, identityDecode, 'WASM1', [enricher])

    expect(result.messages[0].contractMsg).toEqual(jsonMsg)
    expect(result.messages[0].namedArgs).toBeUndefined()
  })

  it('27. MsgStoreAndInstantiateContract — contractMsg = parsed JSON', async () => {
    const jsonMsg = { admin: 'init1abc', label: 'test' }
    const any = mockAny('/cosmwasm.wasm.v1.MsgStoreAndInstantiateContract', {
      msg: encoder.encode(JSON.stringify(jsonMsg)),
    })
    const client = mockClient(mockTxResponse([any]))

    const enricher = createWasmEnricher()
    const result = await getTx(client, identityDecode, 'WASM2', [enricher])

    expect(result.messages[0].contractMsg).toEqual(jsonMsg)
  })
})

// =============================================================================
// Composition + wiring
// =============================================================================

describe('composition and wiring', () => {
  const encoder = new TextEncoder()

  it('28. enricher composition — Move + Wasm enrichers applied to mixed tx', async () => {
    const moveMsg = mockAny('/initia.move.v1.MsgExecuteJSON', {
      moduleAddress: '0x1',
      moduleName: 'coin',
      functionName: 'transfer',
      args: ['"hello"'],
    })
    const wasmMsg = mockAny('/cosmwasm.wasm.v1.MsgExecuteContract', {
      msg: encoder.encode('{"do":"stuff"}'),
    })
    const client = mockClient(mockTxResponse([moveMsg, wasmMsg]))

    const moveEnricher = createMoveEnricher({ module: vi.fn() } as any)
    const wasmEnricher = createWasmEnricher()
    const result = await getTx(client, identityDecode, 'COMP1', [moveEnricher, wasmEnricher])

    expect(result.messages[0].functionName).toBe('transfer')
    expect(result.messages[0].args).toEqual(['hello'])
    expect(result.messages[1].contractMsg).toEqual({ do: 'stuff' })
  })

  it('29. parallel enrichment — multiple messages decoded concurrently', async () => {
    const msgs = Array.from({ length: 5 }, (_, i) =>
      mockAny('/initia.move.v1.MsgExecuteJSON', {
        moduleAddress: '0x1',
        moduleName: 'coin',
        functionName: `fn_${i}`,
        args: [`${i}`],
      })
    )
    const client = mockClient(mockTxResponse(msgs))

    const enricher = createMoveEnricher({ module: vi.fn() } as any)
    const result = await getTx(client, identityDecode, 'COMP2', [enricher])

    expect(result.messages).toHaveLength(5)
    for (let i = 0; i < 5; i++) {
      expect(result.messages[i].functionName).toBe(`fn_${i}`)
    }
  })

  it('30. no enrichers — getTx returns messages without enrichment', async () => {
    const any = mockAny('/initia.move.v1.MsgExecute', {
      moduleAddress: '0x1',
      moduleName: 'coin',
      functionName: 'transfer',
      args: [new Uint8Array([1])],
    })
    const client = mockClient(mockTxResponse([any]))
    const result = await getTx(client, identityDecode, 'COMP3', [])

    expect(result.messages[0].functionName).toBeUndefined()
    expect(result.messages[0].args).toBeUndefined()
  })

  it('31. generic context — no enrichers, protobuf only', async () => {
    const any = mockAny('/initia.move.v1.MsgExecute', {
      moduleAddress: '0x1',
      moduleName: 'coin',
      functionName: 'transfer',
      args: [],
    })
    const client = mockClient(mockTxResponse([any]))
    const result = await getTx(client, identityDecode, 'COMP4', [])

    expect(result.messages[0].typeUrl).toBe('/initia.move.v1.MsgExecute')
    expect(result.messages[0].message).toBeDefined()
    expect(result.messages[0].functionName).toBeUndefined()
    expect(result.messages[0].args).toBeUndefined()
    expect(result.messages[0].contractMsg).toBeUndefined()
  })
})

// =============================================================================
// ChainContext integration
// =============================================================================

describe('ChainContext integration', () => {
  it('32. ABI registry with lowercase normalization — bidirectional', () => {
    const registry = createAbiRegistry<string>()
    registry.set('0xAbCd', 'test-abi')
    expect(registry.get('0xabcd')).toBe('test-abi')
    expect(registry.get('0xABCD')).toBe('test-abi')
    expect(registry.has('0xAbCd')).toBe(true)
  })

  it('33. noop ABI registry — always undefined', () => {
    const registry = createNoopAbiRegistry()
    registry.set('anything', 'value' as never)
    expect(registry.get('anything')).toBeUndefined()
    expect(registry.has('anything')).toBe(false)
  })

  it('35. decodeArgs: none — enrichers never called', async () => {
    const any = mockAny('/initia.move.v1.MsgExecute', {
      moduleAddress: '0x1',
      moduleName: 'coin',
      functionName: 'transfer',
      args: [new Uint8Array([1])],
    })
    const client = mockClient(mockTxResponse([any]))

    const enricher: MessageEnricher = {
      canEnrich: vi.fn().mockReturnValue(true),
      enrich: vi.fn(),
    }
    const result = await getTx(client, identityDecode, 'CTX3', [enricher], { decodeArgs: 'none' })

    expect(enricher.canEnrich).not.toHaveBeenCalled()
    expect(enricher.enrich).not.toHaveBeenCalled()
    expect(result.messages[0].functionName).toBeUndefined()
  })

  it('36. malformed response — missing tx.body throws explicit error', async () => {
    const response = {
      tx: { body: undefined },
      txResponse: {
        txhash: 'MAL1',
        code: 0,
        height: 1n,
        gasUsed: 0n,
        gasWanted: 0n,
        rawLog: '',
        timestamp: '',
        events: [],
      },
    }
    const client = mockClient(response as any)
    await expect(getTx(client, identityDecode, 'MAL1', [])).rejects.toThrow('Malformed tx response')
  })

  it('37. malformed response — missing txResponse throws InitiaError', async () => {
    const response = {
      tx: { body: { messages: [] } },
      txResponse: undefined,
    }
    const client = mockClient(response as any)
    await expect(getTx(client, identityDecode, 'MAL2', [])).rejects.toThrow(InitiaError)
    await expect(getTx(client, identityDecode, 'MAL2', [])).rejects.toThrow(
      'Malformed tx response: missing txResponse'
    )
  })

  it('38. TxNotFoundError extends InitiaError', () => {
    const err = new TxNotFoundError('DEADBEEF')
    expect(err).toBeInstanceOf(InitiaError)
    expect(err).toBeInstanceOf(Error)
    expect(err.hash).toBe('DEADBEEF')
    expect(err.name).toBe('TxNotFoundError')
  })

  it('39. enrichment failure (best-effort) — enrichError set, no throw', async () => {
    const any = mockAny('/initia.move.v1.MsgExecute', {
      moduleAddress: '0x1',
      moduleName: 'coin',
      functionName: 'transfer',
      args: [new Uint8Array([1])],
    })
    const client = mockClient(mockTxResponse([any]))

    const enricher: MessageEnricher = {
      canEnrich: () => true,
      enrich: async () => {
        throw new Error('ABI fetch failed')
      },
    }
    const result = await getTx(client, identityDecode, 'ERR1', [enricher])

    expect(result.messages[0].enrichError).toBe('ABI fetch failed')
    expect(result.messages[0].args).toBeUndefined()
  })
})

// =============================================================================
// Move enricher — bigint coercion
// =============================================================================

describe('Move enricher bigint coercion', () => {
  const makeMoveMsg = (
    functionName: string,
    args: unknown[],
    typeUrl = '/initia.move.v1.MsgExecute'
  ) =>
    mockAny(typeUrl, {
      moduleAddress: '0x1',
      moduleName: 'coin',
      functionName,
      args,
    })

  function makeAbi(params: string[]) {
    return {
      name: 'coin',
      exposed_functions: [
        {
          name: 'test_fn',
          params: ['&signer', ...params],
          return: [],
          is_entry: true,
          is_view: false,
          generic_type_params: [],
          visibility: 'public' as const,
        },
      ],
      structs: [],
    }
  }

  it('40. u128 decoded as bigint', async () => {
    // u128 LE: 1 (16 bytes)
    const u128Bytes = new Uint8Array(16)
    u128Bytes[0] = 1
    const any = makeMoveMsg('test_fn', [u128Bytes])
    const client = mockClient(mockTxResponse([any]))

    const moveClient = { module: vi.fn() }
    const enricher = createMoveEnricher(moveClient as any)
    const result = await getTx(client, identityDecode, 'CAST1', [enricher], {
      abis: { '0x1::coin': makeAbi(['u128']) },
    })

    expect(result.messages[0].args).toHaveLength(1)
    expect(result.messages[0].args![0]).toBe(1n)
    expect(typeof result.messages[0].args![0]).toBe('bigint')
  })

  it('41. u256 decoded as bigint', async () => {
    // u256 LE: 42 (32 bytes)
    const u256Bytes = new Uint8Array(32)
    u256Bytes[0] = 42
    const any = makeMoveMsg('test_fn', [u256Bytes])
    const client = mockClient(mockTxResponse([any]))

    const moveClient = { module: vi.fn() }
    const enricher = createMoveEnricher(moveClient as any)
    const result = await getTx(client, identityDecode, 'CAST2', [enricher], {
      abis: { '0x1::coin': makeAbi(['u256']) },
    })

    expect(result.messages[0].args).toHaveLength(1)
    expect(result.messages[0].args![0]).toBe(42n)
  })

  it('42. vector<u64> decoded as bigint array', async () => {
    // ULEB128 length prefix (2 elements) + 2 u64 LE values
    const buf = new Uint8Array(1 + 8 + 8)
    buf[0] = 2 // length = 2
    buf[1] = 10 // first u64 = 10
    buf[9] = 20 // second u64 = 20
    const any = makeMoveMsg('test_fn', [buf])
    const client = mockClient(mockTxResponse([any]))

    const moveClient = { module: vi.fn() }
    const enricher = createMoveEnricher(moveClient as any)
    const result = await getTx(client, identityDecode, 'CAST3', [enricher], {
      abis: { '0x1::coin': makeAbi(['vector<u64>']) },
    })

    expect(result.messages[0].args).toHaveLength(1)
    const vec = result.messages[0].args![0] as bigint[]
    expect(vec).toHaveLength(2)
    expect(vec[0]).toBe(10n)
    expect(vec[1]).toBe(20n)
  })

  it('43. Option<u128> Some decoded as bigint', async () => {
    // Option Some: 1 byte tag (1) + 16 bytes u128 LE
    const buf = new Uint8Array(17)
    buf[0] = 1 // Some tag
    buf[1] = 99 // value = 99
    const any = makeMoveMsg('test_fn', [buf])
    const client = mockClient(mockTxResponse([any]))

    const moveClient = { module: vi.fn() }
    const enricher = createMoveEnricher(moveClient as any)
    const result = await getTx(client, identityDecode, 'CAST4', [enricher], {
      abis: { '0x1::coin': makeAbi(['0x1::option::Option<u128>']) },
    })

    expect(result.messages[0].args).toHaveLength(1)
    expect(result.messages[0].args![0]).toBe(99n)
  })

  it('44. function-not-found (best-effort) — enrichError set', async () => {
    const any = makeMoveMsg('nonexistent_fn', [new Uint8Array([1, 0, 0, 0, 0, 0, 0, 0])])
    const client = mockClient(mockTxResponse([any]))

    const abi = {
      name: 'coin',
      exposed_functions: [
        {
          name: 'transfer',
          params: ['&signer', 'u64'],
          return: [],
          is_entry: true,
          is_view: false,
          generic_type_params: [],
          visibility: 'public' as const,
        },
      ],
      structs: [],
    }
    const moveClient = { module: vi.fn() }
    const enricher = createMoveEnricher(moveClient as any)
    const result = await getTx(client, identityDecode, 'CAST5', [enricher], {
      abis: { '0x1::coin': abi },
    })

    expect(result.messages[0].functionName).toBe('nonexistent_fn')
    expect(result.messages[0].args).toBeUndefined()
    expect(result.messages[0].enrichError).toMatch(/not found in ABI/)
  })

  it('44b. function-not-found (strict) — throws', async () => {
    const any = makeMoveMsg('nonexistent_fn', [new Uint8Array([1, 0, 0, 0, 0, 0, 0, 0])])
    const client = mockClient(mockTxResponse([any]))

    const abi = {
      name: 'coin',
      exposed_functions: [
        {
          name: 'transfer',
          params: ['&signer', 'u64'],
          return: [],
          is_entry: true,
          is_view: false,
          generic_type_params: [],
          visibility: 'public' as const,
        },
      ],
      structs: [],
    }
    const moveClient = { module: vi.fn() }
    const enricher = createMoveEnricher(moveClient as any)

    await expect(
      getTx(client, identityDecode, 'CAST5S', [enricher], {
        decodeArgs: 'strict',
        abis: { '0x1::coin': abi },
      })
    ).rejects.toThrow(/not found in ABI/)
  })

  it('45. invalid JSON arg (best-effort) — enrichError set', async () => {
    const any = makeMoveMsg('transfer', ['not{json}'], '/initia.move.v1.MsgExecuteJSON')
    const client = mockClient(mockTxResponse([any]))

    const enricher = createMoveEnricher({ module: vi.fn() } as any)
    const result = await getTx(client, identityDecode, 'CAST6', [enricher])

    expect(result.messages[0].enrichError).toMatch(/Failed to parse JSON arg/)
  })
})

// =============================================================================
// Wasm enricher — error handling
// =============================================================================

describe('Wasm enricher error handling', () => {
  const encoder = new TextEncoder()

  it('46. invalid JSON (best-effort) — enrichError set', async () => {
    const any = mockAny('/cosmwasm.wasm.v1.MsgExecuteContract', {
      msg: encoder.encode('not valid json{'),
    })
    const client = mockClient(mockTxResponse([any]))

    const enricher = createWasmEnricher()
    const result = await getTx(client, identityDecode, 'WASM_ERR1', [enricher])

    expect(result.messages[0].contractMsg).toBeUndefined()
    expect(result.messages[0].enrichError).toMatch(/Failed to parse Wasm contract msg/)
  })

  it('47. invalid JSON (strict) — throws', async () => {
    const any = mockAny('/cosmwasm.wasm.v1.MsgExecuteContract', {
      msg: encoder.encode('not valid json{'),
    })
    const client = mockClient(mockTxResponse([any]))

    const enricher = createWasmEnricher()
    await expect(
      getTx(client, identityDecode, 'WASM_ERR2', [enricher], { decodeArgs: 'strict' })
    ).rejects.toThrow(/Failed to parse Wasm contract msg/)
  })
})

// =============================================================================
// EVM enricher — error handling
// =============================================================================

describe('EVM enricher error handling', () => {
  it('48. ABI decode failure (best-effort) — enrichError with context', async () => {
    // Truncated calldata — valid selector but incomplete args
    const truncated = new Uint8Array([0xa9, 0x05, 0x9c, 0xbb, 0x00, 0x01])
    const any = mockAny('/minievm.evm.v1.MsgCall', {
      contractAddr: '0xABCD',
      input: truncated,
    })
    const client = mockClient(mockTxResponse([any]))

    const erc20Abi: Abi = [
      {
        type: 'function',
        name: 'transfer',
        inputs: [
          { name: 'to', type: 'address', internalType: 'address' },
          { name: 'amount', type: 'uint256', internalType: 'uint256' },
        ],
        outputs: [{ name: '', type: 'bool', internalType: 'bool' }],
        stateMutability: 'nonpayable',
      },
    ]
    const registry = createAbiRegistry<Abi>()
    registry.set('0xABCD', erc20Abi)
    const enricher = createEvmEnricher(registry)
    const result = await getTx(client, identityDecode, 'EVM_ERR1', [enricher])

    expect(result.messages[0].enrichError).toMatch(/Failed to decode EVM calldata/)
    expect(result.messages[0].enrichError).toMatch(/0xa9059cbb/)
  })

  it('49. ABI decode failure (strict) — throws with context', async () => {
    const truncated = new Uint8Array([0xa9, 0x05, 0x9c, 0xbb, 0x00, 0x01])
    const any = mockAny('/minievm.evm.v1.MsgCall', {
      contractAddr: '0xABCD',
      input: truncated,
    })
    const client = mockClient(mockTxResponse([any]))

    const erc20Abi: Abi = [
      {
        type: 'function',
        name: 'transfer',
        inputs: [
          { name: 'to', type: 'address', internalType: 'address' },
          { name: 'amount', type: 'uint256', internalType: 'uint256' },
        ],
        outputs: [{ name: '', type: 'bool', internalType: 'bool' }],
        stateMutability: 'nonpayable',
      },
    ]
    const registry = createAbiRegistry<Abi>()
    registry.set('0xABCD', erc20Abi)
    const enricher = createEvmEnricher(registry)

    await expect(
      getTx(client, identityDecode, 'EVM_ERR2', [enricher], { decodeArgs: 'strict' })
    ).rejects.toThrow(/Failed to decode EVM calldata/)
  })
})
