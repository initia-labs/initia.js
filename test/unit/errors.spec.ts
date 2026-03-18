/**
 * Unit tests for all initia.js error classes.
 *
 * Tests error creation, properties, inheritance, and message formatting.
 */

import { describe, it, expect } from 'vitest'
import {
  InitiaError,
  AccountNotFoundError,
  AuthenticationError,
  BroadcastError,
  TimeoutError,
  ChainNotFoundError,
  HeaderConflictError,
  SimulationError,
  WebSocketNotAvailableError,
  NotImplementedError,
  ContractError,
  ValidationError,
  KeyError,
  ParseError,
  isNotFoundError,
} from '../../src/errors'
import { ConnectError, Code } from '@connectrpc/connect'
import { NoSignerError } from '../../src/wallet/chain-context'
import { UsernameServiceError } from '../../src/client/usernames/types'

// =============================================================================
// isNotFoundError — gRPC error classification
// =============================================================================

describe('isNotFoundError', () => {
  it('should return true for ConnectError with Code.NotFound', () => {
    const err = new ConnectError('not found', Code.NotFound)
    expect(isNotFoundError(err)).toBe(true)
  })

  it('should return false for ConnectError with different codes', () => {
    expect(isNotFoundError(new ConnectError('internal', Code.Internal))).toBe(false)
    expect(isNotFoundError(new ConnectError('unavailable', Code.Unavailable))).toBe(false)
    expect(isNotFoundError(new ConnectError('permission', Code.PermissionDenied))).toBe(false)
  })

  it('should return false for non-ConnectError', () => {
    expect(isNotFoundError(new Error('not found'))).toBe(false)
    expect(isNotFoundError(new InitiaError('not found'))).toBe(false)
    expect(isNotFoundError(null)).toBe(false)
    expect(isNotFoundError(undefined)).toBe(false)
  })

  it('should narrow type to ConnectError', () => {
    const err: unknown = new ConnectError('not found', Code.NotFound)
    if (isNotFoundError(err)) {
      // Type guard should allow accessing ConnectError properties
      expect(err.code).toBe(Code.NotFound)
    }
  })
})

// =============================================================================
// Base Error Class
// =============================================================================

describe('InitiaError', () => {
  it('should create error with message', () => {
    const error = new InitiaError('Test error')

    expect(error).toBeInstanceOf(Error)
    expect(error).toBeInstanceOf(InitiaError)
    expect(error.name).toBe('InitiaError')
    expect(error.message).toBe('Test error')
  })

  it('should be catchable as Error', () => {
    try {
      throw new InitiaError('Test')
    } catch (e) {
      expect(e instanceof Error).toBe(true)
      expect(e instanceof InitiaError).toBe(true)
    }
  })

  it('should allow catch-all handling for SDK errors', () => {
    const errors = [
      new AccountNotFoundError('addr'),
      new BroadcastError('hash', 1, 'log'),
      new TimeoutError('op', 1000),
      new ValidationError('field', 'reason'),
    ]

    for (const error of errors) {
      expect(error instanceof InitiaError).toBe(true)
    }
  })
})

// =============================================================================
// Account & Chain Errors
// =============================================================================

describe('AccountNotFoundError', () => {
  it('should create error with address', () => {
    const error = new AccountNotFoundError('init1abc123')

    expect(error).toBeInstanceOf(InitiaError)
    expect(error.name).toBe('AccountNotFoundError')
    expect(error.address).toBe('init1abc123')
    expect(error.message).toBe('Account not found: init1abc123')
  })

  it('should preserve address as readonly property', () => {
    const error = new AccountNotFoundError('init1xyz')
    expect(error.address).toBe('init1xyz')
  })
})

describe('ChainNotFoundError', () => {
  it('should create error with chainId', () => {
    const error = new ChainNotFoundError('initiation-2')

    expect(error).toBeInstanceOf(InitiaError)
    expect(error.name).toBe('ChainNotFoundError')
    expect(error.chainId).toBe('initiation-2')
    expect(error.message).toBe('Chain not found: initiation-2')
  })
})

// =============================================================================
// Transaction Errors
// =============================================================================

