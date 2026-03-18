/**
 * Error classes for initia.js SDK.
 *
 * All SDK errors extend InitiaError for easy catch-all handling.
 */

import { ConnectError, Code } from '@connectrpc/connect'

/**
 * Check if an error is a gRPC NotFound error.
 * Centralizes the ConnectError + Code.NotFound pattern used across the codebase.
 * Also acts as a type guard, narrowing the error to `ConnectError`.
 */
export function isNotFoundError(err: unknown): err is ConnectError {
  return err instanceof ConnectError && err.code === Code.NotFound
}

/**
 * Base error class for all initia.js errors.
 *
 * @example
 * ```typescript
 * try {
 *   await ctx.signAndBroadcast(msgs)
 * } catch (e) {
 *   if (e instanceof InitiaError) {
 *     console.log('SDK error:', e.message)
 *   }
 * }
 * ```
 */
export class InitiaError extends Error {
  constructor(message: string) {
    super(message)
    this.name = 'InitiaError'
  }
}

/**
 * Thrown when an account is not found on chain.
 */
export class AccountNotFoundError extends InitiaError {
  constructor(public readonly address: string) {
    super(`Account not found: ${address}`)
    this.name = 'AccountNotFoundError'
  }
}

/**
 * Category of a broadcast error, derived from Cosmos SDK error codes and raw log.
 */
export type BroadcastErrorCategory =
  | 'insufficient_funds'
  | 'sequence_mismatch'
  | 'gas_error'
  | 'signature_error'
  | 'unknown'

/**
 * Thrown when a transaction broadcast fails.
 *
 * Includes a `category` for programmatic handling and a `suggestion`
 * with actionable guidance.
 *
 * @example
 * ```typescript
 * try {
 *   await ctx.signAndBroadcast(msgs)
 * } catch (e) {
 *   if (e instanceof BroadcastError) {
 *     if (e.category === 'sequence_mismatch') ctx.resetSequence()
 *     console.log(e.suggestion)
 *   }
 * }
 * ```
 */
export class BroadcastError extends InitiaError {
  readonly category: BroadcastErrorCategory
  readonly suggestion: string

  constructor(
    public readonly txHash: string,
    public readonly code: number,
    public readonly rawLog: string
  ) {
    const { category, suggestion } = classifyBroadcastError(code, rawLog)
    super(`Broadcast failed (code ${code}): ${rawLog}`)
    this.name = 'BroadcastError'
    this.category = category
    this.suggestion = suggestion
  }
}

function classifyBroadcastError(
  code: number,
  rawLog: string
): { category: BroadcastErrorCategory; suggestion: string } {
  const log = rawLog.toLowerCase()

  // Cosmos SDK error code 5: insufficient funds
  // Also code 13: insufficient fee
  if (
    code === 5 ||
    code === 13 ||
    log.includes('insufficient fund') ||
    log.includes('insufficient fee')
  ) {
    return {
      category: 'insufficient_funds',
      suggestion:
        'Check account balance and ensure sufficient funds for the transaction amount plus fees.',
    }
  }

  // Code 32: account sequence mismatch
  // Code 19: tx already in mempool (often a sequence issue)
  if (code === 32 || code === 19 || log.includes('account sequence mismatch')) {
    const match = rawLog.match(/expected (\d+), got (\d+)/i)
    const detail = match ? ` Expected ${match[1]}, got ${match[2]}.` : ''
    return {
      category: 'sequence_mismatch',
      suggestion: `Account sequence mismatch.${detail} Call ctx.resetSequence() and retry.`,
    }
  }

  // Code 11: out of gas
  if (code === 11 || log.includes('out of gas')) {
    return {
      category: 'gas_error',
      suggestion: 'Transaction ran out of gas. Increase gasLimit or use auto gas estimation.',
    }
  }

  // Code 4: unauthorized / Code 38: signature verification failed
  if (
    code === 4 ||
    code === 38 ||
    log.includes('signature verification') ||
    log.includes('unauthorized')
  ) {
    return {
      category: 'signature_error',
      suggestion: 'Signature verification failed. Ensure the correct signer key and chain ID.',
    }
  }

  return {
    category: 'unknown',
    suggestion: 'Unexpected broadcast error. Check rawLog for details.',
  }
}

/**
 * Thrown when an operation times out.
 */
export class TimeoutError extends InitiaError {
  constructor(
    public readonly operation: string,
    public readonly timeoutMs: number
  ) {
    super(`Operation '${operation}' timed out after ${timeoutMs}ms`)
    this.name = 'TimeoutError'
  }
}

/**
 * Thrown when a chain is not found in the provider.
 */
