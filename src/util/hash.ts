import { SHA256 } from 'jscrypto/SHA256'
import { RIPEMD160 } from 'jscrypto/RIPEMD160'
import { Base64 } from 'jscrypto/Base64'
import { Word32Array } from 'jscrypto'
import KECCAK256 from 'keccak256'

/**
 * Calculates the transaction hash from Amino-encoded string.
 * @param data amino-encoded string (base64)
 */
export function hashToHex(data: string): string {
  return SHA256.hash(Base64.parse(data)).toString().toUpperCase()
}

/**
 * Calculates the transaction hash from Amino-encoded string.
 * @param data raw bytes
 */
export function sha256(data: Uint8Array): Uint8Array {
  return SHA256.hash(new Word32Array(data)).toUint8Array()
}

export function keccak256(data: Uint8Array): Uint8Array {
  return KECCAK256(Buffer.from(data))
}

export function ripemd160(data: Uint8Array): Uint8Array {
  return RIPEMD160.hash(new Word32Array(data)).toUint8Array()
}
