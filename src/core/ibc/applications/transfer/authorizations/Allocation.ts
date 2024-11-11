import { JSONSerializable } from '../../../../../util/json'
import { Coins } from '../../../../Coins'
import { Allocation as Allocation_pb } from '@initia/initia.proto/ibc/applications/transfer/v1/authz'

/**
 * Allocation defines the spend limit for a particular port and channel.
 */
export class Allocation extends JSONSerializable<
  Allocation.Amino,
  Allocation.Data,
  Allocation.Proto
> {
  public spend_limit: Coins

  /**
   * @param source_port the port on which the packet will be sent
   * @param source_channel the channel by which the packet will be sent
   * @param spend_limit spend limitation on the channel
   * @param allow_list allow list of receivers, an empty allow list permits any receiver address
   * @param allowed_packet_data allow list of packet data keys, an empty list prohibits all packet data keys
   */
  constructor(
    public source_port: string,
    public source_channel: string,
    spend_limit: Coins.Input,
    public allow_list: string[],
    public allowed_packet_data: string[]
  ) {
    super()
    this.spend_limit = new Coins(spend_limit)
  }

  public static fromAmino(data: Allocation.Amino): Allocation {
    const {
      source_port,
      source_channel,
      spend_limit,
      allow_list,
      allowed_packet_data,
    } = data

    return new Allocation(
      source_port,
      source_channel,
      Coins.fromAmino(spend_limit),
      allow_list,
      allowed_packet_data
    )
  }

  public toAmino(): Allocation.Amino {
    const {
      source_port,
      source_channel,
      spend_limit,
      allow_list,
      allowed_packet_data,
    } = this

    return {
      source_port,
      source_channel,
      spend_limit: spend_limit.toAmino(),
      allow_list,
      allowed_packet_data,
    }
  }

  public static fromData(data: Allocation.Data): Allocation {
    const {
      source_port,
      source_channel,
      spend_limit,
      allow_list,
      allowed_packet_data,
    } = data

    return new Allocation(
      source_port,
      source_channel,
      Coins.fromData(spend_limit),
      allow_list,
      allowed_packet_data
    )
  }

  public toData(): Allocation.Data {
    const {
      source_port,
      source_channel,
      spend_limit,
      allow_list,
      allowed_packet_data,
    } = this

    return {
      source_port,
      source_channel,
      spend_limit: spend_limit.toData(),
      allow_list,
      allowed_packet_data,
    }
  }

  public static fromProto(data: Allocation.Proto): Allocation {
    return new Allocation(
      data.sourcePort,
      data.sourceChannel,
      Coins.fromProto(data.spendLimit),
      data.allowList,
      data.allowedPacketData
    )
  }

  public toProto(): Allocation.Proto {
    const {
      source_port,
      source_channel,
      spend_limit,
      allow_list,
      allowed_packet_data,
    } = this

    return Allocation_pb.fromPartial({
      sourcePort: source_port,
      sourceChannel: source_channel,
      spendLimit: spend_limit.toProto(),
      allowList: allow_list,
      allowedPacketData: allowed_packet_data,
    })
  }
}

export namespace Allocation {
  export interface Amino {
    source_port: string
    source_channel: string
    spend_limit: Coins.Amino
    allow_list: string[]
    allowed_packet_data: string[]
  }

  export interface Data {
    source_port: string
    source_channel: string
    spend_limit: Coins.Data
    allow_list: string[]
    allowed_packet_data: string[]
  }

  export type Proto = Allocation_pb
}
