import { JSONSerializable } from '../../../util/json'
import { Coin } from '../../Coin'
import { AccAddress } from '../../bech32'
import { Any } from '@initia/initia.proto/google/protobuf/any'
import { MsgMint as MsgMint_pb } from '@initia/initia.proto/miniwasm/tokenfactory/v1/tx'

export class MsgMint extends JSONSerializable<
  MsgMint.Amino,
  MsgMint.Data,
  MsgMint.Proto
> {
  /**
   * @param sender
   * @param amount
   * @param mint_to_address
   */
  constructor(
    public sender: AccAddress,
    public amount: Coin,
    public mint_to_address: AccAddress
  ) {
    super()
  }

  public static fromAmino(data: MsgMint.Amino): MsgMint {
    const {
      value: { sender, amount, mint_to_address },
    } = data

    return new MsgMint(sender, Coin.fromAmino(amount), mint_to_address)
  }

  public toAmino(): MsgMint.Amino {
    const { sender, amount, mint_to_address } = this
    return {
      type: 'tokenfactory/MsgMint',
      value: {
        sender,
        amount: amount.toAmino(),
        mint_to_address,
      },
    }
  }

  public static fromData(data: MsgMint.Data): MsgMint {
    const { sender, amount, mint_to_address } = data
    return new MsgMint(sender, Coin.fromData(amount), mint_to_address)
  }

  public toData(): MsgMint.Data {
    const { sender, amount, mint_to_address } = this
    return {
      '@type': '/miniwasm.tokenfactory.v1.MsgMint',
      sender,
      amount: amount.toData(),
      mint_to_address,
    }
  }

  public static fromProto(data: MsgMint.Proto): MsgMint {
    return new MsgMint(
      data.sender,
      Coin.fromProto(data.amount as Coin.Proto),
      data.mintToAddress
    )
  }

  public toProto(): MsgMint.Proto {
    const { sender, amount, mint_to_address } = this
    return MsgMint_pb.fromPartial({
      sender,
      amount: amount.toProto(),
      mintToAddress: mint_to_address,
    })
  }

  public packAny(): Any {
    return Any.fromPartial({
      typeUrl: '/miniwasm.tokenfactory.v1.MsgMint',
      value: MsgMint_pb.encode(this.toProto()).finish(),
    })
  }

  public static unpackAny(msgAny: Any): MsgMint {
    return MsgMint.fromProto(MsgMint_pb.decode(msgAny.value))
  }
}

export namespace MsgMint {
  export interface Amino {
    type: 'tokenfactory/MsgMint'
    value: {
      sender: AccAddress
      amount: Coin.Amino
      mint_to_address: AccAddress
    }
  }

  export interface Data {
    '@type': '/miniwasm.tokenfactory.v1.MsgMint'
    sender: AccAddress
    amount: Coin.Data
    mint_to_address: AccAddress
  }

  export type Proto = MsgMint_pb
}
