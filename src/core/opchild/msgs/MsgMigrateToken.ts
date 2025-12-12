import { JSONSerializable } from '../../../util/json'
import { AccAddress } from '../../bech32'
import { Coin } from '../../Coin'
import { MsgMigrateToken as MsgMigrateToken_pb } from '@initia/opinit.proto/opinit/opchild/v1/tx'
import { Any } from '@initia/initia.proto/google/protobuf/any'

/**
 * MsgMigrateToken is a message to migrate the origin OP token to registered IBC token.
 */
export class MsgMigrateToken extends JSONSerializable<
  MsgMigrateToken.Amino,
  MsgMigrateToken.Data,
  MsgMigrateToken.Proto
> {
  /**
   * @param sender the l2 sender address
   * @param amount the coin amount to withdraw
   */
  constructor(
    public sender: AccAddress,
    public amount: Coin
  ) {
    super()
  }

  public static fromAmino(data: MsgMigrateToken.Amino): MsgMigrateToken {
    const {
      value: { sender, amount },
    } = data
    return new MsgMigrateToken(sender, Coin.fromAmino(amount))
  }

  public toAmino(): MsgMigrateToken.Amino {
    const { sender, amount } = this
    return {
      type: 'opchild/MsgMigrateToken',
      value: {
        sender,
        amount: amount.toAmino(),
      },
    }
  }

  public static fromData(data: MsgMigrateToken.Data): MsgMigrateToken {
    const { sender, amount } = data
    return new MsgMigrateToken(sender, Coin.fromData(amount))
  }

  public toData(): MsgMigrateToken.Data {
    const { sender, amount } = this
    return {
      '@type': '/opinit.opchild.v1.MsgMigrateToken',
      sender,
      amount: amount.toData(),
    }
  }

  public static fromProto(data: MsgMigrateToken.Proto): MsgMigrateToken {
    return new MsgMigrateToken(data.sender, Coin.fromProto(data.amount as Coin))
  }

  public toProto(): MsgMigrateToken.Proto {
    const { sender, amount } = this
    return MsgMigrateToken_pb.fromPartial({
      sender,
      amount: amount.toProto(),
    })
  }

  public packAny(): Any {
    return Any.fromPartial({
      typeUrl: '/opinit.opchild.v1.MsgMigrateToken',
      value: MsgMigrateToken_pb.encode(this.toProto()).finish(),
    })
  }

  public static unpackAny(msgAny: Any): MsgMigrateToken {
    return MsgMigrateToken.fromProto(MsgMigrateToken_pb.decode(msgAny.value))
  }
}

export namespace MsgMigrateToken {
  export interface Amino {
    type: 'opchild/MsgMigrateToken'
    value: {
      sender: AccAddress
      amount: Coin.Amino
    }
  }

  export interface Data {
    '@type': '/opinit.opchild.v1.MsgMigrateToken'
    sender: AccAddress
    amount: Coin.Data
  }

  export type Proto = MsgMigrateToken_pb
}
