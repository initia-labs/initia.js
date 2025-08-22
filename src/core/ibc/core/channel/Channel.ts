import { JSONSerializable } from '../../../../util/json'
import {
  Channel as Channel_pb,
  stateFromJSON,
  stateToJSON,
  orderFromJSON,
  orderToJSON,
} from '@initia/initia.proto/ibc/core/channel/v1/channel'
import { ChannelState } from './ChannelState'
import { ChannelOrder } from './ChannelOrder'
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
    public state: ChannelState,
    public ordering: ChannelOrder,
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
      stateFromJSON(state),
      orderFromJSON(ordering),
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
      state: stateToJSON(state),
      ordering: orderToJSON(ordering),
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
      stateFromJSON(state),
      orderFromJSON(ordering),
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
      state: stateToJSON(state),
      ordering: orderToJSON(ordering),
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
    state: string
    ordering: string
    counterparty?: ChannelCounterparty.Amino
    connection_hops: string[]
    version: string
    upgrade_sequence: string
  }

  export interface Data {
    state: string
    ordering: string
    counterparty?: ChannelCounterparty.Data
    connection_hops: string[]
    version: string
    upgrade_sequence: string
  }

  export type Proto = Channel_pb
}
