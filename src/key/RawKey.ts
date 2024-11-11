import { SHA256, Word32Array } from 'jscrypto'
import * as secp256k1 from 'secp256k1'
import { Key } from './Key'
import { EthPublicKey, SimplePublicKey } from '../core'
import keccak256 from 'keccak256'

/**
 * RawKey is an implementation of the Key interfaces that uses a raw private key.
 */
export class RawKey extends Key {
  /**
   * Raw private key, in bytes.
   */
  public privateKey: Buffer
  /**
   * Whether to use eth pubkey
   */
  public eth: boolean

  constructor(privateKey: Buffer, eth = false) {
    const publicKey = secp256k1.publicKeyCreate(
      new Uint8Array(privateKey),
      true
    )

    if (eth) {
      super(new EthPublicKey(Buffer.from(publicKey).toString('base64')))
    } else {
      super(new SimplePublicKey(Buffer.from(publicKey).toString('base64')))
    }

    this.privateKey = privateKey
    this.eth = eth
  }

  public static fromHex(key: string): RawKey {
    const hex = key.startsWith('0x') ? key.slice(2) : key
    if (hex.length !== 64) throw new Error('Invalid private key length')
    return new RawKey(Buffer.from(hex, 'hex'))
  }

  // eslint-disable-next-line @typescript-eslint/require-await
  public async sign(payload: Buffer): Promise<Buffer> {
    if (this.eth) return this.signWithKeccak256(payload)

    const hash = Buffer.from(
      SHA256.hash(new Word32Array(payload)).toString(),
      'hex'
    )

    const { signature } = secp256k1.ecdsaSign(
      Uint8Array.from(hash),
      Uint8Array.from(this.privateKey)
    )

    return Buffer.from(signature)
  }

  // eslint-disable-next-line @typescript-eslint/require-await
  public async signWithKeccak256(payload: Buffer): Promise<Buffer> {
    const hash = keccak256(payload)

    const { signature } = secp256k1.ecdsaSign(
      Uint8Array.from(hash),
      Uint8Array.from(this.privateKey)
    )

    return Buffer.from(signature)
  }
}
