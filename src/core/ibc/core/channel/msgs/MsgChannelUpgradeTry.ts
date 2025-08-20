import { JSONSerializable } from '../../../../../util/json'
import { AccAddress } from '../../../../bech32'
import { Any } from '@initia/initia.proto/google/protobuf/any'
import { MsgChannelUpgradeTry as MsgChannelUpgradeTry_pb } from '@initia/initia.proto/ibc/core/channel/v1/tx'
import { UpgradeFields } from '../UpgradeFields'
import { Height } from '../../client/Height'

/**
 * MsgChannelUpgradeTry defines an sdk.Msg to try to upgrade a channel.
 */
export class MsgChannelUpgradeTry extends JSONSerializable<
  any,
  MsgChannelUpgradeTry.Data,
  MsgChannelUpgradeTry.Proto
> {
  /**
   * @param port_id identifier of the port to use
   * @param channel_id identifier of the channel to upgrade
   * @param proposed_upgrade_connection_hops list of connection hops for the proposed upgrade
   * @param counterparty_upgrade_fields the upgrade fields from the counterparty
   * @param counterparty_upgrade_sequence the upgrade sequence from the counterparty
   * @param proof_channel proof of the channel state
   * @param proof_upgrade proof of the upgrade state
   * @param proof_height height at which the proof was retrieved
   * @param signer signer address
   */
  constructor(
    public port_id: string,
    public channel_id: string,
    public proposed_upgrade_connection_hops: string[],
    public counterparty_upgrade_fields: UpgradeFields | undefined,
    public counterparty_upgrade_sequence: number,
    public proof_channel: Uint8Array,
    public proof_upgrade: Uint8Array,
    public proof_height: Height | undefined,
    public signer: AccAddress
  ) {
    super()
  }

  public static fromAmino(_: any): MsgChannelUpgradeTry {
    throw new Error('Amino not supported')
  }

  public toAmino(): any {
    throw new Error('Amino not supported')
  }

  public static fromData(data: MsgChannelUpgradeTry.Data): MsgChannelUpgradeTry {
    const { 
      port_id, 
      channel_id, 
      proposed_upgrade_connection_hops, 
      counterparty_upgrade_fields, 
      counterparty_upgrade_sequence,
      proof_channel,
      proof_upgrade,
      proof_height,
      signer 
    } = data
    return new MsgChannelUpgradeTry(
      port_id,
      channel_id,
      proposed_upgrade_connection_hops,
      counterparty_upgrade_fields ? UpgradeFields.fromData(counterparty_upgrade_fields) : undefined,
      Number(counterparty_upgrade_sequence),
      proof_channel,
      proof_upgrade,
      proof_height ? Height.fromData(proof_height) : undefined,
      signer
    )
  }

  public toData(): MsgChannelUpgradeTry.Data {
    const { 
      port_id, 
      channel_id, 
      proposed_upgrade_connection_hops, 
      counterparty_upgrade_fields, 
      counterparty_upgrade_sequence,
      proof_channel,
      proof_upgrade,
      proof_height,
      signer 
    } = this
    return {
      '@type': '/ibc.core.channel.v1.MsgChannelUpgradeTry',
      port_id,
      channel_id,
      proposed_upgrade_connection_hops,
      counterparty_upgrade_fields: counterparty_upgrade_fields?.toData(),
      counterparty_upgrade_sequence: counterparty_upgrade_sequence.toString(),
      proof_channel,
      proof_upgrade,
      proof_height: proof_height?.toData(),
      signer,
    }
  }

  public static fromProto(proto: MsgChannelUpgradeTry.Proto): MsgChannelUpgradeTry {
    return new MsgChannelUpgradeTry(
      proto.portId,
      proto.channelId,
      proto.proposedUpgradeConnectionHops,
      proto.counterpartyUpgradeFields ? UpgradeFields.fromProto(proto.counterpartyUpgradeFields) : undefined,
      Number(proto.counterpartyUpgradeSequence),
      proto.proofChannel,
      proto.proofUpgrade,
      proto.proofHeight ? Height.fromProto(proto.proofHeight) : undefined,
      proto.signer
    )
  }

  public toProto(): MsgChannelUpgradeTry.Proto {
    const { 
      port_id, 
      channel_id, 
      proposed_upgrade_connection_hops, 
      counterparty_upgrade_fields, 
      counterparty_upgrade_sequence,
      proof_channel,
      proof_upgrade,
      proof_height,
      signer 
    } = this
    return MsgChannelUpgradeTry_pb.fromPartial({
      portId: port_id,
      channelId: channel_id,
      proposedUpgradeConnectionHops: proposed_upgrade_connection_hops,
      counterpartyUpgradeFields: counterparty_upgrade_fields?.toProto(),
      counterpartyUpgradeSequence: BigInt(counterparty_upgrade_sequence),
      proofChannel: proof_channel,
      proofUpgrade: proof_upgrade,
      proofHeight: proof_height?.toProto(),
      signer,
    })
  }

  public packAny(): Any {
    return Any.fromPartial({
      typeUrl: '/ibc.core.channel.v1.MsgChannelUpgradeTry',
      value: MsgChannelUpgradeTry_pb.encode(this.toProto()).finish(),
    })
  }

  public static unpackAny(msgAny: Any): MsgChannelUpgradeTry {
    return MsgChannelUpgradeTry.fromProto(
      MsgChannelUpgradeTry_pb.decode(msgAny.value)
    )
  }
}

export namespace MsgChannelUpgradeTry {
  export interface Data {
    '@type': '/ibc.core.channel.v1.MsgChannelUpgradeTry'
    port_id: string
    channel_id: string
    proposed_upgrade_connection_hops: string[]
    counterparty_upgrade_fields?: UpgradeFields.Data
    counterparty_upgrade_sequence: string
    proof_channel: Uint8Array
    proof_upgrade: Uint8Array
    proof_height?: Height.Data
    signer: AccAddress
  }

  export type Proto = MsgChannelUpgradeTry_pb
}
