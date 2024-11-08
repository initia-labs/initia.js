import { IdentifiedPacketFees as IdentifiedPacketFees_pb } from '@initia/initia.proto/ibc/applications/fee/v1/fee'
import { JSONSerializable } from '../../../../util/json'
import { PacketFee } from './PacketFee'
import { PacketId } from '../../core/channel/PacketId'

/**
 * IdentifiedPacketFees contains a list of type PacketFee and associated PacketId
 */
export class IdentifiedPacketFees extends JSONSerializable<
  IdentifiedPacketFees.Amino,
  IdentifiedPacketFees.Data,
  IdentifiedPacketFees.Proto
> {
  /**
   * @param packet_id unique packet identifier comprised of the channel ID, port ID and sequence
   * @param packet_fees list of packet fees
   */
  constructor(
    public packet_id?: PacketId,
    public packet_fees: PacketFee[] = []
  ) {
    super()
  }

  public static fromAmino(
    data: IdentifiedPacketFees.Amino
  ): IdentifiedPacketFees {
    const { packet_id, packet_fees } = data
    return new IdentifiedPacketFees(
      packet_id ? PacketId.fromAmino(packet_id) : undefined,
      packet_fees.map((fee) => PacketFee.fromAmino(fee))
    )
  }

  public toAmino(): IdentifiedPacketFees.Amino {
    const { packet_id, packet_fees } = this
    return {
      packet_id: packet_id?.toAmino(),
      packet_fees: packet_fees.map((fee) => fee.toAmino()),
    }
  }

  public static fromData(
    data: IdentifiedPacketFees.Data
  ): IdentifiedPacketFees {
    const { packet_id, packet_fees } = data
    return new IdentifiedPacketFees(
      packet_id ? PacketId.fromData(packet_id) : undefined,
      packet_fees.map((fee) => PacketFee.fromData(fee))
    )
  }

  public toData(): IdentifiedPacketFees.Data {
    const { packet_id, packet_fees } = this
    return {
      packet_id: packet_id?.toData(),
      packet_fees: packet_fees.map((fee) => fee.toData()),
    }
  }

  public static fromProto(
    proto: IdentifiedPacketFees.Proto
  ): IdentifiedPacketFees {
    return new IdentifiedPacketFees(
      proto.packetId ? PacketId.fromProto(proto.packetId) : undefined,
      proto.packetFees.map((fee) => PacketFee.fromProto(fee))
    )
  }

  public toProto(): IdentifiedPacketFees.Proto {
    const { packet_id, packet_fees } = this
    return {
      packetId: packet_id?.toProto(),
      packetFees: packet_fees.map((fee) => fee.toProto()),
    }
  }
}

export namespace IdentifiedPacketFees {
  export interface Amino {
    packet_id?: PacketId.Amino
    packet_fees: PacketFee.Amino[]
  }

  export interface Data {
    packet_id?: PacketId.Data
    packet_fees: PacketFee.Data[]
  }

  export type Proto = IdentifiedPacketFees_pb
}
