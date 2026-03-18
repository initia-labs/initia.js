/**
 * Withdrawal hash calculation for OPInit bridge.
 *
 * Computes the SHA3-256 double hash used as Merkle leaf for withdrawal verification.
 */

import { sha3_256 } from '@noble/hashes/sha3.js'

const textEncoder = new TextEncoder()

/**
 * Encode a bigint as big-endian 8 bytes.
 */
function bigintToBeBytes(value: bigint): Uint8Array {
  const buf = new Uint8Array(8)
  for (let i = 7; i >= 0; i--) {
    buf[i] = Number(value & 0xffn)
    value >>= 8n
  }
  return buf
}

/**
 * Calculate the withdrawal hash for OPInit bridge verification.
 *
 * This is a SHA3-256 double hash (Merkle leaf node format) computed from:
 * - bridgeId (8 bytes big-endian)
 * - l2Sequence (8 bytes big-endian)
 * - sha3_256(sender UTF-8) (32 bytes)
 * - sha3_256(receiver UTF-8) (32 bytes)
 * - sha3_256(denom UTF-8) (32 bytes)
 * - amount (8 bytes big-endian)
 *
 * Result = sha3_256(sha3_256(concatenation))
 *
 * @param bridgeId - Bridge ID
 * @param l2Sequence - L2 withdrawal sequence number
 * @param sender - L2 sender address
 * @param receiver - L1 receiver address
 * @param denom - Token denomination
 * @param amount - Token amount
 * @returns 32-byte withdrawal hash
 */
export function calculateWithdrawalHash(
  bridgeId: bigint,
  l2Sequence: bigint,
  sender: string,
  receiver: string,
  denom: string,
  amount: bigint
): Uint8Array {
  const parts = [
    bigintToBeBytes(bridgeId),
    bigintToBeBytes(l2Sequence),
    sha3_256(textEncoder.encode(sender)),
    sha3_256(textEncoder.encode(receiver)),
    sha3_256(textEncoder.encode(denom)),
    bigintToBeBytes(amount),
  ]

  // Concatenate all parts
  const totalLength = parts.reduce((sum, p) => sum + p.length, 0)
  const concat = new Uint8Array(totalLength)
  let offset = 0
  for (const part of parts) {
    concat.set(part, offset)
    offset += part.length
  }

  // Double hash: sha3_256(sha3_256(concat))
  return sha3_256(sha3_256(concat))
}
