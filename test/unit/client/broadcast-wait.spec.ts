/**
 * Unit tests for BroadcastResultWithWait and signAndBroadcast with waitForConfirmation.
 */

import { describe, it, expect, vi } from 'vitest'
import {
  createBroadcastResultWithWait,
  type BroadcastResult,
  type SignBroadcastOptions,
  type BroadcastResultWithWait,
} from '../../../src/client/broadcast'
import type { TxResult, WaitForTxOptions } from '../../../src/client/websocket'

describe('createBroadcastResultWithWait', () => {
  const mockBroadcastResult: BroadcastResult = {
    txHash: '0x123abc',
    gasUsed: 100000n,
    rawLog: 'success',
  }

  const mockTxResult: TxResult = {
    txHash: '0x123abc',
    height: 12345n,
    code: 0,
    rawLog: 'success',
    gasUsed: 100000n,
    gasWanted: 150000n,
    events: [{ type: 'transfer', attributes: [] }],
  }

  it('should preserve original BroadcastResult properties', () => {
    const waitFn = vi.fn()
    const result = createBroadcastResultWithWait(mockBroadcastResult, waitFn)

    expect(result.txHash).toBe('0x123abc')
    expect(result.gasUsed).toBe(100000n)
    expect(result.rawLog).toBe('success')
  })

  it('should add waitForConfirmation method', () => {
    const waitFn = vi.fn()
    const result = createBroadcastResultWithWait(mockBroadcastResult, waitFn)

    expect(typeof result.waitForConfirmation).toBe('function')
  })

  it('should call waitFn with txHash when waitForConfirmation is called', async () => {
    const waitFn = vi.fn().mockResolvedValue(mockTxResult)
    const result = createBroadcastResultWithWait(mockBroadcastResult, waitFn)

    await result.waitForConfirmation()

    expect(waitFn).toHaveBeenCalledWith('0x123abc', undefined)
  })

  it('should pass options to waitFn', async () => {
    const waitFn = vi.fn().mockResolvedValue(mockTxResult)
    const result = createBroadcastResultWithWait(mockBroadcastResult, waitFn)

    const options: WaitForTxOptions = { timeout: 60000, pollInterval: 2000 }
    await result.waitForConfirmation(options)

    expect(waitFn).toHaveBeenCalledWith('0x123abc', options)
  })

  it('should return TxResult from waitForConfirmation', async () => {
    const waitFn = vi.fn().mockResolvedValue(mockTxResult)
    const result = createBroadcastResultWithWait(mockBroadcastResult, waitFn)

    const txResult = await result.waitForConfirmation()

    expect(txResult).toEqual(mockTxResult)
    expect(txResult.height).toBe(12345n)
    expect(txResult.code).toBe(0)
    expect(txResult.events).toHaveLength(1)
  })

  it('should propagate errors from waitFn', async () => {
    const error = new Error('Timeout waiting for tx')
    const waitFn = vi.fn().mockRejectedValue(error)
    const result = createBroadcastResultWithWait(mockBroadcastResult, waitFn)

    await expect(result.waitForConfirmation()).rejects.toThrow('Timeout waiting for tx')
  })
})

describe('SignBroadcastOptions type', () => {
  // These are compile-time tests - if they compile, the types work
  it('should accept waitForConfirmation as boolean', () => {
    // Type check only - this verifies the interface accepts boolean
    const options: SignBroadcastOptions = {
      waitForConfirmation: true,
    }
    expect(options.waitForConfirmation).toBe(true)
  })

  it('should accept waitForConfirmation as WaitForTxOptions', () => {
    const options: SignBroadcastOptions = {
      waitForConfirmation: { timeout: 30000, pollInterval: 1000 },
    }
    expect(options.waitForConfirmation).toEqual({ timeout: 30000, pollInterval: 1000 })
  })

  it('should accept all TxOptions fields', () => {
    const options: SignBroadcastOptions = {
      fee: [{ denom: 'uinit', amount: '1000' }],
      gasLimit: 200000n,
      memo: 'test memo',
      waitForConfirmation: true,
    }
    expect(options.fee).toHaveLength(1)
    expect(options.gasLimit).toBe(200000n)
    expect(options.memo).toBe('test memo')
  })
})

describe('BroadcastResultWithWait type', () => {
  it('should extend BroadcastResult with waitForConfirmation', () => {
    // Type check - BroadcastResultWithWait should have all BroadcastResult fields
    const result: BroadcastResultWithWait = {
      txHash: '0x123',
      gasUsed: 100000n,
      rawLog: 'ok',
      waitForConfirmation: async () => ({
        txHash: '0x123',
        height: 1n,
        code: 0,
        rawLog: 'ok',
        gasUsed: 100000n,
        gasWanted: 150000n,
        events: [],
      }),
    }

    expect(result.txHash).toBe('0x123')
    expect(typeof result.waitForConfirmation).toBe('function')
  })
})
