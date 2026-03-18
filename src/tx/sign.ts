/**
 * Transaction signing utilities for Initia SDK.
 *
 * Supports:
 * - SIGN_MODE_DIRECT (protobuf)
 * - SIGN_MODE_LEGACY_AMINO_JSON (canonical JSON)
 * - SIGN_MODE_EIP_191 (Ethereum personal sign)
 */

import type { Numeric } from '../types'
import { toBinary, fromBinary, create } from '@bufbuild/protobuf'
import {
  SignDocSchema,
  TxBodySchema,
  TxRawSchema,
  AuthInfoSchema,
  SignerInfoSchema,
  ModeInfoSchema,
  FeeSchema,
} from '@buf/cosmos_cosmos-sdk.bufbuild_es/cosmos/tx/v1beta1/tx_pb'
import type {
  TxBody,
  AuthInfo,
  TxRaw,
} from '@buf/cosmos_cosmos-sdk.bufbuild_es/cosmos/tx/v1beta1/tx_pb'
import { SignMode } from '@buf/cosmos_cosmos-sdk.bufbuild_es/cosmos/tx/signing/v1beta1/signing_pb'
import type { DirectSignDoc } from '../signer/types'
import type { AminoMsg } from './amino'
import { sortObject } from './amino'
import type { MultisigPublicKey, MultiSignature } from '../key/multisig'
import type { UnsignedTx } from './unsigned-tx'
import { packPubKey } from '../util/public-key'

/**
 * Options for signing a transaction.
 */
export interface SignOptions {
  /** Chain ID (e.g., 'initiation-2') */
  chainId: string
  /** Account number on chain */
  accountNumber: Numeric
  /** Account sequence (nonce) */
  sequence: Numeric
}

/**
 * Create sign bytes for SIGN_MODE_DIRECT.
 *
 * @param bodyBytes - Serialized TxBody
 * @param authInfoBytes - Serialized AuthInfo
 * @param chainId - Chain ID
 * @param accountNumber - Account number
 * @returns Sign bytes to be signed
 */
export function makeSignBytes(
  bodyBytes: Uint8Array,
  authInfoBytes: Uint8Array,
  chainId: string,
  accountNumber: Numeric
): Uint8Array {
  const signDoc = create(SignDocSchema, {
    bodyBytes,
    authInfoBytes,
    chainId,
    accountNumber: BigInt(accountNumber),
  })
  return toBinary(SignDocSchema, signDoc)
}

/**
 * Serialize an unsigned transaction (DirectSignDoc) to bytes.
 * Alias for makeSignBytes that accepts a DirectSignDoc object.
 *
 * @param doc - Unsigned transaction
 * @returns Protobuf-encoded SignDoc bytes
 */
export function serializeUnsignedTx(doc: DirectSignDoc): Uint8Array {
  return makeSignBytes(doc.bodyBytes, doc.authInfoBytes, doc.chainId, doc.accountNumber)
}

/**
 * Deserialize bytes back into an unsigned transaction (DirectSignDoc).
 *
 * @param bytes - Protobuf-encoded SignDoc bytes
 * @returns Unsigned transaction
 */
export function deserializeUnsignedTx(bytes: Uint8Array): DirectSignDoc {
  const signDoc = fromBinary(SignDocSchema, bytes)
  return {
    bodyBytes: signDoc.bodyBytes,
    authInfoBytes: signDoc.authInfoBytes,
    chainId: signDoc.chainId,
    accountNumber: signDoc.accountNumber,
  }
}

/**
 * A signed transaction document (TxRaw).
 */
export interface SignedTxDoc {
  bodyBytes: Uint8Array
  authInfoBytes: Uint8Array
  signatures: Uint8Array[]
}

/**
 * Serialize a signed transaction (TxRaw) to bytes.
 *
 * @param doc - Signed transaction
 * @returns Protobuf-encoded TxRaw bytes
 */
export function serializeSignedTx(doc: SignedTxDoc): Uint8Array {
  const txRaw = create(TxRawSchema, {
    bodyBytes: doc.bodyBytes,
    authInfoBytes: doc.authInfoBytes,
    signatures: doc.signatures,
  })
  return toBinary(TxRawSchema, txRaw)
}

/**
 * Deserialize bytes back into a signed transaction (TxRaw).
 *
 * @param bytes - Protobuf-encoded TxRaw bytes
 * @returns Signed transaction
 */
export function deserializeSignedTx(bytes: Uint8Array): SignedTxDoc {
  const txRaw = fromBinary(TxRawSchema, bytes)
  return {
    bodyBytes: txRaw.bodyBytes,
    authInfoBytes: txRaw.authInfoBytes,
    signatures: [...txRaw.signatures],
  }
}

/**
 * Standard fee structure for Amino signing.
 */
export interface StdFee {
  amount: { denom: string; amount: string }[]
  gas: string
}

/**
 * Standard sign document for SIGN_MODE_LEGACY_AMINO_JSON.
 * All fields are strings for canonical JSON serialization.
 */
export interface StdSignDoc {
  account_number: string
  chain_id: string
  fee: StdFee
  memo: string
  msgs: AminoMsg[]
  sequence: string
}

/**
 * Create a standard sign document for Amino signing.
 *
 * @param msgs - Amino-formatted messages
 * @param fee - Transaction fee
 * @param chainId - Chain ID
 * @param memo - Transaction memo
 * @param accountNumber - Account number
 * @param sequence - Account sequence
 * @returns StdSignDoc ready for canonical JSON serialization
 */
export function makeStdSignDoc(
  msgs: AminoMsg[],
  fee: StdFee,
  chainId: string,
  memo: string,
  accountNumber: Numeric,
  sequence: Numeric
): StdSignDoc {
  return {
    account_number: accountNumber.toString(),
    chain_id: chainId,
    fee,
    memo,
    msgs,
    sequence: sequence.toString(),
  }
}

