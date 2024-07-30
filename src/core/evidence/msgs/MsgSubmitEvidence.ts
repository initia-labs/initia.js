import { JSONSerializable } from '../../../util/json'
import { AccAddress } from '../../bech32'
import { Any } from '@initia/initia.proto/google/protobuf/any'
import { MsgSubmitEvidence as MsgSubmitEvidence_pb } from '@initia/initia.proto/cosmos/evidence/v1beta1/tx'
import { Evidence } from '../Evidence'

export class MsgSubmitEvidence extends JSONSerializable<
  MsgSubmitEvidence.Amino,
  MsgSubmitEvidence.Data,
  MsgSubmitEvidence.Proto
> {
  /**
   * @param submitter the signer account address of evidence
   * @param evidence the evidence of misbehavior
   */
  constructor(
    public submitter: AccAddress,
    public evidence: Evidence
  ) {
    super()
  }

  public static fromAmino(data: MsgSubmitEvidence.Amino): MsgSubmitEvidence {
    const {
      value: { submitter, evidence },
    } = data

    return new MsgSubmitEvidence(submitter, Evidence.fromAmino(evidence))
  }

  public toAmino(): MsgSubmitEvidence.Amino {
    const { submitter, evidence } = this
    return {
      type: 'cosmos-sdk/MsgSubmitEvidence',
      value: {
        submitter,
        evidence: evidence.toAmino(),
      },
    }
  }

  public static fromData(data: MsgSubmitEvidence.Data): MsgSubmitEvidence {
    const { submitter, evidence } = data
    return new MsgSubmitEvidence(submitter, Evidence.fromData(evidence))
  }

  public toData(): MsgSubmitEvidence.Data {
    const { submitter, evidence } = this
    return {
      '@type': '/cosmos.evidence.v1beta1.MsgSubmitEvidence',
      submitter,
      evidence: evidence.toData(),
    }
  }

  public static fromProto(data: MsgSubmitEvidence.Proto): MsgSubmitEvidence {
    return new MsgSubmitEvidence(
      data.submitter,
      Evidence.fromProto(data.evidence as Any)
    )
  }

  public toProto(): MsgSubmitEvidence.Proto {
    const { submitter, evidence } = this
    return MsgSubmitEvidence_pb.fromPartial({
      submitter,
      evidence: evidence.packAny(),
    })
  }

  public packAny(): Any {
    return Any.fromPartial({
      typeUrl: '/cosmos.evidence.v1beta1.MsgSubmitEvidence',
      value: MsgSubmitEvidence_pb.encode(this.toProto()).finish(),
    })
  }

  public static unpackAny(msgAny: Any): MsgSubmitEvidence {
    return MsgSubmitEvidence.fromProto(
      MsgSubmitEvidence_pb.decode(msgAny.value)
    )
  }
}

export namespace MsgSubmitEvidence {
  export interface Amino {
    type: 'cosmos-sdk/MsgSubmitEvidence'
    value: {
      submitter: AccAddress
      evidence: Evidence.Amino
    }
  }

  export interface Data {
    '@type': '/cosmos.evidence.v1beta1.MsgSubmitEvidence'
    submitter: AccAddress
    evidence: Evidence.Data
  }

  export type Proto = MsgSubmitEvidence_pb
}
