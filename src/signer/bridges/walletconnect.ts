/**
 * WalletConnect -> SDK OfflineSigner bridge adapter.
 *
 * Creates an OfflineSigner from a WalletConnect SignClient session.
 * Supports Cosmos signing (cosmos_signDirect, cosmos_signAmino)
 * and optionally EIP-191 signing (personal_sign) for minievm chains.
 *
 * Uses duck typing (WalletConnectClientLike) to avoid requiring
 * @walletconnect/sign-client as a dependency.
 */

import { hexToBytes, bytesToHex } from '@noble/hashes/utils.js'
import { secp256k1 } from '@noble/curves/secp256k1.js'
import { bech32, base64 } from '@scure/base'
import { keccak256, sha256, ripemd160 } from '../../util/hash'
import { packPubKey } from '../../util/public-key'
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
 * Minimal interface matching WalletConnect SignClient's request method.
 * Users pass their own WalletConnect client — we only call request().
 */
export interface WalletConnectClientLike {
  request<T>(params: {
    topic: string
    chainId: string
    request: {
      method: string
      params: unknown[]
    }
  }): Promise<T>
}

/**
 * Options for creating a WalletConnect signer.
 */
export interface CreateWalletConnectSignerOptions {
  /** WalletConnect session topic */
  topic: string
  /** Cosmos chain ID (e.g., 'initiation-2') — used for WC namespace as cosmos:{chainId} */
  chainId: string
  /** Bech32 address prefix (default: 'init') */
  bech32Prefix?: string
  /** EVM chain ID for EIP-155 namespace — if set, uses personal_sign for EIP-191 */
  eip155ChainId?: number
  /** Pre-known public key (skip acquisition if already cached) */
  publicKey?: Uint8Array
  /** Signing algorithm (default: 'eth_secp256k1' for Initia; use 'secp256k1' for vanilla Cosmos chains) */
  algorithm?: 'eth_secp256k1' | 'secp256k1'
}

/**
 * Recover compressed public key from an EIP-191 personal_sign signature.
 *
 * Signs a fixed identification message, then uses ecrecover to derive
 * the public key. This is a one-time operation per session.
 *
 * @param client - WalletConnect client
 * @param topic - Session topic
 * @param eip155ChainId - EIP-155 chain ID
 * @param address - EVM 0x address of the signer
 * @returns Compressed public key (33 bytes)
 */
async function recoverPublicKey(
  client: WalletConnectClientLike,
  topic: string,
  eip155ChainId: number,
  address: string
): Promise<Uint8Array> {
  // Fixed identification message (same as interwovenkit)
  const message = 'Initia SDK: Verify account ownership'
  const messageHex = `0x${bytesToHex(new TextEncoder().encode(message))}`

  // Request personal_sign via WC
  const sigHex = await client.request<string>({
    topic,
    chainId: `eip155:${eip155ChainId}`,
    request: {
      method: 'personal_sign',
      params: [messageHex, address],
    },
  })

  // EIP-191 hash: keccak256("\x19Ethereum Signed Message:\n" + len + message)
  const messageBytes = new TextEncoder().encode(message)
  const prefix = `\x19Ethereum Signed Message:\n${messageBytes.length}`
  const prefixBytes = new TextEncoder().encode(prefix)
  const fullMessage = new Uint8Array(prefixBytes.length + messageBytes.length)
  fullMessage.set(prefixBytes, 0)
  fullMessage.set(messageBytes, prefixBytes.length)
  const msgHash = keccak256(fullMessage)

  // Parse signature: r(32) || s(32) || v(1)
  const sigBytes = hexToBytes(sigHex.replace(/^0x/, ''))
  if (sigBytes.length !== 65) {
    throw new Error(
      `Expected 65-byte signature from personal_sign, got ${sigBytes.length} bytes`
    )
  }

  const r = sigBytes.slice(0, 32)
  const s = sigBytes.slice(32, 64)
  const v = sigBytes[64]
  const recovery = v >= 27 ? v - 27 : v

  if (recovery !== 0 && recovery !== 1) {
    throw new Error(
      `Invalid recovery bit: ${v} (expected 0, 1, 27, or 28)`
    )
  }

  // Reconstruct compact signature (64 bytes: r || s)
  const compact = new Uint8Array(64)
  compact.set(r, 0)
  compact.set(s, 32)

  // Recover public key using noble-curves v2 API
  try {
    const recoveredPoint = secp256k1.Signature.fromBytes(compact, 'compact')
      .addRecoveryBit(recovery)
      .recoverPublicKey(msgHash)

    const compressed = recoveredPoint.toBytes(true) // compressed 33 bytes

    // Verify recovered address matches expected address
    const recoveredUncompressed = recoveredPoint.toBytes(false).slice(1)
    const recoveredAddr = `0x${bytesToHex(keccak256(recoveredUncompressed).slice(12))}`
    if (recoveredAddr.toLowerCase() !== address.toLowerCase()) {
      throw new Error(
        `Recovered address ${recoveredAddr} does not match expected ${address}. ` +
          'The wallet may have signed with a different account.'
      )
    }

    return compressed
  } catch (err) {
    if (err instanceof Error && err.message.includes('does not match')) throw err
    throw new Error(
      `Failed to recover public key from personal_sign signature: ${err instanceof Error ? err.message : String(err)}`
    )
  }
}

