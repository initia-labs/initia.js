/**
 * Unit tests for tx serialize / deserialize (unsigned + signed).
 */

import { describe, it, expect } from 'vitest'
import {
  serializeUnsignedTx,
  deserializeUnsignedTx,
  serializeSignedTx,
  deserializeSignedTx,
  makeSignBytes,
} from '../../../src/tx/sign'
import type { DirectSignDoc } from '../../../src/signer/types'
import type { SignedTxDoc } from '../../../src/tx/sign'

const sampleDoc: DirectSignDoc = {
  bodyBytes: new Uint8Array([10, 20, 30, 40]),
  authInfoBytes: new Uint8Array([50, 60, 70]),
  chainId: 'initiation-2',
  accountNumber: 42n,
}

describe('serializeUnsignedTx', () => {
  it('should produce the same bytes as makeSignBytes', () => {
    const fromAlias = serializeUnsignedTx(sampleDoc)
    const fromOriginal = makeSignBytes(
      sampleDoc.bodyBytes,
      sampleDoc.authInfoBytes,
      sampleDoc.chainId,
      sampleDoc.accountNumber
    )
    expect(fromAlias).toEqual(fromOriginal)
  })

  it('should return Uint8Array', () => {
    const bytes = serializeUnsignedTx(sampleDoc)
    expect(bytes).toBeInstanceOf(Uint8Array)
    expect(bytes.length).toBeGreaterThan(0)
  })
})

describe('deserializeUnsignedTx', () => {
  it('should round-trip with serializeUnsignedTx', () => {
    const bytes = serializeUnsignedTx(sampleDoc)
    const restored = deserializeUnsignedTx(bytes)

    expect(restored.bodyBytes).toEqual(sampleDoc.bodyBytes)
    expect(restored.authInfoBytes).toEqual(sampleDoc.authInfoBytes)
    expect(restored.chainId).toBe(sampleDoc.chainId)
    expect(restored.accountNumber).toBe(sampleDoc.accountNumber)
  })

  it('should handle empty body/authInfo bytes', () => {
    const doc: DirectSignDoc = {
      bodyBytes: new Uint8Array(0),
      authInfoBytes: new Uint8Array(0),
      chainId: 'test-chain',
      accountNumber: 0n,
    }
    const bytes = serializeUnsignedTx(doc)
    const restored = deserializeUnsignedTx(bytes)

    expect(restored.chainId).toBe('test-chain')
    expect(restored.accountNumber).toBe(0n)
  })

  it('should handle large account numbers', () => {
    const doc: DirectSignDoc = {
      bodyBytes: new Uint8Array([1]),
      authInfoBytes: new Uint8Array([2]),
      chainId: 'mainnet',
      accountNumber: 999999999999n,
    }
    const bytes = serializeUnsignedTx(doc)
    const restored = deserializeUnsignedTx(bytes)

    expect(restored.accountNumber).toBe(999999999999n)
  })

  it('should throw on invalid bytes', () => {
    expect(() => deserializeUnsignedTx(new Uint8Array([255, 255, 255]))).toThrow()
  })
})

// =============================================================================
// Signed TX (TxRaw)
// =============================================================================

const sampleSigned: SignedTxDoc = {
  bodyBytes: new Uint8Array([10, 20, 30, 40]),
  authInfoBytes: new Uint8Array([50, 60, 70]),
  signatures: [new Uint8Array([1, 2, 3, 4, 5])],
}

describe('serializeSignedTx', () => {
  it('should return Uint8Array', () => {
    const bytes = serializeSignedTx(sampleSigned)
    expect(bytes).toBeInstanceOf(Uint8Array)
    expect(bytes.length).toBeGreaterThan(0)
  })
})

describe('deserializeSignedTx', () => {
  it('should round-trip with serializeSignedTx', () => {
    const bytes = serializeSignedTx(sampleSigned)
    const restored = deserializeSignedTx(bytes)

    expect(restored.bodyBytes).toEqual(sampleSigned.bodyBytes)
    expect(restored.authInfoBytes).toEqual(sampleSigned.authInfoBytes)
    expect(restored.signatures).toEqual(sampleSigned.signatures)
  })

  it('should handle multiple signatures (multisig)', () => {
    const doc: SignedTxDoc = {
      bodyBytes: new Uint8Array([1]),
      authInfoBytes: new Uint8Array([2]),
      signatures: [
        new Uint8Array([10, 20, 30]),
        new Uint8Array([40, 50, 60]),
        new Uint8Array([70, 80, 90]),
      ],
    }
    const bytes = serializeSignedTx(doc)
    const restored = deserializeSignedTx(bytes)

    expect(restored.signatures).toHaveLength(3)
    expect(restored.signatures).toEqual(doc.signatures)
  })

  it('should handle empty signatures', () => {
    const doc: SignedTxDoc = {
      bodyBytes: new Uint8Array([1, 2]),
      authInfoBytes: new Uint8Array([3, 4]),
      signatures: [],
    }
    const bytes = serializeSignedTx(doc)
    const restored = deserializeSignedTx(bytes)

    expect(restored.signatures).toEqual([])
  })

  it('should produce different bytes from unsigned tx', () => {
    const unsigned = serializeUnsignedTx({
      bodyBytes: sampleSigned.bodyBytes,
      authInfoBytes: sampleSigned.authInfoBytes,
      chainId: 'test',
      accountNumber: 1n,
    })
    const signed = serializeSignedTx(sampleSigned)

    expect(signed).not.toEqual(unsigned)
  })

  it('should throw on invalid bytes', () => {
    expect(() => deserializeSignedTx(new Uint8Array([255, 255, 255]))).toThrow()
  })
})
