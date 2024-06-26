import { JSONSerializable } from '../../../../../util/json';
import { AccAddress } from '../../../../bech32';
import { Any } from '@initia/initia.proto/google/protobuf/any';
import { MsgSetPermissionedRelayers as MsgSetPermissionedRelayers_pb } from '@initia/initia.proto/ibc/applications/perm/v1/tx';

export class MsgSetPermissionedRelayers extends JSONSerializable<
  MsgSetPermissionedRelayers.Amino,
  MsgSetPermissionedRelayers.Data,
  MsgSetPermissionedRelayers.Proto
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
    public relayers: string[]
  ) {
    super();
  }

  public static fromAmino(
    data: MsgSetPermissionedRelayers.Amino
  ): MsgSetPermissionedRelayers {
    const {
      value: { authority, port_id, channel_id, relayers },
    } = data;
    return new MsgSetPermissionedRelayers(
      authority,
      port_id,
      channel_id,
      relayers
    );
  }

  public toAmino(): MsgSetPermissionedRelayers.Amino {
    const { authority, port_id, channel_id, relayers } = this;
    return {
      type: 'perm/MsgSetPermissionedRelayers',
      value: {
        authority,
        port_id,
        channel_id,
        relayers,
      },
    };
  }

  public static fromData(
    data: MsgSetPermissionedRelayers.Data
  ): MsgSetPermissionedRelayers {
    const { authority, port_id, channel_id, relayers } = data;
    return new MsgSetPermissionedRelayers(
      authority,
      port_id,
      channel_id,
      relayers
    );
  }

  public toData(): MsgSetPermissionedRelayers.Data {
    const { authority, port_id, channel_id, relayers } = this;
    return {
      '@type': '/ibc.applications.perm.v1.MsgSetPermissionedRelayers',
      authority,
      port_id,
      channel_id,
      relayers,
    };
  }

  public static fromProto(
    data: MsgSetPermissionedRelayers.Proto
  ): MsgSetPermissionedRelayers {
    return new MsgSetPermissionedRelayers(
      data.authority,
      data.portId,
      data.channelId,
      data.relayers
    );
  }

  public toProto(): MsgSetPermissionedRelayers.Proto {
    const { authority, port_id, channel_id, relayers } = this;
    return MsgSetPermissionedRelayers_pb.fromPartial({
      authority,
      portId: port_id,
      channelId: channel_id,
      relayers,
    });
  }

  public packAny(): Any {
    return Any.fromPartial({
      typeUrl: '/ibc.applications.perm.v1.MsgSetPermissionedRelayers',
      value: MsgSetPermissionedRelayers_pb.encode(this.toProto()).finish(),
    });
  }

  public static unpackAny(msgAny: Any): MsgSetPermissionedRelayers {
    return MsgSetPermissionedRelayers.fromProto(
      MsgSetPermissionedRelayers_pb.decode(msgAny.value)
    );
  }
}

export namespace MsgSetPermissionedRelayers {
  export interface Amino {
    type: 'perm/MsgSetPermissionedRelayers';
    value: {
      authority: AccAddress;
      port_id: string;
      channel_id: string;
      relayers: string[];
    };
  }

  export interface Data {
    '@type': '/ibc.applications.perm.v1.MsgSetPermissionedRelayers';
    authority: AccAddress;
    port_id: string;
    channel_id: string;
    relayers: string[];
  }

  export type Proto = MsgSetPermissionedRelayers_pb;
}
