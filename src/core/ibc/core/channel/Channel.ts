import {
  State,
  Order,
  Channel as Channel_pb,
} from '@initia/initia.proto/ibc/core/channel/v1/channel'
import { JSONSerializable } from '../../../../util/json'
import { ChannelCounterparty } from './ChannelCounterparty'

/**
 * Channel defines pipeline for exactly-once packet delivery between specific
 * modules on separate blockchains, which has at least one end capable of
 * sending packets and one end capable of receiving packets.
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
   * @param upgrade_sequence the latest upgrade attempt performed by this channel; 0 indicates the channel has never been upgraded
   */
  constructor(
    public state: State,
    public ordering: Order,
    public counterparty: ChannelCounterparty | undefined,
    public connection_hops: string[],
    public version: string,
    public upgrade_sequence: number
  ) {
    super()
  }

  public static fromAmino(data: Channel.Amino): Channel {
    const {
      state,
      ordering,
      counterparty,
      connection_hops,
      version,
      upgrade_sequence,
    } = data
    return new Channel(
      state,
      ordering,
      counterparty ? ChannelCounterparty.fromAmino(counterparty) : undefined,
      connection_hops,
      version,
      parseInt(upgrade_sequence)
    )
  }

  public toAmino(): Channel.Amino {
    const {
      state,
      ordering,
      counterparty,
      connection_hops,
      version,
      upgrade_sequence,
    } = this
    return {
      state,
      ordering,
      counterparty: counterparty?.toAmino(),
      connection_hops,
      version,
      upgrade_sequence: upgrade_sequence.toFixed(),
    }
  }

  public static fromData(data: Channel.Data): Channel {
    const {
      state,
      ordering,
      counterparty,
      connection_hops,
      version,
      upgrade_sequence,
    } = data
    return new Channel(
      state,
      ordering,
      counterparty ? ChannelCounterparty.fromData(counterparty) : undefined,
      connection_hops,
      version,
      parseInt(upgrade_sequence)
    )
  }

  public toData(): Channel.Data {
    const {
      state,
      ordering,
      counterparty,
      connection_hops,
      version,
      upgrade_sequence,
    } = this
    return {
      state,
      ordering,
      counterparty: counterparty?.toData(),
      connection_hops,
      version,
      upgrade_sequence: upgrade_sequence.toFixed(),
    }
  }

  public static fromProto(proto: Channel.Proto): Channel {
    return new Channel(
      proto.state,
      proto.ordering,
      proto.counterparty
        ? ChannelCounterparty.fromProto(proto.counterparty)
        : undefined,
      proto.connectionHops,
      proto.version,
      Number(proto.upgradeSequence)
    )
  }

  public toProto(): Channel.Proto {
    const {
      state,
      ordering,
      counterparty,
      connection_hops,
      version,
      upgrade_sequence,
    } = this
    return Channel_pb.fromPartial({
      state,
      ordering,
      counterparty: counterparty?.toProto(),
      connectionHops: connection_hops,
      version,
      upgradeSequence: BigInt(upgrade_sequence),
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
    upgrade_sequence: string
  }

  export interface Data {
    state: State
    ordering: Order
    counterparty?: ChannelCounterparty.Data
    connection_hops: string[]
    version: string
    upgrade_sequence: string
  }

  export type Proto = Channel_pb
}
