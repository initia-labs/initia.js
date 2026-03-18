import { create, fromBinary, toBinary } from '@bufbuild/protobuf'
import type { Any } from '@bufbuild/protobuf/wkt'
import { ValidationError } from '../errors'
import { sha256 } from '@noble/hashes/sha2.js'
import { bech32 } from '@scure/base'
import { LegacyAminoPubKeySchema } from '@buf/cosmos_cosmos-sdk.bufbuild_es/cosmos/crypto/multisig/keys_pb'
import {
  MultiSignatureSchema,
  CompactBitArraySchema,
} from '@buf/cosmos_cosmos-sdk.bufbuild_es/cosmos/crypto/multisig/v1beta1/multisig_pb'
import { PubKeySchema as Secp256k1PubKeySchema } from '@buf/cosmos_cosmos-sdk.bufbuild_es/cosmos/crypto/secp256k1/keys_pb'
import {
  ModeInfoSchema,
  ModeInfo_MultiSchema,
  ModeInfo_SingleSchema,
} from '@buf/cosmos_cosmos-sdk.bufbuild_es/cosmos/tx/v1beta1/tx_pb'
import type { ModeInfo } from '@buf/cosmos_cosmos-sdk.bufbuild_es/cosmos/tx/v1beta1/tx_pb'
import { SignMode } from '@buf/cosmos_cosmos-sdk.bufbuild_es/cosmos/tx/signing/v1beta1/signing_pb'
import { anyPack } from '../util/any'

// ─── CompactBitArray ──────────────────────────────────────────────────────────

/**
 * CompactBitArray is an implementation of a space efficient bit array.
 * This is used to ensure that the encoded data takes up a minimal amount of
 * space after proto encoding.
 * This is not thread safe, and is not intended for concurrent usage.
 */
export class CompactBitArray {
  private constructor(
    private extraBitsStored: number,
    private elems: Uint8Array
  ) {}

  /**
   * Creates a new CompactBitArray with the given number of bits.
   * All bits are initialized to false.
   */
  static fromBits(bits: number): CompactBitArray {
    if (bits <= 0) {
      throw new Error('CompactBitArray bits must be bigger than 0')
    }

    const numElems = Math.floor((bits + 7) / 8)
    if (numElems <= 0 || numElems > 2 ** 32 - 1) {
      // Overflow guard: no negatives and no unreasonable limits > maxint32.
      // See https://github.com/cosmos/cosmos-sdk/issues/9162
      throw new Error('CompactBitArray overflow')
    }

    return new CompactBitArray(bits % 8, new Uint8Array(numElems))
  }

  /** Returns the number of bits in the bitarray. */
  count(): number {
    if (this.extraBitsStored === 0) {
      return this.elems.length * 8
    }
    return (this.elems.length - 1) * 8 + this.extraBitsStored
  }

  /**
   * Returns true if the bit at index i is set; returns false otherwise.
   * Returns false if i is out of range.
   */
  getIndex(i: number): boolean {
    if (i < 0 || i >= this.count()) {
      return false
    }
    return (this.elems[i >> 3] & (1 << (7 - (i % 8)))) > 0
  }

  /**
   * Sets the bit at index i within the bit array.
   * Returns true on success, false if i is out of range.
   */
  setIndex(i: number, v: boolean): boolean {
    if (i < 0 || i >= this.count()) {
      return false
    }

    if (v) {
      this.elems[i >> 3] |= 1 << (7 - (i % 8))
    } else {
      this.elems[i >> 3] &= ~(1 << (7 - (i % 8)))
    }

    return true
  }

  /**
   * Returns the number of bits set to true before the given index.
   * e.g. if bA = _XX__XX, numTrueBitsBefore(4) = 2, since
   * there are two bits set to true before index 4.
   */
  numTrueBitsBefore(index: number): number {
    const countOneBits = (n: number) => n.toString(2).split('0').join('').length

    let onesCount = 0
    const max = this.count()
    if (index > max) {
      index = max
    }

    // Iterate over bytes, then over bits (big-endian) and count bits set to 1
    for (let elem = 0; ; elem++) {
      if (elem * 8 + 7 >= index) {
        onesCount += countOneBits(this.elems[elem] >> (7 - (index % 8) + 1))
        return onesCount
      }
      onesCount += countOneBits(this.elems[elem])
    }
  }

