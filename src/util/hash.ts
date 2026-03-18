/**
 * Hash utilities for Cosmos/EVM address derivation and transaction signing.
 *
 * Re-exports from @noble/hashes for consistency and documentation.
 * - sha256: Used for Cosmos address derivation and transaction hashing
 * - ripemd160: Used in Bitcoin-style address derivation (sha256 + ripemd160)
 * - keccak256: Used for EVM address derivation and EIP-191 signing
 */

export { sha256 } from '@noble/hashes/sha2.js'
export { ripemd160 } from '@noble/hashes/legacy.js'
export { keccak_256 as keccak256 } from '@noble/hashes/sha3.js'
