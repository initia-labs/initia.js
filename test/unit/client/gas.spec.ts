/**
 * Unit tests for gas estimation utilities.
 */

import { describe, it, expect, vi } from 'vitest'
import { create } from '@bufbuild/protobuf'
import { AnySchema } from '@bufbuild/protobuf/wkt'
import { SignMode } from '@buf/cosmos_cosmos-sdk.bufbuild_es/cosmos/tx/signing/v1beta1/signing_pb'
import { DecCoins } from '../../../src/core/coins'
import { ConnectError, Code } from '@connectrpc/connect'
import { AccountNotFoundError, SimulationError } from '../../../src/errors'
import { ExtensionOptionQueuedTx } from '../../../src/tx/extension-options'

// Hoist mock objects so they're available in vi.mock factory
const { mockAuth, mockTx } = vi.hoisted(() => ({
  mockAuth: {
    accountInfo: vi.fn(),
  },
  mockTx: {
    simulate: vi.fn(),
  },
}))

// Mock getAccount to control account lookup behavior
vi.mock('../../../src/core/account', () => ({
  getAccount: vi.fn(async (_client: unknown, _address: string) => {
    // Delegate to the mock auth to simulate different scenarios
    const resp = await mockAuth.accountInfo()
    return resp
  }),
}))

import { getAccount } from '../../../src/core/account'
import { estimateGas, getGasPrices, type SimulateClient } from '../../../src/client/gas'

const mockedGetAccount = vi.mocked(getAccount)

function createMockClient(): SimulateClient {
  return {
    auth: mockAuth as any,
    tx: mockTx as any,
  }
}

const defaultSimResponse = {
  gasInfo: { gasUsed: 100_000n, gasWanted: 100_000n },
}

describe('mulBigIntByFloat (via estimateGas)', () => {
  // mulBigIntByFloat is internal, so we test it through estimateGas's multiplier behavior.

  it('should apply multiplier correctly (1.3x)', async () => {
    const client = createMockClient()
    mockedGetAccount.mockResolvedValueOnce({ sequence: 0n, accountNumber: 0n } as any)
    mockTx.simulate.mockResolvedValueOnce({ gasInfo: { gasUsed: 100_000n, gasWanted: 100_000n } })

    const result = await estimateGas(client, [], 'init1test', { multiplier: 1.3 })
    // 100_000 * 1.3 = 130_000
    expect(result.gasLimit).toBe(130_000n)
  })

  it('should ceil the result (not floor or truncate)', async () => {
    const client = createMockClient()
    mockedGetAccount.mockResolvedValueOnce({ sequence: 0n, accountNumber: 0n } as any)
    mockTx.simulate.mockResolvedValueOnce({ gasInfo: { gasUsed: 100_001n, gasWanted: 100_001n } })

    const result = await estimateGas(client, [], 'init1test', { multiplier: 1.3 })
    // 100_001 * 1.3 = 130_001.3 → ceil = 130_002
    expect(result.gasLimit).toBe(130_002n)
  })

  it('should handle zero gasUsed', async () => {
    const client = createMockClient()
    mockedGetAccount.mockResolvedValueOnce({ sequence: 0n, accountNumber: 0n } as any)
    mockTx.simulate.mockResolvedValueOnce({ gasInfo: { gasUsed: 0n, gasWanted: 0n } })

    const result = await estimateGas(client, [], 'init1test', { multiplier: 1.3 })
    expect(result.gasLimit).toBe(0n)
  })

  it('should handle multiplier of 1.0 (no change)', async () => {
    const client = createMockClient()
    mockedGetAccount.mockResolvedValueOnce({ sequence: 0n, accountNumber: 0n } as any)
    mockTx.simulate.mockResolvedValueOnce({ gasInfo: { gasUsed: 200_000n, gasWanted: 200_000n } })

    const result = await estimateGas(client, [], 'init1test', { multiplier: 1.0 })
    expect(result.gasLimit).toBe(200_000n)
  })

  it('should preserve precision for large gas values (> 2^53)', async () => {
    const client = createMockClient()
    mockedGetAccount.mockResolvedValueOnce({ sequence: 0n, accountNumber: 0n } as any)
    // Value above 2^53 (9_007_199_254_740_993)
    const largeGas = 9_007_199_254_740_993n
    mockTx.simulate.mockResolvedValueOnce({ gasInfo: { gasUsed: largeGas, gasWanted: largeGas } })

    const result = await estimateGas(client, [], 'init1test', { multiplier: 1.0 })
    // With multiplier 1.0, result should equal input exactly
    expect(result.gasLimit).toBe(largeGas)
  })

  it('should calculate fee from gas limit and gas price', async () => {
    const client = createMockClient()
    mockedGetAccount.mockResolvedValueOnce({ sequence: 0n, accountNumber: 0n } as any)
    mockTx.simulate.mockResolvedValueOnce({ gasInfo: { gasUsed: 100_000n, gasWanted: 100_000n } })

    const result = await estimateGas(client, [], 'init1test', {
      multiplier: 1.3,
      gasPrice: '0.015uinit',
    })
    expect(result.gasLimit).toBe(130_000n)
    // fee = 130_000 * 0.015 = 1_950
    expect(result.fee).toHaveLength(1)
    expect(result.fee[0].denom).toBe('uinit')
    expect(result.fee[0].amount).toBe('1950')
  })
})