  /** Returns the proto representation matching BSR CompactBitArraySchema. */
  toProto(): { extraBitsStored: number; elems: Uint8Array } {
    return {
      extraBitsStored: this.extraBitsStored,
      elems: new Uint8Array(this.elems),
    }
  }
}

// ─── Amino encoding ──────────────────────────────────────────────────────────

/**
 * 4-byte amino prefix for multisig threshold public key.
 * Reference: https://github.com/tendermint/tendermint/commit/38b401657e4ad7a7eeb3c30a3cbf512037df3740
 */
const AMINO_PREFIX_MULTISIG = new Uint8Array([0x22, 0xc1, 0xf7, 0xe2])

/**
 * 5-byte amino prefix for secp256k1 public key (prefix 0xeb5ae987 + length 0x21 = 33).
 * Reference: https://github.com/tendermint/tendermint/blob/d419fffe18531317c28c29a292ad7d253f6cafdf/docs/spec/blockchain/encoding.md#public-key-cryptography
 */
const AMINO_PREFIX_SECP256K1 = new Uint8Array([0xeb, 0x5a, 0xe9, 0x87, 0x21])

/**
 * Encode a small unsigned integer as protobuf uvarint (supports 0–127).
 */
function encodeUvarint(value: number): number[] {
  if (value < 0) {
    throw new Error(`encodeUvarint: value must be non-negative, got ${value}`)
  }
  if (value > 127) {
    throw new Error(
      'Encoding numbers > 127 is not supported. Values larger than 127 require multi-byte varint encoding.'
    )
  }
  return [value]
}

/**
 * Encode a secp256k1 raw pubkey (33 bytes) using the amino wire format.
 * Result: AMINO_PREFIX_SECP256K1 (5 bytes) || pubkey (33 bytes) = 38 bytes total.
 */
function encodeSecp256k1AminoKey(rawPubKey: Uint8Array): Uint8Array {
  const out = new Uint8Array(AMINO_PREFIX_SECP256K1.length + rawPubKey.length)
  out.set(AMINO_PREFIX_SECP256K1, 0)
  out.set(rawPubKey, AMINO_PREFIX_SECP256K1.length)
  return out
}

/**
 * Convert a secp256k1 Any to its amino-encoded bytes.
 */
function encodeAnyKeyAsAmino(anyKey: Any): Uint8Array {
  const expectedTypeUrl = '/cosmos.crypto.secp256k1.PubKey'
  if (anyKey.typeUrl !== expectedTypeUrl) {
    throw new Error(
      `encodeMultisigAminoPubKey: expected secp256k1 key type '${expectedTypeUrl}', got '${anyKey.typeUrl}'`
    )
  }
  const msg = fromBinary(Secp256k1PubKeySchema, anyKey.value)
  return encodeSecp256k1AminoKey(msg.key)
}

/**
 * Produce amino-encoded bytes for a multisig threshold public key.
 *
 * Encoding format (matches Cosmos SDK / legacy amino):
 *   AMINO_PREFIX_MULTISIG (4 bytes)
 *   0x08 || varint(threshold)          — proto field 1 (threshold)
 *   For each child key:
 *     0x12 || varint(len) || amino_key — proto field 2 (public_keys)
 *
 * Exported for use by `src/util/public-key.ts` (multisig address derivation).
 */
export function encodeMultisigAminoPubKey(threshold: number, publicKeys: Any[]): Uint8Array {
  const out: number[] = Array.from(AMINO_PREFIX_MULTISIG)

  // Field 1: threshold (proto tag 0x08 = field 1, wire type 0 = varint)
  out.push(0x08)
  out.push(...encodeUvarint(threshold))

  // Field 2: each child public key (proto tag 0x12 = field 2, wire type 2 = LEN)
  for (const anyKey of publicKeys) {
    const childAmino = encodeAnyKeyAsAmino(anyKey)
    out.push(0x12)
    out.push(...encodeUvarint(childAmino.length))
    out.push(...Array.from(childAmino))
  }

  return new Uint8Array(out)
}

