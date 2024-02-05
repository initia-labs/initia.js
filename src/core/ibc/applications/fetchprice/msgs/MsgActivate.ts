import { JSONSerializable } from '../../../../../util/json';
import { AccAddress } from '../../../../bech32';
import { Duration } from '../../../../Duration';
import { MsgActivate as MsgActivate_pb } from '@initia/initia.proto/ibc/applications/fetchprice/v1/tx';
import { Any } from '@initia/initia.proto/google/protobuf/any';

export class MsgActivate extends JSONSerializable<
  MsgActivate.Amino,
  MsgActivate.Data,
  MsgActivate.Proto
> {
  /**
   * @param authority the address that controls the module
   * @param source_port
   * @param source_channel
   * @param timeout_duration
   */
  constructor(
    public authority: AccAddress,
    public source_port: string,
    public source_channel: string,
    public timeout_duration: Duration
  ) {
    super();
  }

  public static fromAmino(data: MsgActivate.Amino): MsgActivate {
    const {
      value: { authority, source_port, source_channel, timeout_duration },
    } = data;

    return new MsgActivate(
      authority,
      source_port,
      source_channel,
      Duration.fromAmino(timeout_duration)
    );
  }

  public toAmino(): MsgActivate.Amino {
    const { authority, source_port, source_channel, timeout_duration } = this;
    return {
      type: 'fetchprice/MsgActivate',
      value: {
        authority,
        source_port,
        source_channel,
        timeout_duration: timeout_duration.toAmino(),
      },
    };
  }

  public static fromData(data: MsgActivate.Data): MsgActivate {
    const { authority, source_port, source_channel, timeout_duration } = data;
    return new MsgActivate(
      authority,
      source_port,
      source_channel,
      Duration.fromData(timeout_duration)
    );
  }

  public toData(): MsgActivate.Data {
    const { authority, source_port, source_channel, timeout_duration } = this;
    return {
      '@type': '/ibc.applications.fetchprice.v1.MsgActivate',
      authority,
      source_port,
      source_channel,
      timeout_duration: timeout_duration.toData(),
    };
  }

  public static fromProto(data: MsgActivate.Proto): MsgActivate {
    return new MsgActivate(
      data.authority,
      data.sourcePort,
      data.sourceChannel,
      Duration.fromProto(data.timeoutDuration as Duration.Proto)
    );
  }

  public toProto(): MsgActivate.Proto {
    const { authority, source_port, source_channel, timeout_duration } = this;
    return MsgActivate_pb.fromPartial({
      authority,
      sourcePort: source_port,
      sourceChannel: source_channel,
      timeoutDuration: timeout_duration.toProto(),
    });
  }

  public packAny(): Any {
    return Any.fromPartial({
      typeUrl: '/ibc.applications.fetchprice.v1.MsgActivate',
      value: MsgActivate_pb.encode(this.toProto()).finish(),
    });
  }

  public static unpackAny(msgAny: Any): MsgActivate {
    return MsgActivate.fromProto(MsgActivate_pb.decode(msgAny.value));
  }
}

export namespace MsgActivate {
  export interface Amino {
    type: 'fetchprice/MsgActivate';
    value: {
      authority: AccAddress;
      source_port: string;
      source_channel: string;
      timeout_duration: Duration.Amino;
    };
  }

  export interface Data {
    '@type': '/ibc.applications.fetchprice.v1.MsgActivate';
    authority: AccAddress;
    source_port: string;
    source_channel: string;
    timeout_duration: Duration.Data;
  }

  export type Proto = MsgActivate_pb;
}
