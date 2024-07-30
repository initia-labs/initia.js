import { JSONSerializable } from '../../../util/json'
import { AccAddress } from '../../bech32'
import { Coin } from '../../Coin'
import { MsgInitiateTokenWithdrawal as MsgInitiateTokenWithdrawal_pb } from '@initia/opinit.proto/opinit/opchild/v1/tx'
import { Any } from '@initia/initia.proto/google/protobuf/any'

export class MsgInitiateTokenWithdrawal extends JSONSerializable<
  MsgInitiateTokenWithdrawal.Amino,
  MsgInitiateTokenWithdrawal.Data,
  MsgInitiateTokenWithdrawal.Proto
> {
  /**
   * @param sender the l2 sender address
   * @param to l1 recipient address
   * @param amount the coin amount to withdraw
   */
  constructor(
    public sender: AccAddress,
    public to: AccAddress,
    public amount: Coin
  ) {
    super()
  }

  public static fromAmino(
    data: MsgInitiateTokenWithdrawal.Amino
  ): MsgInitiateTokenWithdrawal {
    const {
      value: { sender, to, amount },
    } = data
    return new MsgInitiateTokenWithdrawal(sender, to, Coin.fromAmino(amount))
  }

  public toAmino(): MsgInitiateTokenWithdrawal.Amino {
    const { sender, to, amount } = this
    return {
      type: 'opchild/MsgInitiateTokenWithdrawal',
      value: {
        sender,
        to,
        amount: amount.toAmino(),
      },
    }
  }

  public static fromData(
    data: MsgInitiateTokenWithdrawal.Data
  ): MsgInitiateTokenWithdrawal {
    const { sender, to, amount } = data
    return new MsgInitiateTokenWithdrawal(sender, to, Coin.fromData(amount))
  }

  public toData(): MsgInitiateTokenWithdrawal.Data {
    const { sender, to, amount } = this
    return {
      '@type': '/opinit.opchild.v1.MsgInitiateTokenWithdrawal',
      sender,
      to,
      amount: amount.toData(),
    }
  }

  public static fromProto(
    data: MsgInitiateTokenWithdrawal.Proto
  ): MsgInitiateTokenWithdrawal {
    return new MsgInitiateTokenWithdrawal(
      data.sender,
      data.to,
      Coin.fromProto(data.amount as Coin)
    )
  }

  public toProto(): MsgInitiateTokenWithdrawal.Proto {
    const { sender, to, amount } = this
    return MsgInitiateTokenWithdrawal_pb.fromPartial({
      sender,
      to,
      amount: amount.toProto(),
    })
  }

  public packAny(): Any {
    return Any.fromPartial({
      typeUrl: '/opinit.opchild.v1.MsgInitiateTokenWithdrawal',
      value: MsgInitiateTokenWithdrawal_pb.encode(this.toProto()).finish(),
    })
  }

  public static unpackAny(msgAny: Any): MsgInitiateTokenWithdrawal {
    return MsgInitiateTokenWithdrawal.fromProto(
      MsgInitiateTokenWithdrawal_pb.decode(msgAny.value)
    )
  }
}

export namespace MsgInitiateTokenWithdrawal {
  export interface Amino {
    type: 'opchild/MsgInitiateTokenWithdrawal'
    value: {
      sender: AccAddress
      to: AccAddress
      amount: Coin.Amino
    }
  }

  export interface Data {
    '@type': '/opinit.opchild.v1.MsgInitiateTokenWithdrawal'
    sender: AccAddress
    to: AccAddress
    amount: Coin.Data
  }

  export type Proto = MsgInitiateTokenWithdrawal_pb
}
