import { JSONSerializable } from '../../../../../util/json'
import { AccAddress } from '../../../../bech32'
import { Any } from '@initia/initia.proto/google/protobuf/any'
import { MsgChannelUpgradeOpen as MsgChannelUpgradeOpen_pb } from '@initia/initia.proto/ibc/core/channel/v1/tx'
import { Height } from '../../client/Height'

/**
 * MsgChannelUpgradeOpen defines an sdk.Msg to open a channel after a successful upgrade.
 */
export class MsgChannelUpgradeOpen extends JSONSerializable<
  any,
  MsgChannelUpgradeOpen.Data,
  MsgChannelUpgradeOpen.Proto
> {
  /**
   * @param port_id identifier of the port to use
   * @param channel_id identifier of the channel to open after upgrade
   * @param counterparty_channel_state the state of the counterparty channel
   * @param counterparty_upgrade_sequence the upgrade sequence from the counterparty
   * @param proof_channel proof of the channel state
   * @param proof_height height at which the proof was retrieved
   * @param signer signer address
   */
  constructor(
    public port_id: string,
    public channel_id: string,
    public counterparty_channel_state: number,
    public counterparty_upgrade_sequence: number,
    public proof_channel: string,
    public proof_height: Height | undefined,
    public signer: AccAddress
  ) {
    super()
  }

  public static fromAmino(_: any): MsgChannelUpgradeOpen {
    throw new Error('Amino not supported')
  }

  public toAmino(): any {
    throw new Error('Amino not supported')
  }

  public static fromData(
    data: MsgChannelUpgradeOpen.Data
  ): MsgChannelUpgradeOpen {
    const {
      port_id,
      channel_id,
      counterparty_channel_state,
      counterparty_upgrade_sequence,
      proof_channel,
      proof_height,
      signer,
    } = data
    return new MsgChannelUpgradeOpen(
      port_id,
      channel_id,
      counterparty_channel_state,
      Number(counterparty_upgrade_sequence),
      proof_channel,
      proof_height ? Height.fromData(proof_height) : undefined,
      signer
    )
  }

  public toData(): MsgChannelUpgradeOpen.Data {
    const {
      port_id,
      channel_id,
      counterparty_channel_state,
      counterparty_upgrade_sequence,
      proof_channel,
      proof_height,
      signer,
    } = this
    return {
      '@type': '/ibc.core.channel.v1.MsgChannelUpgradeOpen',
      port_id,
      channel_id,
      counterparty_channel_state,
      counterparty_upgrade_sequence: counterparty_upgrade_sequence.toString(),
      proof_channel: Buffer.from(proof_channel).toString('base64'),
      proof_height: proof_height?.toData(),
      signer,
    }
  }

  public static fromProto(
    proto: MsgChannelUpgradeOpen.Proto
  ): MsgChannelUpgradeOpen {
    return new MsgChannelUpgradeOpen(
      proto.portId,
      proto.channelId,
      proto.counterpartyChannelState,
      Number(proto.counterpartyUpgradeSequence),
      Buffer.from(proto.proofChannel).toString('base64'),
      proto.proofHeight ? Height.fromProto(proto.proofHeight) : undefined,
      proto.signer
    )
  }

  public toProto(): MsgChannelUpgradeOpen.Proto {
    const {
      port_id,
      channel_id,
      counterparty_channel_state,
      counterparty_upgrade_sequence,
      proof_channel,
      proof_height,
      signer,
    } = this
    return MsgChannelUpgradeOpen_pb.fromPartial({
      portId: port_id,
      channelId: channel_id,
      counterpartyChannelState: counterparty_channel_state,
      counterpartyUpgradeSequence: BigInt(counterparty_upgrade_sequence),
      proofChannel: Buffer.from(proof_channel, 'base64'),
      proofHeight: proof_height?.toProto(),
      signer,
    })
  }

  public packAny(): Any {
    return Any.fromPartial({
      typeUrl: '/ibc.core.channel.v1.MsgChannelUpgradeOpen',
      value: MsgChannelUpgradeOpen_pb.encode(this.toProto()).finish(),
    })
  }

  public static unpackAny(msgAny: Any): MsgChannelUpgradeOpen {
    return MsgChannelUpgradeOpen.fromProto(
      MsgChannelUpgradeOpen_pb.decode(msgAny.value)
    )
  }
}

export namespace MsgChannelUpgradeOpen {
  export interface Data {
    '@type': '/ibc.core.channel.v1.MsgChannelUpgradeOpen'
    port_id: string
    channel_id: string
    counterparty_channel_state: number
    counterparty_upgrade_sequence: string
    proof_channel: string
    proof_height?: Height.Data
    signer: AccAddress
  }

  export type Proto = MsgChannelUpgradeOpen_pb
}
