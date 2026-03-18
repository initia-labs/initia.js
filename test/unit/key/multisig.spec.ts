import { describe, it, expect } from 'vitest'
import { CompactBitArray, MultisigPublicKey, MultiSignature, encodeMultisigAminoPubKey } from '../../../src/key/multisig'
import { RawKey } from '../../../src/key/raw-key'
import { fromBinary } from '@bufbuild/protobuf'
import { LegacyAminoPubKeySchema } from '@buf/cosmos_cosmos-sdk.bufbuild_es/cosmos/crypto/multisig/keys_pb'
import { MultiSignatureSchema } from '@buf/cosmos_cosmos-sdk.bufbuild_es/cosmos/crypto/multisig/v1beta1/multisig_pb'
import { unpackPubKey, pubKeyToAddress } from '../../../src/util/public-key'

describe('CompactBitArray', () => {
  it('should create from bit count', () => {
    const ba = CompactBitArray.fromBits(5)
    expect(ba.count()).toBe(5)
  })

  it('should get/set individual bits', () => {
    const ba = CompactBitArray.fromBits(8)
    expect(ba.getIndex(0)).toBe(false)
    ba.setIndex(0, true)
    expect(ba.getIndex(0)).toBe(true)
    ba.setIndex(3, true)
    expect(ba.getIndex(3)).toBe(true)
    expect(ba.getIndex(1)).toBe(false)
  })

  it('should count true bits before index', () => {
    const ba = CompactBitArray.fromBits(5)
    ba.setIndex(0, true)
    ba.setIndex(2, true)
    expect(ba.numTrueBitsBefore(0)).toBe(0)
    expect(ba.numTrueBitsBefore(1)).toBe(1)
    expect(ba.numTrueBitsBefore(2)).toBe(1)
    expect(ba.numTrueBitsBefore(3)).toBe(2)
  })

  it('should return false on out-of-range index (matches legacy behavior)', () => {
    const ba = CompactBitArray.fromBits(3)
    expect(ba.getIndex(3)).toBe(false)
    expect(ba.getIndex(-1)).toBe(false)
    expect(ba.setIndex(3, true)).toBe(false)
  })

  it('should convert to proto', () => {
    const ba = CompactBitArray.fromBits(10)
    ba.setIndex(0, true)
    const proto = ba.toProto()
    expect(proto.extraBitsStored).toBe(2) // 10 % 8 = 2
    expect(proto.elems).toBeInstanceOf(Uint8Array)
    expect(proto.elems.length).toBe(2) // ceil(10/8) = 2
  })

  it('should handle 8-bit aligned count correctly', () => {
    const ba = CompactBitArray.fromBits(8)
    expect(ba.count()).toBe(8)
    const proto = ba.toProto()
    expect(proto.extraBitsStored).toBe(0) // 8 % 8 = 0
    expect(proto.elems.length).toBe(1)
  })

  it('should set and clear bits', () => {
    const ba = CompactBitArray.fromBits(8)
    ba.setIndex(5, true)
    expect(ba.getIndex(5)).toBe(true)
    ba.setIndex(5, false)
    expect(ba.getIndex(5)).toBe(false)
  })

  it('should throw on bits <= 0', () => {
    expect(() => CompactBitArray.fromBits(0)).toThrow()
    expect(() => CompactBitArray.fromBits(-1)).toThrow()
  })
})