// ─── MultisigPublicKey ────────────────────────────────────────────────────────

/**
 * MultisigPublicKey represents a threshold multisig public key
 * using the legacy amino address rules (SHA-256 truncation, not ripemd160).
 *
 * Address derivation: sha256(aminoEncode(pubkey)).slice(0, 20) → bech32
 *
 * @example
 * ```typescript
 * const mpk = new MultisigPublicKey(2, [pubKey1, pubKey2, pubKey3])
 * console.log(mpk.address()) // init1...
 * ```
 */
export class MultisigPublicKey {
  readonly threshold: number
  private readonly _publicKeys: Uint8Array[]
  private readonly _bech32Prefix: string

  /**
   * Create a MultisigPublicKey.
   * @param threshold - Minimum number of signatures required (1 ≤ threshold ≤ publicKeys.length)
   * @param publicKeys - Compressed secp256k1 public keys (33 bytes each)
   * @param bech32Prefix - Bech32 address prefix (default: 'init')
   * @throws Error if threshold is out of range
   */
  constructor(threshold: number, publicKeys: Uint8Array[], bech32Prefix = 'init') {
    if (threshold < 1) {
      throw new ValidationError('threshold', `must be >= 1, got ${threshold}`)
    }
    if (threshold > publicKeys.length) {
      throw new ValidationError(
        'threshold',
        `${threshold} cannot exceed number of public keys (${publicKeys.length})`
      )
    }
    if (publicKeys.length > 127) {
      throw new ValidationError(
        'publicKeys',
        `Max 127 public keys supported, got ${publicKeys.length}`
      )
    }
    this.threshold = threshold
    this._publicKeys = publicKeys.map(k => new Uint8Array(k))
    this._bech32Prefix = bech32Prefix
  }

  /** Deep defensive copy of the public keys array. */
  get publicKeys(): readonly Uint8Array[] {
    return this._publicKeys.map(k => new Uint8Array(k))
  }

  /**
   * Pack each raw public key as a secp256k1 Any for amino encoding.
   */
  private packedKeys(): Any[] {
    return this._publicKeys.map(key =>
      anyPack(Secp256k1PubKeySchema, create(Secp256k1PubKeySchema, { key }))
    )
  }

  /**
   * Derive the bech32 address for this multisig key.
   *
   * Uses legacy amino address rules:
   *   sha256(aminoEncode(pubkey)).slice(0, 20) → bech32
   *
   * NOTE: This is SHA-256 truncation only — NOT ripemd160(sha256(...))
   * which is used for single secp256k1 keys.
   */
  address(): string {
    const aminoBytes = encodeMultisigAminoPubKey(this.threshold, this.packedKeys())
    const rawAddr = sha256(aminoBytes).slice(0, 20)
    return bech32.encode(this._bech32Prefix, bech32.toWords(rawAddr))
  }

  /**
   * Pack this multisig public key as a protobuf Any.
   * Wraps a LegacyAminoPubKey message.
   */
  packAny(): Any {
    const msg = create(LegacyAminoPubKeySchema, {
      threshold: this.threshold,
      publicKeys: this.packedKeys(),
    })
    return anyPack(LegacyAminoPubKeySchema, msg)
  }

  /**
   * Serialize to binary using LegacyAminoPubKey proto message.
   */
  toBinary(): Uint8Array {
    const msg = create(LegacyAminoPubKeySchema, {
      threshold: this.threshold,
      publicKeys: this.packedKeys(),
    })
    return toBinary(LegacyAminoPubKeySchema, msg)
  }
}

// ─── MultiSignature ───────────────────────────────────────────────────────────

