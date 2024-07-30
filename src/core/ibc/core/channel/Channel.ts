import {
  State,
  Order,
  Channel as Channel_pb,
} from '@initia/initia.proto/ibc/core/channel/v1/channel'
import { JSONSerializable } from '../../../../util/json'
import { ChannelCounterparty } from './ChannelCounterparty'

/**
 * Channel is a monotonically increasing data type
 * that can be compared against another Channel for the purposes of updating and
 * freezing clients
 *
 * Normally the RevisionChannel is incremented at each height while keeping
 * RevisionNumber the same. However some consensus algorithms may choose to
 * reset the height in certain conditions e.g. hard forks, state-machine
 * breaking changes In these cases, the RevisionNumber is incremented so that
 * height continues to be monitonically increasing even as the RevisionChannel
 * gets reset
 */
export class Channel extends JSONSerializable<
  Channel.Amino,
  Channel.Data,
  Channel.Proto
> {
  /**
   * @param state current state of the channel end
   * @param ordering  whether the channel is ordered or unordered
   * @param counterparty counterparty channel end
   * @param connection_hops list of connection identifiers, in order, along which packets sent on this channel will travel
   * @param version opaque channel version, which is agreed upon during the handshake
   */
  constructor(
    public state: State,
    public ordering: Order,
    public counterparty: ChannelCounterparty | undefined,
    public connection_hops: string[],
    public version: string
  ) {
    super()
  }

  public static fromAmino(data: Channel.Amino): Channel {
    const { state, ordering, counterparty, connection_hops, version } = data
    return new Channel(
      state,
      ordering,
      counterparty ? ChannelCounterparty.fromAmino(counterparty) : undefined,
      connection_hops,
      version
    )
  }

  public toAmino(): Channel.Amino {
    const { state, ordering, counterparty, connection_hops, version } = this
    const res: Channel.Amino = {
      state,
      ordering,
      counterparty: counterparty?.toAmino(),
      connection_hops,
      version,
    }
    return res
  }

  public static fromData(data: Channel.Data): Channel {
    const { state, ordering, counterparty, connection_hops, version } = data
    return new Channel(
      state,
      ordering,
      counterparty ? ChannelCounterparty.fromData(counterparty) : undefined,
      connection_hops,
      version
    )
  }

  public toData(): Channel.Data {
    const { state, ordering, counterparty, connection_hops, version } = this
    const res: Channel.Data = {
      state,
      ordering,
      counterparty: counterparty?.toData(),
      connection_hops,
      version,
    }
    return res
  }

  public static fromProto(proto: Channel.Proto): Channel {
    return new Channel(
      proto.state,
      proto.ordering,
      proto.counterparty
        ? ChannelCounterparty.fromProto(proto.counterparty)
        : undefined,
      proto.connectionHops,
      proto.version
    )
  }

  public toProto(): Channel.Proto {
    const { state, ordering, counterparty, connection_hops, version } = this
    return Channel_pb.fromPartial({
      state,
      ordering,
      counterparty: counterparty?.toProto(),
      connectionHops: connection_hops,
      version,
    })
  }
}

export namespace Channel {
  export interface Amino {
    state: State
    ordering: Order
    counterparty?: ChannelCounterparty.Amino
    connection_hops: string[]
    version: string
  }

  export interface Data {
    state: State
    ordering: Order
    counterparty?: ChannelCounterparty.Data
    connection_hops: string[]
    version: string
  }

  export type Proto = Channel_pb
}