describe('MultisigPublicKey', () => {
  const keys = [
    RawKey.fromHex('0x0000000000000000000000000000000000000000000000000000000000000001'),
    RawKey.fromHex('0x0000000000000000000000000000000000000000000000000000000000000002'),
    RawKey.fromHex('0x0000000000000000000000000000000000000000000000000000000000000003'),
  ]
  const pubKeys = keys.map(k => k.publicKey)

  it('should create with threshold and public keys', () => {
    const mpk = new MultisigPublicKey(2, pubKeys)
    expect(mpk.threshold).toBe(2)
    expect(mpk.publicKeys).toHaveLength(3)
  })

  it('should reject threshold > pubkeys length', () => {
    expect(() => new MultisigPublicKey(4, pubKeys)).toThrow()
  })

  it('should reject threshold < 1', () => {
    expect(() => new MultisigPublicKey(0, pubKeys)).toThrow()
  })

  it('should derive address', () => {
    const mpk = new MultisigPublicKey(2, pubKeys)
    const addr = mpk.address()
    expect(addr).toMatch(/^init1[a-z0-9]+$/)
  })

  it('should derive deterministic address', () => {
    const mpk1 = new MultisigPublicKey(2, pubKeys)
    const mpk2 = new MultisigPublicKey(2, pubKeys)
    expect(mpk1.address()).toBe(mpk2.address())
  })

  it('should pack to Any', () => {
    const mpk = new MultisigPublicKey(2, pubKeys)
    const any = mpk.packAny()
    expect(any.typeUrl).toBe('/cosmos.crypto.multisig.LegacyAminoPubKey')
  })

  it('should use custom bech32 prefix', () => {
    const mpk = new MultisigPublicKey(2, pubKeys, 'cosmos')
    const addr = mpk.address()
    expect(addr).toMatch(/^cosmos1[a-z0-9]+$/)
  })

  it('should produce different addresses for different thresholds', () => {
    const mpk1 = new MultisigPublicKey(1, pubKeys)
    const mpk2 = new MultisigPublicKey(2, pubKeys)
    expect(mpk1.address()).not.toBe(mpk2.address())
  })

  it('should accept threshold equal to pubkeys length', () => {
    expect(() => new MultisigPublicKey(3, pubKeys)).not.toThrow()
  })

  it('should accept threshold of 1', () => {
    expect(() => new MultisigPublicKey(1, pubKeys)).not.toThrow()
  })
})

describe('encodeMultisigAminoPubKey', () => {
  const keys = [
    RawKey.fromHex('0x0000000000000000000000000000000000000000000000000000000000000001'),
    RawKey.fromHex('0x0000000000000000000000000000000000000000000000000000000000000002'),
    RawKey.fromHex('0x0000000000000000000000000000000000000000000000000000000000000003'),
  ]
  const pubKeys = keys.map(k => k.publicKey)

  it('should produce amino bytes with correct prefix and structure', () => {
    const mpk = new MultisigPublicKey(2, pubKeys)
    const any = mpk.packAny()
    const msg = fromBinary(LegacyAminoPubKeySchema, any.value)

    const aminoBytes = encodeMultisigAminoPubKey(msg.threshold, msg.publicKeys)

    // Verify amino prefix (first 4 bytes = 0x22c1f7e2)
    expect(aminoBytes[0]).toBe(0x22)
    expect(aminoBytes[1]).toBe(0xc1)
    expect(aminoBytes[2]).toBe(0xf7)
    expect(aminoBytes[3]).toBe(0xe2)

    // Verify it produces non-trivial output
    expect(aminoBytes.length).toBeGreaterThan(100) // 3 keys × ~38 bytes + overhead
  })

  it('should match golden address for known keys', () => {
    const mpk = new MultisigPublicKey(2, pubKeys)
    // Pinned from a known-good computation of SHA-256 truncation over amino bytes
    expect(mpk.address()).toBe('init16nsuts7ccq7c64tat6sm4uar2ammtwgv5v7yf6')
  })
})

