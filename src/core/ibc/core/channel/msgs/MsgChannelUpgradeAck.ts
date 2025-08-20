import { JSONSerializable } from '../../../../../util/json'
import { AccAddress } from '../../../../bech32'
import { Any } from '@initia/initia.proto/google/protobuf/any'
import { MsgChannelUpgradeAck as MsgChannelUpgradeAck_pb } from '@initia/initia.proto/ibc/core/channel/v1/tx'
import { Upgrade } from '../Upgrade'
import { Height } from '../../client/Height'

/**
 * MsgChannelUpgradeAck defines an sdk.Msg to acknowledge a channel upgrade.
 */
export class MsgChannelUpgradeAck extends JSONSerializable<
  any,
  MsgChannelUpgradeAck.Data,
  MsgChannelUpgradeAck.Proto
> {
  /**
   * @param port_id identifier of the port to use
   * @param channel_id identifier of the channel to upgrade
   * @param counterparty_upgrade the upgrade from the counterparty
   * @param proof_channel proof of the channel state
   * @param proof_upgrade proof of the upgrade state
   * @param proof_height height at which the proof was retrieved
   * @param signer signer address
   */
  constructor(
    public port_id: string,
    public channel_id: string,
    public counterparty_upgrade: Upgrade | undefined,
    public proof_channel: string,
    public proof_upgrade: string,
    public proof_height: Height | undefined,
    public signer: AccAddress
  ) {
    super()
  }

  public static fromAmino(_: any): MsgChannelUpgradeAck {
    throw new Error('Amino not supported')
  }

  public toAmino(): any {
    throw new Error('Amino not supported')
  }

  public static fromData(
    data: MsgChannelUpgradeAck.Data
  ): MsgChannelUpgradeAck {
    const {
      port_id,
      channel_id,
      counterparty_upgrade,
      proof_channel,
      proof_upgrade,
      proof_height,
      signer,
    } = data
    return new MsgChannelUpgradeAck(
      port_id,
      channel_id,
      counterparty_upgrade ? Upgrade.fromData(counterparty_upgrade) : undefined,
      proof_channel,
      proof_upgrade,
      proof_height ? Height.fromData(proof_height) : undefined,
      signer
    )
  }

  public toData(): MsgChannelUpgradeAck.Data {
    const {
      port_id,
      channel_id,
      counterparty_upgrade,
      proof_channel,
      proof_upgrade,
      proof_height,
      signer,
    } = this
    return {
      '@type': '/ibc.core.channel.v1.MsgChannelUpgradeAck',
      port_id,
      channel_id,
      counterparty_upgrade: counterparty_upgrade?.toData(),
      proof_channel,
      proof_upgrade,
      proof_height: proof_height?.toData(),
      signer,
    }
  }

  public static fromProto(
    proto: MsgChannelUpgradeAck.Proto
  ): MsgChannelUpgradeAck {
    return new MsgChannelUpgradeAck(
      proto.portId,
      proto.channelId,
      proto.counterpartyUpgrade
        ? Upgrade.fromProto(proto.counterpartyUpgrade)
        : undefined,
      Buffer.from(proto.proofChannel).toString('base64'),
      Buffer.from(proto.proofUpgrade).toString('base64'),
      proto.proofHeight ? Height.fromProto(proto.proofHeight) : undefined,
      proto.signer
    )
  }

  public toProto(): MsgChannelUpgradeAck.Proto {
    const {
      port_id,
      channel_id,
      counterparty_upgrade,
      proof_channel,
      proof_upgrade,
      proof_height,
      signer,
    } = this
    return MsgChannelUpgradeAck_pb.fromPartial({
      portId: port_id,
      channelId: channel_id,
      counterpartyUpgrade: counterparty_upgrade?.toProto(),
      proofChannel: Buffer.from(proof_channel, 'base64'),
      proofUpgrade: Buffer.from(proof_upgrade, 'base64'),
      proofHeight: proof_height?.toProto(),
      signer,
    })
  }

  public packAny(): Any {
    return Any.fromPartial({
      typeUrl: '/ibc.core.channel.v1.MsgChannelUpgradeAck',
      value: MsgChannelUpgradeAck_pb.encode(this.toProto()).finish(),
    })
  }

  public static unpackAny(msgAny: Any): MsgChannelUpgradeAck {
    return MsgChannelUpgradeAck.fromProto(
      MsgChannelUpgradeAck_pb.decode(msgAny.value)
    )
  }
}

export namespace MsgChannelUpgradeAck {
  export interface Data {
    '@type': '/ibc.core.channel.v1.MsgChannelUpgradeAck'
    port_id: string
    channel_id: string
    counterparty_upgrade?: Upgrade.Data
    proof_channel: string
    proof_upgrade: string
    proof_height?: Height.Data
    signer: AccAddress
  }

  export type Proto = MsgChannelUpgradeAck_pb
}
