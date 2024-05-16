import { SHA256, Word32Array } from 'jscrypto';
import * as secp256k1 from 'secp256k1';
import { Key } from './Key';
import { SimplePublicKey } from '../core';
import keccak256 from 'keccak256';

/**
 * An implementation of the Key interfaces that uses a raw private key.
 */
export class RawKey extends Key {
  /**
   * Raw private key, in bytes.
   */
  public privateKey: Buffer;

  constructor(privateKey: Buffer) {
    const publicKey = secp256k1.publicKeyCreate(
      new Uint8Array(privateKey),
      true
    );
    super(new SimplePublicKey(Buffer.from(publicKey).toString('base64')));
    this.privateKey = privateKey;
  }

  public static fromHex(key: string): RawKey {
    const hex = key.startsWith('0x') ? key.slice(2) : key;
    if (hex.length !== 64) throw new Error('Invalid private key length');
    return new RawKey(Buffer.from(hex, 'hex'));
  }

  public async sign(payload: Buffer): Promise<Buffer> {
    const hash = Buffer.from(
      SHA256.hash(new Word32Array(payload)).toString(),
      'hex'
    );

    const { signature } = secp256k1.ecdsaSign(
      Uint8Array.from(hash),
      Uint8Array.from(this.privateKey)
    );

    return Buffer.from(signature);
  }

  public async signWithKeccak256(payload: Buffer): Promise<Buffer> {
    const hash = keccak256(payload);

    const { signature } = secp256k1.ecdsaSign(
      Uint8Array.from(hash),
      Uint8Array.from(this.privateKey)
    );

    return Buffer.from(signature);
  }
}
