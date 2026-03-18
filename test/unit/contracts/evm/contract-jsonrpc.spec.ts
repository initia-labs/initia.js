/**
 * Unit tests for EVM contract JSON-RPC transport.
 */

import { describe, it, expect, vi } from 'vitest'
import { createEvmContract } from '../../../../src/contracts/evm'
import { ContractError } from '../../../../src/contracts/errors'
import type { HasEvmService } from '../../../../src/client/types'
import type { EvmRpcClient } from '../../../../src/client/evm-rpc'

// =============================================================================
// Test ABI
// =============================================================================

const erc20Abi = [
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
    type: 'function',
    name: 'name',
    stateMutability: 'view',
    inputs: [],
    outputs: [{ name: '', type: 'string' }],
  },
  {
    type: 'function',
    name: 'symbol',
    stateMutability: 'view',
    inputs: [],
    outputs: [{ name: '', type: 'string' }],
  },
  {
    type: 'function',
    name: 'totalSupply',
    stateMutability: 'view',
    inputs: [],
    outputs: [{ name: '', type: 'uint256' }],
  },
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
    name: 'deposit',
    stateMutability: 'payable',
    inputs: [],
    outputs: [],
  },
] as const

const CONTRACT_ADDRESS = '0x1234567890123456789012345678901234567890'
const OWNER_ADDRESS = '0xabCDeF0123456789AbcdEf0123456789aBCDEF01'

// =============================================================================
// Mock Helpers
// =============================================================================

function createMockEvmRpc(overrides?: Partial<EvmRpcClient>): EvmRpcClient {
  return {
    ethCall: vi.fn().mockResolvedValue('0x' + '0'.repeat(62) + '64'), // 100n
    estimateGas: vi.fn().mockResolvedValue(21000n),
    sendRawTransaction: vi.fn().mockResolvedValue('0xtxhash'),
    getTransactionCount: vi.fn().mockResolvedValue(0n),
    getChainId: vi.fn().mockResolvedValue(1n),
    getGasPrice: vi.fn().mockResolvedValue(1000000000n),
    getBalance: vi.fn().mockResolvedValue(0n),
    getBlockNumber: vi.fn().mockResolvedValue(100n),
    ...overrides,
  } as unknown as EvmRpcClient
}

function createMockJsonRpcContext(
  rpc: EvmRpcClient,
  options?: { privateKey?: `0x${string}` }
): HasEvmService {
  const signer = options?.privateKey ? { getPrivateKeyHex: () => options.privateKey! } : undefined

  return {
    client: {
      evm: {
        call: vi.fn().mockResolvedValue({ response: '', error: '', usedGas: 0n }),
      },
    },
    evmRpc: rpc,
    signer,
  } as unknown as HasEvmService
}

// =============================================================================
// Tests
// =============================================================================