describe('MultiSignature', () => {
  const keys = [
    RawKey.fromHex('0x0000000000000000000000000000000000000000000000000000000000000001'),
    RawKey.fromHex('0x0000000000000000000000000000000000000000000000000000000000000002'),
    RawKey.fromHex('0x0000000000000000000000000000000000000000000000000000000000000003'),
  ]
  const pubKeys = keys.map(k => k.publicKey)
  const mpk = new MultisigPublicKey(2, pubKeys)

  it('should create from MultisigPublicKey', () => {
    const ms = new MultiSignature(mpk)
    expect(ms.isComplete()).toBe(false)
  })

  it('should append signature by index', () => {
    const ms = new MultiSignature(mpk)
    ms.appendSignature(0, new Uint8Array(64))
    expect(ms.isComplete()).toBe(false) // threshold 2, only 1 signed
  })

  it('should be complete when threshold reached', () => {
    const ms = new MultiSignature(mpk)
    ms.appendSignature(0, new Uint8Array(64))
    ms.appendSignature(1, new Uint8Array(64))
    expect(ms.isComplete()).toBe(true)
  })

  it('should reject duplicate index', () => {
    const ms = new MultiSignature(mpk)
    ms.appendSignature(0, new Uint8Array(64))
    expect(() => ms.appendSignature(0, new Uint8Array(64))).toThrow()
  })

  it('should reject out-of-range index', () => {
    const ms = new MultiSignature(mpk)
    expect(() => ms.appendSignature(3, new Uint8Array(64))).toThrow()
  })

  it('should reject negative index', () => {
    const ms = new MultiSignature(mpk)
    expect(() => ms.appendSignature(-1, new Uint8Array(64))).toThrow()
  })

  it('should serialize to proto bytes', () => {
    const ms = new MultiSignature(mpk)
    ms.appendSignature(0, new Uint8Array(64))
    ms.appendSignature(2, new Uint8Array(64))
    const bytes = ms.toProtoBytes()
    expect(bytes).toBeInstanceOf(Uint8Array)
    expect(bytes.length).toBeGreaterThan(0)
  })

  it('should produce ModeInfo for AuthInfo', () => {
    const ms = new MultiSignature(mpk)
    ms.appendSignature(0, new Uint8Array(64))
    const modeInfo = ms.toModeInfo()
    expect(modeInfo.sum.case).toBe('multi')
  })

  it('toModeInfo should contain correct bitarray and per-signer mode infos', () => {
    const ms = new MultiSignature(mpk)
    ms.appendSignature(0, new Uint8Array(64))
    ms.appendSignature(2, new Uint8Array(64))
    const modeInfo = ms.toModeInfo()

    // Verify multi case
    expect(modeInfo.sum.case).toBe('multi')
    if (modeInfo.sum.case !== 'multi') throw new Error('unreachable')
    const multi = modeInfo.sum.value

    // Verify modeInfos count matches appended signatures
    expect(multi.modeInfos).toHaveLength(2)

    // Each inner ModeInfo should be DIRECT
    for (const mi of multi.modeInfos) {
      expect(mi.sum.case).toBe('single')
      if (mi.sum.case !== 'single') throw new Error('unreachable')
      // SignMode.DIRECT = 1
      expect(mi.sum.value.mode).toBe(1)
    }

    // Bitarray should be present
    expect(multi.bitarray).toBeDefined()
  })

  it('should maintain correct signature ordering for out-of-order appends', () => {
    const ms = new MultiSignature(mpk)

    // Append index 2 first, then index 0
    const sig2 = new Uint8Array(64).fill(2)
    const sig0 = new Uint8Array(64).fill(0)
    ms.appendSignature(2, sig2)
    ms.appendSignature(0, sig0)

    // Decode proto bytes to verify ordering
    const bytes = ms.toProtoBytes()
    const decoded = fromBinary(MultiSignatureSchema, bytes)

    // signatures[0] should be sig0 (index 0 = first in sort order)
    expect(decoded.signatures[0][0]).toBe(0)  // filled with 0
    // signatures[1] should be sig2 (index 2 = second in sort order)
    expect(decoded.signatures[1][0]).toBe(2)  // filled with 2
  })
})

describe('public-key multisig support', () => {
  const keys = [
    RawKey.fromHex('0x0000000000000000000000000000000000000000000000000000000000000001'),
    RawKey.fromHex('0x0000000000000000000000000000000000000000000000000000000000000002'),
    RawKey.fromHex('0x0000000000000000000000000000000000000000000000000000000000000003'),
  ]
  const pubKeys = keys.map(k => k.publicKey)

  it('unpackPubKey should handle LegacyAminoPubKey Any', () => {
    const mpk = new MultisigPublicKey(2, pubKeys)
    const any = mpk.packAny()
    const unpacked = unpackPubKey(any)
    expect(unpacked.type).toBe('multisig')
    expect(unpacked.pubKey).toBeInstanceOf(Uint8Array)
  })

  it('pubKeyToAddress should derive multisig address from proto bytes', () => {
    const mpk = new MultisigPublicKey(2, pubKeys)
    const any = mpk.packAny()
    const addr = pubKeyToAddress(any.value, 'multisig')
    expect(addr).toBe(mpk.address())
  })

  it('pubKeyToAddress multisig should produce the known golden address', () => {
    const mpk = new MultisigPublicKey(2, pubKeys)
    const any = mpk.packAny()
    const addr = pubKeyToAddress(any.value, 'multisig')
    expect(addr).toBe('init16nsuts7ccq7c64tat6sm4uar2ammtwgv5v7yf6')
  })
})
