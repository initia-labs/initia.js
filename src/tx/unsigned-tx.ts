/**
 * UnsignedTx class — structured transaction data ready for signing.
 *
 * Replaces the former UnsignedTx interface with a class that adds
 * multisig helper methods (getMultisigSignBytes, assembleMultisig).
 */

import type { Message } from '../msgs/types'
import type { SignModeType, SignedTx } from '../client/types'
import type { MultisigPublicKey } from '../key/multisig'
import { MultiSignature } from '../key/multisig'
import { createSignedTx, makeSignBytes } from './sign'
import { Coin } from '../core/coin'
import type { CoinLike } from '../core/coin'
import type { Any } from '@bufbuild/protobuf/wkt'
import { create, toBinary } from '@bufbuild/protobuf'
import {
  TxBodySchema,
  AuthInfoSchema,
  FeeSchema,
  SignerInfoSchema,
  ModeInfoSchema,
  TxRawSchema,
} from '@buf/cosmos_cosmos-sdk.bufbuild_es/cosmos/tx/v1beta1/tx_pb'
import { SignMode } from '@buf/cosmos_cosmos-sdk.bufbuild_es/cosmos/tx/signing/v1beta1/signing_pb'

/**
 * An individual signature contribution for a multisig transaction.
 */
export interface MultisigSignature {
  /** Zero-based index of the signer in MultisigPublicKey.publicKeys */
  index: number
  /** Raw ECDSA signature bytes (64 bytes, r || s) */
  signature: Uint8Array
}

/**
 * Unsigned transaction with all structured data needed to produce a signed transaction.
 *
 * Encoding (bodyBytes, authInfoBytes) is deferred to the signing step based on signMode.
 * For multisig workflows, use getMultisigSignBytes() and assembleMultisig().
 *
 * @example
 * ```typescript
 * // Standard single-key signing
 * const signedTx = await key.sign(unsignedTx)
 *
 * // Multisig signing
 * const signBytes = unsignedTx.getMultisigSignBytes(mpk)
 * const sig = await key.sign(signBytes)
 * const signedTx = unsignedTx.assembleMultisig(mpk, [{ index: 0, signature: sig }])
 * ```
 */
export class UnsignedTx {
  /** Messages to include in the transaction */
  readonly msgs: Message[]
  /** Signing mode determined for this transaction */
  readonly signMode: SignModeType
  /** Chain ID for signing */
  readonly chainId: string
  /** Account number for signing */
  readonly accountNumber: bigint
  /** Account sequence number */
  readonly sequence: bigint
  /** Fee for the transaction */
  readonly fee: Coin[]
  /** Gas limit */
  readonly gasLimit: bigint
  /** Memo */
  readonly memo: string
  /** Timeout block height (0 = no timeout) */
  readonly timeoutHeight: bigint
  /** Cosmos TxBody extension options */
  readonly extensionOptions: Any[]
  /** Cosmos TxBody non-critical extension options */
  readonly nonCriticalExtensionOptions: Any[]

  constructor(data: {
    msgs: Message[]
    signMode: SignModeType
    chainId: string
    accountNumber: bigint
    sequence: bigint
    fee: CoinLike[]
    gasLimit: bigint
    memo: string
    timeoutHeight?: bigint
    extensionOptions?: Any[]
    nonCriticalExtensionOptions?: Any[]
  }) {
    this.msgs = data.msgs
    this.signMode = data.signMode
    this.chainId = data.chainId
    this.accountNumber = data.accountNumber
    this.sequence = data.sequence
    this.fee = data.fee.map(c => (c instanceof Coin ? c : new Coin(c.denom, c.amount)))
    this.gasLimit = data.gasLimit
    this.memo = data.memo
    this.timeoutHeight = data.timeoutHeight ?? 0n
    this.extensionOptions = [...(data.extensionOptions ?? [])]
    this.nonCriticalExtensionOptions = [...(data.nonCriticalExtensionOptions ?? [])]
  }

