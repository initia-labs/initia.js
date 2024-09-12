import { JSONSerializable } from '../../../../../util/json'
import { AccAddress } from '../../../../bech32'
import { Any } from '@initia/initia.proto/google/protobuf/any'
import { MsgHaltChannel as MsgHaltChannel_pb } from '@initia/initia.proto/ibc/applications/perm/v1/tx'

export class MsgHaltChannel extends JSONSerializable<
  MsgHaltChannel.Amino,
  MsgHaltChannel.Data,
  MsgHaltChannel.Proto
> {
  /**
   * @param authority the address that controls the module
   * @param channel_id
   * @param port_id
   */
  constructor(
    public authority: AccAddress,
    public channel_id: string,
    public port_id: string
  ) {
    super()
  }

  public static fromAmino(data: MsgHaltChannel.Amino): MsgHaltChannel {
    const {
      value: { authority, channel_id, port_id },
    } = data
    return new MsgHaltChannel(authority, channel_id, port_id)
  }

  public toAmino(): MsgHaltChannel.Amino {
    const { authority, channel_id, port_id } = this
    return {
      type: 'perm/MsgHaltChannel',
      value: {
        authority,
        channel_id,
        port_id,
      },
    }
  }

  public static fromData(data: MsgHaltChannel.Data): MsgHaltChannel {
    const { authority, channel_id, port_id } = data
    return new MsgHaltChannel(authority, channel_id, port_id)
  }

  public toData(): MsgHaltChannel.Data {
    const { authority, channel_id, port_id } = this
    return {
      '@type': '/ibc.applications.perm.v1.MsgHaltChannel',
      authority,
      channel_id,
      port_id,
    }
  }

  public static fromProto(data: MsgHaltChannel.Proto): MsgHaltChannel {
    return new MsgHaltChannel(data.authority, data.channelId, data.portId)
  }

  public toProto(): MsgHaltChannel.Proto {
    const { authority, channel_id, port_id } = this
    return MsgHaltChannel_pb.fromPartial({
      authority,
      channelId: channel_id,
      portId: port_id,
    })
  }

  public packAny(): Any {
    return Any.fromPartial({
      typeUrl: '/ibc.applications.perm.v1.MsgHaltChannel',
      value: MsgHaltChannel_pb.encode(this.toProto()).finish(),
    })
  }

  public static unpackAny(msgAny: Any): MsgHaltChannel {
    return MsgHaltChannel.fromProto(MsgHaltChannel_pb.decode(msgAny.value))
  }
}

export namespace MsgHaltChannel {
  export interface Amino {
    type: 'perm/MsgHaltChannel'
    value: {
      authority: AccAddress
      channel_id: string
      port_id: string
    }
  }

  export interface Data {
    '@type': '/ibc.applications.perm.v1.MsgHaltChannel'
    authority: AccAddress
    channel_id: string
    port_id: string
  }

  export type Proto = MsgHaltChannel_pb
}
