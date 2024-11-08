import { JSONSerializable } from '../../../util/json'
import { Coin } from '../../Coin'
import { AccAddress } from '../../bech32'
import { Any } from '@initia/initia.proto/google/protobuf/any'
import { MsgForceTransfer as MsgForceTransfer_pb } from '@initia/initia.proto/miniwasm/tokenfactory/v1/tx'

/**
 * MsgForceTransfer allows an admin account to transfer a token from one account to another.
 */
export class MsgForceTransfer extends JSONSerializable<
  MsgForceTransfer.Amino,
  MsgForceTransfer.Data,
  MsgForceTransfer.Proto
> {
  /**
   * @param sender
   * @param amount
   * @param transfer_from_address
   * @param transfer_to_address
   */
  constructor(
    public sender: AccAddress,
    public amount: Coin,
    public transfer_from_address: AccAddress,
    public transfer_to_address: AccAddress
  ) {
    super()
  }

  public static fromAmino(data: MsgForceTransfer.Amino): MsgForceTransfer {
    const {
      value: { sender, amount, transfer_from_address, transfer_to_address },
    } = data

    return new MsgForceTransfer(
      sender,
      Coin.fromAmino(amount),
      transfer_from_address,
      transfer_to_address
    )
  }

  public toAmino(): MsgForceTransfer.Amino {
    const { sender, amount, transfer_from_address, transfer_to_address } = this
    return {
      type: 'tokenfactory/MsgForceTransfer',
      value: {
        sender,
        amount: amount.toAmino(),
        transfer_from_address,
        transfer_to_address,
      },
    }
  }

  public static fromData(data: MsgForceTransfer.Data): MsgForceTransfer {
    const { sender, amount, transfer_from_address, transfer_to_address } = data
    return new MsgForceTransfer(
      sender,
      Coin.fromData(amount),
      transfer_from_address,
      transfer_to_address
    )
  }

  public toData(): MsgForceTransfer.Data {
    const { sender, amount, transfer_from_address, transfer_to_address } = this
    return {
      '@type': '/miniwasm.tokenfactory.v1.MsgForceTransfer',
      sender,
      amount: amount.toData(),
      transfer_from_address,
      transfer_to_address,
    }
  }

  public static fromProto(data: MsgForceTransfer.Proto): MsgForceTransfer {
    return new MsgForceTransfer(
      data.sender,
      Coin.fromProto(data.amount as Coin.Proto),
      data.transferFromAddress,
      data.transferToAddress
    )
  }

  public toProto(): MsgForceTransfer.Proto {
    const { sender, amount, transfer_from_address, transfer_to_address } = this
    return MsgForceTransfer_pb.fromPartial({
      sender,
      amount: amount.toProto(),
      transferFromAddress: transfer_from_address,
      transferToAddress: transfer_to_address,
    })
  }

  public packAny(): Any {
    return Any.fromPartial({
      typeUrl: '/miniwasm.tokenfactory.v1.MsgForceTransfer',
      value: MsgForceTransfer_pb.encode(this.toProto()).finish(),
    })
  }

  public static unpackAny(msgAny: Any): MsgForceTransfer {
    return MsgForceTransfer.fromProto(MsgForceTransfer_pb.decode(msgAny.value))
  }
}

export namespace MsgForceTransfer {
  export interface Amino {
    type: 'tokenfactory/MsgForceTransfer'
    value: {
      sender: AccAddress
      amount: Coin.Amino
      transfer_from_address: AccAddress
      transfer_to_address: AccAddress
    }
  }

  export interface Data {
    '@type': '/miniwasm.tokenfactory.v1.MsgForceTransfer'
    sender: AccAddress
    amount: Coin.Data
    transfer_from_address: AccAddress
    transfer_to_address: AccAddress
  }

  export type Proto = MsgForceTransfer_pb
}