describe('createEvmContract with transport: jsonrpc', () => {
  describe('read proxy', () => {
    it('should call ethCall and decode the result', async () => {
      const balanceHex = '0x' + BigInt(1000).toString(16).padStart(64, '0')

      const rpc = createMockEvmRpc({ ethCall: vi.fn().mockResolvedValue(balanceHex) })
      const ctx = createMockJsonRpcContext(rpc)
      const contract = createEvmContract(ctx, CONTRACT_ADDRESS, erc20Abi, { transport: 'jsonrpc' })

      const balance = await contract.read.balanceOf(OWNER_ADDRESS)

      expect(balance).toBe(1000n)
      expect(rpc.ethCall).toHaveBeenCalledOnce()

      // Verify ethCall was called with correct params
      const callArgs = (rpc.ethCall as ReturnType<typeof vi.fn>).mock.calls[0][0]
      expect(callArgs.to).toBe(CONTRACT_ADDRESS)
      expect(callArgs.data).toBeDefined()
    })

    it('should throw ContractError with data on revert', async () => {
      const revertData =
        '0x08c379a0' +
        '0000000000000000000000000000000000000000000000000000000000000020' +
        '0000000000000000000000000000000000000000000000000000000000000014' +
        '496e73756666696369656e742062616c616e6365000000000000000000000000'

      const rpc = createMockEvmRpc({
        ethCall: vi
          .fn()
          .mockRejectedValue(new ContractError('evm', 3, 'execution reverted', revertData)),
      })
      const ctx = createMockJsonRpcContext(rpc)
      const contract = createEvmContract(ctx, CONTRACT_ADDRESS, erc20Abi, { transport: 'jsonrpc' })

      try {
        await contract.read.balanceOf(OWNER_ADDRESS)
        expect.fail('Should have thrown')
      } catch (e) {
        expect(e).toBeInstanceOf(ContractError)
        const err = e as ContractError
        expect(err.data).toBe(revertData)
        expect(err.code).toBe(3)
      }
    })
  })

  describe('estimateGas proxy', () => {
    it('should call eth_estimateGas without sender arg', async () => {
      const rpc = createMockEvmRpc({ estimateGas: vi.fn().mockResolvedValue(50000n) })
      const ctx = createMockJsonRpcContext(rpc)
      const contract = createEvmContract(ctx, CONTRACT_ADDRESS, erc20Abi, { transport: 'jsonrpc' })

      const gas = await contract.estimateGas.transfer(OWNER_ADDRESS, 100n)

      expect(gas).toBe(50000n)
      expect(rpc.estimateGas).toHaveBeenCalledOnce()

      const callArgs = (rpc.estimateGas as ReturnType<typeof vi.fn>).mock.calls[0][0]
      expect(callArgs.to).toBe(CONTRACT_ADDRESS)
      expect(callArgs.data).toBeDefined()
    })

    it('should pass value for payable functions', async () => {
      const rpc = createMockEvmRpc({ estimateGas: vi.fn().mockResolvedValue(30000n) })
      const ctx = createMockJsonRpcContext(rpc)
      const contract = createEvmContract(ctx, CONTRACT_ADDRESS, erc20Abi, { transport: 'jsonrpc' })

      const gas = await contract.estimateGas.deposit({ value: '1000000' })

      expect(gas).toBe(30000n)
      const callArgs = (rpc.estimateGas as ReturnType<typeof vi.fn>).mock.calls[0][0]
      expect(callArgs.value).toBe('0x' + BigInt(1000000).toString(16))
    })
  })

  describe('write proxy', () => {
    it('should throw when no private key is available', async () => {
      const rpc = createMockEvmRpc()
      // No signer, no privateKey
      const ctx = {
        client: { evm: { call: vi.fn() } },
        evmRpc: rpc,
      } as unknown as HasEvmService

      const contract = createEvmContract(ctx, CONTRACT_ADDRESS, erc20Abi, { transport: 'jsonrpc' })

      await expect(contract.write.transfer(OWNER_ADDRESS, 100n)).rejects.toThrow(
        'Private key required'
      )
    })

    it('should use privateKey from options', async () => {
      // Use a real-ish private key (32 bytes hex)
      const privateKey = ('0x' + 'ab'.repeat(32)) as `0x${string}`

      const rpc = createMockEvmRpc()
      const ctx = createMockJsonRpcContext(rpc)
      const contract = createEvmContract(ctx, CONTRACT_ADDRESS, erc20Abi, {
        transport: 'jsonrpc',
        privateKey,
      })

      // sendEvmTx is called internally; it uses rpc methods
      // Since we mock all rpc methods, this should complete
      const txHash = await contract.write.transfer(OWNER_ADDRESS, 100n)

      expect(typeof txHash).toBe('string')
      // sendRawTransaction should have been called
      expect(rpc.sendRawTransaction).toHaveBeenCalledOnce()
    })

    it('should extract privateKey from context signer', async () => {
      const privateKey = ('0x' + 'cd'.repeat(32)) as `0x${string}`
      const rpc = createMockEvmRpc()
      const ctx = createMockJsonRpcContext(rpc, { privateKey })
      const contract = createEvmContract(ctx, CONTRACT_ADDRESS, erc20Abi, { transport: 'jsonrpc' })

      const txHash = await contract.write.transfer(OWNER_ADDRESS, 100n)

      expect(typeof txHash).toBe('string')
      expect(rpc.sendRawTransaction).toHaveBeenCalledOnce()
    })
  })

  describe('context validation', () => {
    it('should throw when evmRpc is not available on context', () => {
      const ctx = {
        client: { evm: { call: vi.fn() } },
        // no evmRpc
      } as unknown as HasEvmService

      expect(() =>
        createEvmContract(ctx, CONTRACT_ADDRESS, erc20Abi, { transport: 'jsonrpc' })
      ).toThrow('JSON-RPC transport requires evmRpc')
    })
  })

  describe('context-level evmTransport', () => {
    it('should use JSON-RPC when context has evmTransport: jsonrpc', async () => {
      const balanceHex = '0x' + BigInt(777).toString(16).padStart(64, '0')
      const rpc = createMockEvmRpc({ ethCall: vi.fn().mockResolvedValue(balanceHex) })
      const ctx = {
        client: {
          evm: {
            call: vi.fn().mockResolvedValue({ response: '', error: '', usedGas: 0n }),
          },
        },
        evmRpc: rpc,
        evmTransport: 'jsonrpc' as const,
      } as unknown as HasEvmService & { evmTransport: 'jsonrpc' }

      // No per-contract options — transport inherited from context
      const contract = createEvmContract(ctx, CONTRACT_ADDRESS, erc20Abi)

      const balance = await contract.read.balanceOf(OWNER_ADDRESS)

      expect(balance).toBe(777n)
      // JSON-RPC was used, not gRPC
      expect(rpc.ethCall).toHaveBeenCalledOnce()
      expect(ctx.client.evm.call).not.toHaveBeenCalled()
    })

    it('should allow per-contract override on gRPC context', async () => {
      const balanceHex = '0x' + BigInt(999).toString(16).padStart(64, '0')
      const rpc = createMockEvmRpc({ ethCall: vi.fn().mockResolvedValue(balanceHex) })
      const ctx = createMockJsonRpcContext(rpc)
      // ctx has no evmTransport — defaults to gRPC

      const contract = createEvmContract(ctx, CONTRACT_ADDRESS, erc20Abi, { transport: 'jsonrpc' })

      const balance = await contract.read.balanceOf(OWNER_ADDRESS)

      expect(balance).toBe(999n)
      expect(rpc.ethCall).toHaveBeenCalledOnce()
    })
  })

  describe('gRPC should still work as default', () => {
    it('should not use evmRpc when no transport option', async () => {
      const balanceHex = '0x' + BigInt(500).toString(16).padStart(64, '0')
      const rpc = createMockEvmRpc()
      const ctx = {
        client: {
          evm: {
            call: vi.fn().mockResolvedValue({
              response: balanceHex,
              error: '',
              usedGas: 21000n,
            }),
          },
        },
        evmRpc: rpc,
      } as unknown as HasEvmService

      const contract = createEvmContract(ctx, CONTRACT_ADDRESS, erc20Abi)
      const balance = await contract.read.balanceOf(OWNER_ADDRESS)

      expect(balance).toBe(500n)
      // gRPC was used, not JSON-RPC
      expect(ctx.client.evm.call).toHaveBeenCalledOnce()
      expect(rpc.ethCall).not.toHaveBeenCalled()
    })
  })
})