/**
 * Create an OfflineSigner from a WalletConnect session.
 *
 * This is an async factory because public key acquisition may require
 * a WC request (cosmos_getAccounts) or user interaction (EIP-191 ecrecover).
 *
 * Public key resolution uses a 3-tier fallback:
 * 1. Pre-provided publicKey option (fastest, no user interaction)
 * 2. cosmos_getAccounts WC RPC (no user interaction if wallet supports it)
 * 3. Ecrecover via personal_sign (requires eip155ChainId + user approval)
 *
 * @param client - WalletConnect SignClient (or any compatible client)
 * @param options - Session and chain configuration
 * @returns OfflineSigner, optionally with EIP191Signer if eip155ChainId is set
 *
 * @example
 * ```typescript
 * import { createWalletConnectSigner } from 'initia.js/signer'
 *
 * const signer = await createWalletConnectSigner(wcClient, {
 *   topic: session.topic,
 *   chainId: 'initiation-2',
 *   eip155ChainId: 2124225178762456,
 * })
 *
 * const ctx = await createInitiaContext({ network: 'testnet', signer })
 * ```
 */
export async function createWalletConnectSigner(
  client: WalletConnectClientLike,
  options: CreateWalletConnectSignerOptions & { eip155ChainId: number }
): Promise<OfflineSigner & EIP191Signer & EvmAddressable>
export async function createWalletConnectSigner(
  client: WalletConnectClientLike,
  options: CreateWalletConnectSignerOptions
): Promise<OfflineSigner>
export async function createWalletConnectSigner(
  client: WalletConnectClientLike,
  options: CreateWalletConnectSignerOptions
): Promise<OfflineSigner & Partial<EIP191Signer & EvmAddressable>> {
  const prefix = options.bech32Prefix ?? 'init'
  const cosmosChainId = `cosmos:${options.chainId}`
  const algo = options.algorithm ?? 'eth_secp256k1'

  // Validate early — before any WC requests that may trigger user popups
  if (options.eip155ChainId && algo !== 'eth_secp256k1') {
    throw new Error(
      `eip155ChainId requires algorithm 'eth_secp256k1', got '${algo}'. ` +
        'EVM signing uses keccak256-based addresses which are incompatible with secp256k1 (ripemd160) derivation.'
    )
  }

  // Resolve public key (3-tier fallback)
  let publicKey: Uint8Array

  if (options.publicKey) {
    // Tier 1: Pre-provided
    publicKey = options.publicKey
  } else {
    // Tier 2: cosmos_getAccounts (works for both EVM and Cosmos-only chains)
    // Some wallets (EVM-only) may reject this method — catch and fall through
    let accounts: Array<{ address: string; algo: string; pubkey: string }> = []
    try {
      accounts = await client.request<typeof accounts>({
        topic: options.topic,
        chainId: cosmosChainId,
        request: { method: 'cosmos_getAccounts', params: [] },
      })
    } catch {
      // Wallet does not support cosmos_getAccounts — fall through to Tier 3
    }

    if (accounts.length > 0 && accounts[0].pubkey) {
      publicKey = base64.decode(accounts[0].pubkey)
    } else if (options.eip155ChainId) {
      // Tier 3: Ecrecover via personal_sign
      const evmAccounts = await client.request<Array<string>>({
        topic: options.topic,
        chainId: `eip155:${options.eip155ChainId}`,
        request: { method: 'eth_accounts', params: [] },
      })

      if (evmAccounts.length === 0) {
        throw new Error(
          'Public key acquisition failed. ' +
            'cosmos_getAccounts returned no pubkey and no EVM accounts available for ecrecover. ' +
            'Provide publicKey option directly.'
        )
      }

      publicKey = await recoverPublicKey(
        client, options.topic, options.eip155ChainId, evmAccounts[0]
      )
    } else {
      throw new Error(
        'No accounts found in WalletConnect session. ' +
          'Provide publicKey option or ensure the wallet supports cosmos_getAccounts.'
      )
    }
  }

  // Derive bech32 address from public key
  let rawAddr: Uint8Array

  if (algo === 'eth_secp256k1') {
    // EVM-style: keccak256(uncompressed[1:])[12:]
    const point = secp256k1.Point.fromHex(bytesToHex(publicKey))
    const uncompressed = point.toBytes(false).slice(1)
    rawAddr = keccak256(uncompressed).slice(12)
  } else {
    // Cosmos-style: ripemd160(sha256(compressed))
    rawAddr = ripemd160(sha256(publicKey))
  }

  function getAddress(pfx?: string): string {
    return bech32.encode(pfx ?? prefix, bech32.toWords(rawAddr))
  }

  // Shared signing methods (Cosmos)
  async function signDirect(signerAddress: string, signDoc: DirectSignDoc): Promise<DirectSignResponse> {
    const response = await client.request<{
      signature: { signature: string; pub_key: { type: string; value: string } }
      signed: {
        bodyBytes: string // base64
        authInfoBytes: string // base64
        chainId: string
        accountNumber: string
      }
    }>({
      topic: options.topic,
      chainId: cosmosChainId,
      request: {
        method: 'cosmos_signDirect',
        params: [
          {
            signerAddress,
            signDoc: {
              bodyBytes: base64.encode(signDoc.bodyBytes),
              authInfoBytes: base64.encode(signDoc.authInfoBytes),
              chainId: signDoc.chainId,
              accountNumber: signDoc.accountNumber.toString(),
            },
          },
        ],
      },
    })

    return {
      signed: {
        bodyBytes: base64.decode(response.signed.bodyBytes),
        authInfoBytes: base64.decode(response.signed.authInfoBytes),
        chainId: response.signed.chainId,
        accountNumber: BigInt(response.signed.accountNumber),
      },
      signature: {
        pubKey: (() => {
          // If the wallet returns a proto typeUrl, use it directly
          if (response.signature.pub_key.type.startsWith('/')) {
            return {
              typeUrl: response.signature.pub_key.type,
              value: base64.decode(response.signature.pub_key.value),
            }
          }
          // Otherwise, use packPubKey with the configured algorithm
          const pkType = algo === 'eth_secp256k1' ? 'ethsecp256k1' : 'secp256k1' as const
          const pk = packPubKey(publicKey, pkType)
          return { typeUrl: pk.typeUrl, value: pk.value }
        })(),
        signature: base64.decode(response.signature.signature),
      },
    }
  }

  async function signAmino(signerAddress: string, signDoc: AminoSignDoc): Promise<AminoSignResponse> {
    const response = await client.request<{
      signature: { signature: string; pub_key: { type: string; value: string } }
      signed: AminoSignDoc
    }>({
      topic: options.topic,
      chainId: cosmosChainId,
      request: {
        method: 'cosmos_signAmino',
        params: [
          {
            signerAddress,
            signDoc,
          },
        ],
      },
    })

    return {
      signed: response.signed,
      signature: {
        pub_key: response.signature.pub_key,
        signature: response.signature.signature,
      },
    }
  }

  // Build the signer object in one shot — no post-construction mutation
  const base = {
    algorithm: algo,
    // eslint-disable-next-line @typescript-eslint/require-await
    async getPublicKey(): Promise<Uint8Array> { return publicKey },
    // eslint-disable-next-line @typescript-eslint/require-await
    async getAddress(pfx?: string): Promise<string> { return getAddress(pfx) },
    signDirect,
    signAmino,
  } as const

  if (options.eip155ChainId) {
    const evmChainId = options.eip155ChainId
    const evmAddress: `0x${string}` = `0x${bytesToHex(rawAddr)}`

    return {
      ...base,
      evmAddress,
      async signPersonal(data: Uint8Array): Promise<Uint8Array> {
        const dataHex = `0x${bytesToHex(data)}`
        const sigHex = await client.request<string>({
          topic: options.topic,
          chainId: `eip155:${evmChainId}`,
          request: {
            method: 'personal_sign',
            params: [dataHex, evmAddress],
          },
        })

        // External wallet returns r(32) || s(32) || v(1) — strip v
        const sigBytes = hexToBytes(sigHex.replace(/^0x/, ''))
        if (sigBytes.length !== 65) {
          throw new Error(`Expected 65-byte signature from personal_sign, got ${sigBytes.length} bytes`)
        }
        const v = sigBytes[64]
        if (v !== 0 && v !== 1 && v !== 27 && v !== 28) {
          throw new Error(`Unexpected recovery byte from personal_sign: ${v}`)
        }
        return sigBytes.slice(0, 64)
      },
    }
  }

  return base
}
