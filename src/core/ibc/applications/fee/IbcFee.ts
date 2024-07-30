import { Fee as Fee_pb } from '@initia/initia.proto/ibc/applications/fee/v1/fee'
import { Coins } from '../../../Coins'
import { JSONSerializable } from '../../../../util/json'

/**
 *  Fee defines the ICS29 receive, acknowledgement and timeout fees
 */
export class IbcFee extends JSONSerializable<
  IbcFee.Amino,
  IbcFee.Data,
  IbcFee.Proto
> {
  /** the packet receive fee */
  public recv_fee: Coins
  /** the packet acknowledgement fee */
  public ack_fee: Coins
  /** the packet timeout fee */
  public timeout_fee: Coins
  /**
   * @param recv_fee the packet receive fee
   * @param ack_fee the packet acknowledgement fee
   * @param timeout_fee the packet timeout fee
   */
  constructor(
    recv_fee: Coins.Input,
    ack_fee: Coins.Input,
    timeout_fee: Coins.Input
  ) {
    super()
    this.recv_fee = new Coins(recv_fee)
    this.ack_fee = new Coins(ack_fee)
    this.timeout_fee = new Coins(timeout_fee)
  }

  public static fromAmino(data: IbcFee.Amino): IbcFee {
    const { recv_fee, ack_fee, timeout_fee } = data
    return new IbcFee(
      Coins.fromAmino(recv_fee),
      Coins.fromAmino(ack_fee),
      Coins.fromAmino(timeout_fee)
    )
  }

  public toAmino(): IbcFee.Amino {
    const { recv_fee, ack_fee, timeout_fee } = this
    const res: IbcFee.Amino = {
      recv_fee: recv_fee.toAmino(),
      ack_fee: ack_fee.toAmino(),
      timeout_fee: timeout_fee.toAmino(),
    }
    return res
  }

  public static fromData(data: IbcFee.Data): IbcFee {
    const { recv_fee, ack_fee, timeout_fee } = data
    return new IbcFee(
      Coins.fromData(recv_fee),
      Coins.fromData(ack_fee),
      Coins.fromData(timeout_fee)
    )
  }

  public toData(): IbcFee.Data {
    const { recv_fee, ack_fee, timeout_fee } = this
    const res: IbcFee.Data = {
      recv_fee: recv_fee.toData(),
      ack_fee: ack_fee.toData(),
      timeout_fee: timeout_fee.toData(),
    }
    return res
  }

  public static fromProto(proto: IbcFee.Proto): IbcFee {
    return new IbcFee(
      Coins.fromProto(proto.recvFee),
      Coins.fromProto(proto.ackFee),
      Coins.fromProto(proto.timeoutFee)
    )
  }

  public toProto(): IbcFee.Proto {
    const { recv_fee, ack_fee, timeout_fee } = this
    return Fee_pb.fromPartial({
      recvFee: recv_fee.toProto(),
      ackFee: ack_fee.toProto(),
      timeoutFee: timeout_fee.toProto(),
    })
  }
}

export namespace IbcFee {
  export interface Amino {
    recv_fee: Coins.Amino
    ack_fee: Coins.Amino
    timeout_fee: Coins.Amino
  }

  export interface Data {
    recv_fee: Coins.Data
    ack_fee: Coins.Data
    timeout_fee: Coins.Data
  }

  export type Proto = Fee_pb
}
