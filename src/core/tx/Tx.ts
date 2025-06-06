import {
  PublicKey,
  SimplePublicKey,
  LegacyAminoMultisigPublicKey,
} from '../PublicKey'
import { Any } from '@initia/initia.proto/google/protobuf/any'
import {
  SignMode as SignMode_pb,
  signModeFromJSON,
  signModeToJSON,
} from '@initia/initia.proto/cosmos/tx/signing/v1beta1/signing'
import {
  Tx as Tx_pb,
  TxBody as TxBody_pb,
  SignerInfo as SignerInfo_pb,
  ModeInfo as ModeInfo_pb,
  AuthInfo as AuthInfo_pb,
  ModeInfo_Single as ModeInfoSingle_pb,
  ModeInfo_Multi as ModeInfoMulti_pb,
} from '@initia/initia.proto/cosmos/tx/v1beta1/tx'
import { CompactBitArray } from './CompactBitArray'
import { Msg } from '../Msg'
import { Fee } from './Fee'
import { SignatureV2 } from './SignatureV2'
import { SignerData } from '../../client'

/**
 * Tx is the standard type used for broadcasting transactions.
 */
export class Tx {
  /**
   * @param body the processable content of the transaction
   * @param auth_info the authorization related content of the transaction (signers, signer modes, fee)
   * @param signatures list of signatures that matches the length and order of signer_infos
   */
  constructor(
    public body: TxBody,
    public auth_info: AuthInfo,
    public signatures: string[]
  ) {}

  public static fromAmino(data: Tx.Amino): Tx {
    const signatures = data.value.signatures.map(SignatureV2.fromAmino)

    return new Tx(
      new TxBody(
        data.value.msg.map(Msg.fromAmino),
        data.value.memo,
        parseInt(data.value.timeout_height)
      ),
      new AuthInfo([], Fee.fromAmino(data.value.fee)),
      signatures.map((s) => s.data.single?.signature ?? '')
    )
  }

  public static fromData(data: Tx.Data): Tx {
    return new Tx(
      TxBody.fromData(data.body),
      AuthInfo.fromData(data.auth_info),
      data.signatures
    )
  }

  public toData(): Tx.Data {
    return {
      body: this.body.toData(),
      auth_info: this.auth_info.toData(),
      signatures: this.signatures,
    }
  }

  public static unpackAny(anyProto: Any): Tx {
    return this.fromProto(Tx_pb.decode(anyProto.value))
  }

  public static fromProto(proto: Tx.Proto): Tx {
    return new Tx(
      TxBody.fromProto(proto.body as TxBody_pb),
      AuthInfo.fromProto(proto.authInfo as AuthInfo_pb),
      proto.signatures.map((sig) => Buffer.from(sig).toString('base64'))
    )
  }

  public toProto(): Tx.Proto {
    return Tx_pb.fromPartial({
      body: this.body.toProto(),
      authInfo: this.auth_info.toProto(),
      signatures: this.signatures.map((s) => Buffer.from(s, 'base64')),
    })
  }

  public toBytes(): Uint8Array {
    return Tx_pb.encode(this.toProto()).finish()
  }

  public static fromBuffer(buf: Buffer): Tx {
    return Tx.fromProto(Tx_pb.decode(buf))
  }

  public appendEmptySignatures(signers: SignerData[]) {
    signers.forEach((signer) => {
      let signerInfo: SignerInfo
      if (signer.publicKey) {
        if (signer.publicKey instanceof LegacyAminoMultisigPublicKey) {
          signerInfo = new SignerInfo(
            signer.publicKey,
            signer.sequenceNumber,
            new ModeInfo(
              new ModeInfo.Multi(
                CompactBitArray.fromBits(signer.publicKey.pubkeys.length),
                []
              )
            )
          )
        } else {
          signerInfo = new SignerInfo(
            signer.publicKey,
            signer.sequenceNumber,
            new ModeInfo(
              new ModeInfo.Single(ModeInfo.SignMode.SIGN_MODE_DIRECT)
            )
          )
        }
      } else {
        signerInfo = new SignerInfo(
          new SimplePublicKey(''),
          signer.sequenceNumber,
          new ModeInfo(new ModeInfo.Single(ModeInfo.SignMode.SIGN_MODE_DIRECT))
        )
      }

      this.auth_info.signer_infos.push(signerInfo)
      this.signatures.push('')
    })
  }

  public clearSignatures() {
    this.auth_info.signer_infos = []
    this.signatures = []
  }

