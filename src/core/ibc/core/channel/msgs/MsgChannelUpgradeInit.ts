import { JSONSerializable } from '../../../../../util/json'
import { AccAddress } from '../../../../bech32'
import { Any } from '@initia/initia.proto/google/protobuf/any'
import { MsgChannelUpgradeInit as MsgChannelUpgradeInit_pb } from '@initia/initia.proto/ibc/core/channel/v1/tx'
import { UpgradeFields } from '../UpgradeFields'

/**
 * MsgChannelUpgradeInit defines an sdk.Msg to initiate a channel upgrade handshake.
 */
export class MsgChannelUpgradeInit extends JSONSerializable<
  any,
  MsgChannelUpgradeInit.Data,
  MsgChannelUpgradeInit.Proto
> {
  /**
   * @param port_id identifier of the port to use
   * @param channel_id identifier of the channel to upgrade
   * @param fields the upgrade fields to apply
   * @param signer signer address
   */
  constructor(
    public port_id: string,
    public channel_id: string,
    public fields: UpgradeFields | undefined,
    public signer: AccAddress
  ) {
    super()
  }

  public static fromAmino(_: any): MsgChannelUpgradeInit {
    throw new Error('Amino not supported')
  }

  public toAmino(): any {
    throw new Error('Amino not supported')
  }

  public static fromData(
    data: MsgChannelUpgradeInit.Data
  ): MsgChannelUpgradeInit {
    const { port_id, channel_id, fields, signer } = data
    return new MsgChannelUpgradeInit(
      port_id,
      channel_id,
      fields ? UpgradeFields.fromData(fields) : undefined,
      signer
    )
  }

  public toData(): MsgChannelUpgradeInit.Data {
    const { port_id, channel_id, fields, signer } = this
    return {
      '@type': '/ibc.core.channel.v1.MsgChannelUpgradeInit',
      port_id,
      channel_id,
      fields: fields?.toData(),
      signer,
    }
  }

  public static fromProto(
    proto: MsgChannelUpgradeInit.Proto
  ): MsgChannelUpgradeInit {
    return new MsgChannelUpgradeInit(
      proto.portId,
      proto.channelId,
      proto.fields ? UpgradeFields.fromProto(proto.fields) : undefined,
      proto.signer
    )
  }

  public toProto(): MsgChannelUpgradeInit.Proto {
    const { port_id, channel_id, fields, signer } = this
    return MsgChannelUpgradeInit_pb.fromPartial({
      portId: port_id,
      channelId: channel_id,
      fields: fields?.toProto(),
      signer,
    })
  }

  public packAny(): Any {
    return Any.fromPartial({
      typeUrl: '/ibc.core.channel.v1.MsgChannelUpgradeInit',
      value: MsgChannelUpgradeInit_pb.encode(this.toProto()).finish(),
    })
  }

  public static unpackAny(msgAny: Any): MsgChannelUpgradeInit {
    return MsgChannelUpgradeInit.fromProto(
      MsgChannelUpgradeInit_pb.decode(msgAny.value)
    )
  }
}

export namespace MsgChannelUpgradeInit {
  export interface Data {
    '@type': '/ibc.core.channel.v1.MsgChannelUpgradeInit'
    port_id: string
    channel_id: string
    fields?: UpgradeFields.Data
    signer: AccAddress
  }

  export type Proto = MsgChannelUpgradeInit_pb
}
