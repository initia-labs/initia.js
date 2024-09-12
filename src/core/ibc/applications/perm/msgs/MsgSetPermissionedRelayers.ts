import { JSONSerializable } from '../../../../../util/json'
import { AccAddress } from '../../../../bech32'
import { Any } from '@initia/initia.proto/google/protobuf/any'
import { MsgSetPermissionedRelayers as MsgSetPermissionedRelayers_pb } from '@initia/initia.proto/ibc/applications/perm/v1/tx'

export class MsgSetPermissionedRelayers extends JSONSerializable<
  MsgSetPermissionedRelayers.Amino,
  MsgSetPermissionedRelayers.Data,
  MsgSetPermissionedRelayers.Proto
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
    data: MsgSetPermissionedRelayers.Amino
  ): MsgSetPermissionedRelayers {
    const {
      value: { authority, channel_id, port_id, relayers },
    } = data
    return new MsgSetPermissionedRelayers(
      authority,
      channel_id,
      port_id,
      relayers
    )
  }

  public toAmino(): MsgSetPermissionedRelayers.Amino {
    const { authority, channel_id, port_id, relayers } = this
    return {
      type: 'perm/MsgSetPermissionedRelayers',
      value: {
        authority,
        channel_id,
        port_id,
        relayers,
      },
    }
  }

  public static fromData(
    data: MsgSetPermissionedRelayers.Data
  ): MsgSetPermissionedRelayers {
    const { authority, channel_id, port_id, relayers } = data
    return new MsgSetPermissionedRelayers(
      authority,
      channel_id,
      port_id,
      relayers
    )
  }

  public toData(): MsgSetPermissionedRelayers.Data {
    const { authority, channel_id, port_id, relayers } = this
    return {
      '@type': '/ibc.applications.perm.v1.MsgSetPermissionedRelayers',
      authority,
      channel_id,
      port_id,
      relayers,
    }
  }

  public static fromProto(
    data: MsgSetPermissionedRelayers.Proto
  ): MsgSetPermissionedRelayers {
    return new MsgSetPermissionedRelayers(
      data.authority,
      data.channelId,
      data.portId,
      data.relayers
    )
  }

  public toProto(): MsgSetPermissionedRelayers.Proto {
    const { authority, channel_id, port_id, relayers } = this
    return MsgSetPermissionedRelayers_pb.fromPartial({
      authority,
      channelId: channel_id,
      portId: port_id,
      relayers,
    })
  }

  public packAny(): Any {
    return Any.fromPartial({
      typeUrl: '/ibc.applications.perm.v1.MsgSetPermissionedRelayers',
      value: MsgSetPermissionedRelayers_pb.encode(this.toProto()).finish(),
    })
  }

  public static unpackAny(msgAny: Any): MsgSetPermissionedRelayers {
    return MsgSetPermissionedRelayers.fromProto(
      MsgSetPermissionedRelayers_pb.decode(msgAny.value)
    )
  }
}

export namespace MsgSetPermissionedRelayers {
  export interface Amino {
    type: 'perm/MsgSetPermissionedRelayers'
    value: {
      authority: AccAddress
      channel_id: string
      port_id: string
      relayers: string[]
    }
  }

  export interface Data {
    '@type': '/ibc.applications.perm.v1.MsgSetPermissionedRelayers'
    authority: AccAddress
    channel_id: string
    port_id: string
    relayers: string[]
  }

  export type Proto = MsgSetPermissionedRelayers_pb
}
