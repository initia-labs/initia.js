/**
 * Unit tests for contract error classes.
 */

import { describe, it, expect } from 'vitest'
import { ContractError } from '../../../src/contracts'

describe('ContractError', () => {
  it('should create error with platform and reason', () => {
    const error = new ContractError('evm', 0, 'Insufficient funds')

    expect(error).toBeInstanceOf(Error)
    expect(error).toBeInstanceOf(ContractError)
    expect(error.name).toBe('ContractError')
    expect(error.platform).toBe('evm')
    expect(error.code).toBe(0)
    expect(error.reason).toBe('Insufficient funds')
    expect(error.message).toContain('[evm]')
    expect(error.message).toContain('Insufficient funds')
  })

  it('should create error with data', () => {
    const error = new ContractError('evm', 1, 'Revert', '0x1234')

    expect(error.data).toBe('0x1234')
  })

  it('should work with move platform', () => {
    const error = new ContractError('move', 100, 'Abort code')

    expect(error.platform).toBe('move')
    expect(error.code).toBe(100)
    expect(error.message).toContain('[move]')
  })

  it('should work with wasm platform', () => {
    const error = new ContractError('wasm', 2, 'Unauthorized')

    expect(error.platform).toBe('wasm')
    expect(error.message).toContain('[wasm]')
  })

  it('should include code in message', () => {
    const error = new ContractError('evm', 42, 'Custom error')

    expect(error.message).toContain('code 42')
  })

  it('should be catchable as Error', () => {
    const error = new ContractError('evm', 0, 'Test')

    try {
      throw error
    } catch (e) {
      expect(e instanceof Error).toBe(true)
      expect(e instanceof ContractError).toBe(true)
    }
  })
})
