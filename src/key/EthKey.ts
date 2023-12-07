import * as secp256k1 from 'secp256k1';
import { Key } from './Key';
import { EthPublicKey } from '../core';
import keccak256 from 'keccak256';

/**
 * An implementation of the Key interfaces that uses a raw private key.
 */
export class EthKey extends Key {
  /**
   * Raw private key, in bytes.
   */
  public privateKey: Buffer;

  constructor(privateKey: Buffer) {
    const publicKey = secp256k1.publicKeyCreate(
      new Uint8Array(privateKey),
      true
    );
    super(new EthPublicKey(Buffer.from(publicKey).toString('base64')));
    this.privateKey = privateKey;
  }

  public ecdsaSign(payload: Buffer): { signature: Uint8Array; recid: number } {
    const hash = keccak256(payload);
    return secp256k1.ecdsaSign(
      Uint8Array.from(hash),
      Uint8Array.from(this.privateKey)
    );
  }

  public async sign(payload: Buffer): Promise<Buffer> {
    const { signature } = this.ecdsaSign(payload);
    return Buffer.from(signature);
  }
}
