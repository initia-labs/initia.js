import { JSONSerializable } from '../../../util/json'
import { AccAddress } from '../../bech32'
import { WeightedVoteOption } from '../Vote'
import { Any } from '@initia/initia.proto/google/protobuf/any'
import { MsgVoteWeighted as MsgVoteWeighted_pb } from '@initia/initia.proto/cosmos/gov/v1beta1/tx'

/**
 * MsgVoteWeightedLegacy defines weighted vote for a proposal.
 */
export class MsgVoteWeightedLegacy extends JSONSerializable<
  MsgVoteWeightedLegacy.Amino,
  MsgVoteWeightedLegacy.Data,
  MsgVoteWeightedLegacy.Proto
> {
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
    super()
  }

  public static fromAmino(
    data: MsgVoteWeightedLegacy.Amino
  ): MsgVoteWeightedLegacy {
    const {
      value: { proposal_id, voter, options },
    } = data
    return new MsgVoteWeightedLegacy(
      parseInt(proposal_id),
      voter,
      options.map((o) => WeightedVoteOption.fromAmino(o))
    )
  }

  public toAmino(): MsgVoteWeightedLegacy.Amino {
    const { proposal_id, voter, options } = this
    return {
      type: 'cosmos-sdk/MsgVoteWeighted',
      value: {
        proposal_id: proposal_id.toFixed(),
        voter,
        options: options.map((o) => o.toAmino()),
      },
    }
  }

  public static fromData(
    data: MsgVoteWeightedLegacy.Data
  ): MsgVoteWeightedLegacy {
    const { proposal_id, voter, options } = data
    return new MsgVoteWeightedLegacy(
      parseInt(proposal_id),
      voter,
      options.map((o) => WeightedVoteOption.fromData(o))
    )
  }

  public toData(): MsgVoteWeightedLegacy.Data {
    const { proposal_id, voter, options } = this
    return {
      '@type': '/cosmos.gov.v1beta1.MsgVoteWeighted',
      proposal_id: proposal_id.toFixed(),
      voter,
      options: options.map((o) => o.toData()),
    }
  }

  public static fromProto(
    proto: MsgVoteWeightedLegacy.Proto
  ): MsgVoteWeightedLegacy {
    return new MsgVoteWeightedLegacy(
      proto.proposalId.toNumber(),
      proto.voter,
      proto.options.map((o) => WeightedVoteOption.fromProto(o))
    )
  }

  public toProto(): MsgVoteWeightedLegacy.Proto {
    const { proposal_id, voter, options } = this
    return MsgVoteWeighted_pb.fromPartial({
      options: options.map((o) => o.toProto()),
      proposalId: proposal_id,
      voter,
    })
  }

  public packAny(): Any {
    return Any.fromPartial({
      typeUrl: '/cosmos.gov.v1beta1.MsgVoteWeighted',
      value: MsgVoteWeighted_pb.encode(this.toProto()).finish(),
    })
  }

  public static unpackAny(msgAny: Any): MsgVoteWeightedLegacy {
    return MsgVoteWeightedLegacy.fromProto(
      MsgVoteWeighted_pb.decode(msgAny.value)
    )
  }
}

export namespace MsgVoteWeightedLegacy {
  export interface Amino {
    type: 'cosmos-sdk/MsgVoteWeighted'
    value: {
      proposal_id: string
      voter: AccAddress
      options: WeightedVoteOption.Amino[]
    }
  }

  export interface Data {
    '@type': '/cosmos.gov.v1beta1.MsgVoteWeighted'
    proposal_id: string
    voter: AccAddress
    options: WeightedVoteOption.Data[]
  }

  export type Proto = MsgVoteWeighted_pb
}
