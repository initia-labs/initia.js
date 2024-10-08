import { JSONSerializable } from '../../../../util/json'
import { base64FromBytes, bytesFromBase64 } from '../../../../util/polyfill'
import { Height } from '../client/Height'
import { Packet as Packet_pb } from '@initia/initia.proto/ibc/core/channel/v1/channel'
import Long from 'long'

/** Packet defines a type that carries data across different chains through IBC */
export class Packet extends JSONSerializable<
  Packet.Amino,
  Packet.Data,
  Packet.Proto
> {
  /**
   * @param port_id port on the counterparty chain which owns the other end of the channel.
   * @param channel_id channel end on the counterparty chain
   */
  constructor(
    public sequence: number,
    public source_port: string,
    public source_channel: string,
    public destination_port: string,
    public destination_channel: string,
    public data: string,
    public timeout_height: Height | undefined,
    public timeout_timestamp: string
  ) {
    super()
  }

  public static fromAmino(_data: Packet.Amino): Packet {
    const {
      sequence,
      source_port,
      source_channel,
      destination_port,
      destination_channel,
      data,
      timeout_height,
      timeout_timestamp,
    } = _data
    return new Packet(
      sequence,
      source_port,
      source_channel,
      destination_port,
      destination_channel,
      data,
      timeout_height ? Height.fromAmino(timeout_height) : undefined,
      timeout_timestamp
    )
  }

  public toAmino(): Packet.Amino {
    const {
      sequence,
      source_port,
      source_channel,
      destination_port,
      destination_channel,
      data,
      timeout_height,
      timeout_timestamp,
    } = this
    const res: Packet.Amino = {
      sequence,
      source_port,
      source_channel,
      destination_port,
      destination_channel,
      data,
      timeout_height: timeout_height?.toAmino(),
      timeout_timestamp,
    }
    return res
  }

  public static fromData(_data: Packet.Data): Packet {
    const {
      sequence,
      source_port,
      source_channel,
      destination_port,
      destination_channel,
      data,
      timeout_height,
      timeout_timestamp,
    } = _data
    return new Packet(
      sequence,
      source_port,
      source_channel,
      destination_port,
      destination_channel,
      data,
      timeout_height ? Height.fromData(timeout_height) : undefined,
      timeout_timestamp
    )
  }

  public toData(): Packet.Data {
    const {
      sequence,
      source_port,
      source_channel,
      destination_port,
      destination_channel,
      data,
      timeout_height,
      timeout_timestamp,
    } = this
    const res: Packet.Data = {
      sequence,
      source_port,
      source_channel,
      destination_port,
      destination_channel,
      data,
      timeout_height: timeout_height?.toData(),
      timeout_timestamp: timeout_timestamp,
    }
    return res
  }

  public static fromProto(proto: Packet.Proto): Packet {
    return new Packet(
      proto.sequence.toNumber(),
      proto.sourcePort,
      proto.sourceChannel,
      proto.destinationPort,
      proto.destinationChannel,
      base64FromBytes(proto.data),
      proto.timeoutHeight ? Height.fromProto(proto.timeoutHeight) : undefined,
      proto.timeoutTimestamp.toString()
    )
  }

  public toProto(): Packet.Proto {
    const {
      sequence,
      source_port,
      source_channel,
      destination_port,
      destination_channel,
      data,
      timeout_height,
      timeout_timestamp,
    } = this
    return Packet_pb.fromPartial({
      sequence: Long.fromNumber(sequence),
      sourcePort: source_port,
      sourceChannel: source_channel,
      destinationPort: destination_port,
      destinationChannel: destination_channel,
      data: bytesFromBase64(data),
      timeoutHeight: timeout_height?.toProto(),
      timeoutTimestamp: Long.fromString(timeout_timestamp),
    })
  }
}

export namespace Packet {
  export interface Amino {
    sequence: number
    source_port: string
    source_channel: string
    destination_port: string
    destination_channel: string
    data: string
    timeout_height?: Height.Amino
    timeout_timestamp: string
  }

  export interface Data {
    sequence: number
    source_port: string
    source_channel: string
    destination_port: string
    destination_channel: string
    data: string
    timeout_height?: Height.Data
    timeout_timestamp: string
  }

  export type Proto = Packet_pb
}
