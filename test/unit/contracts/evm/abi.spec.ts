/**
 * Unit tests for EVM ABI encoding/decoding utilities.
 */

import { describe, it, expect } from 'vitest'
import {
  encodeFunctionData,
  decodeFunctionResult,
  encodeAbiParameters,
  decodeAbiParameters,
  encodeEventTopics,
} from '../../../../src/contracts/evm'

// Sample ERC20 ABI for testing
const erc20Abi = [
  {
    type: 'function',
    name: 'transfer',
    stateMutability: 'nonpayable',
    inputs: [
      { name: 'to', type: 'address' },
      { name: 'value', type: 'uint256' },
    ],
    outputs: [{ name: '', type: 'bool' }],
  },
  {
    type: 'function',
    name: 'balanceOf',
    stateMutability: 'view',
    inputs: [{ name: 'account', type: 'address' }],
    outputs: [{ name: '', type: 'uint256' }],
  },
  {
    type: 'function',
    name: 'decimals',
    stateMutability: 'view',
    inputs: [],
    outputs: [{ name: '', type: 'uint8' }],
  },
  {
    type: 'event',
    name: 'Transfer',
    inputs: [
      { name: 'from', type: 'address', indexed: true },
      { name: 'to', type: 'address', indexed: true },
      { name: 'value', type: 'uint256', indexed: false },
    ],
  },
] as const

