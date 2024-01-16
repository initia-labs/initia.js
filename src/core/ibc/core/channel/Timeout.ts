import { JSONSerializable } from '../../../../util/json';
import { Timeout as Timeout_pb } from '@initia/initia.proto/ibc/core/channel/v1/channel';
import { Height } from '../client';
import Long from 'long';

export class Timeout extends JSONSerializable<
  Timeout.Amino,
  Timeout.Data,
  Timeout.Proto
> {
  /**
   * @param height block height after which the packet or upgrade times out
   * @param timestamp block timestamp (in nanoseconds) after which the packet or upgrade times out
   */
  constructor(public height: Height, public timestamp: number) {
    super();
  }

  public static fromAmino(data: Timeout.Amino): Timeout {
    const { height, timestamp } = data;
    return new Timeout(Height.fromAmino(height), Number.parseInt(timestamp));
  }

  public toAmino(): Timeout.Amino {
    const { height, timestamp } = this;
    return {
      height: height.toAmino(),
      timestamp: timestamp.toString(),
    };
  }

  public static fromData(data: Timeout.Data): Timeout {
    const { height, timestamp } = data;
    return new Timeout(Height.fromData(height), Number.parseInt(timestamp));
  }

  public toData(): Timeout.Data {
    const { height, timestamp } = this;
    return {
      height: height.toData(),
      timestamp: timestamp.toString(),
    };
  }

  public static fromProto(proto: Timeout.Proto): Timeout {
    return new Timeout(
      Height.fromProto(proto.height as Height.Proto),
      proto.timestamp.toNumber()
    );
  }

  public toProto(): Timeout.Proto {
    const { height, timestamp } = this;
    return Timeout_pb.fromPartial({
      height: height.toProto(),
      timestamp: Long.fromNumber(timestamp),
    });
  }
}

export namespace Timeout {
  export interface Amino {
    height: Height.Amino;
    timestamp: string;
  }

  export interface Data {
    height: Height.Data;
    timestamp: string;
  }

  export type Proto = Timeout_pb;
}