describe('BroadcastError', () => {
  it('should create error with tx details', () => {
    const error = new BroadcastError('ABC123HASH', 5, 'insufficient funds')

    expect(error).toBeInstanceOf(InitiaError)
    expect(error.name).toBe('BroadcastError')
    expect(error.txHash).toBe('ABC123HASH')
    expect(error.code).toBe(5)
    expect(error.rawLog).toBe('insufficient funds')
    expect(error.message).toContain('code 5')
    expect(error.message).toContain('insufficient funds')
  })

  it('should handle code 0 (success code but with error)', () => {
    const error = new BroadcastError('HASH', 0, 'unexpected error')
    expect(error.code).toBe(0)
    expect(error.message).toContain('code 0')
  })

  // Category classification tests
  it('should classify code 5 as insufficient_funds', () => {
    const error = new BroadcastError('H', 5, 'some log')
    expect(error.category).toBe('insufficient_funds')
    expect(error.suggestion).toContain('balance')
  })

  it('should classify code 13 as insufficient_funds', () => {
    const error = new BroadcastError('H', 13, 'insufficient fee')
    expect(error.category).toBe('insufficient_funds')
  })

  it('should classify code 32 as sequence_mismatch', () => {
    const error = new BroadcastError('H', 32, 'account sequence mismatch, expected 42, got 41')
    expect(error.category).toBe('sequence_mismatch')
    expect(error.suggestion).toContain('42')
    expect(error.suggestion).toContain('41')
  })

  it('should classify code 19 as sequence_mismatch', () => {
    const error = new BroadcastError('H', 19, 'tx already in mempool')
    expect(error.category).toBe('sequence_mismatch')
  })

  it('should classify code 11 as gas_error', () => {
    const error = new BroadcastError('H', 11, 'out of gas')
    expect(error.category).toBe('gas_error')
    expect(error.suggestion).toContain('gas')
  })

  it('should classify code 4 as signature_error', () => {
    const error = new BroadcastError('H', 4, 'unauthorized')
    expect(error.category).toBe('signature_error')
  })

  it('should classify code 38 as signature_error', () => {
    const error = new BroadcastError('H', 38, 'signature verification failed')
    expect(error.category).toBe('signature_error')
  })

  it('should classify by rawLog when code is generic', () => {
    const error = new BroadcastError('H', 1, 'insufficient fund for fee')
    expect(error.category).toBe('insufficient_funds')
  })

  it('should classify unknown error codes as unknown', () => {
    const error = new BroadcastError('H', 99, 'something unexpected')
    expect(error.category).toBe('unknown')
    expect(error.suggestion).toContain('rawLog')
  })
})

describe('SimulationError', () => {
  it('should create error with message', () => {
    const error = new SimulationError('No gas info returned')

    expect(error).toBeInstanceOf(InitiaError)
    expect(error.name).toBe('SimulationError')
    expect(error.message).toBe('Simulation failed: No gas info returned')
    expect(error.rawLog).toBeUndefined()
  })

  it('should include optional rawLog', () => {
    const error = new SimulationError('Failed', 'detailed log here')

    expect(error.rawLog).toBe('detailed log here')
    expect(error.message).toBe('Simulation failed: Failed')
  })
})

describe('TimeoutError', () => {
  it('should create error with operation and timeout', () => {
    const error = new TimeoutError('waitForTx', 30000)

    expect(error).toBeInstanceOf(InitiaError)
    expect(error.name).toBe('TimeoutError')
    expect(error.operation).toBe('waitForTx')
    expect(error.timeoutMs).toBe(30000)
    expect(error.message).toBe("Operation 'waitForTx' timed out after 30000ms")
  })

  it('should handle various timeout values', () => {
    const error1 = new TimeoutError('op', 0)
    expect(error1.timeoutMs).toBe(0)

    const error2 = new TimeoutError('op', 60000)
    expect(error2.message).toContain('60000ms')
  })
})

// =============================================================================
// WebSocket Errors
// =============================================================================

describe('WebSocketNotAvailableError', () => {
  it('should create error with chainId and helpful message', () => {
    const error = new WebSocketNotAvailableError('initiation-2')

    expect(error).toBeInstanceOf(InitiaError)
    expect(error.name).toBe('WebSocketNotAvailableError')
    expect(error.chainId).toBe('initiation-2')
    expect(error.message).toContain('initiation-2')
    expect(error.message).toContain('wss')
    expect(error.message).toContain('polling fallback')
  })
})

// =============================================================================
// Contract Errors
// =============================================================================

