import { JSONSerializable } from '../../../util/json';
import { AccAddress } from '../../bech32';
import { WeightedVoteOption } from '../Vote';
import { Any } from '@initia/initia.proto/google/protobuf/any';
import { MsgVoteWeighted as MsgVoteWeighted_pb } from '@initia/initia.proto/cosmos/gov/v1/tx';
import Long from 'long';

/**
 * Defines a message to cast a vote
 */
export class MsgVoteWeighted extends JSONSerializable<
  MsgVoteWeighted.Amino,
  MsgVoteWeighted.Data,
  MsgVoteWeighted.Proto
> {
  /**
   * @param proposal_id the unique id of the proposal
   * @param voter the voter address for the proposal
   * @param options the weighted vote options
   * @param metadata any arbitrary metadata attached to the VoteWeighted
   */
  constructor(
    public proposal_id: number,
    public voter: AccAddress,
    public options: WeightedVoteOption[],
    public metadata: string
  ) {
    super();
  }

  public static fromAmino(data: MsgVoteWeighted.Amino): MsgVoteWeighted {
    const {
      value: { proposal_id, voter, options, metadata },
    } = data;
    return new MsgVoteWeighted(
      Number.parseInt(proposal_id),
      voter,
      options.map(o => WeightedVoteOption.fromAmino(o)),
      metadata ?? ''
    );
  }

  public toAmino(): MsgVoteWeighted.Amino {
    const { proposal_id, voter, options, metadata } = this;
    return {
      type: 'cosmos-sdk/v1/MsgVoteWeighted',
      value: {
        proposal_id: proposal_id.toFixed(),
        voter,
        options: options.map(o => o.toAmino()),
        metadata: metadata && metadata !== '' ? metadata : undefined,
      },
    };
  }

  public static fromData(data: MsgVoteWeighted.Data): MsgVoteWeighted {
    const { proposal_id, voter, options, metadata } = data;
    return new MsgVoteWeighted(
      Number.parseInt(proposal_id),
      voter,
      options.map(o => WeightedVoteOption.fromData(o)),
      metadata
    );
  }

  public toData(): MsgVoteWeighted.Data {
    const { proposal_id, voter, options, metadata } = this;
    return {
      '@type': '/cosmos.gov.v1.MsgVoteWeighted',
      proposal_id: proposal_id.toFixed(),
      voter,
      options: options.map(o => o.toData()),
      metadata,
    };
  }

  public static fromProto(proto: MsgVoteWeighted.Proto): MsgVoteWeighted {
    return new MsgVoteWeighted(
      proto.proposalId.toNumber(),
      proto.voter,
      proto.options.map(o => WeightedVoteOption.fromProto(o)),
      proto.metadata
    );
  }

  public toProto(): MsgVoteWeighted.Proto {
    const { proposal_id, voter, options, metadata } = this;
    return MsgVoteWeighted_pb.fromPartial({
      options: options.map(o => o.toProto()),
      proposalId: Long.fromNumber(proposal_id),
      voter,
      metadata,
    });
  }

  public packAny(): Any {
    return Any.fromPartial({
      typeUrl: '/cosmos.gov.v1.MsgVoteWeighted',
      value: MsgVoteWeighted_pb.encode(this.toProto()).finish(),
    });
  }

  public static unpackAny(msgAny: Any): MsgVoteWeighted {
    return MsgVoteWeighted.fromProto(MsgVoteWeighted_pb.decode(msgAny.value));
  }
}

export namespace MsgVoteWeighted {
  export interface Amino {
    type: 'cosmos-sdk/v1/MsgVoteWeighted';
    value: {
      proposal_id: string;
      voter: AccAddress;
      options: WeightedVoteOption.Amino[];
      metadata?: string;
    };
  }

  export interface Data {
    '@type': '/cosmos.gov.v1.MsgVoteWeighted';
    proposal_id: string;
    voter: AccAddress;
    options: WeightedVoteOption.Data[];
    metadata: string;
  }

  export type Proto = MsgVoteWeighted_pb;
}
