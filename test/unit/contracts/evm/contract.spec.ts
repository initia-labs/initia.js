/**
 * Unit tests for EVM contract utilities.
 */

import { describe, it, expect, vi } from 'vitest'
import {
  decodeRevertReason,
  createEvmContract,
  decodeFunctionResult,
  decodeAbiParameters,
  encodeEvmCall,
  encodeEvmParameters,
} from '../../../../src/contracts/evm'
import { AccAddress } from '../../../../src/util/address'
import type { HasEvmService } from '../../../../src/client/types'

describe('decodeRevertReason', () => {
  describe('standard Error(string)', () => {
    it('should decode Error(string) revert reason', () => {
      // Error("Insufficient balance") encoded
      // Error(string) selector: 0x08c379a0
      // Encoded as: selector + offset (32) + length (20) + "Insufficient balance" padded
      const errorData =
        '0x08c379a0' +
        '0000000000000000000000000000000000000000000000000000000000000020' +
        '0000000000000000000000000000000000000000000000000000000000000014' +
        '496e73756666696369656e742062616c616e6365000000000000000000000000'

      const reason = decodeRevertReason(errorData)
      expect(reason).toBe('Insufficient balance')
    })

    it('should decode empty error message', () => {
      // Error("") encoded
      const errorData =
        '0x08c379a0' +
        '0000000000000000000000000000000000000000000000000000000000000020' +
        '0000000000000000000000000000000000000000000000000000000000000000'

      const reason = decodeRevertReason(errorData)
      expect(reason).toBe('')
    })
  })

  describe('Panic(uint256)', () => {
    it('should decode Panic with code 1 (assert failed)', () => {
      // Panic(1) encoded
      // Panic(uint256) selector: 0x4e487b71
      const panicData =
        '0x4e487b71' + '0000000000000000000000000000000000000000000000000000000000000001'

      const reason = decodeRevertReason(panicData)
      expect(reason).toContain('Panic')
      expect(reason).toContain('Assert failed')
    })

    it('should decode Panic with code 17 (overflow/underflow)', () => {
      // Panic(17 = 0x11) encoded
      const panicData =
        '0x4e487b71' + '0000000000000000000000000000000000000000000000000000000000000011'

      const reason = decodeRevertReason(panicData)
      expect(reason).toContain('Panic')
      expect(reason).toContain('overflow')
    })

    it('should decode Panic with code 18 (division by zero)', () => {
      // Panic(18 = 0x12) encoded
      const panicData =
        '0x4e487b71' + '0000000000000000000000000000000000000000000000000000000000000012'

      const reason = decodeRevertReason(panicData)
      expect(reason).toContain('Panic')
      expect(reason).toContain('Division by zero')
    })

    it('should decode Panic with code 50 (array index out of bounds)', () => {
      // Panic(50 = 0x32) encoded
      const panicData =
        '0x4e487b71' + '0000000000000000000000000000000000000000000000000000000000000032'

      const reason = decodeRevertReason(panicData)
      expect(reason).toContain('Panic')
      expect(reason).toContain('out of bounds')
    })
  })

  describe('custom errors', () => {
    it('should decode custom error with ABI', () => {
      const customAbi = [
        {
          type: 'error',
          name: 'InsufficientFunds',
          inputs: [
            { name: 'available', type: 'uint256' },
            { name: 'required', type: 'uint256' },
          ],
        },
      ] as const

      // InsufficientFunds(100, 200) encoded
      // Selector: keccak256("InsufficientFunds(uint256,uint256)")[:4] = 0x03eb8b54
      const errorData =
        '0x03eb8b54' +
        '0000000000000000000000000000000000000000000000000000000000000064' +
        '00000000000000000000000000000000000000000000000000000000000000c8'

      const reason = decodeRevertReason(errorData, customAbi)
      expect(reason).toContain('InsufficientFunds')
      expect(reason).toContain('100')
      expect(reason).toContain('200')
    })

    it('should return unknown error for unrecognized data', () => {
      const unknownData = '0x12345678'
      const reason = decodeRevertReason(unknownData)
      expect(reason).toContain('Unknown error')
    })
  })

  describe('edge cases', () => {
    it('should handle data without 0x prefix', () => {
      const panicData =
        '4e487b71' + '0000000000000000000000000000000000000000000000000000000000000001'

      const reason = decodeRevertReason(panicData)
      expect(reason).toContain('Panic')
    })

    it('should handle empty data', () => {
      const reason = decodeRevertReason('0x')
      expect(reason).toContain('Unknown error')
    })

    it('should handle malformed data gracefully', () => {
      // Too short for standard Error
      const reason = decodeRevertReason('0x08c379a0')
      expect(reason).toContain('Unknown error')
    })
  })
})

