import { JSONSerializable } from '../../../util/json'
import { Coin } from '../../Coin'
import { AccAddress } from '../../bech32'
import { Any } from '@initia/initia.proto/google/protobuf/any'
import { MsgBurn as MsgBurn_pb } from '@initia/initia.proto/miniwasm/tokenfactory/v1/tx'

export class MsgBurn extends JSONSerializable<
  MsgBurn.Amino,
  MsgBurn.Data,
  MsgBurn.Proto
> {
  /**
   * @param sender
   * @param amount
   * @param burn_from_address
   */
  constructor(
    public sender: AccAddress,
    public amount: Coin,
    public burn_from_address: AccAddress
  ) {
    super()
  }

  public static fromAmino(data: MsgBurn.Amino): MsgBurn {
    const {
      value: { sender, amount, burn_from_address },
    } = data

    return new MsgBurn(sender, Coin.fromAmino(amount), burn_from_address)
  }

  public toAmino(): MsgBurn.Amino {
    const { sender, amount, burn_from_address } = this
    return {
      type: 'tokenfactory/MsgBurn',
      value: {
        sender,
        amount: amount.toAmino(),
        burn_from_address,
      },
    }
  }

  public static fromData(data: MsgBurn.Data): MsgBurn {
    const { sender, amount, burn_from_address } = data
    return new MsgBurn(sender, Coin.fromData(amount), burn_from_address)
  }

  public toData(): MsgBurn.Data {
    const { sender, amount, burn_from_address } = this
    return {
      '@type': '/miniwasm.tokenfactory.v1.MsgBurn',
      sender,
      amount: amount.toData(),
      burn_from_address,
    }
  }

  public static fromProto(data: MsgBurn.Proto): MsgBurn {
    return new MsgBurn(
      data.sender,
      Coin.fromProto(data.amount as Coin.Proto),
      data.burnFromAddress
    )
  }

  public toProto(): MsgBurn.Proto {
    const { sender, amount, burn_from_address } = this
    return MsgBurn_pb.fromPartial({
      sender,
      amount: amount.toProto(),
      burnFromAddress: burn_from_address,
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
      burn_from_address: AccAddress
    }
  }

  export interface Data {
    '@type': '/miniwasm.tokenfactory.v1.MsgBurn'
    sender: AccAddress
    amount: Coin.Data
    burn_from_address: AccAddress
  }

  export type Proto = MsgBurn_pb
}
