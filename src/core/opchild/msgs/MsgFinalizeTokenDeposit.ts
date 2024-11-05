import { JSONSerializable } from '../../../util/json'
import { AccAddress } from '../../bech32'
import { Coin } from '../../Coin'
import { Denom } from '../../Denom'
import { MsgFinalizeTokenDeposit as MsgFinalizeTokenDeposit_pb } from '@initia/opinit.proto/opinit/opchild/v1/tx'
import { Any } from '@initia/initia.proto/google/protobuf/any'
import Long from 'long'

export class MsgFinalizeTokenDeposit extends JSONSerializable<
  MsgFinalizeTokenDeposit.Amino,
  MsgFinalizeTokenDeposit.Data,
  MsgFinalizeTokenDeposit.Proto
> {
  /**
   * @param sender the sender address
   * @param from l1 sender address
   * @param to l2 recipient address
   * @param amount the coin amount to deposit
   * @param sequence the sequence number of l1 bridge
   * @param height the height of l1 which is including the deposit message
   * @param base_denom the l1 denomination of the sent coin
   * @param data extra bytes for hooks
   */
  constructor(
    public sender: AccAddress,
    public from: AccAddress,
    public to: AccAddress,
    public amount: Coin,
    public sequence: number,
    public height: number,
    public base_denom: Denom,
    public data?: string
  ) {
    super()
  }

  public static fromAmino(
    msgAmino: MsgFinalizeTokenDeposit.Amino
  ): MsgFinalizeTokenDeposit {
    const {
      value: { sender, from, to, amount, sequence, height, base_denom, data },
    } = msgAmino
    return new MsgFinalizeTokenDeposit(
      sender,
      from,
      to,
      Coin.fromAmino(amount),
      parseInt(sequence),
      parseInt(height),
      base_denom,
      data
    )
  }

  public toAmino(): MsgFinalizeTokenDeposit.Amino {
    const { sender, from, to, amount, sequence, height, base_denom, data } =
      this
    return {
      type: 'opchild/MsgFinalizeTokenDeposit',
      value: {
        sender,
        from,
        to,
        amount: amount.toAmino(),
        sequence: sequence.toString(),
        height: height.toString(),
        base_denom,
        data,
      },
    }
  }

  public static fromData(
    msgData: MsgFinalizeTokenDeposit.Data
  ): MsgFinalizeTokenDeposit {
    const { sender, from, to, amount, sequence, height, base_denom, data } =
      msgData
    return new MsgFinalizeTokenDeposit(
      sender,
      from,
      to,
      Coin.fromData(amount),
      parseInt(sequence),
      parseInt(height),
      base_denom,
      data
    )
  }

  public toData(): MsgFinalizeTokenDeposit.Data {
    const { sender, from, to, amount, sequence, height, base_denom, data } =
      this
    return {
      '@type': '/opinit.opchild.v1.MsgFinalizeTokenDeposit',
      sender,
      from,
      to,
      amount: amount.toData(),
      sequence: sequence.toString(),
      height: height.toString(),
      base_denom,
      data,
    }
  }

  public static fromProto(
    msgProto: MsgFinalizeTokenDeposit.Proto
  ): MsgFinalizeTokenDeposit {
    return new MsgFinalizeTokenDeposit(
      msgProto.sender,
      msgProto.from,
      msgProto.to,
      Coin.fromProto(msgProto.amount as Coin),
      msgProto.sequence.toNumber(),
      msgProto.height.toNumber(),
      msgProto.baseDenom,
      msgProto.data.length
        ? Buffer.from(msgProto.data).toString('base64')
        : undefined
    )
  }

  public toProto(): MsgFinalizeTokenDeposit.Proto {
    const { sender, from, to, amount, sequence, height, base_denom, data } =
      this
    return MsgFinalizeTokenDeposit_pb.fromPartial({
      sender,
      from,
      to,
      amount: amount.toProto(),
      sequence: Long.fromNumber(sequence),
      height: Long.fromNumber(height),
      baseDenom: base_denom,
      data: data ? Buffer.from(data, 'base64') : undefined,
    })
  }

  public packAny(): Any {
    return Any.fromPartial({
      typeUrl: '/opinit.opchild.v1.MsgFinalizeTokenDeposit',
      value: MsgFinalizeTokenDeposit_pb.encode(this.toProto()).finish(),
    })
  }

  public static unpackAny(msgAny: Any): MsgFinalizeTokenDeposit {
    return MsgFinalizeTokenDeposit.fromProto(
      MsgFinalizeTokenDeposit_pb.decode(msgAny.value)
    )
  }
}

export namespace MsgFinalizeTokenDeposit {
  export interface Amino {
    type: 'opchild/MsgFinalizeTokenDeposit'
    value: {
      sender: AccAddress
      from: AccAddress
      to: AccAddress
      amount: Coin.Amino
      sequence: string
      height: string
      base_denom: Denom
      data?: string
    }
  }

  export interface Data {
    '@type': '/opinit.opchild.v1.MsgFinalizeTokenDeposit'
    sender: AccAddress
    from: AccAddress
    to: AccAddress
    amount: Coin.Data
    sequence: string
    height: string
    base_denom: Denom
    data?: string
  }

  export type Proto = MsgFinalizeTokenDeposit_pb
}
