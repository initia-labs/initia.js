import { JSONSerializable } from '../../../util/json'
import { AccAddress } from '../../bech32'
import { Any } from '@initia/initia.proto/google/protobuf/any'
import { MsgVote as MsgVote_pb } from '@initia/initia.proto/cosmos/gov/v1/tx'
import { VoteOption } from '@initia/initia.proto/cosmos/gov/v1/gov'
import Long from 'long'

/**
 * Defines a message to cast a vote
 */
export class MsgVote extends JSONSerializable<
  MsgVote.Amino,
  MsgVote.Data,
  MsgVote.Proto
> {
  /**
   * @param proposal_id the unique id of the proposal
   * @param voter the voter address for the proposal
   * @param option the vote option
   * @param metadata any arbitrary metadata attached to the Vote
   */
  constructor(
    public proposal_id: number,
    public voter: AccAddress,
    public option: VoteOption,
    public metadata: string
  ) {
    super()
  }

  public static fromAmino(data: MsgVote.Amino): MsgVote {
    const {
      value: { proposal_id, voter, option, metadata },
    } = data
    return new MsgVote(parseInt(proposal_id), voter, option, metadata ?? '')
  }

  public toAmino(): MsgVote.Amino {
    const { proposal_id, voter, option, metadata } = this
    return {
      type: 'cosmos-sdk/v1/MsgVote',
      value: {
        proposal_id: proposal_id.toString(),
        voter,
        option,
        metadata: metadata && metadata !== '' ? metadata : undefined,
      },
    }
  }

  public static fromData(data: MsgVote.Data): MsgVote {
    const { proposal_id, voter, option, metadata } = data
    return new MsgVote(parseInt(proposal_id), voter, option, metadata)
  }

  public toData(): MsgVote.Data {
    const { proposal_id, voter, option, metadata } = this
    return {
      '@type': '/cosmos.gov.v1.MsgVote',
      proposal_id: proposal_id.toString(),
      voter,
      option,
      metadata,
    }
  }

  public static fromProto(data: MsgVote.Proto): MsgVote {
    return new MsgVote(
      data.proposalId.toNumber(),
      data.voter,
      data.option,
      data.metadata
    )
  }

  public toProto(): MsgVote.Proto {
    const { proposal_id, voter, option, metadata } = this
    return MsgVote_pb.fromPartial({
      proposalId: Long.fromNumber(proposal_id),
      voter,
      option,
      metadata,
    })
  }

  public packAny(): Any {
    return Any.fromPartial({
      typeUrl: '/cosmos.gov.v1.MsgVote',
      value: MsgVote_pb.encode(this.toProto()).finish(),
    })
  }

  public static unpackAny(msgAny: Any): MsgVote {
    return MsgVote.fromProto(MsgVote_pb.decode(msgAny.value))
  }
}

export namespace MsgVote {
  export const Option = VoteOption
  export type Option = VoteOption

  export interface Amino {
    type: 'cosmos-sdk/v1/MsgVote'
    value: {
      proposal_id: string
      voter: AccAddress
      option: VoteOption
      metadata?: string
    }
  }

  export interface Data {
    '@type': '/cosmos.gov.v1.MsgVote'
    proposal_id: string
    voter: AccAddress
    option: Option
    metadata: string
  }

  export type Proto = MsgVote_pb
}
