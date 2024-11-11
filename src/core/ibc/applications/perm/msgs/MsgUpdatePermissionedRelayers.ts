import { JSONSerializable } from '../../../../../util/json'
import { AccAddress } from '../../../../bech32'
import { Any } from '@initia/initia.proto/google/protobuf/any'
import { MsgUpdatePermissionedRelayers as MsgUpdatePermissionedRelayers_pb } from '@initia/initia.proto/ibc/applications/perm/v1/tx'

/**
 * MsgUpdatePermissionedRelayers defines msg to set permissioned relyer for the specific ibc channel.
 */
export class MsgUpdatePermissionedRelayers extends JSONSerializable<
  MsgUpdatePermissionedRelayers.Amino,
  MsgUpdatePermissionedRelayers.Data,
  MsgUpdatePermissionedRelayers.Proto
> {
  /**
   * @param authority the address that controls the module
   * @param channel_id
   * @param port_id
   * @param relayers
   */
  constructor(
    public authority: AccAddress,
    public channel_id: string,
    public port_id: string,
    public relayers: string[]
  ) {
    super()
  }

  public static fromAmino(
    data: MsgUpdatePermissionedRelayers.Amino
  ): MsgUpdatePermissionedRelayers {
    const {
      value: { authority, channel_id, port_id, relayers },
    } = data
    return new MsgUpdatePermissionedRelayers(
      authority,
      channel_id,
      port_id,
      relayers
    )
  }

  public toAmino(): MsgUpdatePermissionedRelayers.Amino {
    const { authority, channel_id, port_id, relayers } = this
    return {
      type: 'ibc-perm/MsgUpdatePermissionedRelayers',
      value: {
        authority,
        channel_id,
        port_id,
        relayers,
      },
    }
  }

  public static fromData(
    data: MsgUpdatePermissionedRelayers.Data
  ): MsgUpdatePermissionedRelayers {
    const { authority, channel_id, port_id, relayers } = data
    return new MsgUpdatePermissionedRelayers(
      authority,
      channel_id,
      port_id,
      relayers
    )
  }

  public toData(): MsgUpdatePermissionedRelayers.Data {
    const { authority, channel_id, port_id, relayers } = this
    return {
      '@type': '/ibc.applications.perm.v1.MsgUpdatePermissionedRelayers',
      authority,
      channel_id,
      port_id,
      relayers,
    }
  }

  public static fromProto(
    data: MsgUpdatePermissionedRelayers.Proto
  ): MsgUpdatePermissionedRelayers {
    return new MsgUpdatePermissionedRelayers(
      data.authority,
      data.channelId,
      data.portId,
      data.relayers
    )
  }

  public toProto(): MsgUpdatePermissionedRelayers.Proto {
    const { authority, channel_id, port_id, relayers } = this
    return MsgUpdatePermissionedRelayers_pb.fromPartial({
      authority,
      channelId: channel_id,
      portId: port_id,
      relayers,
    })
  }

  public packAny(): Any {
    return Any.fromPartial({
      typeUrl: '/ibc.applications.perm.v1.MsgUpdatePermissionedRelayers',
      value: MsgUpdatePermissionedRelayers_pb.encode(this.toProto()).finish(),
    })
  }

  public static unpackAny(msgAny: Any): MsgUpdatePermissionedRelayers {
    return MsgUpdatePermissionedRelayers.fromProto(
      MsgUpdatePermissionedRelayers_pb.decode(msgAny.value)
    )
  }
}

export namespace MsgUpdatePermissionedRelayers {
  export interface Amino {
    type: 'ibc-perm/MsgUpdatePermissionedRelayers'
    value: {
      authority: AccAddress
      channel_id: string
      port_id: string
      relayers: string[]
    }
  }

  export interface Data {
    '@type': '/ibc.applications.perm.v1.MsgUpdatePermissionedRelayers'
    authority: AccAddress
    channel_id: string
    port_id: string
    relayers: string[]
  }

  export type Proto = MsgUpdatePermissionedRelayers_pb
}
