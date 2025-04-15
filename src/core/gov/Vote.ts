import { JSONSerializable } from '../../util/json'
import { AccAddress } from '../bech32'
import {
  Vote as Vote_pb,
  VoteOption,
  WeightedVoteOption as WeightedVoteOption_pb,
} from '@initia/initia.proto/cosmos/gov/v1/gov'

/**
 * Vote defines a vote on a governance proposal.
 */
export class Vote extends JSONSerializable<Vote.Amino, Vote.Data, Vote.Proto> {
  /**
   * @param proposal_id the unique id of the proposal
   * @param voter the voter address of the proposal
   * @param options the weighted vote options
   * @param metadata any arbitrary metadata to attached to the vote
   */
  constructor(
    public proposal_id: number,
    public voter: AccAddress,
    public options: WeightedVoteOption[],
    public metadata: string
  ) {
    super()
  }

  public static fromAmino(data: Vote.Amino): Vote {
    const { proposal_id, voter, options, metadata } = data
    return new Vote(
      parseInt(proposal_id),
      voter,
      options.map(WeightedVoteOption.fromAmino),
      metadata
    )
  }

  public toAmino(): Vote.Amino {
    const { proposal_id, voter, options, metadata } = this
    return {
      proposal_id: proposal_id.toFixed(),
      voter,
      options: options.map((v) => v.toAmino()),
      metadata,
    }
  }

  public static fromData(data: Vote.Data): Vote {
    const { proposal_id, voter, options, metadata } = data
    return new Vote(
      parseInt(proposal_id),
      voter,
      options.map(WeightedVoteOption.fromData),
      metadata
    )
  }

  public toData(): Vote.Data {
    const { proposal_id, voter, options, metadata } = this
    return {
      proposal_id: proposal_id.toFixed(),
      voter,
      options: options.map((v) => v.toData()),
      metadata,
    }
  }

  public static fromProto(proto: Vote.Proto): Vote {
    return new Vote(
      Number(proto.proposalId),
      proto.voter,
      proto.options.map(WeightedVoteOption.fromProto),
      proto.metadata
    )
  }

  public toProto(): Vote.Proto {
    const { proposal_id, voter, options, metadata } = this
    return Vote_pb.fromPartial({
      options: options.map((o) => o.toProto()),
      proposalId: BigInt(proposal_id),
      voter,
      metadata,
    })
  }
}

export namespace Vote {
  export const Option = VoteOption
  export type Option = VoteOption

  export interface Amino {
    proposal_id: string
    voter: AccAddress
    options: WeightedVoteOption.Amino[]
    metadata: string
  }

  export interface Data {
    proposal_id: string
    voter: AccAddress
    options: WeightedVoteOption.Data[]
    metadata: string
  }

  export type Proto = Vote_pb
}

/**
 * WeightedVoteOption defines a unit of vote for vote split.
 */
export class WeightedVoteOption extends JSONSerializable<
  WeightedVoteOption.Amino,
  WeightedVoteOption.Data,
  WeightedVoteOption.Proto
> {
  constructor(
    public option: VoteOption,
    public weight: number
  ) {
    super()
  }

  public static fromAmino(data: WeightedVoteOption.Amino): WeightedVoteOption {
    const { option, weight } = data
    return new WeightedVoteOption(option, parseFloat(weight))
  }

  public toAmino(): WeightedVoteOption.Amino {
    const { option, weight } = this
    return {
      option,
      weight: weight.toString(),
    }
  }

  public static fromData(data: WeightedVoteOption.Data): WeightedVoteOption {
    const { option, weight } = data
    return new WeightedVoteOption(option, parseFloat(weight))
  }

  public toData(): WeightedVoteOption.Data {
    const { option, weight } = this
    return {
      option,
      weight: weight.toString(),
    }
  }

  public static fromProto(proto: WeightedVoteOption.Proto): WeightedVoteOption {
    return new WeightedVoteOption(proto.option, parseFloat(proto.weight))
  }

  public toProto(): WeightedVoteOption.Proto {
    const { option, weight } = this
    return WeightedVoteOption_pb.fromPartial({
      option,
      weight: weight.toString(),
    })
  }
}

export namespace WeightedVoteOption {
  export interface Amino {
    option: VoteOption
    weight: string
  }

  export interface Data {
    option: VoteOption
    weight: string
  }

  export type Proto = WeightedVoteOption_pb
}