  public appendSignatures(signatures: SignatureV2[]) {
    for (const signature of signatures) {
      const [modeInfo, sigBytes] = signature.data.toModeInfoAndSignature()

      this.signatures.push(Buffer.from(sigBytes).toString('base64'))
      this.auth_info.signer_infos.push(
        new SignerInfo(signature.public_key, signature.sequence, modeInfo)
      )
    }
  }
}

export namespace Tx {
  export interface Amino {
    type: 'cosmos-sdk/StdTx'
    value: {
      msg: Msg.Amino[]
      fee: Fee.Amino
      signatures: SignatureV2.Amino[]
      memo: string
      timeout_height: string
    }
  }

  export interface Data {
    body: TxBody.Data
    auth_info: AuthInfo.Data
    signatures: string[]
  }
  export type Proto = Tx_pb
}

/**
 * TxBody is the body of a transaction that all signers sign over.
 */
export class TxBody {
  /**
   * @param messages list of messages to be executed
   * @param memo any arbitrary note/comment to be added to the transaction
   * @param timeout_height the block height after which this transaction will not be processed by the chain
   */
  constructor(
    public messages: Msg[],
    public memo?: string,
    public timeout_height?: number
  ) {}

  public static fromData(data: TxBody.Data): TxBody {
    return new TxBody(
      data.messages.map(Msg.fromData),
      data.memo,
      parseInt(data.timeout_height)
    )
  }

  public toData(): TxBody.Data {
    return {
      memo: this.memo ?? '',
      messages: this.messages.map((m) => m.toData()),
      timeout_height: (this.timeout_height ?? 0).toFixed(),
    }
  }

  public static fromProto(proto: TxBody.Proto): TxBody {
    return new TxBody(
      proto.messages.map(Msg.fromProto),
      proto.memo,
      Number(proto.timeoutHeight)
    )
  }

  public toProto(): TxBody.Proto {
    return TxBody_pb.fromPartial({
      memo: this.memo,
      messages: this.messages.map((m) => m.packAny()),
      timeoutHeight: this.timeout_height
        ? BigInt(this.timeout_height)
        : undefined,
    })
  }

  public toBytes(): Uint8Array {
    return TxBody_pb.encode(this.toProto()).finish()
  }
}

export namespace TxBody {
  export interface Data {
    messages: Msg.Data[]
    memo: string
    timeout_height: string
  }
  export type Proto = TxBody_pb
}

/**
 * AuthInfo describes the fee and signer modes that are used to sign a transaction.
 */
export class AuthInfo {
  /**
   * @param signer_infos the signing modes for the required signers
   * @param fee the fee and gas limit for the transaction
   */
  constructor(
    public signer_infos: SignerInfo[],
    public fee: Fee
  ) {}

  public static fromData(data: AuthInfo.Data): AuthInfo {
    return new AuthInfo(
      data.signer_infos.map(SignerInfo.fromData),
      Fee.fromData(data.fee)
    )
  }

  public toData(): AuthInfo.Data {
    return {
      fee: this.fee.toData(),
      signer_infos: this.signer_infos.map((info) => info.toData()),
    }
  }

  public static fromProto(proto: AuthInfo.Proto): AuthInfo {
    return new AuthInfo(
      proto.signerInfos.map(SignerInfo.fromProto),
      Fee.fromProto(proto.fee as Fee.Proto)
    )
  }

  public toProto(): AuthInfo.Proto {
    return AuthInfo_pb.fromPartial({
      fee: this.fee.toProto(),
      signerInfos: this.signer_infos.map((info) => info.toProto()),
    })
  }

  public toBytes(): Uint8Array {
    return AuthInfo_pb.encode(this.toProto()).finish()
  }
}

export namespace AuthInfo {
  export interface Data {
    signer_infos: SignerInfo.Data[]
    fee: Fee.Data
  }
  export type Proto = AuthInfo_pb
}

/**
 * SignerInfo describes the public key and signing mode of a single top-level signer.
 */
export class SignerInfo {
  /**
   * @param public_key the public key of the signer
   * @param sequence the number of committed transactions signed by a given address
   * @param mode_info the signing mode of the signer
   */
  constructor(
    public public_key: PublicKey,
    public sequence: number,
    public mode_info: ModeInfo
  ) {}

  public static fromData(data: SignerInfo.Data): SignerInfo {
    return new SignerInfo(
      PublicKey.fromData(data.public_key ?? new SimplePublicKey('').toData()),
      parseInt(data.sequence),
      ModeInfo.fromData(data.mode_info)
    )
  }