// =============================================================================
// Contract Proxy with Complex ABI
// =============================================================================

const complexAbi = [
  {
    type: 'function',
    name: 'createOrder',
    stateMutability: 'nonpayable',
    inputs: [
      {
        name: 'order',
        type: 'tuple',
        components: [
          { name: 'maker', type: 'address' },
          { name: 'amount', type: 'uint256' },
          { name: 'active', type: 'bool' },
        ],
      },
    ],
    outputs: [{ name: '', type: 'uint256' }],
  },
  {
    type: 'function',
    name: 'batchTransfer',
    stateMutability: 'nonpayable',
    inputs: [
      { name: 'recipients', type: 'address[]' },
      { name: 'amounts', type: 'uint256[]' },
    ],
    outputs: [{ name: '', type: 'bool' }],
  },
  {
    type: 'function',
    name: 'getOrder',
    stateMutability: 'view',
    inputs: [{ name: 'id', type: 'uint256' }],
    outputs: [
      {
        name: '',
        type: 'tuple',
        components: [
          { name: 'maker', type: 'address' },
          { name: 'amount', type: 'uint256' },
          { name: 'active', type: 'bool' },
        ],
      },
    ],
  },
] as const

const ADDR1 = '0x1234567890123456789012345678901234567890' as const
const ADDR2 = '0xabCDeF0123456789AbcdEf0123456789aBCDEF01' as const

function createMockEvmContext(callResponse: string): HasEvmService {
  return {
    client: {
      evm: {
        call: vi.fn().mockResolvedValue({
          response: callResponse,
          error: '',
          usedGas: 21000n,
        }),
      },
    },
  } as unknown as HasEvmService
}

// =============================================================================
// Bech32 → Hex Address Conversion in Proxies
// =============================================================================

// Generate valid bech32 ↔ hex pairs from known hex addresses
const BECH32_ADDR1 = AccAddress.fromHex(ADDR1)
const BECH32_ADDR2 = AccAddress.fromHex(ADDR2)

// ABI with various address parameter patterns
const addressConversionAbi = [
  {
    type: 'function',
    name: 'transfer',
    stateMutability: 'nonpayable',
    inputs: [
      { name: 'to', type: 'address' },
      { name: 'amount', type: 'uint256' },
    ],
    outputs: [{ name: '', type: 'bool' }],
  },
  {
    type: 'function',
    name: 'batchTransfer',
    stateMutability: 'nonpayable',
    inputs: [
      { name: 'recipients', type: 'address[]' },
      { name: 'amounts', type: 'uint256[]' },
    ],
    outputs: [{ name: '', type: 'bool' }],
  },
  {
    type: 'function',
    name: 'createOrder',
    stateMutability: 'nonpayable',
    inputs: [
      {
        name: 'order',
        type: 'tuple',
        components: [
          { name: 'buyer', type: 'address' },
          { name: 'seller', type: 'address' },
          { name: 'amount', type: 'uint256' },
        ],
      },
    ],
    outputs: [{ name: '', type: 'uint256' }],
  },
  {
    type: 'function',
    name: 'createOrders',
    stateMutability: 'nonpayable',
    inputs: [
      {
        name: 'orders',
        type: 'tuple[]',
        components: [
          { name: 'buyer', type: 'address' },
          { name: 'seller', type: 'address' },
          { name: 'amount', type: 'uint256' },
        ],
      },
    ],
    outputs: [{ name: '', type: 'uint256' }],
  },
  {
    type: 'function',
    name: 'balanceOf',
    stateMutability: 'view',
    inputs: [{ name: 'owner', type: 'address' }],
    outputs: [{ name: '', type: 'uint256' }],
  },
] as const

/**
 * Decode the ABI-encoded input (strip 4-byte selector) back to args using
 * a trick: treat the inputs schema as outputs and use decodeFunctionResult.
 */
function decodeWriteInput(abiItem: (typeof addressConversionAbi)[number], input: string) {
  return decodeFunctionResult({
    abi: [
      {
        type: 'function' as const,
        name: abiItem.name,
        stateMutability: 'view' as const,
        inputs: [] as const,
        outputs: abiItem.inputs,
      },
    ],
    functionName: abiItem.name,
    data: `0x${input.slice(10)}`,
  })
}

