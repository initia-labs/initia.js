/**
 * Viem bridge adapters.
 *
 * Provides bidirectional conversion between SDK key/signer types
 * and viem LocalAccount. Runtime viem dependency is limited to
 * serializeTransaction (shared with src/tx/evm.ts); all other
 * viem imports are type-only.
 *
 * keyToViemAccount: SDK RawKey -> viem LocalAccount (outbound)
 * createViemSigner: viem LocalAccount -> SDK OfflineSigner + EIP191Signer (inbound)
 */

import { secp256k1 } from '@noble/curves/secp256k1.js'
import { bytesToHex, hexToBytes } from '@noble/hashes/utils.js'
import { bech32, base64 } from '@scure/base'
import { keccak256 } from '../../util/hash'
import { hashEIP191Message, hashEIP712TypedData } from './eip-hash'
import { makeSignBytes } from '../../tx/sign'
import { packPubKey } from '../../util/public-key'
import { sortObject } from '../../tx/amino'
import { serializeTransaction } from 'viem'
import type {
  LocalAccount,
  SignableMessage,
  TypedDataDefinition,
  TransactionSerializableEIP1559,
} from 'viem'
import type { RawKey } from '../../key'
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
 * Convert an SDK RawKey into a viem-compatible LocalAccount.
 *
 * The returned account can be used with viem's `createWalletClient({ account })`,
 * `signMessage`, `signTransaction`, and `signTypedData`.
 *
 * @param key - SDK RawKey instance (must not be destroyed)
 * @returns viem LocalAccount
 * @throws if the key has been destroyed
 *
 * @example
 * ```typescript
 * import { RawKey } from 'initia.js'
 * import { keyToViemAccount } from 'initia.js/signer'
 * import { createWalletClient, http } from 'viem'
 *
 * const key = RawKey.fromHex('0x...')
 * const account = keyToViemAccount(key)
 * const client = createWalletClient({ account, transport: http(rpcUrl) })
 * ```
 */
export function keyToViemAccount(key: RawKey): LocalAccount {
  // Validate key is usable — getPrivateKeyHex() throws if destroyed
  const pkHex = key.getPrivateKeyHex()
  const pkBytes = hexToBytes(pkHex.slice(2))

  const address = key.evmAddress
  const publicKey = `0x${bytesToHex(key.publicKey)}`

  function signHash(hash: Uint8Array): `0x${string}` {
    // format: 'recovered' returns 65 bytes: recovery(1) || r(32) || s(32)
    const sig = secp256k1.sign(hash, pkBytes, {
      prehash: false,
      lowS: true,
      format: 'recovered',
    })
    if (sig.length !== 65) {
      throw new Error(`Expected 65-byte recovered signature, got ${sig.length} bytes`)
    }
    const recovery = sig[0]
    const r = bytesToHex(sig.slice(1, 33))
    const s = bytesToHex(sig.slice(33, 65))
    const v = recovery === 0 ? '1b' : '1c' // 27 or 28
    return `0x${r}${s}${v}`
  }

  return {
    address,
    publicKey,
    type: 'local',
    source: 'custom',

    // eslint-disable-next-line @typescript-eslint/require-await
    async signMessage({ message }: { message: SignableMessage }): Promise<`0x${string}`> {
      const hashHex = hashEIP191Message(message as string | { raw: Uint8Array })
      const hash = hexToBytes(hashHex.slice(2))
      return signHash(hash)
    },

    // eslint-disable-next-line @typescript-eslint/require-await
    async signTransaction(tx: TransactionSerializableEIP1559): Promise<`0x${string}`> {
      const serialized = serializeTransaction(tx)
      const hash = keccak256(hexToBytes(serialized.slice(2)))
      // format: 'recovered' returns 65 bytes: recovery(1) || r(32) || s(32)
      const sig = secp256k1.sign(hash, pkBytes, {
        prehash: false,
        lowS: true,
        format: 'recovered',
      })
      const r: `0x${string}` = `0x${bytesToHex(sig.slice(1, 33))}`
      const s: `0x${string}` = `0x${bytesToHex(sig.slice(33, 65))}`
      return serializeTransaction(tx, { r, s, yParity: sig[0] as 0 | 1 })
    },

    // eslint-disable-next-line @typescript-eslint/require-await
    async signTypedData(params: TypedDataDefinition): Promise<`0x${string}`> {
      const hashHex = hashEIP712TypedData(
        params as unknown as Parameters<typeof hashEIP712TypedData>[0]
      )
      const hash = hexToBytes(hashHex.slice(2))
      return signHash(hash)
    },
  } as LocalAccount
}

