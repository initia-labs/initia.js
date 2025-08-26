import { JSONSerializable } from '../../../../util/json'
import { Timeout as Timeout_pb } from '@initia/initia.proto/ibc/core/channel/v1/channel'
import { Height } from '../client'

/**
 * Timeout defines an execution deadline structure for 04-channel handlers.
 * This includes packet lifecycle handlers as well as the upgrade handshake handlers.
 * A valid Timeout contains either one or both of a timestamp and block height (sequence).
 */
export class Timeout extends JSONSerializable<
  Timeout.Amino,
  Timeout.Data,
  Timeout.Proto
> {
  /**
   * @param height block height after which the packet or upgrade times out
   * @param timestamp block timestamp (in nanoseconds) after which the packet or upgrade times out
   */
  constructor(
    public height: Height,
    public timestamp: string
  ) {
    super()
  }

  public static fromAmino(data: Timeout.Amino): Timeout {
    const { height, timestamp } = data
    return new Timeout(Height.fromAmino(height), timestamp)
  }

  public toAmino(): Timeout.Amino {
    const { height, timestamp } = this
    return {
      height: height.toAmino(),
      timestamp: timestamp,
    }
  }

  public static fromData(data: Timeout.Data): Timeout {
    const { height, timestamp } = data
    return new Timeout(Height.fromData(height), timestamp)
  }

  public toData(): Timeout.Data {
    const { height, timestamp } = this
    return {
      height: height.toData(),
      timestamp: timestamp,
    }
  }

  public static fromProto(proto: Timeout.Proto): Timeout {
    return new Timeout(
      Height.fromProto(proto.height as Height.Proto),
      proto.timestamp.toString()
    )
  }

  public toProto(): Timeout.Proto {
    const { height, timestamp } = this
    return Timeout_pb.fromPartial({
      height: height.toProto(),
      timestamp: BigInt(timestamp),
    })
  }
}

export namespace Timeout {
  export interface Amino {
    height: Height.Amino
    timestamp: string
  }

  export interface Data {
    height: Height.Data
    timestamp: string
  }

  export type Proto = Timeout_pb
}
