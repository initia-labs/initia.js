import { JSONSerializable } from '../../../util/json';
import { AccAddress } from '../../bech32';
import { Any } from '@initia/initia.proto/google/protobuf/any';
import { MsgCancelProposal as MsgCancelProposal_pb } from '@initia/initia.proto/cosmos/gov/v1/tx';
import Long from 'long';

export class MsgCancelProposal extends JSONSerializable<
  MsgCancelProposal.Amino,
  MsgCancelProposal.Data,
  MsgCancelProposal.Proto
> {
  /**
   * @param proposal_id the unique id of the proposal
   * @param proposer the account address of the proposer
   */
  constructor(public proposal_id: number, public proposer: AccAddress) {
    super();
  }

  public static fromAmino(data: MsgCancelProposal.Amino): MsgCancelProposal {
    const {
      value: { proposal_id, proposer },
    } = data;
    return new MsgCancelProposal(Number.parseInt(proposal_id), proposer);
  }

  public toAmino(): MsgCancelProposal.Amino {
    const { proposal_id, proposer } = this;
    return {
      type: 'cosmos-sdk/v1/MsgCancelProposal',
      value: {
        proposal_id: proposal_id.toString(),
        proposer,
      },
    };
  }

  public static fromData(data: MsgCancelProposal.Data): MsgCancelProposal {
    const { proposal_id, proposer } = data;
    return new MsgCancelProposal(Number.parseInt(proposal_id), proposer);
  }

  public toData(): MsgCancelProposal.Data {
    const { proposal_id, proposer } = this;
    return {
      '@type': '/cosmos.gov.v1.MsgCancelProposal',
      proposal_id: proposal_id.toString(),
      proposer,
    };
  }

  public static fromProto(proto: MsgCancelProposal.Proto): MsgCancelProposal {
    return new MsgCancelProposal(proto.proposalId.toNumber(), proto.proposer);
  }

  public toProto(): MsgCancelProposal.Proto {
    const { proposal_id, proposer } = this;
    return MsgCancelProposal_pb.fromPartial({
      proposalId: Long.fromNumber(proposal_id),
      proposer,
    });
  }

  public packAny(): Any {
    return Any.fromPartial({
      typeUrl: '/cosmos.gov.v1.MsgCancelProposal',
      value: MsgCancelProposal_pb.encode(this.toProto()).finish(),
    });
  }

  public static unpackAny(msgAny: Any): MsgCancelProposal {
    return MsgCancelProposal.fromProto(
      MsgCancelProposal_pb.decode(msgAny.value)
    );
  }
}

export namespace MsgCancelProposal {
  export interface Amino {
    type: 'cosmos-sdk/v1/MsgCancelProposal';
    value: {
      proposal_id: string;
      proposer: AccAddress;
    };
  }

  export interface Data {
    '@type': '/cosmos.gov.v1.MsgCancelProposal';
    proposal_id: string;
    proposer: AccAddress;
  }

  export type Proto = MsgCancelProposal_pb;
}
