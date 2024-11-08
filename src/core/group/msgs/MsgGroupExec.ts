import { JSONSerializable } from '../../../util/json'
import { AccAddress } from '../../bech32'
import { Any } from '@initia/initia.proto/google/protobuf/any'
import { MsgExec as MsgExec_pb } from '@initia/initia.proto/cosmos/group/v1/tx'

/**
 * MsgGroupExec executes a group proposal.
 */
export class MsgGroupExec extends JSONSerializable<
  MsgGroupExec.Amino,
  MsgGroupExec.Data,
  MsgGroupExec.Proto
> {
  /**
   * @param proposal_id the unique ID of the proposal
   * @param executor the account address used to execute the proposal
   */
  constructor(
    public proposal_id: number,
    public executor: AccAddress
  ) {
    super()
  }

  public static fromAmino(data: MsgGroupExec.Amino): MsgGroupExec {
    const {
      value: { proposal_id, executor },
    } = data
    return new MsgGroupExec(parseInt(proposal_id), executor)
  }

  public toAmino(): MsgGroupExec.Amino {
    const { proposal_id, executor } = this
    return {
      type: 'cosmos-sdk/group/MsgExec',
      value: {
        proposal_id: proposal_id.toFixed(),
        executor,
      },
    }
  }

  public static fromData(data: MsgGroupExec.Data): MsgGroupExec {
    const { proposal_id, executor } = data
    return new MsgGroupExec(parseInt(proposal_id), executor)
  }

  public toData(): MsgGroupExec.Data {
    const { proposal_id, executor } = this
    return {
      '@type': '/cosmos.group.v1.MsgExec',
      proposal_id: proposal_id.toFixed(),
      executor,
    }
  }

  public static fromProto(data: MsgGroupExec.Proto): MsgGroupExec {
    return new MsgGroupExec(data.proposalId.toNumber(), data.executor)
  }

  public toProto(): MsgGroupExec.Proto {
    const { proposal_id, executor } = this
    return MsgExec_pb.fromPartial({
      proposalId: proposal_id,
      executor,
    })
  }

  public packAny(): Any {
    return Any.fromPartial({
      typeUrl: '/cosmos.group.v1.MsgExec',
      value: MsgExec_pb.encode(this.toProto()).finish(),
    })
  }

  public static unpackAny(msgAny: Any): MsgGroupExec {
    return MsgGroupExec.fromProto(MsgExec_pb.decode(msgAny.value))
  }
}

export namespace MsgGroupExec {
  export interface Amino {
    type: 'cosmos-sdk/group/MsgExec'
    value: {
      proposal_id: string
      executor: AccAddress
    }
  }

  export interface Data {
    '@type': '/cosmos.group.v1.MsgExec'
    proposal_id: string
    executor: AccAddress
  }

  export type Proto = MsgExec_pb
}