describe('estimateGas error narrowing', () => {
  it('should default to sequence 0 for AccountNotFoundError', async () => {
    const client = createMockClient()
    mockedGetAccount.mockRejectedValueOnce(new AccountNotFoundError('init1new'))
    mockTx.simulate.mockResolvedValueOnce(defaultSimResponse)

    const result = await estimateGas(client, [], 'init1new')
    // Should succeed with sequence 0 (new account)
    expect(result.gasLimit).toBeGreaterThan(0n)
  })

  it('should default to sequence 0 for gRPC NotFound', async () => {
    const client = createMockClient()
    mockedGetAccount.mockRejectedValueOnce(new ConnectError('not found', Code.NotFound))
    mockTx.simulate.mockResolvedValueOnce(defaultSimResponse)

    const result = await estimateGas(client, [], 'init1new')
    expect(result.gasLimit).toBeGreaterThan(0n)
  })

  it('should propagate gRPC Internal errors', async () => {
    const client = createMockClient()
    mockedGetAccount.mockRejectedValueOnce(new ConnectError('internal error', Code.Internal))

    await expect(estimateGas(client, [], 'init1test')).rejects.toThrow(ConnectError)
  })

  it('should propagate generic errors (e.g., network)', async () => {
    const client = createMockClient()
    mockedGetAccount.mockRejectedValueOnce(new Error('network timeout'))

    await expect(estimateGas(client, [], 'init1test')).rejects.toThrow('network timeout')
  })

  it('should throw SimulationError when no gas info returned', async () => {
    const client = createMockClient()
    mockedGetAccount.mockResolvedValueOnce({ sequence: 0n, accountNumber: 0n } as any)
    mockTx.simulate.mockResolvedValueOnce({ gasInfo: undefined })

    await expect(estimateGas(client, [], 'init1test')).rejects.toThrow(SimulationError)
  })
})

describe('estimateGas TxBody options', () => {
  it('always simulates with SIGN_MODE_DIRECT', async () => {
    const client = createMockClient()
    mockedGetAccount.mockResolvedValueOnce({ sequence: 9n, accountNumber: 1n } as any)
    mockTx.simulate.mockResolvedValueOnce(defaultSimResponse)

    await estimateGas(client, [], 'init1test')

    const simulatedTx = mockTx.simulate.mock.calls.at(-1)?.[0].tx as {
      authInfo?: {
        signerInfos?: Array<{
          modeInfo?: {
            sum: {
              case: string
              value: { mode: number }
            }
          }
        }>
      }
    }
    expect(simulatedTx.authInfo?.signerInfos?.[0].modeInfo?.sum.case).toBe('single')
    expect(simulatedTx.authInfo?.signerInfos?.[0].modeInfo?.sum.value.mode).toBe(SignMode.DIRECT)
  })

  it('passes timeout height and extension option arrays into simulation', async () => {
    const client = createMockClient()
    const nonCritical = create(AnySchema, {
      typeUrl: '/example.NonCritical',
      value: new Uint8Array([4, 5, 6]),
    })
    mockedGetAccount.mockResolvedValueOnce({ sequence: 3n, accountNumber: 1n } as any)
    mockTx.simulate.mockResolvedValueOnce(defaultSimResponse)

    await estimateGas(client, [], 'init1test', {
      timeoutHeight: 123n,
      extensionOptions: [ExtensionOptionQueuedTx.packAny()],
      nonCriticalExtensionOptions: [nonCritical],
    })

    const simulatedTx = mockTx.simulate.mock.calls.at(-1)?.[0].tx as {
      body?: {
        timeoutHeight?: bigint
        extensionOptions?: Array<{ typeUrl: string }>
        nonCriticalExtensionOptions?: Array<{ typeUrl: string }>
      }
    }
    expect(simulatedTx.body?.timeoutHeight).toBe(123n)
    expect(simulatedTx.body?.extensionOptions?.map(o => o.typeUrl)).toEqual([
      '/initia.tx.v1.ExtensionOptionQueuedTx',
    ])
    expect(simulatedTx.body?.nonCriticalExtensionOptions?.map(o => o.typeUrl)).toEqual([
      '/example.NonCritical',
    ])
  })
})

describe('getGasPrices', () => {
  it('should fetch from initiaTx on L1', async () => {
    const mockClient = {
      initiaTx: {
        gasPrices: async () => ({
          gasPrices: [{ denom: 'uinit', amount: '0.015000000000000000' }],
        }),
      },
    }
    const prices = await getGasPrices(mockClient)
    expect(prices).toBeInstanceOf(DecCoins)
    expect(prices.get('uinit')?.amount).toBe('0.015000000000000000')
  })

  it('should fetch from opchild on L2', async () => {
    const mockClient = {
      opchild: {
        params: async () => ({
          params: {
            minGasPrices: [{ denom: 'umin', amount: '0.001000000000000000' }],
          },
        }),
      },
    }
    const prices = await getGasPrices(mockClient)
    expect(prices).toBeInstanceOf(DecCoins)
    expect(prices.get('umin')?.amount).toBe('0.001000000000000000')
  })

  it('should throw when opchild params is undefined', async () => {
    const mockClient = {
      opchild: {
        params: async () => ({
          params: undefined,
        }),
      },
    }
    await expect(getGasPrices(mockClient)).rejects.toThrow('returned no params')
  })

  it('should throw when neither service available', async () => {
    await expect(getGasPrices({})).rejects.toThrow(
      'Cannot determine gas prices: client has neither initiaTx nor opchild service'
    )
  })

  it('should prefer initiaTx over opchild when both exist', async () => {
    const mockClient = {
      initiaTx: {
        gasPrices: async () => ({
          gasPrices: [{ denom: 'uinit', amount: '0.015000000000000000' }],
        }),
      },
      opchild: {
        params: async () => ({
          params: { minGasPrices: [{ denom: 'umin', amount: '0.001000000000000000' }] },
        }),
      },
    }
    const prices = await getGasPrices(mockClient)
    expect(prices.get('uinit')).toBeDefined() // initiaTx wins
  })
})
