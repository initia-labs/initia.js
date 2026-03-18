/**
 * ethers.js Signer -> SDK OfflineSigner bridge adapter.
 *
 * Uses duck typing (EthersSignerLike interface) to avoid
 * requiring ethers as a dependency. Users must install ethers
 * themselves if they want to use this adapter.
 */

import { hexToBytes, bytesToHex } from '@noble/hashes/utils.js'
import { secp256k1 } from '@noble/curves/secp256k1.js'
import { bech32, base64 } from '@scure/base'
import { keccak256 } from '../../util/hash'
import { makeSignBytes } from '../../tx/sign'
import { packPubKey } from '../../util/public-key'
import { sortObject } from '../../tx/amino'
import type {
  OfflineSigner,
  DirectSignDoc,
  DirectSignResponse,
  AminoSignDoc,
  AminoSignResponse,
  EIP191Signer,
  EvmAddressable,
} from '../types'

/**
 * Minimal interface matching ethers.js Signer's key methods.
 * Users pass a real ethers.Signer — we only access these methods.
 */
export interface EthersSignerLike {
  /** Sign a raw message (ethers handles EIP-191 prefix wrapping) */
  signMessage(message: Uint8Array): Promise<string>
  /** The SigningKey with compressedPublicKey and raw sign (ethers v6 Wallet) */
  signingKey: {
    compressedPublicKey: string
    sign(digest: Uint8Array): { r: string; s: string; v: number }
  }
}

interface CreateEthersSignerOptions {
  bech32Prefix?: string
}

/**
 * Create an OfflineSigner from an ethers.js Signer.
 *
 * Requires ethers v6 Wallet (must have signingKey with compressedPublicKey
 * and synchronous sign method). Abstract Signers without local key material
 * are not supported.
 *
 * @param ethersSigner - ethers.js Wallet instance (must have signingKey)
 * @param options - Bech32 prefix configuration
 * @returns OfflineSigner & EIP191Signer & EvmAddressable
 *
 * @example
 * ```typescript
 * import { ethers } from 'ethers'
 * import { createEthersSigner } from 'initia.js/signer'
 * import { createMinievmContext } from 'initia.js'
 *
 * const wallet = new ethers.Wallet('0x...')
 * const signer = createEthersSigner(wallet)
 * const ctx = await createMinievmContext({ network: 'testnet', chainId: 'evm-1', signer })
 * ```
 */
export function createEthersSigner(
  ethersSigner: EthersSignerLike,
  options?: CreateEthersSignerOptions
): OfflineSigner & EIP191Signer & EvmAddressable {
  const prefix = options?.bech32Prefix ?? 'init'

  if (!ethersSigner.signingKey) {
    throw new Error(
      'ethers Signer must have a signingKey property. ' +
        'Use ethers.Wallet (not JsonRpcSigner or AbstractSigner) to create a signing-capable signer.'
    )
  }
  const signingKey = ethersSigner.signingKey
  const publicKey = hexToBytes(signingKey.compressedPublicKey.replace(/^0x/, ''))

  // Derive bech32 address
  const point = secp256k1.Point.fromHex(bytesToHex(publicKey))
  const uncompressed = point.toBytes(false).slice(1)
  const rawAddr = keccak256(uncompressed).slice(12)

  // Cache EVM address
  const evmAddr: `0x${string}` = `0x${bytesToHex(rawAddr)}`

  function getAddress(pfx?: string): string {
    return bech32.encode(pfx ?? prefix, bech32.toWords(rawAddr))
  }

  function signHash(hash: Uint8Array): Uint8Array {
    const sig = signingKey.sign(hash)
    if (typeof sig.r !== 'string' || typeof sig.s !== 'string') {
      throw new Error(
        'ethers signingKey.sign() returned unexpected format. ' +
          'Expected { r: string, s: string, v: number }.'
      )
    }
    // ethers v6 SigningKey.sign returns { r, s, v } with 0x-prefixed hex
    // Pad to 32 bytes to handle legitimate short r/s values
    const rHex = sig.r.replace(/^0x/, '').padStart(64, '0')
    const sHex = sig.s.replace(/^0x/, '').padStart(64, '0')
    const r = hexToBytes(rHex)
    const s = hexToBytes(sHex)
    const result = new Uint8Array(64)
    result.set(r, 0)
    result.set(s, 32)
    return result
  }

  return {
    algorithm: 'eth_secp256k1',
    evmAddress: evmAddr,

    // eslint-disable-next-line @typescript-eslint/require-await
    async getPublicKey(): Promise<Uint8Array> {
      return publicKey
    },

    // eslint-disable-next-line @typescript-eslint/require-await
    async getAddress(pfx?: string): Promise<string> {
      return getAddress(pfx)
    },

    // eslint-disable-next-line @typescript-eslint/require-await
    async signDirect(_signerAddress: string, signDoc: DirectSignDoc): Promise<DirectSignResponse> {
      const signBytes = makeSignBytes(
        signDoc.bodyBytes,
        signDoc.authInfoBytes,
        signDoc.chainId,
        signDoc.accountNumber
      )
      const hash = keccak256(signBytes)
      const signature = signHash(hash)
      const pubKeyAny = packPubKey(publicKey, 'ethsecp256k1')

      return {
        signed: signDoc,
        signature: {
          pubKey: { typeUrl: pubKeyAny.typeUrl, value: pubKeyAny.value },
          signature,
        },
      }
    },

    // eslint-disable-next-line @typescript-eslint/require-await
    async signAmino(_signerAddress: string, signDoc: AminoSignDoc): Promise<AminoSignResponse> {
      signDoc = sortObject(signDoc)
      const signBytes = new TextEncoder().encode(JSON.stringify(signDoc))
      const hash = keccak256(signBytes)
      const signature = signHash(hash)

      return {
        signed: signDoc,
        signature: {
          pub_key: {
            type: 'tendermint/PubKeyEthSecp256k1',
            value: base64.encode(publicKey),
          },
          signature: base64.encode(signature),
        },
      }
    },

    async signPersonal(data: Uint8Array): Promise<Uint8Array> {
      const sigHex = await ethersSigner.signMessage(data)
      const sigBytes = hexToBytes(sigHex.replace(/^0x/, ''))
      if (sigBytes.length !== 65) {
        throw new Error(`Expected 65-byte signature from signMessage, got ${sigBytes.length} bytes`)
      }
      const v = sigBytes[64]
      if (v !== 0 && v !== 1 && v !== 27 && v !== 28) {
        throw new Error(`Unexpected recovery byte from signMessage: ${v}`)
      }
      return sigBytes.slice(0, 64)
    },
  }
}
