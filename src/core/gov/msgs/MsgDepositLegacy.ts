import { Coins } from '../../Coins'
import { JSONSerializable } from '../../../util/json'
import { AccAddress } from '../../bech32'
import { Any } from '@initia/initia.proto/google/protobuf/any'
import { MsgDeposit as MsgDeposit_pb } from '@initia/initia.proto/cosmos/gov/v1beta1/tx'

/**
 * MsgDepositLegacy adds a deposit for a proposal.
 */
export class MsgDepositLegacy extends JSONSerializable<
  MsgDepositLegacy.Amino,
  MsgDepositLegacy.Data,
  MsgDepositLegacy.Proto
> {
  public amount: Coins
  /**
   * @param proposal_id Id of proposal to deposit to
   * @param depositor depositor's account address
   * @param amount amount to deposit
   */
  constructor(
    public proposal_id: number,
    public depositor: AccAddress,
    amount: Coins.Input
  ) {
    super()
    this.amount = new Coins(amount)
  }

  public static fromAmino(data: MsgDepositLegacy.Amino): MsgDepositLegacy {
    const {
      value: { proposal_id, depositor, amount },
    } = data
    return new MsgDepositLegacy(
      parseInt(proposal_id),
      depositor,
      Coins.fromAmino(amount)
    )
  }

  public toAmino(): MsgDepositLegacy.Amino {
    const { proposal_id, depositor, amount } = this
    return {
      type: 'cosmos-sdk/MsgDeposit',
      value: {
        proposal_id: proposal_id.toFixed(),
        depositor,
        amount: amount.toAmino(),
      },
    }
  }

  public static fromData(data: MsgDepositLegacy.Data): MsgDepositLegacy {
    const { proposal_id, depositor, amount } = data
    return new MsgDepositLegacy(
      parseInt(proposal_id),
      depositor,
      Coins.fromData(amount)
    )
  }

  public toData(): MsgDepositLegacy.Data {
    const { proposal_id, depositor, amount } = this
    return {
      '@type': '/cosmos.gov.v1beta1.MsgDeposit',
      proposal_id: proposal_id.toFixed(),
      depositor,
      amount: amount.toData(),
    }
  }

  public static fromProto(proto: MsgDepositLegacy.Proto): MsgDepositLegacy {
    return new MsgDepositLegacy(
      Number(proto.proposalId),
      proto.depositor,
      Coins.fromProto(proto.amount)
    )
  }

  public toProto(): MsgDepositLegacy.Proto {
    const { proposal_id, depositor, amount } = this
    return MsgDeposit_pb.fromPartial({
      amount: amount.toProto(),
      depositor,
      proposalId: BigInt(proposal_id),
    })
  }

  public packAny(): Any {
    return Any.fromPartial({
      typeUrl: '/cosmos.gov.v1beta1.MsgDeposit',
      value: MsgDeposit_pb.encode(this.toProto()).finish(),
    })
  }

  public static unpackAny(msgAny: Any): MsgDepositLegacy {
    return MsgDepositLegacy.fromProto(MsgDeposit_pb.decode(msgAny.value))
  }
}

export namespace MsgDepositLegacy {
  export interface Amino {
    type: 'cosmos-sdk/MsgDeposit'
    value: {
      proposal_id: string
      depositor: AccAddress
      amount: Coins.Amino
    }
  }

  export interface Data {
    '@type': '/cosmos.gov.v1beta1.MsgDeposit'
    proposal_id: string
    depositor: AccAddress
    amount: Coins.Data
  }

  export type Proto = MsgDeposit_pb
}
