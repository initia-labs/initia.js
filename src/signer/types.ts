/**
 * Signer interface definitions for external key management.
 *
 * These interfaces allow integration with various signing backends:
 * - Hardware wallets (Ledger)
 * - Browser extensions (Keplr, Leap)
 * - Mobile wallets (WalletConnect)
 * - OS keyrings (macOS Keychain, Linux Secret Service)
 * - Cloud KMS (AWS KMS, HashiCorp Vault)
 */

import type { SignModeType } from '../client/types'

/**
 * Supported signing algorithms
 *
 * - 'eth_secp256k1': Ethereum-style secp256k1 (keccak256 address derivation) - Initia default
 * - 'secp256k1': Cosmos-style secp256k1 (ripemd160(sha256) address derivation)
 */
export type SigningAlgorithm = 'eth_secp256k1' | 'secp256k1'

/**
 * Basic signer interface for identity and public key access.
 *
 * All external key stores and hardware wallets implement this interface.
 * Signing is delegated to protocol-specific sub-interfaces
 * (DirectSigner, AminoSigner) rather than raw byte signing.
 *
 * @example
 * ```typescript
 * const signer: Signer = await LedgerSigner.connect()
 *
 * const pubKey = await signer.getPublicKey()
 * const address = await signer.getAddress('init')
 * ```
 */
export interface Signer {
  /**
   * The signing algorithm used by this signer.
   */
  readonly algorithm: SigningAlgorithm

  /**
   * Preferred sign mode hint for auto-detection.
   *
   * When set, `ChainContext.defaultSignMode()` uses this instead of
   * duck-typing fallback. Useful for signers that implement multiple
   * signing interfaces but only support a subset at runtime
   * (e.g. LedgerKey: Ethereum app → 'eip191', Cosmos app → 'amino').
   */
  readonly preferredSignMode?: SignModeType

  /**
   * Get the public key (compressed 33-byte secp256k1 format).
   */
  getPublicKey(): Promise<Uint8Array>

  /**
   * Get the bech32 address.
   * @param prefix - Address prefix (default: 'init')
   */
  getAddress(prefix?: string): Promise<string>
}

/**
 * SignDoc for Cosmos SDK Direct signing (Protobuf).
 */
export interface DirectSignDoc {
  /** Protobuf-encoded TxBody */
  bodyBytes: Uint8Array
  /** Protobuf-encoded AuthInfo */
  authInfoBytes: Uint8Array
  /** Chain identifier */
  chainId: string
  /** Account number */
  accountNumber: bigint
}

/**
 * Result of Direct signing.
 */
export interface DirectSignResponse {
  /** The signed document (may be modified by the signer) */
  signed: DirectSignDoc
  /** The signature with public key */
  signature: {
    pubKey: {
      typeUrl: string
      value: Uint8Array
    }
    signature: Uint8Array
  }
}

/**
 * Cosmos SDK Direct signing support (Protobuf encoding).
 *
 * This is the modern signing method used by Cosmos SDK v0.40+.
 * The signer signs the Protobuf-encoded SignDoc directly.
 *
 * @example
 * ```typescript
 * const signer: DirectSigner = await KeplrSigner.connect('initiation-2')
 *
 * const response = await signer.signDirect(address, {
 *   bodyBytes: txBody.toBinary(),
 *   authInfoBytes: authInfo.toBinary(),
 *   chainId: 'initiation-2',
 *   accountNumber: 12345n,
 * })
 * ```
 */
export interface DirectSigner extends Signer {
  /**
   * Sign a SignDoc directly (Protobuf encoding).
   *
   * @param signerAddress - The signer's bech32 address
   * @param signDoc - The document to sign
   * @returns The signed document and signature
   */
  signDirect(signerAddress: string, signDoc: DirectSignDoc): Promise<DirectSignResponse>
}

/**
 * Amino fee structure.
 */
export interface AminoFee {
  amount: Array<{ denom: string; amount: string }>
  gas: string
  payer?: string
  granter?: string
}

/**
 * Amino message structure.
 */
export interface AminoMsg {
  type: string
  value: Record<string, unknown>
}

/**
 * SignDoc for Cosmos SDK Amino signing (JSON).
 */
export interface AminoSignDoc {
  chain_id: string
  account_number: string
  sequence: string
  fee: AminoFee
  msgs: AminoMsg[]
  memo: string
}

/**
 * Result of Amino signing.
 */
export interface AminoSignResponse {
  /** The signed document (may be modified by the signer) */
  signed: AminoSignDoc
  /** The signature with public key */
  signature: {
    pub_key: {
      type: string
      value: string
    }
    signature: string
  }
}

