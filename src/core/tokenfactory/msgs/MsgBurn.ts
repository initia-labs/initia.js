import { JSONSerializable } from '../../../util/json'
import { Coin } from '../../Coin'
import { AccAddress } from '../../bech32'
import { Any } from '@initia/initia.proto/google/protobuf/any'
import { MsgBurn as MsgBurn_pb } from '@initia/initia.proto/miniwasm/tokenfactory/v1/tx'

/**
 * MsgBurn allows an admin account to burn a token.
 * Only the admin of the token factory denom has permission to burn unless
 * the denom does not have any admin.
 */
export class MsgBurn extends JSONSerializable<
  MsgBurn.Amino,
  MsgBurn.Data,
  MsgBurn.Proto
> {
  /**
   * @param sender
   * @param amount
   */
  constructor(
    public sender: AccAddress,
    public amount: Coin
  ) {
    super()
  }

  public static fromAmino(data: MsgBurn.Amino): MsgBurn {
    const {
      value: { sender, amount },
    } = data

    return new MsgBurn(sender, Coin.fromAmino(amount))
  }

  public toAmino(): MsgBurn.Amino {
    const { sender, amount } = this
    return {
      type: 'tokenfactory/MsgBurn',
      value: {
        sender,
        amount: amount.toAmino(),
      },
    }
  }

  public static fromData(data: MsgBurn.Data): MsgBurn {
    const { sender, amount } = data
    return new MsgBurn(sender, Coin.fromData(amount))
  }

  public toData(): MsgBurn.Data {
    const { sender, amount } = this
    return {
      '@type': '/miniwasm.tokenfactory.v1.MsgBurn',
      sender,
      amount: amount.toData(),
    }
  }

  public static fromProto(data: MsgBurn.Proto): MsgBurn {
    return new MsgBurn(data.sender, Coin.fromProto(data.amount as Coin.Proto))
  }

  public toProto(): MsgBurn.Proto {
    const { sender, amount } = this
    return MsgBurn_pb.fromPartial({
      sender,
      amount: amount.toProto(),
    })
  }

  public packAny(): Any {
    return Any.fromPartial({
      typeUrl: '/miniwasm.tokenfactory.v1.MsgBurn',
      value: MsgBurn_pb.encode(this.toProto()).finish(),
    })
  }

  public static unpackAny(msgAny: Any): MsgBurn {
    return MsgBurn.fromProto(MsgBurn_pb.decode(msgAny.value))
  }
}

export namespace MsgBurn {
  export interface Amino {
    type: 'tokenfactory/MsgBurn'
    value: {
      sender: AccAddress
      amount: Coin.Amino
    }
  }

  export interface Data {
    '@type': '/miniwasm.tokenfactory.v1.MsgBurn'
    sender: AccAddress
    amount: Coin.Data
  }

  export type Proto = MsgBurn_pb
}
