/**
 * Unit tests for header utilities.
 *
 * Focuses on behavior contracts that matter:
 * - Auth replacement semantics (query vs context)
 * - Header merge order and case normalization
 * - Same-level conflict detection vs cross-level allowance
 * - Base64 encoding correctness
 * - Connect RPC field mapping quirks
 */

import { describe, it, expect, vi } from 'vitest'
import { base64 } from '@scure/base'
import {
  authConfigToHeaders,
  mergeHeaders,
  validateHeaderConflict,
  toCallOptions,
} from '../../../src/client/headers'
import { auth } from '../../../src/client/types'
import { HeaderConflictError } from '../../../src/errors'

// =============================================================================
// authConfigToHeaders — only non-trivial conversions
// =============================================================================

describe('authConfigToHeaders', () => {
  it('basic auth produces valid Base64 encoding', () => {
    const headers = authConfigToHeaders(auth.basic('user', 'pass'))
    const encoded = headers.authorization.replace('Basic ', '')
    const decoded = new TextDecoder().decode(base64.decode(encoded))
    expect(decoded).toBe('user:pass')
  })

  it('custom api-key header name is lowercased', () => {
    const headers = authConfigToHeaders(auth.apiKey('sk-123', 'X-Alchemy-Token'))
    expect(headers).toEqual({ 'x-alchemy-token': 'sk-123' })
  })
})

// =============================================================================
// mergeHeaders — order and case normalization
// =============================================================================

describe('mergeHeaders', () => {
  it('later sources override earlier for same key (case-insensitive)', () => {
    const result = mergeHeaders({ 'x-api-key': 'old', 'x-base': 'keep' }, { 'X-Api-Key': 'new' })
    expect(result).toEqual({ 'x-api-key': 'new', 'x-base': 'keep' })
  })
})

// =============================================================================
// validateHeaderConflict — same-level detection
// =============================================================================

describe('validateHeaderConflict', () => {
  it('detects bearer auth vs authorization header conflict (case-insensitive)', () => {
    expect(() =>
      validateHeaderConflict(auth.bearer('token'), { Authorization: 'other' }, 'context')
    ).toThrow(HeaderConflictError)
  })

  it('detects custom api-key header conflict', () => {
    expect(() =>
      validateHeaderConflict(
        auth.apiKey('key', 'x-alchemy-token'),
        { 'x-alchemy-token': 'other' },
        'context'
      )
    ).toThrow(HeaderConflictError)
  })

  it('error includes header name and level for debugging', () => {
    try {
      validateHeaderConflict(auth.bearer('token'), { authorization: 'other' }, 'query')
      expect.fail('Should throw')
    } catch (e) {
      expect(e).toBeInstanceOf(HeaderConflictError)
      expect((e as HeaderConflictError).headerName).toBe('authorization')
      expect((e as HeaderConflictError).level).toBe('query')
    }
  })
})

// =============================================================================
// toCallOptions — the critical integration point
// =============================================================================

describe('toCallOptions', () => {
  it('query auth completely replaces context auth (not merge)', () => {
    const result = toCallOptions(auth.bearer('ctx-token'), undefined, {
      auth: auth.apiKey('query-key'),
    })
    // api-key only, bearer must NOT be present
    expect(result.headers).toEqual({ 'x-api-key': 'query-key' })
    expect((result.headers as Record<string, string>)['authorization']).toBeUndefined()
  })

  it('merge order: contextHeaders → auth → queryHeaders (query wins)', () => {
    const result = toCallOptions(
      auth.bearer('token'),
      { 'x-base': 'ctx', authorization: 'ctx-will-be-overridden' },
      { headers: { 'x-query': 'q' } }
    )
    expect(result.headers).toEqual({
      'x-base': 'ctx',
      authorization: 'Bearer token', // auth overrides context
      'x-query': 'q',
    })
  })

  it('query headers can override auth headers (escape hatch)', () => {
    const result = toCallOptions(auth.bearer('token'), undefined, {
      headers: { authorization: 'Custom override' },
    })
    expect((result.headers as Record<string, string>)['authorization']).toBe('Custom override')
  })

  it('same-level conflict throws (query auth + query headers)', () => {
    expect(() =>
      toCallOptions(undefined, undefined, {
        auth: auth.bearer('token'),
        headers: { authorization: 'other' },
      })
    ).toThrow(HeaderConflictError)
  })

  it('cross-level is NOT a conflict (query auth vs context headers)', () => {
    const result = toCallOptions(
      undefined,
      { authorization: 'ctx' },
      {
        auth: auth.bearer('query-token'),
      }
    )
    // query auth should win via merge order
    expect((result.headers as Record<string, string>)['authorization']).toBe('Bearer query-token')
  })

  it('height coexists with existing headers', () => {
    const result = toCallOptions(
      auth.bearer('token'),
      { 'x-custom': 'val' },
      {
        height: 12345n,
      }
    )
    expect(result.headers).toEqual({
      'x-custom': 'val',
      authorization: 'Bearer token',
      'x-cosmos-block-height': '12345',
    })
  })

  it('maps onHeaders → onHeader (Connect RPC naming)', () => {
    const cb = vi.fn()
    const result = toCallOptions(undefined, undefined, { onHeaders: cb })
    expect(result.onHeader).toBe(cb)
  })
})