/**
 * Cosmos SDK Amino signing support (JSON encoding, legacy).
 *
 * This is the legacy signing method used by older Cosmos SDK versions.
 * Some wallets and hardware devices only support Amino signing.
 *
 * @example
 * ```typescript
 * const signer: AminoSigner = await LedgerSigner.connect()
 *
 * const response = await signer.signAmino(address, {
 *   chain_id: 'initiation-2',
 *   account_number: '12345',
 *   sequence: '0',
 *   fee: { amount: [{ denom: 'uinit', amount: '1000' }], gas: '200000' },
 *   msgs: [{ type: 'cosmos-sdk/MsgSend', value: { ... } }],
 *   memo: '',
 * })
 * ```
 */
export interface AminoSigner extends Signer {
  /**
   * Sign an Amino JSON document.
   *
   * @param signerAddress - The signer's bech32 address
   * @param signDoc - The Amino document to sign
   * @returns The signed document and signature
   */
  signAmino(signerAddress: string, signDoc: AminoSignDoc): Promise<AminoSignResponse>
}

/**
 * Combined signer supporting both Direct and Amino signing.
 *
 * Most modern wallets (Keplr, Leap) implement this interface,
 * allowing applications to choose the signing method based on
 * message compatibility.
 *
 * @example
 * ```typescript
 * const signer: OfflineSigner = await KeplrSigner.connect('initiation-2')
 *
 * // Use Direct signing for modern messages
 * const directResponse = await signer.signDirect(address, directSignDoc)
 *
 * // Use Amino signing for legacy compatibility
 * const aminoResponse = await signer.signAmino(address, aminoSignDoc)
 * ```
 */
export interface OfflineSigner extends DirectSigner, AminoSigner {}

/**
 * Type guard to check if a signer supports Direct signing.
 */
export function isDirectSigner(signer: Signer): signer is DirectSigner {
  return 'signDirect' in signer && typeof (signer as DirectSigner).signDirect === 'function'
}

/**
 * Type guard to check if a signer supports Amino signing.
 */
export function isAminoSigner(signer: Signer): signer is AminoSigner {
  return 'signAmino' in signer && typeof (signer as AminoSigner).signAmino === 'function'
}

/**
 * Type guard to check if a signer supports both Direct and Amino signing.
 */
export function isOfflineSigner(signer: Signer): signer is OfflineSigner {
  return isDirectSigner(signer) && isAminoSigner(signer)
}

/**
 * Capability interface for EIP-191 personal signing.
 *
 * Duck-typed interface — any object with a `signPersonal` method qualifies.
 * This avoids forcing external signers (MetaMask, WalletConnect) to implement
 * a specific class hierarchy.
 *
 * @example
 * ```typescript
 * if (isEIP191Signer(signer)) {
 *   const sig = await signer.signPersonal(aminoSignBytes)
 * }
 * ```
 */
export interface EIP191Signer {
  signPersonal(data: Uint8Array): Promise<Uint8Array>
}

/**
 * Type guard to check if an object supports EIP-191 personal signing.
 */
export function isEIP191Signer(signer: unknown): signer is EIP191Signer {
  return signer != null && typeof (signer as EIP191Signer).signPersonal === 'function'
}

/**
 * Capability interface for EVM 0x address access.
 *
 * Duck-typed interface — any object with an `evmAddress` property qualifies.
 * Bridge adapters for Ethereum wallets naturally provide this.
 */
export interface EvmAddressable {
  readonly evmAddress: `0x${string}`
}

/**
 * Type guard to check if an object provides an EVM address.
 */
export function isEvmAddressable(obj: unknown): obj is EvmAddressable {
  return (
    obj != null &&
    typeof (obj as EvmAddressable).evmAddress === 'string' &&
    (obj as EvmAddressable).evmAddress.startsWith('0x')
  )
}

/**
 * Recoverable ECDSA signature for EVM transactions.
 */
export interface RecoverableSignature {
  readonly r: Uint8Array
  readonly s: Uint8Array
  readonly yParity: 0 | 1
}

/**
 * Capability interface for EVM transaction signing.
 *
 * Duck-typed interface — any object with `evmAddress` and `signEvmHash`
 * qualifies. RawKey/MnemonicKey implement this natively.
 * External signers (viem, ethers) can also implement it.
 *
 * @example
 * ```typescript
 * if (isEvmTxSigner(signer)) {
 *   const { r, s, yParity } = await signer.signEvmHash(txHash)
 * }
 * ```
 */
export interface EvmTxSigner extends EvmAddressable {
  /**
   * Sign a pre-hashed EVM transaction digest.
   * @param hash - 32-byte keccak256 hash of the serialized unsigned transaction
   * @returns Recoverable ECDSA signature components
   */
  signEvmHash(hash: Uint8Array): Promise<RecoverableSignature>
}

/**
 * Type guard to check if an object supports EVM transaction signing.
 */
export function isEvmTxSigner(obj: unknown): obj is EvmTxSigner {
  return isEvmAddressable(obj) && typeof (obj as EvmTxSigner).signEvmHash === 'function'
}