describe('EVM Address Conversion — bech32 → hex', () => {
  describe('top-level address', () => {
    it('should convert bech32 address param to hex', () => {
      const ctx = createMockEvmContext('')
      const contract = createEvmContract(ctx, ADDR1, addressConversionAbi)

      // @ts-expect-error -- testing bech32 auto-conversion (bech32 string where 0x expected)
      const msg = contract.write.transfer('init1sender', BECH32_ADDR1, 100n)
      const decoded = decodeWriteInput(addressConversionAbi[0], msg.value.input) as [string, bigint]

      expect(decoded[0].toLowerCase()).toBe(ADDR1.toLowerCase())
      expect(decoded[1]).toBe(100n)
    })

    it('should pass hex address through unchanged', () => {
      const ctx = createMockEvmContext('')
      const contract = createEvmContract(ctx, ADDR1, addressConversionAbi)

      const msg = contract.write.transfer('init1sender', ADDR1, 100n)
      const decoded = decodeWriteInput(addressConversionAbi[0], msg.value.input) as [string, bigint]

      expect(decoded[0].toLowerCase()).toBe(ADDR1.toLowerCase())
    })
  })

  describe('address[]', () => {
    it('should convert bech32 addresses in array', () => {
      const ctx = createMockEvmContext('')
      const contract = createEvmContract(ctx, ADDR1, addressConversionAbi)

      const msg = contract.write.batchTransfer(
        'init1sender',
        // @ts-expect-error -- testing bech32 auto-conversion (bech32 strings in address[])
        [BECH32_ADDR1, BECH32_ADDR2],
        [100n, 200n]
      )
      const decoded = decodeWriteInput(addressConversionAbi[1], msg.value.input) as [
        string[],
        bigint[],
      ]

      expect(decoded[0][0].toLowerCase()).toBe(ADDR1.toLowerCase())
      expect(decoded[0][1].toLowerCase()).toBe(ADDR2.toLowerCase())
    })

    it('should handle mixed hex and bech32 in array', () => {
      const ctx = createMockEvmContext('')
      const contract = createEvmContract(ctx, ADDR1, addressConversionAbi)

      const msg = contract.write.batchTransfer(
        'init1sender',
        // @ts-expect-error -- testing bech32 auto-conversion (mixed hex/bech32 in address[])
        [ADDR1, BECH32_ADDR2],
        [100n, 200n]
      )
      const decoded = decodeWriteInput(addressConversionAbi[1], msg.value.input) as [
        string[],
        bigint[],
      ]

      expect(decoded[0][0].toLowerCase()).toBe(ADDR1.toLowerCase())
      expect(decoded[0][1].toLowerCase()).toBe(ADDR2.toLowerCase())
    })
  })

  describe('tuple with address components', () => {
    it('should convert bech32 addresses inside tuple', () => {
      const ctx = createMockEvmContext('')
      const contract = createEvmContract(ctx, ADDR1, addressConversionAbi)

      // @ts-expect-error -- testing bech32 auto-conversion (bech32 in tuple address fields)
      const msg = contract.write.createOrder('init1sender', {
        buyer: BECH32_ADDR1,
        seller: BECH32_ADDR2,
        amount: 500n,
      })
      const decoded = decodeWriteInput(addressConversionAbi[2], msg.value.input) as {
        buyer: string
        seller: string
        amount: bigint
      }

      expect(decoded.buyer.toLowerCase()).toBe(ADDR1.toLowerCase())
      expect(decoded.seller.toLowerCase()).toBe(ADDR2.toLowerCase())
      expect(decoded.amount).toBe(500n)
    })

    it('should handle mixed hex and bech32 inside tuple', () => {
      const ctx = createMockEvmContext('')
      const contract = createEvmContract(ctx, ADDR1, addressConversionAbi)

      // @ts-expect-error -- testing bech32 auto-conversion (mixed hex/bech32 in tuple)
      const msg = contract.write.createOrder('init1sender', {
        buyer: ADDR1,
        seller: BECH32_ADDR2,
        amount: 500n,
      })
      const decoded = decodeWriteInput(addressConversionAbi[2], msg.value.input) as {
        buyer: string
        seller: string
        amount: bigint
      }

      expect(decoded.buyer.toLowerCase()).toBe(ADDR1.toLowerCase())
      expect(decoded.seller.toLowerCase()).toBe(ADDR2.toLowerCase())
    })
  })

  describe('tuple[] with address components', () => {
    it('should convert bech32 addresses inside array of tuples', () => {
      const ctx = createMockEvmContext('')
      const contract = createEvmContract(ctx, ADDR1, addressConversionAbi)

      // @ts-expect-error -- testing bech32 auto-conversion (bech32 in tuple[] address fields)
      const msg = contract.write.createOrders('init1sender', [
        { buyer: BECH32_ADDR1, seller: BECH32_ADDR2, amount: 100n },
        { buyer: BECH32_ADDR2, seller: BECH32_ADDR1, amount: 200n },
      ])
      const decoded = decodeWriteInput(addressConversionAbi[3], msg.value.input) as Array<{
        buyer: string
        seller: string
        amount: bigint
      }>

      expect(decoded[0].buyer.toLowerCase()).toBe(ADDR1.toLowerCase())
      expect(decoded[0].seller.toLowerCase()).toBe(ADDR2.toLowerCase())
      expect(decoded[1].buyer.toLowerCase()).toBe(ADDR2.toLowerCase())
      expect(decoded[1].seller.toLowerCase()).toBe(ADDR1.toLowerCase())
    })
  })

  describe('read proxy', () => {
    it('should convert bech32 address in read args', async () => {
      const ctx = createMockEvmContext(
        '0x0000000000000000000000000000000000000000000000000000000000000064'
      )
      const contract = createEvmContract(ctx, ADDR1, addressConversionAbi)

      // @ts-expect-error -- testing bech32 auto-conversion (bech32 in read address param)
      const result = await contract.read.balanceOf(BECH32_ADDR1)

      // Verify the call was made and returned properly
      expect(result).toBe(100n)

      // Verify the encoded input contains the hex address, not bech32
      const callArgs = (ctx.client.evm.call as ReturnType<typeof vi.fn>).mock.calls[0][0]
      const input = callArgs.input as string
      // The input should contain the hex address (without 0x, lowercase, 0-padded to 32 bytes)
      expect(input.toLowerCase()).toContain(ADDR1.slice(2).toLowerCase())
    })
  })
})

