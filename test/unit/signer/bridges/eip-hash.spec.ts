// test/unit/signer/bridges/eip-hash.spec.ts
import { describe, it, expect } from 'vitest'
import { hashEIP191Message, hashEIP712TypedData } from '../../../../src/signer/bridges/eip-hash'
import { hashMessage, hashTypedData } from 'viem'

describe('hashEIP191Message', () => {
  it('should match viem hashMessage for string input', () => {
    const message = 'hello world'
    const ours = hashEIP191Message(message)
    const viems = hashMessage(message)

    expect(ours).toBe(viems)
  })

  it('should match viem hashMessage for empty string', () => {
    expect(hashEIP191Message('')).toBe(hashMessage(''))
  })

  it('should match viem hashMessage for Uint8Array input', () => {
    const raw = new Uint8Array([0xde, 0xad, 0xbe, 0xef])
    const ours = hashEIP191Message({ raw })
    const viems = hashMessage({ raw })

    expect(ours).toBe(viems)
  })

  it('should match viem hashMessage for long message', () => {
    const message = 'a'.repeat(1000)
    expect(hashEIP191Message(message)).toBe(hashMessage(message))
  })
})

describe('hashEIP712TypedData', () => {
  const typedData = {
    domain: {
      name: 'Ether Mail',
      version: '1',
      chainId: 1,
      verifyingContract: '0xCcCCccccCCCCcCCCCCCcCcCccCcCCCcCcccccccC' as `0x${string}`,
    },
    types: {
      Person: [
        { name: 'name', type: 'string' },
        { name: 'wallet', type: 'address' },
      ],
      Mail: [
        { name: 'from', type: 'Person' },
        { name: 'to', type: 'Person' },
        { name: 'contents', type: 'string' },
      ],
    },
    primaryType: 'Mail' as const,
    message: {
      from: { name: 'Cow', wallet: '0xCD2a3d9F938E13CD947Ec05AbC7FE734Df8DD826' },
      to: { name: 'Bob', wallet: '0xbBbBBBBbbBBBbbbBbbBbbbbBBbBbbbbBbBbbBBbB' },
      contents: 'Hello, Bob!',
    },
  }

  it('should match viem hashTypedData for EIP-712 example', () => {
    const ours = hashEIP712TypedData(typedData)
    const viems = hashTypedData(typedData)

    expect(ours).toBe(viems)
  })

  it('should handle uint256 and int256 types', () => {
    const data = {
      domain: { name: 'Test' },
      types: {
        Order: [
          { name: 'amount', type: 'uint256' },
          { name: 'price', type: 'int256' },
        ],
      },
      primaryType: 'Order' as const,
      message: { amount: 1000n, price: -500n },
    }

    expect(hashEIP712TypedData(data)).toBe(hashTypedData(data))
  })

  it('should handle bytes and bytes32 types', () => {
    const data = {
      domain: { name: 'Test' },
      types: {
        Data: [
          { name: 'hash', type: 'bytes32' },
          { name: 'payload', type: 'bytes' },
        ],
      },
      primaryType: 'Data' as const,
      message: {
        hash: '0x1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef',
        payload: '0xdeadbeef',
      },
    }

    expect(hashEIP712TypedData(data)).toBe(hashTypedData(data))
  })

  it('should handle bool type', () => {
    const data = {
      domain: { name: 'Test' },
      types: {
        Flag: [{ name: 'active', type: 'bool' }],
      },
      primaryType: 'Flag' as const,
      message: { active: true },
    }

    expect(hashEIP712TypedData(data)).toBe(hashTypedData(data))
  })

  it('should handle array types', () => {
    const data = {
      domain: { name: 'Test' },
      types: {
        Batch: [{ name: 'amounts', type: 'uint256[]' }],
      },
      primaryType: 'Batch' as const,
      message: { amounts: [100n, 200n, 300n] },
    }

    expect(hashEIP712TypedData(data)).toBe(hashTypedData(data))
  })
})
