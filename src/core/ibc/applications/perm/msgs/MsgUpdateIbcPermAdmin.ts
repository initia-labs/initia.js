import { JSONSerializable } from '../../../../../util/json'
import { AccAddress } from '../../../../bech32'
import { Any } from '@initia/initia.proto/google/protobuf/any'
import { MsgUpdateAdmin as MsgUpdateAdmin_pb } from '@initia/initia.proto/ibc/applications/perm/v1/tx'

/**
 * MsgUpdateIbcPermAdmin transfers a ownership of a channel to a new admin.
 */
export class MsgUpdateIbcPermAdmin extends JSONSerializable<
  MsgUpdateIbcPermAdmin.Amino,
  MsgUpdateIbcPermAdmin.Data,
  MsgUpdateIbcPermAdmin.Proto
> {
  /**
   * @param authority the address that controls the module
   * @param channel_id
   * @param port_id
   * @param admin
   */
  constructor(
    public authority: AccAddress,
    public channel_id: string,
    public port_id: string,
    public admin: string
  ) {
    super()
  }

  public static fromAmino(
    data: MsgUpdateIbcPermAdmin.Amino
  ): MsgUpdateIbcPermAdmin {
    const {
      value: { authority, channel_id, port_id, admin },
    } = data
    return new MsgUpdateIbcPermAdmin(authority, channel_id, port_id, admin)
  }

  public toAmino(): MsgUpdateIbcPermAdmin.Amino {
    const { authority, channel_id, port_id, admin } = this
    return {
      type: 'ibc-perm/MsgUpdateAdmin',
      value: {
        authority,
        channel_id,
        port_id,
        admin,
      },
    }
  }

  public static fromData(
    data: MsgUpdateIbcPermAdmin.Data
  ): MsgUpdateIbcPermAdmin {
    const { authority, channel_id, port_id, admin } = data
    return new MsgUpdateIbcPermAdmin(authority, channel_id, port_id, admin)
  }

  public toData(): MsgUpdateIbcPermAdmin.Data {
    const { authority, channel_id, port_id, admin } = this
    return {
      '@type': '/ibc.applications.perm.v1.MsgUpdateAdmin',
      authority,
      channel_id,
      port_id,
      admin,
    }
  }

  public static fromProto(
    data: MsgUpdateIbcPermAdmin.Proto
  ): MsgUpdateIbcPermAdmin {
    return new MsgUpdateIbcPermAdmin(
      data.authority,
      data.channelId,
      data.portId,
      data.admin
    )
  }

  public toProto(): MsgUpdateIbcPermAdmin.Proto {
    const { authority, channel_id, port_id, admin } = this
    return MsgUpdateAdmin_pb.fromPartial({
      authority,
      channelId: channel_id,
      portId: port_id,
      admin,
    })
  }

  public packAny(): Any {
    return Any.fromPartial({
      typeUrl: '/ibc.applications.perm.v1.MsgUpdateAdmin',
      value: MsgUpdateAdmin_pb.encode(this.toProto()).finish(),
    })
  }

  public static unpackAny(msgAny: Any): MsgUpdateIbcPermAdmin {
    return MsgUpdateIbcPermAdmin.fromProto(
      MsgUpdateAdmin_pb.decode(msgAny.value)
    )
  }
}

export namespace MsgUpdateIbcPermAdmin {
  export interface Amino {
    type: 'ibc-perm/MsgUpdateAdmin'
    value: {
      authority: AccAddress
      channel_id: string
      port_id: string
      admin: string
    }
  }

  export interface Data {
    '@type': '/ibc.applications.perm.v1.MsgUpdateAdmin'
    authority: AccAddress
    channel_id: string
    port_id: string
    admin: string
  }

  export type Proto = MsgUpdateAdmin_pb
}
