import { JSONSerializable } from '../../../../../util/json';
import { AccAddress } from '../../../../bech32';
import { Any } from '@initia/initia.proto/google/protobuf/any';
import { MsgUpdateChannelRelayer as MsgUpdateChannelRelayer_pb } from '@initia/initia.proto/ibc/applications/perm/v1/tx';

export class MsgUpdateChannelRelayer extends JSONSerializable<
  MsgUpdateChannelRelayer.Amino,
  MsgUpdateChannelRelayer.Data,
  MsgUpdateChannelRelayer.Proto
> {
  /**
   * @param authority the address that controls the module
   * @param channel
   * @param relayer
   */
  constructor(
    public authority: AccAddress,
    public channel: string,
    public relayer: string
  ) {
    super();
  }

  public static fromAmino(
    data: MsgUpdateChannelRelayer.Amino
  ): MsgUpdateChannelRelayer {
    const {
      value: { authority, channel, relayer },
    } = data;
    return new MsgUpdateChannelRelayer(authority, channel, relayer);
  }

  public toAmino(): MsgUpdateChannelRelayer.Amino {
    const { authority, channel, relayer } = this;
    return {
      type: 'perm/MsgUpdateChannelRelayer',
      value: {
        authority,
        channel,
        relayer,
      },
    };
  }

  public static fromData(
    data: MsgUpdateChannelRelayer.Data
  ): MsgUpdateChannelRelayer {
    const { authority, channel, relayer } = data;
    return new MsgUpdateChannelRelayer(authority, channel, relayer);
  }

  public toData(): MsgUpdateChannelRelayer.Data {
    const { authority, channel, relayer } = this;
    return {
      '@type': '/ibc.applications.perm.v1.MsgUpdateChannelRelayer',
      authority,
      channel,
      relayer,
    };
  }

  public static fromProto(
    data: MsgUpdateChannelRelayer.Proto
  ): MsgUpdateChannelRelayer {
    return new MsgUpdateChannelRelayer(
      data.authority,
      data.channel,
      data.relayer
    );
  }

  public toProto(): MsgUpdateChannelRelayer.Proto {
    const { authority, channel, relayer } = this;
    return MsgUpdateChannelRelayer_pb.fromPartial({
      authority,
      channel,
      relayer,
    });
  }

  public packAny(): Any {
    return Any.fromPartial({
      typeUrl: '/ibc.applications.perm.v1.MsgUpdateChannelRelayer',
      value: MsgUpdateChannelRelayer_pb.encode(this.toProto()).finish(),
    });
  }

  public static unpackAny(msgAny: Any): MsgUpdateChannelRelayer {
    return MsgUpdateChannelRelayer.fromProto(
      MsgUpdateChannelRelayer_pb.decode(msgAny.value)
    );
  }
}

export namespace MsgUpdateChannelRelayer {
  export interface Amino {
    type: 'perm/MsgUpdateChannelRelayer';
    value: {
      authority: AccAddress;
      channel: string;
      relayer: string;
    };
  }

  export interface Data {
    '@type': '/ibc.applications.perm.v1.MsgUpdateChannelRelayer';
    authority: AccAddress;
    channel: string;
    relayer: string;
  }

  export type Proto = MsgUpdateChannelRelayer_pb;
}