describe('EVM ABI Utilities', () => {
  describe('encodeFunctionData', () => {
    it('should encode transfer function call', () => {
      const data = encodeFunctionData({
        abi: erc20Abi,
        functionName: 'transfer',
        args: ['0x1234567890123456789012345678901234567890', 1000000n],
      })

      // transfer(address,uint256) selector = 0xa9059cbb
      expect(data.startsWith('0xa9059cbb')).toBe(true)
      expect(data.length).toBe(138) // 0x + 4 bytes selector + 32 bytes address + 32 bytes amount
    })

    it('should encode balanceOf function call', () => {
      const data = encodeFunctionData({
        abi: erc20Abi,
        functionName: 'balanceOf',
        args: ['0x1234567890123456789012345678901234567890'],
      })

      // balanceOf(address) selector = 0x70a08231
      expect(data.startsWith('0x70a08231')).toBe(true)
      expect(data.length).toBe(74) // 0x + 4 bytes selector + 32 bytes address
    })

    it('should encode function with no arguments', () => {
      const data = encodeFunctionData({
        abi: erc20Abi,
        functionName: 'decimals',
        args: [],
      })

      // decimals() selector = 0x313ce567
      expect(data.startsWith('0x313ce567')).toBe(true)
      expect(data.length).toBe(10) // 0x + 4 bytes selector only
    })
  })

  describe('decodeFunctionResult', () => {
    it('should decode uint256 result', () => {
      // Encoded value: 1000000 (0xF4240)
      const encodedBalance = '0x00000000000000000000000000000000000000000000000000000000000f4240'

      const result = decodeFunctionResult({
        abi: erc20Abi,
        functionName: 'balanceOf',
        data: encodedBalance,
      })

      expect(result).toBe(1000000n)
    })

    it('should decode uint8 result', () => {
      // Encoded value: 18 (0x12)
      const encodedDecimals = '0x0000000000000000000000000000000000000000000000000000000000000012'

      const result = decodeFunctionResult({
        abi: erc20Abi,
        functionName: 'decimals',
        data: encodedDecimals,
      })

      expect(result).toBe(18)
    })

    it('should decode bool result', () => {
      // Encoded value: true (1)
      const encodedTrue = '0x0000000000000000000000000000000000000000000000000000000000000001'

      const result = decodeFunctionResult({
        abi: erc20Abi,
        functionName: 'transfer',
        data: encodedTrue,
      })

      expect(result).toBe(true)
    })
  })

  describe('encodeAbiParameters', () => {
    it('should encode simple types', () => {
      const encoded = encodeAbiParameters(
        [
          { name: 'x', type: 'uint256' },
          { name: 'y', type: 'address' },
        ],
        [123n, '0x1234567890123456789012345678901234567890']
      )

      expect(encoded.startsWith('0x')).toBe(true)
      expect(encoded.length).toBe(130) // 0x + 32 bytes uint256 + 32 bytes address
    })

    it('should encode string type', () => {
      const encoded = encodeAbiParameters([{ name: 's', type: 'string' }], ['hello'])

      expect(encoded.startsWith('0x')).toBe(true)
      // String encoding includes offset, length, and padded data
      expect(encoded.length).toBeGreaterThan(66)
    })

    it('should encode bytes type', () => {
      const encoded = encodeAbiParameters([{ name: 'b', type: 'bytes' }], ['0x1234'])

      expect(encoded.startsWith('0x')).toBe(true)
    })
  })

  describe('decodeAbiParameters', () => {
    it('should decode encoded parameters', () => {
      const encoded = encodeAbiParameters(
        [
          { name: 'a', type: 'uint256' },
          { name: 'b', type: 'bool' },
        ],
        [42n, true]
      )

      const [a, b] = decodeAbiParameters(
        [
          { name: 'a', type: 'uint256' },
          { name: 'b', type: 'bool' },
        ],
        encoded
      )

      expect(a).toBe(42n)
      expect(b).toBe(true)
    })
  })

  // ===========================================================================
  // Complex ABI Types
  // ===========================================================================

  // ABI with tuple, array, nested tuple, and multi-return functions
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
      name: 'setScores',
      stateMutability: 'nonpayable',
      inputs: [{ name: 'scores', type: 'uint256[3]' }],
      outputs: [],
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
    {
      type: 'function',
      name: 'getOrders',
      stateMutability: 'view',
      inputs: [],
      outputs: [
        {
          name: '',
          type: 'tuple[]',
          components: [
            { name: 'maker', type: 'address' },
            { name: 'amount', type: 'uint256' },
          ],
        },
      ],
    },
    {
      type: 'function',
      name: 'getInfo',
      stateMutability: 'view',
      inputs: [],
      outputs: [
        { name: 'name', type: 'string' },
        { name: 'value', type: 'uint256' },
        { name: 'active', type: 'bool' },
      ],
    },
    {
      type: 'function',
      name: 'createNestedOrder',
      stateMutability: 'nonpayable',
      inputs: [
        {
          name: 'order',
          type: 'tuple',
          components: [
            { name: 'maker', type: 'address' },
            {
              name: 'details',
              type: 'tuple',
              components: [
                { name: 'amount', type: 'uint256' },
                { name: 'active', type: 'bool' },
              ],
            },
          ],
        },
      ],
      outputs: [{ name: '', type: 'uint256' }],
    },
  ] as const

  const ADDR1 = '0x1234567890123456789012345678901234567890'
  const ADDR2 = '0xabCDeF0123456789AbcdEf0123456789aBCDEF01'

  describe('encodeFunctionData — complex types', () => {
    it('should encode tuple (struct) parameter', () => {
      const data = encodeFunctionData({
        abi: complexAbi,
        functionName: 'createOrder',
        args: [{ maker: ADDR1, amount: 500n, active: true }],
      })

      // createOrder((address,uint256,bool))
      expect(data.startsWith('0x')).toBe(true)
      expect(data.length).toBeGreaterThan(10)
    })

    it('should encode dynamic array parameters', () => {
      const data = encodeFunctionData({
        abi: complexAbi,
        functionName: 'batchTransfer',
        args: [
          [ADDR1, ADDR2],
          [100n, 200n],
        ],
      })

      expect(data.startsWith('0x')).toBe(true)
      // Dynamic arrays use offset pointers, so encoding is longer
      expect(data.length).toBeGreaterThan(138)
    })

    it('should encode fixed-size array parameter', () => {
      const data = encodeFunctionData({
        abi: complexAbi,
        functionName: 'setScores',
        args: [[10n, 20n, 30n]],
      })

      expect(data.startsWith('0x')).toBe(true)
      // selector(8) + 3 * 64 chars = 200
      expect(data.length).toBe(2 + 8 + 3 * 64)
    })

    it('should encode nested tuple parameter', () => {
      const data = encodeFunctionData({
        abi: complexAbi,
        functionName: 'createNestedOrder',
        args: [{ maker: ADDR1, details: { amount: 1000n, active: false } }],
      })

      expect(data.startsWith('0x')).toBe(true)
      expect(data.length).toBeGreaterThan(10)
    })
  })

  describe('decodeFunctionResult — complex types', () => {
    it('should decode tuple return', () => {
      // Encode a tuple then decode it
      const encoded = encodeAbiParameters(
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
        [{ maker: ADDR1, amount: 500n, active: true }]
      )

      const result = decodeFunctionResult({
        abi: complexAbi,
        functionName: 'getOrder',
        data: encoded,
      })

      expect(result).toEqual({
        maker: ADDR1,
        amount: 500n,
        active: true,
      })
    })

    it('should decode tuple array return', () => {
      const encoded = encodeAbiParameters(
        [
          {
            name: '',
            type: 'tuple[]',
            components: [
              { name: 'maker', type: 'address' },
              { name: 'amount', type: 'uint256' },
            ],
          },
        ],
        [
          [
            { maker: ADDR1, amount: 100n },
            { maker: ADDR2, amount: 200n },
          ],
        ]
      )

      const result = decodeFunctionResult({
        abi: complexAbi,
        functionName: 'getOrders',
        data: encoded,
      }) as Array<{ maker: string; amount: bigint }>

      expect(result).toHaveLength(2)
      expect(result[0].maker).toBe(ADDR1)
      expect(result[0].amount).toBe(100n)
      expect(result[1].maker).toBe(ADDR2)
      expect(result[1].amount).toBe(200n)
    })

    it('should decode multiple return values', () => {
      const encoded = encodeAbiParameters(
        [
          { name: 'name', type: 'string' },
          { name: 'value', type: 'uint256' },
          { name: 'active', type: 'bool' },
        ],
        ['TestToken', 42n, true]
      )

      const result = decodeFunctionResult({
        abi: complexAbi,
        functionName: 'getInfo',
        data: encoded,
      }) as [string, bigint, boolean]

      expect(result).toEqual(['TestToken', 42n, true])
    })
  })

  describe('encodeAbiParameters / decodeAbiParameters — complex types', () => {
    it('should roundtrip tuple', () => {
      const params = [
        {
          name: 'order',
          type: 'tuple' as const,
          components: [
            { name: 'maker', type: 'address' as const },
            { name: 'amount', type: 'uint256' as const },
            { name: 'active', type: 'bool' as const },
          ],
        },
      ]
      const values = [{ maker: ADDR1, amount: 999n, active: false }] as const

      const encoded = encodeAbiParameters(params, values)
      const [decoded] = decodeAbiParameters(params, encoded)

      expect(decoded).toEqual({ maker: ADDR1, amount: 999n, active: false })
    })

    it('should roundtrip nested tuple', () => {
      const params = [
        {
          name: 'order',
          type: 'tuple' as const,
          components: [
            { name: 'maker', type: 'address' as const },
            {
              name: 'details',
              type: 'tuple' as const,
              components: [
                { name: 'amount', type: 'uint256' as const },
                { name: 'active', type: 'bool' as const },
              ],
            },
          ],
        },
      ]
      const values = [{ maker: ADDR1, details: { amount: 777n, active: true } }] as const

      const encoded = encodeAbiParameters(params, values)
      const [decoded] = decodeAbiParameters(params, encoded)

      expect(decoded).toEqual({
        maker: ADDR1,
        details: { amount: 777n, active: true },
      })
    })

    it('should roundtrip dynamic array', () => {
      const params = [{ name: 'values', type: 'uint256[]' as const }]
      const values = [[10n, 20n, 30n, 40n]] as const

      const encoded = encodeAbiParameters(params, values)
      const [decoded] = decodeAbiParameters(params, encoded)

      expect(decoded).toEqual([10n, 20n, 30n, 40n])
    })

    it('should roundtrip fixed-size array', () => {
      const params = [{ name: 'scores', type: 'uint256[3]' as const }]
      const values = [[1n, 2n, 3n]] as const

      const encoded = encodeAbiParameters(params, values)
      const [decoded] = decodeAbiParameters(params, encoded)

      expect(decoded).toEqual([1n, 2n, 3n])
    })

    it('should roundtrip tuple array', () => {
      const params = [
        {
          name: 'orders',
          type: 'tuple[]' as const,
          components: [
            { name: 'maker', type: 'address' as const },
            { name: 'amount', type: 'uint256' as const },
          ],
        },
      ]
      const values = [
        [
          { maker: ADDR1, amount: 100n },
          { maker: ADDR2, amount: 200n },
        ],
      ] as const

      const encoded = encodeAbiParameters(params, values)
      const [decoded] = decodeAbiParameters(params, encoded)

      expect(decoded).toEqual([
        { maker: ADDR1, amount: 100n },
        { maker: ADDR2, amount: 200n },
      ])
    })

    it('should roundtrip bytes32', () => {
      const params = [{ name: 'hash', type: 'bytes32' as const }]
      const hash =
        '0xaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa' as `0x${string}`
      const values = [hash] as const

      const encoded = encodeAbiParameters(params, values)
      const [decoded] = decodeAbiParameters(params, encoded)

      expect(decoded).toBe(hash)
    })

    it('should roundtrip int256 (signed)', () => {
      const params = [{ name: 'val', type: 'int256' as const }]
      const values = [-42n] as const

      const encoded = encodeAbiParameters(params, values)
      const [decoded] = decodeAbiParameters(params, encoded)

      expect(decoded).toBe(-42n)
    })
  })

  describe('encodeEventTopics', () => {
    it('should encode event topics with indexed parameters', () => {
      const topics = encodeEventTopics({
        abi: erc20Abi,
        eventName: 'Transfer',
        args: {
          from: '0x1234567890123456789012345678901234567890',
          to: '0x0987654321098765432109876543210987654321',
        },
      })

      // topics[0] is the event signature hash
      // topics[1] is the 'from' address
      // topics[2] is the 'to' address
      expect(topics).toHaveLength(3)
      expect(topics[0]).toBeTruthy()
    })

    it('should encode event topic without filter args', () => {
      const topics = encodeEventTopics({
        abi: erc20Abi,
        eventName: 'Transfer',
      })

      // Only the event signature hash
      expect(topics).toHaveLength(1)
      expect(topics[0]).toBeTruthy()
    })
  })
})
