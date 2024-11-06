import { JSONSerializable } from '../../util/json'
import { AccAddress } from '../bech32'
import {
  Vote as Vote_pb,
  VoteOption,
  voteOptionFromJSON,
  voteOptionToJSON,
} from '@initia/initia.proto/cosmos/group/v1/types'

export class GroupVote extends JSONSerializable<
  GroupVote.Amino,
  GroupVote.Data,
  GroupVote.Proto
> {
  /**
   * @param proposal_id the unique ID of the proposal
   * @param voter the account address of the voter
   * @param option the voter's choice on the proposal
   * @param metadata any arbitrary metadata attached to the vote
   * @param submit_time the timestamp when the vote was submitted
   */
  constructor(
    public proposal_id: number,
    public voter: AccAddress,
    public option: VoteOption,
    public metadata: string,
    public submit_time: Date
  ) {
    super()
  }

  public static fromAmino(data: GroupVote.Amino): GroupVote {
    const { proposal_id, voter, option, metadata, submit_time } = data
    return new GroupVote(
      parseInt(proposal_id),
      voter,
      voteOptionFromJSON(option),
      metadata,
      new Date(submit_time)
    )
  }

  public toAmino(): GroupVote.Amino {
    const { proposal_id, voter, option, metadata, submit_time } = this
    return {
      proposal_id: proposal_id.toFixed(),
      voter,
      option: voteOptionToJSON(option),
      metadata,
      submit_time: submit_time.toISOString(),
    }
  }

  public static fromData(data: GroupVote.Data): GroupVote {
    const { proposal_id, voter, option, metadata, submit_time } = data
    return new GroupVote(
      parseInt(proposal_id),
      voter,
      voteOptionFromJSON(option),
      metadata,
      new Date(submit_time)
    )
  }

  public toData(): GroupVote.Data {
    const { proposal_id, voter, option, metadata, submit_time } = this
    return {
      proposal_id: proposal_id.toFixed(),
      voter,
      option: voteOptionToJSON(option),
      metadata,
      submit_time: submit_time.toISOString(),
    }
  }

  public static fromProto(data: GroupVote.Proto): GroupVote {
    return new GroupVote(
      data.proposalId.toNumber(),
      data.voter,
      data.option,
      data.metadata,
      data.submitTime as Date
    )
  }

  public toProto(): GroupVote.Proto {
    const { proposal_id, voter, option, metadata, submit_time } = this
    return Vote_pb.fromPartial({
      proposalId: proposal_id,
      voter,
      option,
      metadata,
      submitTime: submit_time,
    })
  }
}

export namespace GroupVote {
  export type Option = VoteOption
  export const Option = VoteOption

  export interface Amino {
    proposal_id: string
    voter: AccAddress
    option: string
    metadata: string
    submit_time: string
  }

  export interface Data {
    proposal_id: string
    voter: AccAddress
    option: string
    metadata: string
    submit_time: string
  }

  export type Proto = Vote_pb
}
