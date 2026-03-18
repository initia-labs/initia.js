// src/cache/keys.ts

import type { Numeric } from '../types'
import { toBinary, type DescMessage, type MessageShape } from '@bufbuild/protobuf'
import { sha256 } from '@noble/hashes/sha2.js'
import { bytesToHex } from '@noble/hashes/utils.js'
import { ValidationError } from '../errors'

// =============================================================================
// Validation Helpers
// =============================================================================

const HEX_REGEX = /^[0-9a-f]+$/i

/** Throws if value is empty string */
function assertNonEmpty(value: string, name: string): void {
  if (value === '') {
    throw new ValidationError(name, 'Cannot be empty')
  }
}

/**
 * Validate hex string (without 0x prefix).
 * @throws if value contains non-hex characters
 */
function assertValidHex(value: string, name: string): void {
  if (!HEX_REGEX.test(value)) {
    throw new ValidationError(name, `Invalid hex characters: ${value}`)
  }
}

// =============================================================================
// Address Normalization
// =============================================================================

/**
 * Normalize Move address to lowercase 0x-prefixed 64-char hex.
 * @example "0x1" -> "0x0000000000000000000000000000000000000000000000000000000000000001"
 * @throws if address is empty, contains invalid hex, or exceeds 64 chars
 */
export function normalizeMoveAddress(addr: string): string {
  assertNonEmpty(addr, 'address')

  const hasPrefix = addr.slice(0, 2).toLowerCase() === '0x'
  const raw = hasPrefix ? addr.slice(2) : addr

  if (raw.length === 0) {
    throw new ValidationError('address', 'Cannot be empty (only 0x prefix)')
  }
  assertValidHex(raw, 'address')

  if (raw.length > 64) {
    throw new ValidationError('address', `Move address exceeds 64 hex chars: ${raw.length}`)
  }

  return '0x' + raw.toLowerCase().padStart(64, '0')
}

/**
 * Normalize EVM address to lowercase 0x-prefixed 40-char hex.
 * @example "0xABC..." -> "0xabc..."
 * @throws if address is empty, invalid hex, or not exactly 40 chars
 */
export function normalizeEvmAddress(addr: string): string {
  assertNonEmpty(addr, 'address')

  const hasPrefix = addr.slice(0, 2).toLowerCase() === '0x'
  const raw = hasPrefix ? addr.slice(2) : addr

  if (raw.length === 0) {
    throw new ValidationError('address', 'Cannot be empty (only 0x prefix)')
  }
  assertValidHex(raw, 'address')

  if (raw.length !== 40) {
    throw new ValidationError(
      'address',
      `EVM address must be exactly 40 hex chars, got: ${raw.length}`
    )
  }

  return '0x' + raw.toLowerCase()
}

// =============================================================================
// Stable Hashing
// =============================================================================

/**
 * Compute a deterministic hash of a proto message.
 *
 * Proto binary serialization guarantees field order,
 * making `toBinary` output deterministic for the same message.
 */
export function stableHash<D extends DescMessage>(schema: D, msg: MessageShape<D>): string {
  const bytes = toBinary(schema, msg)
  return bytesToHex(sha256(bytes))
}

/**
 * Hash an arbitrary request object using JSON serialization + SHA-256.
 *
 * Used when proto schema is not available (e.g., at the cache proxy layer).
 * JSON.stringify on proto-es v2 messages is deterministic for identically
 * constructed messages (same field insertion order).
 *
 * Worst case for non-determinism: cache miss (never stale data).
 */
export function hashRequestJson(request: unknown): string {
  const json = JSON.stringify(request, (_, v: unknown) =>
    typeof v === 'bigint' ? `__bigint__${v}` : v
  )
  const encoder = new TextEncoder()
  return bytesToHex(sha256(encoder.encode(json)))
}

/**
 * Build a cache key for a gRPC query, optionally scoped to a block height.
 *
 * - With height: `serviceName.methodName:requestHash:hHeight` (immutable snapshot)
 * - Without height: `serviceName.methodName:requestHash` (current state)
 */
export function buildCacheKey(
  serviceName: string,
  methodName: string,
  requestHash: string,
  height?: Numeric
): string {
  const baseKey = `${serviceName}.${methodName}:${requestHash}`
  if (height !== undefined) {
    return `${baseKey}:h${height}`
  }
  return baseKey
}

// =============================================================================
// Cache Key Generators
// =============================================================================

/** Cache key generators with chainId namespacing */
export const cacheKeys = {
  moveAbi: (chainId: string, addr: string, module: string) => {
    assertNonEmpty(chainId, 'chainId')
    assertNonEmpty(module, 'module')
    return `${chainId}:move:${normalizeMoveAddress(addr)}:${module}`
  },
  denomToContract: (chainId: string, denom: string) => {
    assertNonEmpty(chainId, 'chainId')
    assertNonEmpty(denom, 'denom')
    return `${chainId}:d2c:${denom}`
  },
  contractToDenom: (chainId: string, addr: string) => {
    assertNonEmpty(chainId, 'chainId')
    return `${chainId}:c2d:${normalizeEvmAddress(addr)}`
  },
}

/** Pending request key prefixes with chainId namespacing */
export const pendingKeys = {
  moveAbi: (chainId: string, addr: string, module: string) => {
    assertNonEmpty(chainId, 'chainId')
    return `${chainId}:move:${normalizeMoveAddress(addr)}:${module}`
  },
  denomMapping: (chainId: string, key: string) => {
    assertNonEmpty(chainId, 'chainId')
    return `${chainId}:denom:${key}`
  },
}