  public toData(): SignerInfo.Data {
    const { public_key, sequence, mode_info } = this
    return {
      mode_info: mode_info.toData(),
      public_key: public_key?.toData(),
      sequence: sequence.toFixed(),
    }
  }

  public static fromProto(proto: SignerInfo.Proto): SignerInfo {
    return new SignerInfo(
      PublicKey.fromProto(proto.publicKey ?? new SimplePublicKey('').packAny()),
      Number(proto.sequence),
      ModeInfo.fromProto(proto.modeInfo as ModeInfo_pb)
    )
  }

  public toProto(): SignerInfo.Proto {
    const { public_key, sequence, mode_info } = this
    return SignerInfo_pb.fromPartial({
      modeInfo: mode_info.toProto(),
      publicKey: public_key?.packAny(),
      sequence: BigInt(sequence),
    })
  }
}

export namespace SignerInfo {
  export interface Data {
    public_key?: PublicKey.Data
    mode_info: ModeInfo.Data
    sequence: string
  }

  export type Proto = SignerInfo_pb
}

/**
 * ModeInfo describes the signing mode of a single or nested multisig signer.
 */
export class ModeInfo {
  public single?: ModeInfo.Single
  public multi?: ModeInfo.Multi

  /**
   * @param mode_info the oneof that specifies whether this represents a single or nested multisig signer
   */
  constructor(mode_info: ModeInfo.Single | ModeInfo.Multi) {
    if (mode_info instanceof ModeInfo.Single) {
      this.single = mode_info
    } else {
      this.multi = mode_info
    }
  }

  public static fromData(data: ModeInfo.Data): ModeInfo {
    if (data.single) {
      return new ModeInfo(ModeInfo.Single.fromData(data.single))
    }

    if (data.multi) {
      return new ModeInfo(ModeInfo.Multi.fromData(data.multi))
    }

    throw new Error('must be one of single or multi')
  }

  public toData(): ModeInfo.Data {
    return {
      single: this.single?.toData(),
      multi: this.multi?.toData(),
    }
  }

  public static fromProto(proto: ModeInfo.Proto): ModeInfo {
    const singleMode = proto.single
    const multiMode = proto.multi

    return new ModeInfo(
      singleMode
        ? ModeInfo.Single.fromProto(singleMode)
        : ModeInfo.Multi.fromProto(multiMode as ModeInfoMulti_pb)
    )
  }

  public toProto(): ModeInfo.Proto {
    return ModeInfo_pb.fromPartial({
      multi: this.multi?.toProto(),
      single: this.single?.toProto(),
    })
  }
}

export namespace ModeInfo {
  export interface Data {
    single?: Single.Data
    multi?: Multi.Data
  }
  export type Proto = ModeInfo_pb
  export const SignMode = SignMode_pb
  export type SignMode = SignMode_pb

  export class Single {
    constructor(public mode: SignMode) {}

    public static fromData(data: Single.Data): Single {
      return new Single(signModeFromJSON(data.mode))
    }

    public toData(): Single.Data {
      return {
        mode: signModeToJSON(this.mode),
      }
    }

    public static fromProto(proto: Single.Proto): Single {
      return new Single(proto.mode)
    }

    public toProto(): Single.Proto {
      return ModeInfoSingle_pb.fromPartial({
        mode: this.mode,
      })
    }
  }

  export namespace Single {
    export interface Data {
      mode: string
    }

    export type Proto = ModeInfoSingle_pb
  }

  export class Multi {
    constructor(
      public bitarray: CompactBitArray,
      public modeInfos: ModeInfo[]
    ) {}

    public static fromData(proto: Multi.Data): Multi {
      return new Multi(
        CompactBitArray.fromData(proto.bitarray),
        proto.mode_infos.map(ModeInfo.fromData)
      )
    }

    public toData(): Multi.Data {
      return {
        bitarray: this.bitarray.toData(),
        mode_infos: this.modeInfos.map((m) => m.toData()),
      }
    }

    public static fromProto(proto: Multi.Proto): Multi {
      return new Multi(
        CompactBitArray.fromProto(proto.bitarray as CompactBitArray.Proto),
        proto.modeInfos.map(ModeInfo.fromProto)
      )
    }

    public toProto(): Multi.Proto {
      return ModeInfoMulti_pb.fromPartial({
        bitarray: this.bitarray.toProto(),
        modeInfos: this.modeInfos.map((m) => m.toProto()),
      })
    }
  }

  export namespace Multi {
    export interface Data {
      bitarray: CompactBitArray.Data
      mode_infos: ModeInfo.Data[]
    }
    export type Proto = ModeInfoMulti_pb
  }
}
