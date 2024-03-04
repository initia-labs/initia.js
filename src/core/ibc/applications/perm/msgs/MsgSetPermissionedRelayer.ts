import { JSONSerializable } from '../../../../../util/json';
import { AccAddress } from '../../../../bech32';
import { Any } from '@initia/initia.proto/google/protobuf/any';
import { MsgSetPermissionedRelayer as MsgSetPermissionedRelayer_pb } from '@initia/initia.proto/ibc/applications/perm/v1/tx';

export class MsgSetPermissionedRelayer extends JSONSerializable<
  MsgSetPermissionedRelayer.Amino,
  MsgSetPermissionedRelayer.Data,
  MsgSetPermissionedRelayer.Proto
> {
  /**
   * @param authority the address that controls the module
   * @param port_id
   * @param channel_id
   * @param relayer
   */
  constructor(
    public authority: AccAddress,
    public port_id: string,
    public channel_id: string,
    public relayer: string
  ) {
    super();
  }

  public static fromAmino(
    data: MsgSetPermissionedRelayer.Amino
  ): MsgSetPermissionedRelayer {
    const {
      value: { authority, port_id, channel_id, relayer },
    } = data;
    return new MsgSetPermissionedRelayer(
      authority,
      port_id,
      channel_id,
      relayer
    );
  }

  public toAmino(): MsgSetPermissionedRelayer.Amino {
    const { authority, port_id, channel_id, relayer } = this;
    return {
      type: 'perm/MsgSetPermissionedRelayer',
      value: {
        authority,
        port_id,
        channel_id,
        relayer,
      },
    };
  }

  public static fromData(
    data: MsgSetPermissionedRelayer.Data
  ): MsgSetPermissionedRelayer {
    const { authority, port_id, channel_id, relayer } = data;
    return new MsgSetPermissionedRelayer(
      authority,
      port_id,
      channel_id,
      relayer
    );
  }

  public toData(): MsgSetPermissionedRelayer.Data {
    const { authority, port_id, channel_id, relayer } = this;
    return {
      '@type': '/ibc.applications.perm.v1.MsgSetPermissionedRelayer',
      authority,
      port_id,
      channel_id,
      relayer,
    };
  }

  public static fromProto(
    data: MsgSetPermissionedRelayer.Proto
  ): MsgSetPermissionedRelayer {
    return new MsgSetPermissionedRelayer(
      data.authority,
      data.portId,
      data.channelId,
      data.relayer
    );
  }

  public toProto(): MsgSetPermissionedRelayer.Proto {
    const { authority, port_id, channel_id, relayer } = this;
    return MsgSetPermissionedRelayer_pb.fromPartial({
      authority,
      portId: port_id,
      channelId: channel_id,
      relayer,
    });
  }

  public packAny(): Any {
    return Any.fromPartial({
      typeUrl: '/ibc.applications.perm.v1.MsgSetPermissionedRelayer',
      value: MsgSetPermissionedRelayer_pb.encode(this.toProto()).finish(),
    });
  }

  public static unpackAny(msgAny: Any): MsgSetPermissionedRelayer {
    return MsgSetPermissionedRelayer.fromProto(
      MsgSetPermissionedRelayer_pb.decode(msgAny.value)
    );
  }
}

export namespace MsgSetPermissionedRelayer {
  export interface Amino {
    type: 'perm/MsgSetPermissionedRelayer';
    value: {
      authority: AccAddress;
      port_id: string;
      channel_id: string;
      relayer: string;
    };
  }

  export interface Data {
    '@type': '/ibc.applications.perm.v1.MsgSetPermissionedRelayer';
    authority: AccAddress;
    port_id: string;
    channel_id: string;
    relayer: string;
  }

  export type Proto = MsgSetPermissionedRelayer_pb;
}
