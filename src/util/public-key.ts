/**
 * PublicKey utilities for Initia SDK.
 *
 * Provides functions for:
 * - Converting public keys to addresses (secp256k1, ethsecp256k1, ed25519)
 * - Packing/unpacking public keys to/from protobuf Any
 */

import { sha256, ripemd160, keccak256 } from './hash'
import { secp256k1 } from '@noble/curves/secp256k1.js'
import { bytesToHex } from '@noble/hashes/utils.js'
import { bech32 } from '@scure/base'
import { create, fromBinary, getOption } from '@bufbuild/protobuf'
import { anyIs } from '@bufbuild/protobuf/wkt'
import { anyPack } from './any'
import { name as aminoName } from '@buf/cosmos_cosmos-sdk.bufbuild_es/amino/amino_pb'
import type { Any } from '@bufbuild/protobuf/wkt'
import { PubKeySchema as Secp256k1PubKeySchema } from '@buf/cosmos_cosmos-sdk.bufbuild_es/cosmos/crypto/secp256k1/keys_pb'
import { PubKeySchema as Ed25519PubKeySchema } from '@buf/cosmos_cosmos-sdk.bufbuild_es/cosmos/crypto/ed25519/keys_pb'
import { PubKeySchema as EthSecp256k1PubKeySchema } from '@buf/initia-labs_initia.bufbuild_es/initia/crypto/v1beta1/ethsecp256k1/keys_pb'
import { LegacyAminoPubKeySchema } from '@buf/cosmos_cosmos-sdk.bufbuild_es/cosmos/crypto/multisig/keys_pb'
import { encodeMultisigAminoPubKey } from '../key/multisig'
import { ParseError } from '../errors'

/**
 * Supported public key types.
 * - secp256k1: Cosmos-style (sha256 + ripemd160)
 * - ethsecp256k1: EVM-style (keccak256)
 * - ed25519: Validator consensus keys
 * - multisig: Threshold multisig (LegacyAminoPubKey), address derived via sha256 truncation
 */
export type PublicKeyType = 'secp256k1' | 'ethsecp256k1' | 'ed25519' | 'multisig'

/**
 * Convert public key bytes to bech32 address.
 * @param pubKey - Compressed public key bytes (33 bytes for secp256k1, 32 bytes for ed25519)
 * @param type - Public key type (default: ethsecp256k1)
 * @returns Bech32-encoded address
 */
export function pubKeyToAddress(pubKey: Uint8Array, type: PublicKeyType = 'ethsecp256k1'): string {
  switch (type) {
    case 'secp256k1':
      // Cosmos: sha256 -> ripemd160 -> bech32
      return bech32.encode('init', bech32.toWords(ripemd160(sha256(pubKey))))

    case 'ethsecp256k1': {
      // EVM: uncompress -> keccak256[12:] -> bech32
      const uncompressed = secp256k1.Point.fromHex(bytesToHex(pubKey)).toBytes(false).slice(1)
      return bech32.encode('init', bech32.toWords(keccak256(uncompressed).slice(12)))
    }

    case 'ed25519':
      // Tendermint: sha256[:20] -> bech32
      return bech32.encode('initvalcons', bech32.toWords(sha256(pubKey).slice(0, 20)))

    case 'multisig': {
      // Multisig: pubKey is serialized LegacyAminoPubKey proto bytes
      // Address derivation: sha256(aminoEncode(LegacyAminoPubKey))[:20] -> bech32
      const msg = fromBinary(LegacyAminoPubKeySchema, pubKey)
      const aminoBytes = encodeMultisigAminoPubKey(msg.threshold, msg.publicKeys)
      return bech32.encode('init', bech32.toWords(sha256(aminoBytes).slice(0, 20)))
    }
  }
}

/**
 * Pack public key bytes into protobuf Any.
 * @param pubKey - Public key bytes
 * @param type - Public key type (default: ethsecp256k1)
 * @returns Packed Any message
 */
export function packPubKey(pubKey: Uint8Array, type: PublicKeyType = 'ethsecp256k1'): Any {
  switch (type) {
    case 'secp256k1':
      return anyPack(Secp256k1PubKeySchema, create(Secp256k1PubKeySchema, { key: pubKey }))

    case 'ethsecp256k1':
      return anyPack(EthSecp256k1PubKeySchema, create(EthSecp256k1PubKeySchema, { key: pubKey }))

    case 'ed25519':
      return anyPack(Ed25519PubKeySchema, create(Ed25519PubKeySchema, { key: pubKey }))

    case 'multisig':
      // Multisig keys cannot be packed via raw bytes — use MultisigPublicKey.packAny() instead
      throw new Error('packPubKey does not support multisig: use MultisigPublicKey.packAny() instead')
  }
}

/**
 * Get the Amino type name for a public key type.
 * Reads from proto amino.name option at runtime.
 *
 * @param type - Public key type
 * @returns Amino type name (e.g., 'tendermint/PubKeySecp256k1')
 */
export function getAminoPubKeyType(type: PublicKeyType): string {
  switch (type) {
    case 'secp256k1':
      return getOption(Secp256k1PubKeySchema, aminoName) || 'tendermint/PubKeySecp256k1'
    case 'ethsecp256k1':
      return getOption(EthSecp256k1PubKeySchema, aminoName) || 'ethermint/PubKeyEthSecp256k1'
    case 'ed25519':
      return getOption(Ed25519PubKeySchema, aminoName) || 'tendermint/PubKeyEd25519'
    case 'multisig':
      return 'tendermint/PubKeyMultisigThreshold'
  }
}

/**
 * Unpack protobuf Any to public key bytes.
 * @param any - Packed Any message containing a public key
 * @returns Public key bytes and type
 * @throws Error if unknown public key type
 */
export function unpackPubKey(any: Any): { pubKey: Uint8Array; type: PublicKeyType } {
  if (anyIs(any, Secp256k1PubKeySchema)) {
    const msg = fromBinary(Secp256k1PubKeySchema, any.value)
    return { pubKey: msg.key, type: 'secp256k1' }
  }

  if (anyIs(any, EthSecp256k1PubKeySchema)) {
    const msg = fromBinary(EthSecp256k1PubKeySchema, any.value)
    return { pubKey: msg.key, type: 'ethsecp256k1' }
  }

  if (anyIs(any, Ed25519PubKeySchema)) {
    const msg = fromBinary(Ed25519PubKeySchema, any.value)
    return { pubKey: msg.key, type: 'ed25519' }
  }

  if (anyIs(any, LegacyAminoPubKeySchema)) {
    // Return raw proto bytes as pubKey — callers use pubKeyToAddress('multisig') to derive address
    return { pubKey: any.value, type: 'multisig' }
  }

  throw new ParseError('pubkey', `Unknown type: ${any.typeUrl}`)
}
