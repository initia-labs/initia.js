import { JSONSerializable } from '../../../../util/json'
import { Counterparty as Counterparty_pb } from '@initia/initia.proto/ibc/core/channel/v1/channel'

/** ChannelCounterparty defines a channel end ChannelCounterparty */
export class ChannelCounterparty extends JSONSerializable<
  ChannelCounterparty.Amino,
  ChannelCounterparty.Data,
  ChannelCounterparty.Proto
> {
  /**
   * @param port_id port on the ChannelCounterparty chain which owns the other end of the channel.
   * @param channel_id channel end on the ChannelCounterparty chain
   */
  constructor(
    public port_id: string,
    public channel_id: string
  ) {
    super()
  }

  public static fromAmino(
    data: ChannelCounterparty.Amino
  ): ChannelCounterparty {
    const { port_id, channel_id } = data
    return new ChannelCounterparty(port_id, channel_id)
  }

  public toAmino(): ChannelCounterparty.Amino {
    const { port_id, channel_id } = this
    return {
      port_id,
      channel_id,
    }
  }

  public static fromData(data: ChannelCounterparty.Data): ChannelCounterparty {
    const { port_id, channel_id } = data
    return new ChannelCounterparty(port_id, channel_id)
  }

  public toData(): ChannelCounterparty.Data {
    const { port_id, channel_id } = this
    return {
      port_id,
      channel_id,
    }
  }

  public static fromProto(
    proto: ChannelCounterparty.Proto
  ): ChannelCounterparty {
    return new ChannelCounterparty(proto.portId, proto.channelId)
  }

  public toProto(): ChannelCounterparty.Proto {
    const { port_id, channel_id } = this
    return Counterparty_pb.fromPartial({
      portId: port_id,
      channelId: channel_id,
    })
  }
}

export namespace ChannelCounterparty {
  export interface Amino {
    port_id: string
    channel_id: string
  }

  export interface Data {
    port_id: string
    channel_id: string
  }

  export type Proto = Counterparty_pb
}
