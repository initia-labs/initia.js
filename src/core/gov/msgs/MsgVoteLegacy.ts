import { JSONSerializable } from '../../../util/json';
import { AccAddress } from '../../bech32';
import { Any } from '@initia/initia.proto/google/protobuf/any';
import { MsgVote as MsgVote_pb } from '@initia/initia.proto/cosmos/gov/v1beta1/tx';
import { VoteOption } from '@initia/initia.proto/cosmos/gov/v1beta1/gov';
import Long from 'long';

/**
 * Vote for a proposal
 */
export class MsgVoteLegacy extends JSONSerializable<
  MsgVoteLegacy.Amino,
  MsgVoteLegacy.Data,
  MsgVoteLegacy.Proto
> {
  /**
   * @param proposal_id ID of proposal to vote on
   * @param voter voter's account address
   * @param option one of voting options
   */
  constructor(
    public proposal_id: number,
    public voter: AccAddress,
    public option: VoteOption
  ) {
    super();
  }

  public static fromAmino(data: MsgVoteLegacy.Amino): MsgVoteLegacy {
    const {
      value: { proposal_id, voter, option },
    } = data;
    return new MsgVoteLegacy(Number.parseInt(proposal_id), voter, option);
  }

  public toAmino(): MsgVoteLegacy.Amino {
    const { proposal_id, voter, option } = this;
    return {
      type: 'cosmos-sdk/MsgVote',
      value: {
        proposal_id: proposal_id.toFixed(),
        voter,
        option,
      },
    };
  }

  public static fromData(data: MsgVoteLegacy.Data): MsgVoteLegacy {
    const { proposal_id, voter, option } = data;
    return new MsgVoteLegacy(Number.parseInt(proposal_id), voter, option);
  }

  public toData(): MsgVoteLegacy.Data {
    const { proposal_id, voter, option } = this;
    return {
      '@type': '/cosmos.gov.v1beta1.MsgVote',
      proposal_id: proposal_id.toFixed(),
      voter,
      option,
    };
  }

  public static fromProto(proto: MsgVoteLegacy.Proto): MsgVoteLegacy {
    return new MsgVoteLegacy(
      proto.proposalId.toNumber(),
      proto.voter,
      proto.option
    );
  }

  public toProto(): MsgVoteLegacy.Proto {
    const { proposal_id, voter, option } = this;
    return MsgVote_pb.fromPartial({
      option,
      proposalId: Long.fromNumber(proposal_id),
      voter,
    });
  }

  public packAny(): Any {
    return Any.fromPartial({
      typeUrl: '/cosmos.gov.v1beta1.MsgVote',
      value: MsgVote_pb.encode(this.toProto()).finish(),
    });
  }

  public static unpackAny(msgAny: Any): MsgVoteLegacy {
    return MsgVoteLegacy.fromProto(MsgVote_pb.decode(msgAny.value));
  }
}

export namespace MsgVoteLegacy {
  export const Option = VoteOption;
  export type Option = VoteOption;

  export interface Amino {
    type: 'cosmos-sdk/MsgVote';
    value: {
      proposal_id: string;
      voter: AccAddress;
      option: VoteOption;
    };
  }

  export interface Data {
    '@type': '/cosmos.gov.v1beta1.MsgVote';
    proposal_id: string;
    voter: AccAddress;
    option: Option;
  }

  export type Proto = MsgVote_pb;
}
