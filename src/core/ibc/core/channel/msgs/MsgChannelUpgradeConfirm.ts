import { JSONSerializable } from '../../../../../util/json'
import { AccAddress } from '../../../../bech32'
import { Any } from '@initia/initia.proto/google/protobuf/any'
import { MsgChannelUpgradeConfirm as MsgChannelUpgradeConfirm_pb } from '@initia/initia.proto/ibc/core/channel/v1/tx'
import { Upgrade } from '../Upgrade'
import { Height } from '../../client/Height'

/**
 * MsgChannelUpgradeConfirm defines an sdk.Msg to confirm a channel upgrade.
 */
export class MsgChannelUpgradeConfirm extends JSONSerializable<
  any,
  MsgChannelUpgradeConfirm.Data,
  MsgChannelUpgradeConfirm.Proto
> {
  /**
   * @param port_id identifier of the port to use
   * @param channel_id identifier of the channel to upgrade
   * @param counterparty_channel_state the state of the counterparty channel
   * @param counterparty_upgrade the upgrade from the counterparty
   * @param proof_channel proof of the channel state
   * @param proof_upgrade proof of the upgrade state
   * @param proof_height height at which the proof was retrieved
   * @param signer signer address
   */
  constructor(
    public port_id: string,
    public channel_id: string,
    public counterparty_channel_state: number,
    public counterparty_upgrade: Upgrade | undefined,
    public proof_channel: Uint8Array,
    public proof_upgrade: Uint8Array,
    public proof_height: Height | undefined,
    public signer: AccAddress
  ) {
    super()
  }

  public static fromAmino(_: any): MsgChannelUpgradeConfirm {
    throw new Error('Amino not supported')
  }

  public toAmino(): any {
    throw new Error('Amino not supported')
  }

  public static fromData(data: MsgChannelUpgradeConfirm.Data): MsgChannelUpgradeConfirm {
    const { 
      port_id, 
      channel_id, 
      counterparty_channel_state, 
      counterparty_upgrade, 
      proof_channel, 
      proof_upgrade, 
      proof_height, 
      signer 
    } = data
    return new MsgChannelUpgradeConfirm(
      port_id,
      channel_id,
      counterparty_channel_state,
      counterparty_upgrade ? Upgrade.fromData(counterparty_upgrade) : undefined,
      proof_channel,
      proof_upgrade,
      proof_height ? Height.fromData(proof_height) : undefined,
      signer
    )
  }

  public toData(): MsgChannelUpgradeConfirm.Data {
    const { 
      port_id, 
      channel_id, 
      counterparty_channel_state, 
      counterparty_upgrade, 
      proof_channel, 
      proof_upgrade, 
      proof_height, 
      signer 
    } = this
    return {
      '@type': '/ibc.core.channel.v1.MsgChannelUpgradeConfirm',
      port_id,
      channel_id,
      counterparty_channel_state,
      counterparty_upgrade: counterparty_upgrade?.toData(),
      proof_channel,
      proof_upgrade,
      proof_height: proof_height?.toData(),
      signer,
    }
  }

  public static fromProto(proto: MsgChannelUpgradeConfirm.Proto): MsgChannelUpgradeConfirm {
    return new MsgChannelUpgradeConfirm(
      proto.portId,
      proto.channelId,
      proto.counterpartyChannelState,
      proto.counterpartyUpgrade ? Upgrade.fromProto(proto.counterpartyUpgrade) : undefined,
      proto.proofChannel,
      proto.proofUpgrade,
      proto.proofHeight ? Height.fromProto(proto.proofHeight) : undefined,
      proto.signer
    )
  }

  public toProto(): MsgChannelUpgradeConfirm.Proto {
    const { 
      port_id, 
      channel_id, 
      counterparty_channel_state, 
      counterparty_upgrade, 
      proof_channel, 
      proof_upgrade, 
      proof_height, 
      signer 
    } = this
    return MsgChannelUpgradeConfirm_pb.fromPartial({
      portId: port_id,
      channelId: channel_id,
      counterpartyChannelState: counterparty_channel_state,
      counterpartyUpgrade: counterparty_upgrade?.toProto(),
      proofChannel: proof_channel,
      proofUpgrade: proof_upgrade,
      proofHeight: proof_height?.toProto(),
      signer,
    })
  }

  public packAny(): Any {
    return Any.fromPartial({
      typeUrl: '/ibc.core.channel.v1.MsgChannelUpgradeConfirm',
      value: MsgChannelUpgradeConfirm_pb.encode(this.toProto()).finish(),
    })
  }

  public static unpackAny(msgAny: Any): MsgChannelUpgradeConfirm {
    return MsgChannelUpgradeConfirm.fromProto(
      MsgChannelUpgradeConfirm_pb.decode(msgAny.value)
    )
  }
}

export namespace MsgChannelUpgradeConfirm {
  export interface Data {
    '@type': '/ibc.core.channel.v1.MsgChannelUpgradeConfirm'
    port_id: string
    channel_id: string
    counterparty_channel_state: number
    counterparty_upgrade?: Upgrade.Data
    proof_channel: Uint8Array
    proof_upgrade: Uint8Array
    proof_height?: Height.Data
    signer: AccAddress
  }

  export type Proto = MsgChannelUpgradeConfirm_pb
}
