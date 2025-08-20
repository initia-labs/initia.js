import { JSONSerializable } from '../../../../../util/json'
import { AccAddress } from '../../../../bech32'
import { Any } from '@initia/initia.proto/google/protobuf/any'
import { MsgChannelUpgradeCancel as MsgChannelUpgradeCancel_pb } from '@initia/initia.proto/ibc/core/channel/v1/tx'
import { ErrorReceipt } from '../ErrorReceipt'
import { Height } from '../../client/Height'

/**
 * MsgChannelUpgradeCancel defines an sdk.Msg to cancel a channel upgrade.
 */
export class MsgChannelUpgradeCancel extends JSONSerializable<
  any,
  MsgChannelUpgradeCancel.Data,
  MsgChannelUpgradeCancel.Proto
> {
  /**
   * @param port_id identifier of the port to use
   * @param channel_id identifier of the channel to cancel upgrade
   * @param error_receipt the error receipt containing sequence and error message
   * @param proof_error_receipt proof of the error receipt
   * @param proof_height height at which the proof was retrieved
   * @param signer signer address
   */
  constructor(
    public port_id: string,
    public channel_id: string,
    public error_receipt: ErrorReceipt | undefined,
    public proof_error_receipt: Uint8Array,
    public proof_height: Height | undefined,
    public signer: AccAddress
  ) {
    super()
  }

  public static fromAmino(_: any): MsgChannelUpgradeCancel {
    throw new Error('Amino not supported')
  }

  public toAmino(): any {
    throw new Error('Amino not supported')
  }

  public static fromData(
    data: MsgChannelUpgradeCancel.Data
  ): MsgChannelUpgradeCancel {
    const {
      port_id,
      channel_id,
      error_receipt,
      proof_error_receipt,
      proof_height,
      signer,
    } = data
    return new MsgChannelUpgradeCancel(
      port_id,
      channel_id,
      error_receipt ? ErrorReceipt.fromData(error_receipt) : undefined,
      proof_error_receipt,
      proof_height ? Height.fromData(proof_height) : undefined,
      signer
    )
  }

  public toData(): MsgChannelUpgradeCancel.Data {
    const {
      port_id,
      channel_id,
      error_receipt,
      proof_error_receipt,
      proof_height,
      signer,
    } = this
    return {
      '@type': '/ibc.core.channel.v1.MsgChannelUpgradeCancel',
      port_id,
      channel_id,
      error_receipt: error_receipt?.toData(),
      proof_error_receipt,
      proof_height: proof_height?.toData(),
      signer,
    }
  }

  public static fromProto(
    proto: MsgChannelUpgradeCancel.Proto
  ): MsgChannelUpgradeCancel {
    return new MsgChannelUpgradeCancel(
      proto.portId,
      proto.channelId,
      proto.errorReceipt
        ? ErrorReceipt.fromProto(proto.errorReceipt)
        : undefined,
      proto.proofErrorReceipt,
      proto.proofHeight ? Height.fromProto(proto.proofHeight) : undefined,
      proto.signer
    )
  }

  public toProto(): MsgChannelUpgradeCancel.Proto {
    const {
      port_id,
      channel_id,
      error_receipt,
      proof_error_receipt,
      proof_height,
      signer,
    } = this
    return MsgChannelUpgradeCancel_pb.fromPartial({
      portId: port_id,
      channelId: channel_id,
      errorReceipt: error_receipt?.toProto(),
      proofErrorReceipt: proof_error_receipt,
      proofHeight: proof_height?.toProto(),
      signer,
    })
  }

  public packAny(): Any {
    return Any.fromPartial({
      typeUrl: '/ibc.core.channel.v1.MsgChannelUpgradeCancel',
      value: MsgChannelUpgradeCancel_pb.encode(this.toProto()).finish(),
    })
  }

  public static unpackAny(msgAny: Any): MsgChannelUpgradeCancel {
    return MsgChannelUpgradeCancel.fromProto(
      MsgChannelUpgradeCancel_pb.decode(msgAny.value)
    )
  }
}

export namespace MsgChannelUpgradeCancel {
  export interface Data {
    '@type': '/ibc.core.channel.v1.MsgChannelUpgradeCancel'
    port_id: string
    channel_id: string
    error_receipt?: ErrorReceipt.Data
    proof_error_receipt: Uint8Array
    proof_height?: Height.Data
    signer: AccAddress
  }

  export type Proto = MsgChannelUpgradeCancel_pb
}
