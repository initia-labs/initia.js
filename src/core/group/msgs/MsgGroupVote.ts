import { JSONSerializable } from '../../../util/json'
import { AccAddress } from '../../bech32'
import { Any } from '@initia/initia.proto/google/protobuf/any'
import {
  MsgVote as MsgVote_pb,
  Exec as Exec_pb,
  execFromJSON,
  execToJSON,
} from '@initia/initia.proto/cosmos/group/v1/tx'
import {
  VoteOption,
  voteOptionFromJSON,
  voteOptionToJSON,
} from '@initia/initia.proto/cosmos/group/v1/types'

export class MsgGroupVote extends JSONSerializable<
  MsgGroupVote.Amino,
  MsgGroupVote.Data,
  MsgGroupVote.Proto
> {
  /**
   * @param proposal_id the unique ID of the proposal
   * @param voter the voter account address
   * @param option the voter's choice on the proposal
   * @param metadata any arbitrary metadata attached to the vote
   * @param exec whether the proposal should be executed immediately after voting or not
   */
  constructor(
    public proposal_id: number,
    public voter: AccAddress,
    public option: MsgGroupVote.Option,
    public metadata: string,
    public exec: MsgGroupVote.Exec
  ) {
    super()
  }

  public static fromAmino(data: MsgGroupVote.Amino): MsgGroupVote {
    const {
      value: { proposal_id, voter, option, metadata, exec },
    } = data

    return new MsgGroupVote(
      parseInt(proposal_id),
      voter,
      voteOptionFromJSON(option),
      metadata,
      execFromJSON(exec)
    )
  }

  public toAmino(): MsgGroupVote.Amino {
    const { proposal_id, voter, option, metadata, exec } = this

    return {
      type: 'cosmos-sdk/group/MsgVote',
      value: {
        proposal_id: proposal_id.toFixed(),
        voter,
        option: voteOptionToJSON(option),
        metadata,
        exec: execToJSON(exec),
      },
    }
  }

  public static fromData(data: MsgGroupVote.Data): MsgGroupVote {
    const { proposal_id, voter, option, metadata, exec } = data

    return new MsgGroupVote(
      parseInt(proposal_id),
      voter,
      voteOptionFromJSON(option),
      metadata,
      execFromJSON(exec)
    )
  }

  public toData(): MsgGroupVote.Data {
    const { proposal_id, voter, option, metadata, exec } = this

    return {
      '@type': '/cosmos.group.v1.MsgVote',
      proposal_id: proposal_id.toFixed(),
      voter,
      option: voteOptionToJSON(option),
      metadata,
      exec: execToJSON(exec),
    }
  }

  public static fromProto(data: MsgGroupVote.Proto): MsgGroupVote {
    return new MsgGroupVote(
      data.proposalId.toNumber(),
      data.voter,
      data.option,
      data.metadata,
      data.exec
    )
  }

  public toProto(): MsgGroupVote.Proto {
    const { proposal_id, voter, option, metadata, exec } = this

    return MsgVote_pb.fromPartial({
      proposalId: proposal_id,
      voter,
      option,
      metadata,
      exec,
    })
  }

  public packAny(): Any {
    return Any.fromPartial({
      typeUrl: '/cosmos.group.v1.MsgVote',
      value: MsgVote_pb.encode(this.toProto()).finish(),
    })
  }

  public static unpackAny(msgAny: Any): MsgGroupVote {
    return MsgGroupVote.fromProto(MsgVote_pb.decode(msgAny.value))
  }
}

export namespace MsgGroupVote {
  export type Option = VoteOption
  export const Option = VoteOption
  export type Exec = Exec_pb
  export const Exec = Exec_pb

  export interface Amino {
    type: 'cosmos-sdk/group/MsgVote'
    value: {
      proposal_id: string
      voter: AccAddress
      option: string
      metadata: string
      exec: string
    }
  }

  export interface Data {
    '@type': '/cosmos.group.v1.MsgVote'
    proposal_id: string
    voter: AccAddress
    option: string
    metadata: string
    exec: string
  }

  export type Proto = MsgVote_pb
}