// =============================================================================
// createViemSigner: viem LocalAccount -> SDK OfflineSigner + EIP191Signer
// =============================================================================

interface CreateViemSignerOptions {
  /** Bech32 prefix (default: 'init') */
  bech32Prefix?: string
}

/**
 * Create an OfflineSigner from a viem LocalAccount.
 *
 * Accepts any viem account object (from privateKeyToAccount, mnemonicToAccount,
 * or custom accounts). Delegates signing to the account's methods.
 *
 * Requires an account with the `sign({ hash })` method (e.g., from
 * `privateKeyToAccount` or `mnemonicToAccount`). Generic LocalAccount
 * objects without `sign` are not supported for Direct/Amino signing.
 *
 * @param account - viem LocalAccount instance (must have `sign` method)
 * @param options - Bech32 prefix configuration
 * @returns OfflineSigner & EIP191Signer & EvmAddressable
 *
 * @example
 * ```typescript
 * import { privateKeyToAccount } from 'viem/accounts'
 * import { createViemSigner } from 'initia.js/signer'
 * import { createMinievmContext } from 'initia.js'
 *
 * const account = privateKeyToAccount('0x...')
 * const signer = createViemSigner(account)
 * const ctx = await createMinievmContext({ network: 'testnet', chainId: 'evm-1', signer })
 * ```
 */
export function createViemSigner(
  account: LocalAccount,
  options?: CreateViemSignerOptions
): OfflineSigner & EIP191Signer & EvmAddressable {
  const prefix = options?.bech32Prefix ?? 'init'

  if (!account.sign) {
    throw new Error(
      'viem LocalAccount must have a sign({ hash }) method. ' +
        'Use privateKeyToAccount() or mnemonicToAccount() to create a signing-capable account.'
    )
  }
  // Capture the non-nullable reference for use in closures
  const accountSign = account.sign

  // Extract public key from account.publicKey (0x-prefixed hex)
  // viem stores uncompressed keys (65 bytes, 0x04...) — compress to 33 bytes
  const rawPubKey = hexToBytes(account.publicKey.slice(2))
  const point = secp256k1.Point.fromHex(bytesToHex(rawPubKey))
  const publicKey = point.toBytes(true) // compressed 33 bytes

  // Derive bech32 address (ethsecp256k1 = keccak256 of uncompressed[1:])
  const uncompressed = point.toBytes(false).slice(1)
  const rawAddr = keccak256(uncompressed).slice(12)

  function getAddress(pfx?: string): string {
    return bech32.encode(pfx ?? prefix, bech32.toWords(rawAddr))
  }

  // Sign a keccak256 hash via viem account.sign, return 64-byte compact sig (r||s)
  async function viemSign(hash: Uint8Array): Promise<Uint8Array> {
    const hashHex: `0x${string}` = `0x${bytesToHex(hash)}`
    const sigHex = await accountSign({ hash: hashHex })
    const sigBytes = hexToBytes(sigHex.slice(2))
    if (sigBytes.length !== 65) {
      throw new Error(
        `Expected 65-byte signature from viem account.sign, got ${sigBytes.length} bytes`
      )
    }
    return sigBytes.slice(0, 64)
  }

  return {
    algorithm: 'eth_secp256k1',
    evmAddress: account.address,

    // eslint-disable-next-line @typescript-eslint/require-await
    async getPublicKey(): Promise<Uint8Array> {
      return publicKey
    },

    // eslint-disable-next-line @typescript-eslint/require-await
    async getAddress(pfx?: string): Promise<string> {
      return getAddress(pfx)
    },

    async signDirect(_signerAddress: string, signDoc: DirectSignDoc): Promise<DirectSignResponse> {
      const signBytes = makeSignBytes(
        signDoc.bodyBytes,
        signDoc.authInfoBytes,
        signDoc.chainId,
        signDoc.accountNumber
      )
      const signature = await viemSign(keccak256(signBytes))
      const pubKeyAny = packPubKey(publicKey, 'ethsecp256k1')

      return {
        signed: signDoc,
        signature: {
          pubKey: { typeUrl: pubKeyAny.typeUrl, value: pubKeyAny.value },
          signature,
        },
      }
    },

    async signAmino(_signerAddress: string, signDoc: AminoSignDoc): Promise<AminoSignResponse> {
      signDoc = sortObject(signDoc)
      const signBytes = new TextEncoder().encode(JSON.stringify(signDoc))
      const signature = await viemSign(keccak256(signBytes))

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
      const sigHex = await account.signMessage({ message: { raw: data } })
      const sigBytes = hexToBytes(sigHex.slice(2))
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
