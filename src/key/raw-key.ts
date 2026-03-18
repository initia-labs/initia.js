/**
 * RawKey - Key implementation using a raw private key.
 *
 * Creates keys from raw 32-byte private keys for signing transactions.
 * Supports both Cosmos-style and EVM-style address derivation.
 */

import { secp256k1 } from '@noble/curves/secp256k1.js'
import { hexToBytes, bytesToHex } from '@noble/hashes/utils.js'
import { sha256, keccak256 } from '../util/hash'
import { Key, DEFAULT_BECH32_PREFIX } from './key'
import { KeyError } from '../errors'
import type { RecoverableSignature } from '../signer/types'

/**
 * Key implementation using a raw private key.
 *
 * @example
 * ```typescript
 * // From raw bytes
 * const key = new RawKey(privateKeyBytes)
 *
 * // From hex string
 * const key = RawKey.fromHex('0x...')
 *
 * // Get address
 * console.log(key.address) // init1...
 * ```
 */
export class RawKey extends Key {
  readonly publicKey: Uint8Array
  readonly isEth: boolean
  readonly bech32Prefix: string

  /** Private key stored securely using ES2022 private field */
  #privateKey: Uint8Array

  /** Track if key has been destroyed */
  #destroyed = false

  /**
   * Create a RawKey from a private key.
   * @param privateKey - 32-byte private key
   * @param isEth - Use EVM-style address derivation (default: true)
   * @param bech32Prefix - Bech32 prefix for address encoding (default: 'init')
   */
  constructor(privateKey: Uint8Array, isEth = true, bech32Prefix = DEFAULT_BECH32_PREFIX) {
    super()
    if (privateKey.length !== 32) {
      throw new KeyError('import', 'Private key must be 32 bytes')
    }
    this.#privateKey = privateKey
    this.publicKey = secp256k1.getPublicKey(privateKey, true) // compressed
    this.isEth = isEth
    this.bech32Prefix = bech32Prefix
  }

  /**
   * Create a RawKey from a hex string.
   * @param hex - 64-character hex string (with or without 0x prefix)
   * @param isEth - Use EVM-style address derivation (default: true)
   * @param bech32Prefix - Bech32 prefix for address encoding (default: 'init')
   */
  static fromHex(hex: string, isEth = true, bech32Prefix = DEFAULT_BECH32_PREFIX): RawKey {
    const cleaned = hex.replace(/^0x/, '')
    if (cleaned.length !== 64) {
      throw new KeyError('import', 'Private key must be 64 hex characters')
    }
    return new RawKey(hexToBytes(cleaned), isEth, bech32Prefix)
  }

  /**
   * Check if the key has been destroyed.
   */
  get isDestroyed(): boolean {
    return this.#destroyed
  }

  /**
   * Securely destroy the key by zeroing out the private key bytes.
   *
   * After calling this method:
   * - The private key memory is overwritten with zeros
   * - Any subsequent signing operations will throw an error
   * - The public key and address remain accessible
   *
   * WARNING: This operation is irreversible.
   *
   * @example
   * ```typescript
   * const key = new RawKey(privateKeyBytes)
   * await key.sign(message)
   * key.destroy() // Zero out private key when done
   * ```
   */
  destroy(): void {
    if (this.#destroyed) return
    this.#privateKey.fill(0)
    this.#destroyed = true
  }

  /**
   * Get the private key as a hex string (0x-prefixed).
   * Use for EVM transaction signing or external key export.
   * @throws KeyError if the key has been destroyed
   */
  getPrivateKeyHex(): `0x${string}` {
    if (this.#destroyed) {
      throw new KeyError('sign', 'Key has been destroyed')
    }
    return `0x${bytesToHex(this.#privateKey)}`
  }

  /**
   * Sign raw bytes with SHA256 hash.
   * @param message - Raw message bytes to sign
   * @returns ECDSA signature in compact format (64 bytes, r || s)
   * @throws KeyError if the key has been destroyed
   */
  // eslint-disable-next-line @typescript-eslint/require-await
  protected async signRaw(message: Uint8Array): Promise<Uint8Array> {
    if (this.#destroyed) {
      throw new KeyError('sign', 'Key has been destroyed')
    }
    const msgHash = sha256(message)
    // noble-curves v2: prehash defaults to true (applies curve hash internally).
    // We pre-hash ourselves, so disable prehash to avoid double-hashing.
    return secp256k1.sign(msgHash, this.#privateKey, { prehash: false })
  }

  /**
   * Sign a message with Keccak256 hash (EVM compatible).
   * @param message - Raw message bytes to sign
   * @returns ECDSA signature in compact format (64 bytes, r || s)
   * @throws KeyError if the key has been destroyed
   */
  // eslint-disable-next-line @typescript-eslint/require-await
  async signWithKeccak256(message: Uint8Array): Promise<Uint8Array> {
    if (this.#destroyed) {
      throw new KeyError('sign', 'Key has been destroyed')
    }
    const msgHash = keccak256(message)
    // noble-curves v2: prehash defaults to true (applies curve hash internally).
    // We pre-hash ourselves, so disable prehash to avoid double-hashing.
    return secp256k1.sign(msgHash, this.#privateKey, { prehash: false })
  }

  /**
   * Sign an EVM transaction hash with recoverable signature.
   *
   * Returns r, s, and yParity components needed for EIP-1559 transaction
   * serialization. Uses keccak256-compatible ECDSA signing.
   *
   * @param hash - 32-byte hash to sign (already hashed, no prehash applied)
   * @returns Recoverable signature components
   * @throws KeyError if the key has been destroyed
   */
  // eslint-disable-next-line @typescript-eslint/require-await
  async signEvmHash(hash: Uint8Array): Promise<RecoverableSignature> {
    if (this.#destroyed) {
      throw new KeyError('sign', 'Key has been destroyed')
    }
    if (hash.length !== 32) {
      throw new KeyError('sign', `Expected 32-byte hash, got ${hash.length} bytes`)
    }
    // noble-curves v2: format:'recovered' returns 65 bytes: recovery(1) || r(32) || s(32)
    const sig = secp256k1.sign(hash, this.#privateKey, { prehash: false, format: 'recovered' })
    const recovery = sig[0]
    if (recovery !== 0 && recovery !== 1) {
      throw new KeyError('sign', `Unexpected recovery byte: ${recovery}`)
    }
    return {
      r: sig.slice(1, 33),
      s: sig.slice(33, 65),
      yParity: recovery,
    }
  }
}
