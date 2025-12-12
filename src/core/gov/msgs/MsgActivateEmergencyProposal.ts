import { JSONSerializable } from '../../../util/json'
import { AccAddress } from '../../bech32'
import { Any } from '@initia/initia.proto/google/protobuf/any'
import { MsgActivateEmergencyProposal as MsgActivateEmergencyProposal_pb } from '@initia/initia.proto/initia/gov/v1/tx'

/**
 * MsgActivateEmergencyProposal defines an operation for activating an emergency proposal.
 */
export class MsgActivateEmergencyProposal extends JSONSerializable<
  MsgActivateEmergencyProposal.Amino,
  MsgActivateEmergencyProposal.Data,
  MsgActivateEmergencyProposal.Proto
> {
  /**
   * @param sender
   * @param proposal_id
   */
  constructor(
    public sender: AccAddress,
    public proposal_id: number
  ) {
    super()
  }

  public static fromAmino(
    data: MsgActivateEmergencyProposal.Amino
  ): MsgActivateEmergencyProposal {
    const {
      value: { sender, proposal_id },
    } = data
    return new MsgActivateEmergencyProposal(sender, parseInt(proposal_id))
  }

  public toAmino(): MsgActivateEmergencyProposal.Amino {
    const { sender, proposal_id } = this
    return {
      type: 'gov/MsgActivateEmergencyProposal',
      value: {
        sender,
        proposal_id: proposal_id.toFixed(),
      },
    }
  }

  public static fromData(
    data: MsgActivateEmergencyProposal.Data
  ): MsgActivateEmergencyProposal {
    const { sender, proposal_id } = data
    return new MsgActivateEmergencyProposal(sender, parseInt(proposal_id))
  }

  public toData(): MsgActivateEmergencyProposal.Data {
    const { sender, proposal_id } = this
    return {
      '@type': '/initia.gov.v1.MsgActivateEmergencyProposal',
      sender,
      proposal_id: proposal_id.toFixed(),
    }
  }

  public static fromProto(
    data: MsgActivateEmergencyProposal.Proto
  ): MsgActivateEmergencyProposal {
    return new MsgActivateEmergencyProposal(
      data.sender,
      Number(data.proposalId)
    )
  }

  public toProto(): MsgActivateEmergencyProposal.Proto {
    const { sender, proposal_id } = this
    return MsgActivateEmergencyProposal_pb.fromPartial({
      sender,
      proposalId: BigInt(proposal_id),
    })
  }

  public packAny(): Any {
    return Any.fromPartial({
      typeUrl: '/initia.gov.v1.MsgActivateEmergencyProposal',
      value: MsgActivateEmergencyProposal_pb.encode(this.toProto()).finish(),
    })
  }

  public static unpackAny(msgAny: Any): MsgActivateEmergencyProposal {
    return MsgActivateEmergencyProposal.fromProto(
      MsgActivateEmergencyProposal_pb.decode(msgAny.value)
    )
  }
}

export namespace MsgActivateEmergencyProposal {
  export interface Amino {
    type: 'gov/MsgActivateEmergencyProposal'
    value: {
      sender: AccAddress
      proposal_id: string
    }
  }

  export interface Data {
    '@type': '/initia.gov.v1.MsgActivateEmergencyProposal'
    sender: AccAddress
    proposal_id: string
  }

  export type Proto = MsgActivateEmergencyProposal_pb
}