describe('EVM Contract Proxy — complex ABI types', () => {
  describe('write proxy', () => {
    it('should encode tuple arg through write proxy and produce valid input', () => {
      const ctx = createMockEvmContext('')
      const contract = createEvmContract(ctx, ADDR1, complexAbi)

      const order = { maker: ADDR2, amount: 500n, active: true }
      const msg = contract.write.createOrder('init1sender', order)

      // Verify the input can be decoded back to the original args
      const decoded = decodeFunctionResult({
        abi: [
          {
            type: 'function',
            name: 'createOrder',
            stateMutability: 'view',
            inputs: [],
            outputs: complexAbi[0].inputs,
          },
        ] as const,
        functionName: 'createOrder',
        // Strip selector (first 10 chars = "0x" + 8 hex) and treat remainder as return data
        data: `0x${msg.value.input.slice(10)}`,
      }) as { maker: string; amount: bigint; active: boolean }

      expect(decoded.maker).toBe(ADDR2)
      expect(decoded.amount).toBe(500n)
      expect(decoded.active).toBe(true)
    })

    it('should encode dynamic array args through write proxy', () => {
      const ctx = createMockEvmContext('')
      const contract = createEvmContract(ctx, ADDR1, complexAbi)

      const msg = contract.write.batchTransfer('init1sender', [ADDR1, ADDR2], [100n, 200n])

      // Verify input starts with correct selector and has reasonable length
      const input = msg.value.input
      expect(input.startsWith('0x') || input.length > 10).toBe(true)
      // batchTransfer has dynamic args so encoding is substantial
      expect(input.length).toBeGreaterThan(100)
    })
  })

  describe('read proxy — complex ABI', () => {
    it('should decode tuple return through read proxy', async () => {
      // Pre-encode the expected return value
      const { encodeAbiParameters } = await import('../../../../src/contracts/evm')
      const encodedReturn = encodeAbiParameters(
        [
          {
            name: '',
            type: 'tuple',
            components: [
              { name: 'maker', type: 'address' },
              { name: 'amount', type: 'uint256' },
              { name: 'active', type: 'bool' },
            ],
          },
        ],
        [{ maker: ADDR2, amount: 1000n, active: false }]
      )

      const ctx = createMockEvmContext(encodedReturn)
      const contract = createEvmContract(ctx, ADDR1, complexAbi)

      const result = (await contract.read.getOrder(1n)) as {
        maker: string
        amount: bigint
        active: boolean
      }

      expect(result.maker).toBe(ADDR2)
      expect(result.amount).toBe(1000n)
      expect(result.active).toBe(false)
    })
  })
})