describe('ContractError', () => {
  it('should create error for EVM platform', () => {
    const error = new ContractError('evm', 3, 'execution reverted')

    expect(error).toBeInstanceOf(InitiaError)
    expect(error.name).toBe('ContractError')
    expect(error.platform).toBe('evm')
    expect(error.code).toBe(3)
    expect(error.reason).toBe('execution reverted')
    expect(error.data).toBeUndefined()
    expect(error.message).toContain('[evm]')
    expect(error.message).toContain('code 3')
  })

  it('should create error for Move platform', () => {
    const error = new ContractError('move', 65537, 'EINSUFFICIENT_BALANCE')

    expect(error.platform).toBe('move')
    expect(error.message).toContain('[move]')
  })

  it('should create error for Wasm platform', () => {
    const error = new ContractError('wasm', 2, 'unauthorized')

    expect(error.platform).toBe('wasm')
    expect(error.message).toContain('[wasm]')
  })

  it('should include optional data', () => {
    const error = new ContractError('evm', 3, 'revert', '0x08c379a0...')

    expect(error.data).toBe('0x08c379a0...')
  })
})

// =============================================================================
// Validation Errors
// =============================================================================

describe('ValidationError', () => {
  it('should create error with field and reason', () => {
    const error = new ValidationError('address', 'Cannot be empty')

    expect(error).toBeInstanceOf(InitiaError)
    expect(error.name).toBe('ValidationError')
    expect(error.field).toBe('address')
    expect(error.reason).toBe('Cannot be empty')
    expect(error.message).toBe("Validation failed for 'address': Cannot be empty")
  })

  it('should handle various field names', () => {
    const error1 = new ValidationError('chainId', 'Invalid format')
    expect(error1.message).toContain("'chainId'")

    const error2 = new ValidationError('denom', 'Must start with u')
    expect(error2.field).toBe('denom')
  })
})

describe('ParseError', () => {
  it('should create error with dataType and reason', () => {
    const error = new ParseError('gasPrice', 'Invalid format: abc')

    expect(error).toBeInstanceOf(InitiaError)
    expect(error.name).toBe('ParseError')
    expect(error.dataType).toBe('gasPrice')
    expect(error.reason).toBe('Invalid format: abc')
    expect(error.message).toBe('Failed to parse gasPrice: Invalid format: abc')
  })

  it('should handle various data types', () => {
    const error1 = new ParseError('pubkey', 'Unknown type')
    expect(error1.message).toContain('pubkey')

    const error2 = new ParseError('json', 'Unexpected token')
    expect(error2.dataType).toBe('json')
  })
})

// =============================================================================
// Key Errors
// =============================================================================

describe('KeyError', () => {
  it('should create error for generate operation', () => {
    const error = new KeyError('generate', 'Random source unavailable')

    expect(error).toBeInstanceOf(InitiaError)
    expect(error.name).toBe('KeyError')
    expect(error.operation).toBe('generate')
    expect(error.reason).toBe('Random source unavailable')
    expect(error.message).toBe('Key generate failed: Random source unavailable')
  })

  it('should create error for derive operation', () => {
    const error = new KeyError('derive', 'Invalid HD path')
    expect(error.operation).toBe('derive')
    expect(error.message).toContain('derive failed')
  })

  it('should create error for import operation', () => {
    const error = new KeyError('import', 'Invalid key format')
    expect(error.operation).toBe('import')
  })

  it('should create error for sign operation', () => {
    const error = new KeyError('sign', 'Key has been destroyed')
    expect(error.operation).toBe('sign')
    expect(error.message).toContain('sign failed')
  })
})

// =============================================================================
// Feature Errors
// =============================================================================

describe('NotImplementedError', () => {
  it('should create error with feature name', () => {
    const error = new NotImplementedError('Amino conversion for MsgX')

    expect(error).toBeInstanceOf(InitiaError)
    expect(error.name).toBe('NotImplementedError')
    expect(error.message).toContain('Amino conversion for MsgX')
    expect(error.message).toContain('not yet implemented')
  })

  it('should include optional hint', () => {
    const error = new NotImplementedError('WebSocket subscriptions', 'Use polling as a workaround.')

    expect(error.message).toContain('WebSocket subscriptions')
    expect(error.message).toContain('Use polling as a workaround.')
  })

  it('should work without hint', () => {
    const error = new NotImplementedError('Feature X')
    expect(error.message).not.toContain('undefined')
  })
})

