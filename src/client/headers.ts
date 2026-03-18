/**
 * Header utilities for gRPC authentication and metadata.
 *
 * Converts AuthConfig to HTTP headers, merges header sources,
 * validates conflicts, and transforms QueryOptions to Connect RPC CallOptions.
 */

import type { CallOptions } from '@connectrpc/connect'
import { base64 } from '@scure/base'
import { HeaderConflictError } from '../errors'
import type { Numeric } from '../types'
import type { AuthConfig, HttpRequestOptions, QueryOptions } from './types'

/**
 * Convert AuthConfig to HTTP headers.
 *
 * All header keys are returned in lowercase.
 */
export function authConfigToHeaders(config: AuthConfig): Record<string, string> {
  switch (config.type) {
    case 'bearer':
      return { authorization: `Bearer ${config.token}` }
    case 'api-key': {
      const headerName = config.header ?? 'x-api-key'
      return { [headerName.toLowerCase()]: config.key }
    }
    case 'basic': {
      const credentials = new TextEncoder().encode(`${config.username}:${config.password}`)
      const encoded = base64.encode(credentials)
      return { authorization: `Basic ${encoded}` }
    }
  }
}

/**
 * Convert block height to gRPC metadata header.
 */
export function heightToHeaders(height: Numeric): Record<string, string> {
  return { 'x-cosmos-block-height': height.toString() }
}

/**
 * Merge multiple header sources with lowercase key normalization.
 *
 * Later sources override earlier ones for the same key.
 * Order: contextHeaders (base) → authHeaders → queryHeaders (highest priority)
 */
export function mergeHeaders(
  ...sources: (Record<string, string> | undefined)[]
): Record<string, string> {
  const result: Record<string, string> = {}
  for (const source of sources) {
    if (source) {
      for (const [key, value] of Object.entries(source)) {
        result[key.toLowerCase()] = value
      }
    }
  }
  return result
}

/**
 * Validate that `auth` and `headers` at the same level don't set the same header key.
 *
 * Called in:
 * - `createChainContext` (level: 'context')
 * - `toCallOptions` (level: 'query')
 *
 * @throws {HeaderConflictError} when auth and headers set the same key
 */
export function validateHeaderConflict(
  auth: AuthConfig | undefined,
  headers: Record<string, string> | undefined,
  level: 'context' | 'query'
): void {
  if (!auth || !headers) return
  const authHeaders = authConfigToHeaders(auth)
  const normalizedKeys = new Set(Object.keys(headers).map(k => k.toLowerCase()))
  for (const key of Object.keys(authHeaders)) {
    if (normalizedKeys.has(key)) {
      throw new HeaderConflictError(key, level)
    }
  }
}

/**
 * Build merged HTTP headers from context-level and request-level options.
 *
 * Handles conflict validation, auth resolution (request overrides context),
 * and multi-source header merge. Transport-agnostic — used by both gRPC and
 * EVM JSON-RPC clients.
 */
export function toFetchHeaders(
  contextAuth: AuthConfig | undefined,
  contextHeaders: Record<string, string> | undefined,
  requestOptions?: HttpRequestOptions
): Record<string, string> {
  validateHeaderConflict(requestOptions?.auth, requestOptions?.headers, 'query')
  const effectiveAuth = requestOptions?.auth ?? contextAuth
  const authHeaders = effectiveAuth ? authConfigToHeaders(effectiveAuth) : undefined
  return mergeHeaders(contextHeaders, authHeaders, requestOptions?.headers)
}

/**
 * Convert QueryOptions to Connect RPC CallOptions.
 *
 * Uses toFetchHeaders() for header merge, then adds gRPC-specific
 * height injection and callback mapping.
 */
export function toCallOptions(
  contextAuth: AuthConfig | undefined,
  contextHeaders: Record<string, string> | undefined,
  queryOptions?: QueryOptions
): CallOptions {
  const headers = toFetchHeaders(contextAuth, contextHeaders, queryOptions)

  if (queryOptions?.height !== undefined) {
    Object.assign(headers, heightToHeaders(queryOptions.height))
  }

  return {
    headers,
    signal: queryOptions?.signal,
    timeoutMs: queryOptions?.timeoutMs,
    onHeader: queryOptions?.onHeaders, // onHeaders → onHeader (Connect RPC naming)
    onTrailer: queryOptions?.onTrailer,
  }
}