// =============================================================================
// encodeEvmCall / encodeEvmParameters
// =============================================================================

describe('encodeEvmCall', () => {
  it('should encode with human-readable signature', () => {
    const calldata = encodeEvmCall('function transfer(address to, uint256 amount)', [ADDR1, 100n])

    expect(calldata).toMatch(/^0x/)
    // function selector (4 bytes = 8 hex chars) + encoded params
    expect(calldata.length).toBeGreaterThan(10)
  })

  it('should encode without function keyword', () => {
    const calldata = encodeEvmCall('transfer(address,uint256)', [ADDR1, 100n])

    expect(calldata).toMatch(/^0x/)
    expect(calldata.length).toBeGreaterThan(10)
  })

  it('should produce same calldata with or without function keyword', () => {
    const a = encodeEvmCall('function transfer(address to, uint256 amount)', [ADDR1, 100n])
    const b = encodeEvmCall('transfer(address,uint256)', [ADDR1, 100n])

    expect(a).toBe(b)
  })

  it('should auto-convert bech32 address to hex', () => {
    const withBech32 = encodeEvmCall('function transfer(address to, uint256 amount)', [
      BECH32_ADDR1,
      100n,
    ])
    const withHex = encodeEvmCall('function transfer(address to, uint256 amount)', [ADDR1, 100n])

    expect(withBech32).toBe(withHex)
  })

  it('should auto-convert bech32 in address[] param', () => {
    const withBech32 = encodeEvmCall(
      'function batchTransfer(address[] recipients, uint256[] amounts)',
      [
        [BECH32_ADDR1, BECH32_ADDR2],
        [100n, 200n],
      ]
    )
    const withHex = encodeEvmCall(
      'function batchTransfer(address[] recipients, uint256[] amounts)',
      [
        [ADDR1, ADDR2],
        [100n, 200n],
      ]
    )

    expect(withBech32).toBe(withHex)
  })

  it('should auto-convert bech32 in tuple address fields', () => {
    const withBech32 = encodeEvmCall(
      'function createOrder((address buyer, address seller, uint256 amount) order)',
      [{ buyer: BECH32_ADDR1, seller: BECH32_ADDR2, amount: 100n }]
    )
    const withHex = encodeEvmCall(
      'function createOrder((address buyer, address seller, uint256 amount) order)',
      [{ buyer: ADDR1, seller: ADDR2, amount: 100n }]
    )

    expect(withBech32).toBe(withHex)
  })

  it('should encode function with no args', () => {
    const calldata = encodeEvmCall('function totalSupply()', [])

    expect(calldata).toMatch(/^0x/)
    // selector only (4 bytes = 8 hex chars + 0x)
    expect(calldata.length).toBe(10)
  })

  it('should throw on invalid signature', () => {
    expect(() => encodeEvmCall('not a valid signature', [])).toThrow()
  })
})

describe('encodeEvmParameters', () => {
  it('should encode parameters with type strings', () => {
    const encoded = encodeEvmParameters(['address', 'uint256'], [ADDR1, 100n])

    expect(encoded).toMatch(/^0x/)
    // 2 params × 32 bytes = 64 bytes = 128 hex chars + 0x prefix
    expect(encoded.length).toBe(2 + 128)
  })

  it('should auto-convert bech32 address to hex', () => {
    const withBech32 = encodeEvmParameters(['address', 'uint256'], [BECH32_ADDR1, 100n])
    const withHex = encodeEvmParameters(['address', 'uint256'], [ADDR1, 100n])

    expect(withBech32).toBe(withHex)
  })

  it('should decode back to original values', () => {
    const encoded = encodeEvmParameters(['address', 'uint256'], [ADDR1, 42n])

    const [addr, amount] = decodeAbiParameters([{ type: 'address' }, { type: 'uint256' }], encoded)

    expect((addr as string).toLowerCase()).toBe(ADDR1.toLowerCase())
    expect(amount).toBe(42n)
  })

  it('should auto-convert bech32 in address array', () => {
    const withBech32 = encodeEvmParameters(['address[]'], [[BECH32_ADDR1, BECH32_ADDR2]])
    const withHex = encodeEvmParameters(['address[]'], [[ADDR1, ADDR2]])

    expect(withBech32).toBe(withHex)
  })
})
