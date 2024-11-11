import { PacketFee as PacketFee_pb } from '@initia/initia.proto/ibc/applications/fee/v1/fee'
import { JSONSerializable } from '../../../../util/json'
import { IbcFee } from './IbcFee'
import { AccAddress } from '../../../..'

/**
 * PacketFee contains ICS29 relayer fees, refund address and optional list of permitted relayers.
 */
export class PacketFee extends JSONSerializable<
  PacketFee.Amino,
  PacketFee.Data,
  PacketFee.Proto
> {
  /**
   * @param fee fee encapsulates the recv, ack and timeout fees associated with an IBC packet
   * @param refund_address the refund address for unspent fees
   * @param relayers  optional list of relayers permitted to receive fees
   */
  constructor(
    public fee: IbcFee | undefined,
    public refund_address: AccAddress,
    public relayers: string[] = []
  ) {
    super()
  }

  public static fromAmino(data: PacketFee.Amino): PacketFee {
    const { fee, refund_address, relayers } = data
    return new PacketFee(
      fee ? IbcFee.fromAmino(fee) : undefined,
      refund_address,
      relayers
    )
  }

  public toAmino(): PacketFee.Amino {
    const { fee, refund_address, relayers } = this
    return {
      fee: fee?.toAmino(),
      refund_address,
      relayers,
    }
  }

  public static fromData(data: PacketFee.Data): PacketFee {
    const { fee, refund_address, relayers } = data
    return new PacketFee(
      fee ? IbcFee.fromData(fee) : undefined,
      refund_address,
      relayers
    )
  }

  public toData(): PacketFee.Data {
    const { fee, refund_address, relayers } = this
    return {
      fee: fee?.toData(),
      refund_address,
      relayers,
    }
  }

  public static fromProto(proto: PacketFee.Proto): PacketFee {
    return new PacketFee(
      proto.fee ? IbcFee.fromProto(proto.fee) : undefined,
      proto.refundAddress,
      proto.relayers
    )
  }

  public toProto(): PacketFee.Proto {
    const { fee, refund_address, relayers } = this
    return PacketFee_pb.fromPartial({
      fee: fee?.toProto(),
      refundAddress: refund_address,
      relayers,
    })
  }
}

export namespace PacketFee {
  export interface Amino {
    fee?: IbcFee.Amino
    refund_address: AccAddress
    relayers: string[]
  }

  export interface Data {
    fee?: IbcFee.Data
    refund_address: AccAddress
    relayers: string[]
  }

  export type Proto = PacketFee_pb
}