export class ChainNotFoundError extends InitiaError {
  constructor(public readonly chainId: string) {
    super(`Chain not found: ${chainId}`)
    this.name = 'ChainNotFoundError'
  }
}

/**
 * Thrown when a transaction simulation fails.
 */
export class SimulationError extends InitiaError {
  constructor(
    message: string,
    public readonly rawLog?: string
  ) {
    super(`Simulation failed: ${message}`)
    this.name = 'SimulationError'
  }
}

/**
 * Thrown when WebSocket endpoint is not available for a chain.
 */
export class WebSocketNotAvailableError extends InitiaError {
  constructor(public readonly chainId: string) {
    super(
      `WebSocket endpoint not available for chain '${chainId}'. ` +
        `Configure 'wss' endpoint in ChainInfo or use polling fallback.`
    )
    this.name = 'WebSocketNotAvailableError'
  }
}

/**
 * Thrown when a feature is not yet implemented.
 * Used as a placeholder for features that will be added in future releases.
 */
export class NotImplementedError extends InitiaError {
  constructor(feature: string, hint?: string) {
    super(`Feature '${feature}' is not yet implemented.` + (hint ? ` ${hint}` : ''))
    this.name = 'NotImplementedError'
  }
}

/**
 * Thrown when a smart contract call fails.
 * Unified error class for EVM, Move, and Wasm contract errors.
 */
export class ContractError extends InitiaError {
  constructor(
    /** Platform where the error occurred */
    public readonly platform: 'evm' | 'move' | 'wasm',
    /** Error code (platform-specific) */
    public readonly code: number,
    /** Human-readable error reason */
    public readonly reason: string,
    /** Raw error data from the chain (optional) */
    public readonly data?: string
  ) {
    super(`[${platform}] Contract error (code ${code}): ${reason}`)
    this.name = 'ContractError'
  }
}

/**
 * Thrown when input validation fails.
 */
export class ValidationError extends InitiaError {
  constructor(
    /** Field or parameter that failed validation */
    public readonly field: string,
    /** Description of what's wrong */
    public readonly reason: string
  ) {
    super(`Validation failed for '${field}': ${reason}`)
    this.name = 'ValidationError'
  }
}

/**
 * Thrown when key generation or derivation fails.
 */
export class KeyError extends InitiaError {
  constructor(
    /** Type of key operation that failed */
    public readonly operation: 'generate' | 'derive' | 'import' | 'sign',
    /** Description of what went wrong */
    public readonly reason: string
  ) {
    super(`Key ${operation} failed: ${reason}`)
    this.name = 'KeyError'
  }
}

/**
 * Thrown when parsing input data fails.
 */
export class ParseError extends InitiaError {
  constructor(
    /** Type of data being parsed */
    public readonly dataType: string,
    /** Description of parsing failure */
    public readonly reason: string
  ) {
    super(`Failed to parse ${dataType}: ${reason}`)
    this.name = 'ParseError'
  }
}

/**
 * Thrown when `auth` and `headers` options at the same level set the same header key.
 *
 * @example
 * ```typescript
 * // This throws HeaderConflictError:
 * createInitiaContext({
 *   network: 'testnet',
 *   auth: auth.apiKey('key'),
 *   headers: { 'x-api-key': 'other' },
 * })
 * ```
 */
export class HeaderConflictError extends InitiaError {
  constructor(
    /** The conflicting header key (lowercase) */
    public readonly headerName: string,
    /** Where the conflict occurred */
    public readonly level: 'context' | 'query'
  ) {
    super(
      `Header '${headerName}' is set by both 'auth' and 'headers' in ${level} options. ` +
        `Remove '${headerName}' from 'headers', or use 'headers' only without 'auth'.`
    )
    this.name = 'HeaderConflictError'
  }
}

/**
 * Thrown when an asset is not found in the provider.
 */
export class AssetNotFoundError extends InitiaError {
  constructor(
    public readonly denom: string,
    public readonly chainId?: string
  ) {
    super(`Asset not found: "${denom}"${chainId ? ` on chain "${chainId}"` : ''}`)
    this.name = 'AssetNotFoundError'
  }
}

/**
 * Thrown when a gRPC call fails with an authentication or authorization error.
 *
 * Converted from ConnectError in the gRPC client proxy:
 * - `Code.Unauthenticated` → statusCode 401
 * - `Code.PermissionDenied` → statusCode 403
 *
 * These errors are excluded from retry logic.
 */
export class AuthenticationError extends InitiaError {
  constructor(
    /** HTTP-equivalent status code (401 or 403) */
    public readonly statusCode: number,
    message?: string
  ) {
    super(message ?? `Authentication failed (HTTP ${statusCode})`)
    this.name = 'AuthenticationError'
  }
}