  /**
   * Compute the sign bytes for multisig SIGN_MODE_DIRECT signing.
   *
   * Builds bodyBytes and authInfoBytes with the multisig public key in a
   * single-DIRECT SignerInfo (matches what the chain expects for the SignDoc),
   * then serializes them into a protobuf SignDoc.
   *
   * Each co-signer must call this method and sign the returned bytes.
   *
   * @param mpk - The multisig public key
   * @returns Protobuf-encoded SignDoc bytes to be signed by each co-signer
   */
  getMultisigSignBytes(mpk: MultisigPublicKey): Uint8Array {
    const { bodyBytes, authInfoBytes } = this._encodeForMultisigSignDoc(mpk)
    return makeSignBytes(bodyBytes, authInfoBytes, this.chainId, this.accountNumber)
  }

  /**
   * Assemble a complete signed multisig transaction from collected signatures.
   *
   * Builds a TxRaw with the multisig ModeInfo derived from the provided signatures
   * and the MultiSignature proto encoding. The caller is responsible for ensuring
   * enough signatures have been collected to meet the threshold.
   *
   * @param mpk - The multisig public key (defines threshold and signer order)
   * @param signatures - Collected signatures with their signer index
   * @returns SignedTx ready for broadcast
   */
  assembleMultisig(mpk: MultisigPublicKey, signatures: MultisigSignature[]): SignedTx {
    const ms = new MultiSignature(mpk)
    for (const { index, signature } of signatures) {
      ms.appendSignature(index, signature)
    }

    if (!ms.isComplete()) {
      throw new Error(
        `Multisig threshold not met: need ${mpk.threshold} signatures, got ${signatures.length}`
      )
    }

    const body = this._buildTxBody()
    const authInfo = this._buildFeeOnlyAuthInfo()

    const txRaw = createSignedTx(body, authInfo, mpk, ms, this.sequence)
    return { txBytes: toBinary(TxRawSchema, txRaw) }
  }

  // ── Private helpers ────────────────────────────────────────────────────────

  /**
   * Build the TxBody proto from this transaction's messages and memo.
   */
  private _buildTxBody() {
    return create(TxBodySchema, {
      messages: this.msgs.map(m => m.toAny()),
      memo: this.memo,
      timeoutHeight: this.timeoutHeight,
      extensionOptions: this.extensionOptions,
      nonCriticalExtensionOptions: this.nonCriticalExtensionOptions,
    })
  }

  private _buildFee() {
    return create(FeeSchema, {
      amount: this.fee.map(c => c.toProto()),
      gasLimit: this.gasLimit,
    })
  }

  /**
   * Build a minimal AuthInfo that carries only the fee (no signerInfos).
   * createSignedTx replaces signerInfos internally, so we only need to
   * preserve the fee for the final TxRaw.
   */
  private _buildFeeOnlyAuthInfo() {
    return create(AuthInfoSchema, { fee: this._buildFee() })
  }

  /**
   * Encode bodyBytes and authInfoBytes for the multisig SignDoc.
   *
   * Uses a single SIGN_MODE_DIRECT SignerInfo with the multisig public key.
   * This is the standard form expected by the chain when verifying individual
   * co-signer signatures against the SignDoc.
   */
  private _encodeForMultisigSignDoc(mpk: MultisigPublicKey): {
    bodyBytes: Uint8Array
    authInfoBytes: Uint8Array
  } {
    const bodyBytes = toBinary(TxBodySchema, this._buildTxBody())

    const signerInfo = create(SignerInfoSchema, {
      publicKey: mpk.packAny(),
      modeInfo: create(ModeInfoSchema, {
        sum: { case: 'single', value: { mode: SignMode.DIRECT } },
      }),
      sequence: this.sequence,
    })

    const authInfo = create(AuthInfoSchema, {
      signerInfos: [signerInfo],
      fee: this._buildFee(),
    })
    const authInfoBytes = toBinary(AuthInfoSchema, authInfo)

    return { bodyBytes, authInfoBytes }
  }
}
