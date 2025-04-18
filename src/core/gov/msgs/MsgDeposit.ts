import { Coins } from '../../Coins'
import { JSONSerializable } from '../../../util/json'
import { AccAddress } from '../../bech32'
import { Any } from '@initia/initia.proto/google/protobuf/any'
import { MsgDeposit as MsgDeposit_pb } from '@initia/initia.proto/cosmos/gov/v1/tx'

/**
 * MsgDeposit defines a message to submit a deposit to an existing proposal.
 */
export class MsgDeposit extends JSONSerializable<
  MsgDeposit.Amino,
  MsgDeposit.Data,
  MsgDeposit.Proto
> {
  public amount: Coins
  /**
   * @param proposal_id the unique id of the proposal
   * @param depositor the deposit addresses from the proposals
   * @param amount amount to be deposited by depositor
   */
  constructor(
    public proposal_id: number,
    public depositor: AccAddress,
    amount: Coins.Input
  ) {
    super()
    this.amount = new Coins(amount)
  }

  public static fromAmino(data: MsgDeposit.Amino): MsgDeposit {
    const {
      value: { proposal_id, depositor, amount },
    } = data
    return new MsgDeposit(
      parseInt(proposal_id),
      depositor,
      amount ? Coins.fromAmino(amount) : new Coins()
    )
  }

  public toAmino(): MsgDeposit.Amino {
    const { proposal_id, depositor, amount } = this
    return {
      type: 'cosmos-sdk/v1/MsgDeposit',
      value: {
        proposal_id: proposal_id.toFixed(),
        depositor,
        amount: amount.toArray().length > 0 ? amount.toAmino() : null,
      },
    }
  }

  public static fromData(data: MsgDeposit.Data): MsgDeposit {
    const { proposal_id, depositor, amount } = data
    return new MsgDeposit(
      parseInt(proposal_id),
      depositor,
      Coins.fromData(amount)
    )
  }

  public toData(): MsgDeposit.Data {
    const { proposal_id, depositor, amount } = this
    return {
      '@type': '/cosmos.gov.v1.MsgDeposit',
      proposal_id: proposal_id.toFixed(),
      depositor,
      amount: amount.toData(),
    }
  }

  public static fromProto(proto: MsgDeposit.Proto): MsgDeposit {
    return new MsgDeposit(
      Number(proto.proposalId),
      proto.depositor,
      Coins.fromProto(proto.amount)
    )
  }

  public toProto(): MsgDeposit.Proto {
    const { proposal_id, depositor, amount } = this
    return MsgDeposit_pb.fromPartial({
      amount: amount.toProto(),
      depositor,
      proposalId: BigInt(proposal_id),
    })
  }

  public packAny(): Any {
    return Any.fromPartial({
      typeUrl: '/cosmos.gov.v1.MsgDeposit',
      value: MsgDeposit_pb.encode(this.toProto()).finish(),
    })
  }

  public static unpackAny(msgAny: Any): MsgDeposit {
    return MsgDeposit.fromProto(MsgDeposit_pb.decode(msgAny.value))
  }
}

export namespace MsgDeposit {
  export interface Amino {
    type: 'cosmos-sdk/v1/MsgDeposit'
    value: {
      proposal_id: string
      depositor: AccAddress
      amount: Coins.Amino | null
    }
  }

  export interface Data {
    '@type': '/cosmos.gov.v1.MsgDeposit'
    proposal_id: string
    depositor: AccAddress
    amount: Coins.Data
  }

  export type Proto = MsgDeposit_pb
}
