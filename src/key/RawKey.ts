import { SHA256, Word32Array } from 'jscrypto'
import * as secp256k1 from 'secp256k1'
import { Key } from './Key'
import { SimplePublicKey } from '../core'
import { base64FromBytes, bytesFromHex } from '../util'
import keccak256 from 'keccak256'

/**
 * An implementation of the Key interfaces that uses a raw private key.
 */
export class RawKey extends Key {
  /**
   * Raw private key, in bytes.
   */
  public privateKey: Uint8Array

  constructor(privateKey: Uint8Array) {
    const publicKey = secp256k1.publicKeyCreate(privateKey, true)
    super(new SimplePublicKey(base64FromBytes(publicKey)))
    this.privateKey = privateKey
  }

  public static fromHex(key: string): RawKey {
    const hex = key.startsWith('0x') ? key.slice(2) : key
    if (hex.length !== 64) throw new Error('Invalid private key length')
    return new RawKey(bytesFromHex(hex))
  }

  // eslint-disable-next-line @typescript-eslint/require-await
  public async sign(payload: Uint8Array): Promise<Uint8Array> {
    const hash = bytesFromHex(SHA256.hash(new Word32Array(payload)).toString())
    const { signature } = secp256k1.ecdsaSign(hash, this.privateKey)
    return signature
  }

  // eslint-disable-next-line @typescript-eslint/require-await
  public async signWithKeccak256(payload: Uint8Array): Promise<Uint8Array> {
    const hash = keccak256(payload)
    const { signature } = secp256k1.ecdsaSign(
      Uint8Array.from(hash),
      this.privateKey
    )
    return signature
  }
}
