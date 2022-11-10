import { JSONSerializable } from '../../util/json';
import { AccAddress } from '../bech32';
import {
  Vote as Vote_pb,
  VoteOption,
  WeightedVoteOption as WeightedVoteOption_pb,
} from '@initia/initia.proto/cosmos/gov/v1beta1/gov';
import { num } from '../num';
import Long from 'long';
/**
 * Stores vote information for a proposal
 */
export class Vote extends JSONSerializable<Vote.Amino, Vote.Data, Vote.Proto> {
  public Option = VoteOption;

  /**
   * @param proposal_id ID of proposal to vote on
   * @param voter voter's account address
   * @param option one of voting options
   */
  constructor(
    public proposal_id: number,
    public voter: AccAddress,
    public options: WeightedVoteOption[]
  ) {
    super();
  }

  public static fromAmino(data: Vote.Amino): Vote {
    const { proposal_id, voter, options } = data;
    return new Vote(
      Number.parseInt(proposal_id),
      voter,
      options.map(v => WeightedVoteOption.fromAmino(v))
    );
  }

  public toAmino(): Vote.Amino {
    const { proposal_id, voter, options } = this;

    const res: Vote.Amino = {
      proposal_id: proposal_id.toFixed(),
      voter,
      options: options.map(v => v.toAmino()),
    };

    return res;
  }

  public static fromData(data: Vote.Data): Vote {
    const { proposal_id, voter, options } = data;
    return new Vote(
      Number.parseInt(proposal_id),
      voter,
      options.map(v => WeightedVoteOption.fromData(v))
    );
  }

  public toData(): Vote.Data {
    const { proposal_id, voter, options } = this;

    const res: Vote.Data = {
      proposal_id: proposal_id.toFixed(),
      voter,
      options: options.map(v => v.toData()),
    };

    return res;
  }

  public static fromProto(proto: Vote.Proto): Vote {
    return new Vote(
      proto.proposalId.toNumber(),
      proto.voter,
      proto.options.map(o => WeightedVoteOption.fromProto(o))
    );
  }

  public toProto(): Vote.Proto {
    const { proposal_id, voter, options } = this;
    return Vote_pb.fromPartial({
      options: options.map(o => o.toProto()),
      proposalId: Long.fromNumber(proposal_id),
      voter,
    });
  }
}

export namespace Vote {
  export const Option = VoteOption;
  export type Option = VoteOption;

  export interface Amino {
    proposal_id: string;
    voter: AccAddress;
    options: WeightedVoteOption.Amino[];
  }

  export interface Data {
    proposal_id: string;
    voter: AccAddress;
    options: WeightedVoteOption.Data[];
  }

  export type Proto = Vote_pb;
}

export class WeightedVoteOption extends JSONSerializable<
  WeightedVoteOption.Amino,
  WeightedVoteOption.Data,
  WeightedVoteOption.Proto
> {
  public weight: string;
  constructor(public option: VoteOption, weight: number | string) {
    super();
    this.weight = num(weight).toString();
  }

  public static fromAmino(data: WeightedVoteOption.Amino): WeightedVoteOption {
    const { option, weight } = data;
    return new WeightedVoteOption(option, weight);
  }

  public toAmino(): WeightedVoteOption.Amino {
    const { option, weight } = this;
    return {
      option,
      weight: num(weight).toFixed(18),
    };
  }

  public static fromData(data: WeightedVoteOption.Data): WeightedVoteOption {
    const { option, weight } = data;
    return new WeightedVoteOption(option, weight);
  }

  public toData(): WeightedVoteOption.Data {
    const { option, weight } = this;
    return {
      option,
      weight: num(weight).toFixed(18),
    };
  }

  public static fromProto(proto: WeightedVoteOption.Proto): WeightedVoteOption {
    return new WeightedVoteOption(proto.option, proto.weight);
  }

  public toProto(): WeightedVoteOption.Proto {
    const { option, weight } = this;
    return WeightedVoteOption_pb.fromPartial({
      option,
      weight: num(weight).toFixed(18),
    });
  }
}

export namespace WeightedVoteOption {
  export interface Amino {
    option: VoteOption;
    weight: string;
  }

  export interface Data {
    option: VoteOption;
    weight: string;
  }

  export type Proto = WeightedVoteOption_pb;
}
