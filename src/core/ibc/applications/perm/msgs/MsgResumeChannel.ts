import { JSONSerializable } from '../../../../../util/json'
import { AccAddress } from '../../../../bech32'
import { Any } from '@initia/initia.proto/google/protobuf/any'
import { MsgResumeChannel as MsgResumeChannel_pb } from '@initia/initia.proto/ibc/applications/perm/v1/tx'

export class MsgResumeChannel extends JSONSerializable<
  MsgResumeChannel.Amino,
  MsgResumeChannel.Data,
  MsgResumeChannel.Proto
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

  public static fromAmino(data: MsgResumeChannel.Amino): MsgResumeChannel {
    const {
      value: { authority, channel_id, port_id },
    } = data
    return new MsgResumeChannel(authority, channel_id, port_id)
  }

  public toAmino(): MsgResumeChannel.Amino {
    const { authority, channel_id, port_id } = this
    return {
      type: 'perm/MsgResumeChannel',
      value: {
        authority,
        channel_id,
        port_id,
      },
    }
  }

  public static fromData(data: MsgResumeChannel.Data): MsgResumeChannel {
    const { authority, channel_id, port_id } = data
    return new MsgResumeChannel(authority, channel_id, port_id)
  }

  public toData(): MsgResumeChannel.Data {
    const { authority, channel_id, port_id } = this
    return {
      '@type': '/ibc.applications.perm.v1.MsgResumeChannel',
      authority,
      channel_id,
      port_id,
    }
  }

  public static fromProto(data: MsgResumeChannel.Proto): MsgResumeChannel {
    return new MsgResumeChannel(data.authority, data.channelId, data.portId)
  }

  public toProto(): MsgResumeChannel.Proto {
    const { authority, channel_id, port_id } = this
    return MsgResumeChannel_pb.fromPartial({
      authority,
      channelId: channel_id,
      portId: port_id,
    })
  }

  public packAny(): Any {
    return Any.fromPartial({
      typeUrl: '/ibc.applications.perm.v1.MsgResumeChannel',
      value: MsgResumeChannel_pb.encode(this.toProto()).finish(),
    })
  }

  public static unpackAny(msgAny: Any): MsgResumeChannel {
    return MsgResumeChannel.fromProto(MsgResumeChannel_pb.decode(msgAny.value))
  }
}

export namespace MsgResumeChannel {
  export interface Amino {
    type: 'perm/MsgResumeChannel'
    value: {
      authority: AccAddress
      channel_id: string
      port_id: string
    }
  }

  export interface Data {
    '@type': '/ibc.applications.perm.v1.MsgResumeChannel'
    authority: AccAddress
    channel_id: string
    port_id: string
  }

  export type Proto = MsgResumeChannel_pb
}