// =============================================================================
// Non-InitiaError Errors (other modules)
// =============================================================================

describe('NoSignerError', () => {
  it('should create error with helpful message', () => {
    const error = new NoSignerError()

    expect(error).toBeInstanceOf(Error)
    expect(error.name).toBe('NoSignerError')
    expect(error.message).toContain('Cannot sign')
    expect(error.message).toContain('createChainContext')
    expect(error.message).toContain('ctx.sign')
  })

  it('should not extend InitiaError (domain-specific)', () => {
    const error = new NoSignerError()
    expect(error instanceof InitiaError).toBe(false)
  })
})

describe('UsernameServiceError', () => {
  it('should create error with message', () => {
    const error = new UsernameServiceError('Username not found')

    expect(error).toBeInstanceOf(Error)
    expect(error.name).toBe('UsernameServiceError')
    expect(error.message).toBe('Username not found')
    expect(error.cause).toBeUndefined()
  })

  it('should include optional cause', () => {
    const cause = new Error('Network error')
    const error = new UsernameServiceError('Lookup failed', cause)

    expect(error.cause).toBe(cause)
    expect(error.message).toBe('Lookup failed')
  })

  it('should not extend InitiaError (domain-specific)', () => {
    const error = new UsernameServiceError('Test')
    expect(error instanceof InitiaError).toBe(false)
  })
})

// =============================================================================
// Error Hierarchy Tests
// =============================================================================

// =============================================================================
// Auth Errors (new in header API)
// =============================================================================

describe('HeaderConflictError', () => {
  it('should expose headerName and level for debugging', () => {
    const error = new HeaderConflictError('authorization', 'context')

    expect(error).toBeInstanceOf(InitiaError)
    expect(error.name).toBe('HeaderConflictError')
    expect(error.headerName).toBe('authorization')
    expect(error.level).toBe('context')
  })
})

describe('AuthenticationError', () => {
  it('should accept custom message override', () => {
    const error = new AuthenticationError(401, 'Invalid API key')
    expect(error).toBeInstanceOf(InitiaError)
    expect(error.message).toBe('Invalid API key')
    expect(error.statusCode).toBe(401)
  })
})

describe('Error Hierarchy', () => {
  it('should allow catching all SDK errors with InitiaError', () => {
    const sdkErrors = [
      new AccountNotFoundError('addr'),
      new AuthenticationError(401),
      new BroadcastError('hash', 1, 'log'),
      new TimeoutError('op', 1000),
      new ChainNotFoundError('chain'),
      new HeaderConflictError('authorization', 'context'),
      new SimulationError('msg'),
      new WebSocketNotAvailableError('chain'),
      new NotImplementedError('feature'),
      new ContractError('evm', 0, 'reason'),
      new ValidationError('field', 'reason'),
      new KeyError('sign', 'reason'),
      new ParseError('type', 'reason'),
    ]

    for (const error of sdkErrors) {
      expect(error instanceof InitiaError).toBe(true)
      expect(error instanceof Error).toBe(true)
    }
  })

  it('should preserve error name for each class', () => {
    const errorNames: [Error, string][] = [
      [new InitiaError('msg'), 'InitiaError'],
      [new AccountNotFoundError('addr'), 'AccountNotFoundError'],
      [new BroadcastError('hash', 1, 'log'), 'BroadcastError'],
      [new TimeoutError('op', 1000), 'TimeoutError'],
      [new ChainNotFoundError('chain'), 'ChainNotFoundError'],
      [new SimulationError('msg'), 'SimulationError'],
      [new WebSocketNotAvailableError('chain'), 'WebSocketNotAvailableError'],
      [new NotImplementedError('feature'), 'NotImplementedError'],
      [new ContractError('evm', 0, 'reason'), 'ContractError'],
      [new ValidationError('field', 'reason'), 'ValidationError'],
      [new KeyError('sign', 'reason'), 'KeyError'],
      [new ParseError('type', 'reason'), 'ParseError'],
      [new AuthenticationError(401), 'AuthenticationError'],
      [new HeaderConflictError('authorization', 'context'), 'HeaderConflictError'],
      [new NoSignerError(), 'NoSignerError'],
      [new UsernameServiceError('msg'), 'UsernameServiceError'],
    ]

    for (const [error, expectedName] of errorNames) {
      expect(error.name).toBe(expectedName)
    }
  })
})