/**
 * Create sign bytes for SIGN_MODE_LEGACY_AMINO_JSON.
 *
 * The sign bytes are the UTF-8 encoded canonical JSON of the StdSignDoc.
 * Canonical JSON means keys are sorted alphabetically.
 *
 * @param signDoc - Standard sign document
 * @returns UTF-8 encoded canonical JSON bytes
 */
export function makeAminoSignBytes(signDoc: StdSignDoc): Uint8Array {
  const sorted = sortObject(signDoc)
  const json = JSON.stringify(sorted)
  return new TextEncoder().encode(json)
}

/**
 * Create sign bytes for SIGN_MODE_EIP_191 (Ethereum personal sign).
 *
 * This prepends the Ethereum personal sign prefix to Amino sign bytes:
 * "\x19Ethereum Signed Message:\n" + length + message
 *
 * Used for Ledger Ethereum app compatibility.
 *
 * @param signDoc - Standard sign document
 * @returns Prefixed sign bytes for keccak256 hashing
 */
export function makeEIP191SignBytes(signDoc: StdSignDoc): Uint8Array {
  const aminoBytes = makeAminoSignBytes(signDoc)
  const prefix = `\x19Ethereum Signed Message:\n${aminoBytes.length}`
  const prefixBytes = new TextEncoder().encode(prefix)

  // Concatenate prefix + amino bytes
  const result = new Uint8Array(prefixBytes.length + aminoBytes.length)
  result.set(prefixBytes, 0)
  result.set(aminoBytes, prefixBytes.length)

  return result
}

/**
 * Build a StdFee from an UnsignedTx.
 * Converts Coin[] fee to amino format using Coin.toAmino().
 */
export function buildStdFee(tx: UnsignedTx): StdFee {
  return {
    amount: tx.fee.map(c => c.toAmino()),
    gas: tx.gasLimit.toString(),
  }
}

/**
 * Encode an UnsignedTx into bodyBytes + authInfoBytes for direct signing.
 *
 * @param tx - Unsigned transaction
 * @param pubKey - Public key bytes
 * @param algorithm - Key algorithm ('ethsecp256k1' or 'secp256k1')
 * @returns Serialized bodyBytes and authInfoBytes
 */
export function encodeTxDirect(
  tx: UnsignedTx,
  pubKey: Uint8Array,
  algorithm: 'ethsecp256k1' | 'secp256k1'
): { bodyBytes: Uint8Array; authInfoBytes: Uint8Array } {
  const txBody = create(TxBodySchema, {
    messages: tx.msgs.map(m => m.toAny()),
    memo: tx.memo,
    timeoutHeight: tx.timeoutHeight,
  })
  const bodyBytes = toBinary(TxBodySchema, txBody)

  const protoSignMode =
    tx.signMode === 'amino'
      ? SignMode.LEGACY_AMINO_JSON
      : tx.signMode === 'eip191'
        ? SignMode.EIP_191
        : SignMode.DIRECT

  const pubKeyAny = packPubKey(pubKey, algorithm)

  const signerInfo = create(SignerInfoSchema, {
    publicKey: pubKeyAny,
    modeInfo: create(ModeInfoSchema, {
      sum: {
        case: 'single',
        value: { mode: protoSignMode },
      },
    }),
    sequence: tx.sequence,
  })

  const fee = create(FeeSchema, {
    amount: tx.fee.map(c => c.toProto()),
    gasLimit: tx.gasLimit,
    payer: '',
    granter: '',
  })

  const authInfo = create(AuthInfoSchema, {
    signerInfos: [signerInfo],
    fee,
    tip: undefined,
  })
  const authInfoBytes = toBinary(AuthInfoSchema, authInfo)

  return { bodyBytes, authInfoBytes }
}

/**
 * Assemble a multisig TxRaw from its component parts.
 *
 * Creates a single SignerInfo from the multisig public key and the accumulated
 * MultiSignature's ModeInfo, then serializes body and authInfo into a TxRaw.
 * The input `authInfo` is NOT mutated — a copy is created with the new signerInfos.
 *
 * @param body - Transaction body
 * @param authInfo - Auth info (signerInfos is replaced; fee/tip preserved)
 * @param multisigPubKey - Multisig threshold public key
 * @param multiSig - Accumulated multisig signatures. Caller should verify
 *   `multiSig.isComplete()` before calling — incomplete signatures will be
 *   rejected by the chain at broadcast time.
 * @param sequence - Account sequence (nonce) for the multisig account
 * @returns TxRaw ready for broadcast
 */
export function createSignedTx(
  body: TxBody,
  authInfo: AuthInfo,
  multisigPubKey: MultisigPublicKey,
  multiSig: MultiSignature,
  sequence: Numeric
): TxRaw {
  // Build the single SignerInfo for the multisig account
  const signerInfo = create(SignerInfoSchema, {
    publicKey: multisigPubKey.packAny(),
    modeInfo: multiSig.toModeInfo(),
    sequence: BigInt(sequence),
  })

  // Create a copy of authInfo with signerInfos replaced — do NOT mutate the input
  const authInfoCopy = create(AuthInfoSchema, {
    signerInfos: [signerInfo],
    fee: authInfo.fee,
    tip: authInfo.tip,
  })

  const bodyBytes = toBinary(TxBodySchema, body)
  const authInfoBytes = toBinary(AuthInfoSchema, authInfoCopy)
  const signatures = [multiSig.toProtoBytes()]

  return create(TxRawSchema, { bodyBytes, authInfoBytes, signatures })
}
