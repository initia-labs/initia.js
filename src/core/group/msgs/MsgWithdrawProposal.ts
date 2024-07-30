import { JSONSerializable } from '../../../util/json'
import { AccAddress } from '../../bech32'
import { Any } from '@initia/initia.proto/google/protobuf/any'
import { MsgWithdrawProposal as MsgWithdrawProposal_pb } from '@initia/initia.proto/cosmos/group/v1/tx'
import Long from 'long'

export class MsgWithdrawProposal extends JSONSerializable<
  MsgWithdrawProposal.Amino,
  MsgWithdrawProposal.Data,
  MsgWithdrawProposal.Proto
> {
  /**
   * @param proposal_id the unique ID of the proposal
   * @param address the admin of the group policy or one of the proposer of the proposal
   */
  constructor(
    public proposal_id: number,
    public address: AccAddress
  ) {
    super()
  }

  public static fromAmino(
    data: MsgWithdrawProposal.Amino
  ): MsgWithdrawProposal {
    const {
      value: { proposal_id, address },
    } = data
    return new MsgWithdrawProposal(Number.parseInt(proposal_id), address)
  }

  public toAmino(): MsgWithdrawProposal.Amino {
    const { proposal_id, address } = this
    return {
      type: 'cosmos-sdk/group/MsgWithdrawProposal',
      value: {
        proposal_id: proposal_id.toString(),
        address,
      },
    }
  }

  public static fromData(data: MsgWithdrawProposal.Data): MsgWithdrawProposal {
    const { proposal_id, address } = data
    return new MsgWithdrawProposal(Number.parseInt(proposal_id), address)
  }

  public toData(): MsgWithdrawProposal.Data {
    const { proposal_id, address } = this
    return {
      '@type': '/cosmos.group.v1.MsgWithdrawProposal',
      proposal_id: proposal_id.toString(),
      address,
    }
  }

  public static fromProto(
    data: MsgWithdrawProposal.Proto
  ): MsgWithdrawProposal {
    return new MsgWithdrawProposal(data.proposalId.toNumber(), data.address)
  }

  public toProto(): MsgWithdrawProposal.Proto {
    const { proposal_id, address } = this
    return MsgWithdrawProposal_pb.fromPartial({
      proposalId: Long.fromNumber(proposal_id),
      address,
    })
  }

  public packAny(): Any {
    return Any.fromPartial({
      typeUrl: '/cosmos.group.v1.MsgWithdrawProposal',
      value: MsgWithdrawProposal_pb.encode(this.toProto()).finish(),
    })
  }

  public static unpackAny(msgAny: Any): MsgWithdrawProposal {
    return MsgWithdrawProposal.fromProto(
      MsgWithdrawProposal_pb.decode(msgAny.value)
    )
  }
}

export namespace MsgWithdrawProposal {
  export interface Amino {
    type: 'cosmos-sdk/group/MsgWithdrawProposal'
    value: {
      proposal_id: string
      address: AccAddress
    }
  }

  export interface Data {
    '@type': '/cosmos.group.v1.MsgWithdrawProposal'
    proposal_id: string
    address: AccAddress
  }

  export type Proto = MsgWithdrawProposal_pb
}
