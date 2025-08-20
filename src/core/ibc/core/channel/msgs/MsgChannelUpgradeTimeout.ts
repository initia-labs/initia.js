import { JSONSerializable } from '../../../../../util/json'
import { AccAddress } from '../../../../bech32'
import { Any } from '@initia/initia.proto/google/protobuf/any'
import { MsgChannelUpgradeTimeout as MsgChannelUpgradeTimeout_pb } from '@initia/initia.proto/ibc/core/channel/v1/tx'
import { Channel } from '../Channel'
import { Height } from '../../client/Height'

/**
 * MsgChannelUpgradeTimeout defines an sdk.Msg to timeout a channel upgrade.
 */
export class MsgChannelUpgradeTimeout extends JSONSerializable<
  any,
  MsgChannelUpgradeTimeout.Data,
  MsgChannelUpgradeTimeout.Proto
> {
  /**
   * @param port_id identifier of the port to use
   * @param channel_id identifier of the channel to timeout upgrade
   * @param counterparty_channel the counterparty channel state
   * @param proof_channel proof of the channel state
   * @param proof_height height at which the proof was retrieved
   * @param signer signer address
   */
  constructor(
    public port_id: string,
    public channel_id: string,
    public counterparty_channel: Channel | undefined,
    public proof_channel: Uint8Array,
    public proof_height: Height | undefined,
    public signer: AccAddress
  ) {
    super()
  }

  public static fromAmino(_: any): MsgChannelUpgradeTimeout {
    throw new Error('Amino not supported')
  }

  public toAmino(): any {
    throw new Error('Amino not supported')
  }

  public static fromData(
    data: MsgChannelUpgradeTimeout.Data
  ): MsgChannelUpgradeTimeout {
    const {
      port_id,
      channel_id,
      counterparty_channel,
      proof_channel,
      proof_height,
      signer,
    } = data
    return new MsgChannelUpgradeTimeout(
      port_id,
      channel_id,
      counterparty_channel ? Channel.fromData(counterparty_channel) : undefined,
      proof_channel,
      proof_height ? Height.fromData(proof_height) : undefined,
      signer
    )
  }

  public toData(): MsgChannelUpgradeTimeout.Data {
    const {
      port_id,
      channel_id,
      counterparty_channel,
      proof_channel,
      proof_height,
      signer,
    } = this
    return {
      '@type': '/ibc.core.channel.v1.MsgChannelUpgradeTimeout',
      port_id,
      channel_id,
      counterparty_channel: counterparty_channel?.toData(),
      proof_channel,
      proof_height: proof_height?.toData(),
      signer,
    }
  }

  public static fromProto(
    proto: MsgChannelUpgradeTimeout.Proto
  ): MsgChannelUpgradeTimeout {
    return new MsgChannelUpgradeTimeout(
      proto.portId,
      proto.channelId,
      proto.counterpartyChannel
        ? Channel.fromProto(proto.counterpartyChannel)
        : undefined,
      proto.proofChannel,
      proto.proofHeight ? Height.fromProto(proto.proofHeight) : undefined,
      proto.signer
    )
  }

  public toProto(): MsgChannelUpgradeTimeout.Proto {
    const {
      port_id,
      channel_id,
      counterparty_channel,
      proof_channel,
      proof_height,
      signer,
    } = this
    return MsgChannelUpgradeTimeout_pb.fromPartial({
      portId: port_id,
      channelId: channel_id,
      counterpartyChannel: counterparty_channel?.toProto(),
      proofChannel: proof_channel,
      proofHeight: proof_height?.toProto(),
      signer,
    })
  }

  public packAny(): Any {
    return Any.fromPartial({
      typeUrl: '/ibc.core.channel.v1.MsgChannelUpgradeTimeout',
      value: MsgChannelUpgradeTimeout_pb.encode(this.toProto()).finish(),
    })
  }

  public static unpackAny(msgAny: Any): MsgChannelUpgradeTimeout {
    return MsgChannelUpgradeTimeout.fromProto(
      MsgChannelUpgradeTimeout_pb.decode(msgAny.value)
    )
  }
}

export namespace MsgChannelUpgradeTimeout {
  export interface Data {
    '@type': '/ibc.core.channel.v1.MsgChannelUpgradeTimeout'
    port_id: string
    channel_id: string
    counterparty_channel?: Channel.Data
    proof_channel: Uint8Array
    proof_height?: Height.Data
    signer: AccAddress
  }

  export type Proto = MsgChannelUpgradeTimeout_pb
}
