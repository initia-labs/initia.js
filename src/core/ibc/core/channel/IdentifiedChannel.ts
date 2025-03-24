import {
  State,
  Order,
  IdentifiedChannel as IdentifiedChannel_pb,
} from '@initia/initia.proto/ibc/core/channel/v1/channel'
import { JSONSerializable } from '../../../../util/json'
import { ChannelCounterparty } from './ChannelCounterparty'

/**
 * IdentifiedChannel defines a channel with additional port and channel identifier fields.
 */
export class IdentifiedChannel extends JSONSerializable<
  IdentifiedChannel.Amino,
  IdentifiedChannel.Data,
  IdentifiedChannel.Proto
> {
  /**
   * @param state current state of the channel end
   * @param ordering  whether the channel is ordered or unordered
   * @param counterparty counterparty channel end
   * @param connection_hops list of connection identifiers, in order, along which packets sent on this channel will travel
   * @param version opaque channel version, which is agreed upon during the handshake
   * @param port_id port identifier
   * @param channel_id channel identifier
   * @param upgrade_sequence the latest upgrade attempt performed by this channel; 0 indicates the channel has never been upgraded
   */
  constructor(
    public state: State,
    public ordering: Order,
    public counterparty: ChannelCounterparty | undefined,
    public connection_hops: string[],
    public version: string,
    public port_id: string,
    public channel_id: string,
    public upgrade_sequence: number
  ) {
    super()
  }

  public static fromAmino(data: IdentifiedChannel.Amino): IdentifiedChannel {
    const {
      state,
      ordering,
      counterparty,
      connection_hops,
      version,
      port_id,
      channel_id,
      upgrade_sequence,
    } = data
    return new IdentifiedChannel(
      state,
      ordering,
      counterparty ? ChannelCounterparty.fromAmino(counterparty) : undefined,
      connection_hops,
      version,
      port_id,
      channel_id,
      parseInt(upgrade_sequence)
    )
  }

  public toAmino(): IdentifiedChannel.Amino {
    const {
      state,
      ordering,
      counterparty,
      connection_hops,
      version,
      port_id,
      channel_id,
      upgrade_sequence,
    } = this
    return {
      state,
      ordering,
      counterparty: counterparty?.toAmino(),
      connection_hops,
      version,
      port_id,
      channel_id,
      upgrade_sequence: upgrade_sequence.toFixed(),
    }
  }

  public static fromData(data: IdentifiedChannel.Data): IdentifiedChannel {
    const {
      state,
      ordering,
      counterparty,
      connection_hops,
      version,
      port_id,
      channel_id,
      upgrade_sequence,
    } = data
    return new IdentifiedChannel(
      state,
      ordering,
      counterparty ? ChannelCounterparty.fromData(counterparty) : undefined,
      connection_hops,
      version,
      port_id,
      channel_id,
      parseInt(upgrade_sequence)
    )
  }

  public toData(): IdentifiedChannel.Data {
    const {
      state,
      ordering,
      counterparty,
      connection_hops,
      version,
      port_id,
      channel_id,
      upgrade_sequence,
    } = this
    return {
      state,
      ordering,
      counterparty: counterparty?.toData(),
      connection_hops,
      version,
      port_id,
      channel_id,
      upgrade_sequence: upgrade_sequence.toFixed(),
    }
  }

  public static fromProto(proto: IdentifiedChannel.Proto): IdentifiedChannel {
    return new IdentifiedChannel(
      proto.state,
      proto.ordering,
      proto.counterparty
        ? ChannelCounterparty.fromProto(proto.counterparty)
        : undefined,
      proto.connectionHops,
      proto.version,
      proto.portId,
      proto.channelId,
      Number(proto.upgradeSequence)
    )
  }

  public toProto(): IdentifiedChannel.Proto {
    const {
      state,
      ordering,
      counterparty,
      connection_hops,
      version,
      port_id,
      channel_id,
      upgrade_sequence,
    } = this
    return IdentifiedChannel_pb.fromPartial({
      state,
      ordering,
      counterparty: counterparty?.toProto(),
      connectionHops: connection_hops,
      version,
      portId: port_id,
      channelId: channel_id,
      upgradeSequence: BigInt(upgrade_sequence),
    })
  }
}

export namespace IdentifiedChannel {
  export interface Amino {
    state: State
    ordering: Order
    counterparty?: ChannelCounterparty.Amino
    connection_hops: string[]
    version: string
    port_id: string
    channel_id: string
    upgrade_sequence: string
  }

  export interface Data {
    state: State
    ordering: Order
    counterparty?: ChannelCounterparty.Data
    connection_hops: string[]
    version: string
    port_id: string
    channel_id: string
    upgrade_sequence: string
  }

  export type Proto = IdentifiedChannel_pb
}