/**
 * MultiSignature is a mutable accumulator that collects individual signatures
 * for a multisig transaction.
 *
 * Signatures are stored ordered by signer position (index in MultisigPublicKey),
 * using CompactBitArray to track which positions have signed. This matches the
 * Cosmos SDK encoding used when assembling a multisig TxRaw.
 *
 * @example
 * ```typescript
 * const ms = new MultiSignature(mpk)
 * ms.appendSignature(0, sig0)
 * ms.appendSignature(2, sig2)
 * if (ms.isComplete()) {
 *   const sigBytes = ms.toProtoBytes()
 *   const modeInfo = ms.toModeInfo()
 * }
 * ```
 */
export class MultiSignature {
  private readonly bitArray: CompactBitArray
  private readonly signatures: Uint8Array[]
  private readonly _threshold: number

  /**
   * Create a MultiSignature accumulator from a MultisigPublicKey.
   *
   * @param multisigPubKey - The multisig public key defining signers and threshold
   */
  constructor(private readonly multisigPubKey: MultisigPublicKey) {
    this.bitArray = CompactBitArray.fromBits(multisigPubKey.publicKeys.length)
    this.signatures = []
    this._threshold = multisigPubKey.threshold
  }

  /**
   * Append a signature at the given signer index.
   *
   * The signature is inserted at the position determined by
   * `CompactBitArray.numTrueBitsBefore(index)`, keeping the internal
   * signatures array ordered by signer position even when signers sign
   * out-of-order.
   *
   * @param index - Zero-based index of the signer in MultisigPublicKey.publicKeys
   * @param signature - Raw signature bytes (typically 64 bytes r || s)
   * @throws Error if index is out of range or already has a signature
   */
  appendSignature(index: number, signature: Uint8Array): void {
    const n = this.multisigPubKey.publicKeys.length
    if (index < 0 || index >= n) {
      throw new ValidationError('index', `${index} is out of range [0, ${n})`)
    }
    if (this.bitArray.getIndex(index)) {
      throw new ValidationError('index', `${index} already has a signature`)
    }

    // Determine insertion position: number of true bits before this index
    const insertPos = this.bitArray.numTrueBitsBefore(index)

    // Set the bit to mark this signer as signed
    this.bitArray.setIndex(index, true)

    // Insert signature at the correct ordered position
    this.signatures.splice(insertPos, 0, new Uint8Array(signature))
  }

  /**
   * Returns true when the number of collected signatures meets or exceeds
   * the signing threshold.
   */
  isComplete(): boolean {
    let count = 0
    for (let i = 0; i < this.multisigPubKey.publicKeys.length; i++) {
      if (this.bitArray.getIndex(i)) {
        count++
      }
    }
    return count >= this._threshold
  }

  /**
   * Serialize the collected signatures as a MultiSignature proto binary.
   */
  toProtoBytes(): Uint8Array {
    const msg = create(MultiSignatureSchema, {
      signatures: this.signatures,
    })
    return toBinary(MultiSignatureSchema, msg)
  }

  /**
   * Build a ModeInfo for use in AuthInfo.signerInfos.
   *
   * The returned ModeInfo has:
   * - case: 'multi'
   * - bitarray: current CompactBitArray state
   * - modeInfos: one SIGN_MODE_DIRECT ModeInfo_Single per collected signature
   */
  toModeInfo(): ModeInfo {
    const bitarrayProto = this.bitArray.toProto()
    const bitarray = create(CompactBitArraySchema, {
      extraBitsStored: bitarrayProto.extraBitsStored,
      elems: bitarrayProto.elems,
    })

    // One ModeInfo_Single per signature collected (ordered by position)
    const modeInfos = this.signatures.map(() =>
      create(ModeInfoSchema, {
        sum: {
          case: 'single',
          value: create(ModeInfo_SingleSchema, {
            mode: SignMode.DIRECT,
          }),
        },
      })
    )

    const multi = create(ModeInfo_MultiSchema, {
      bitarray,
      modeInfos,
    })

    return create(ModeInfoSchema, {
      sum: {
        case: 'multi',
        value: multi,
      },
    })
  }
}
