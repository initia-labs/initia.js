import { JSONSerializable } from '../../../../../util/json'
import { AccAddress } from '../../../../bech32'
import { Any } from '@initia/initia.proto/google/protobuf/any'
import { MsgChannelCloseConfirm as MsgChannelCloseConfirm_pb } from '@initia/initia.proto/ibc/core/channel/v1/tx'
import { Height } from '../../client'

/**
 * MsgChannelCloseConfirm defines a msg sent by a Relayer to Chain B to acknowledge the change of channel state to CLOSED on Chain A.
 */
export class MsgChannelCloseConfirm extends JSONSerializable<
  any,
  MsgChannelCloseConfirm.Data,
  MsgChannelCloseConfirm.Proto
> {
  /**
   * @param port_id identifier of the port to use
   * @param channel_id
   * @param proof_init
   * @param proof_height
   * @param signer signer address
   */
  constructor(
    public port_id: string,
    public channel_id: string,
    public proof_init: string,
    public proof_height: Height | undefined,
    public signer: AccAddress
  ) {
    super()
  }

  public static fromAmino(_: any): MsgChannelCloseConfirm {
    throw new Error('Amino not supported')
  }

  public toAmino(): any {
    throw new Error('Amino not supported')
  }

  public static fromData(
    data: MsgChannelCloseConfirm.Data
  ): MsgChannelCloseConfirm {
    const { port_id, channel_id, proof_init, proof_height, signer } = data
    return new MsgChannelCloseConfirm(
      port_id,
      channel_id,
      proof_init,
      proof_height ? Height.fromData(proof_height) : undefined,
      signer
    )
  }

  public toData(): MsgChannelCloseConfirm.Data {
    const { port_id, channel_id, proof_init, proof_height, signer } = this
    return {
      '@type': '/ibc.core.channel.v1.MsgChannelCloseConfirm',
      port_id,
      channel_id,
      proof_init,
      proof_height: proof_height?.toData(),
      signer,
    }
  }

  public static fromProto(
    proto: MsgChannelCloseConfirm.Proto
  ): MsgChannelCloseConfirm {
    return new MsgChannelCloseConfirm(
      proto.portId,
      proto.channelId,
      Buffer.from(proto.proofInit).toString('base64'),
      proto.proofHeight ? Height.fromProto(proto.proofHeight) : undefined,
      proto.signer
    )
  }

  public toProto(): MsgChannelCloseConfirm.Proto {
    const { port_id, channel_id, proof_init, proof_height, signer } = this
    return MsgChannelCloseConfirm_pb.fromPartial({
      portId: port_id,
      channelId: channel_id,
      proofInit: Buffer.from(proof_init, 'base64'),
      proofHeight: proof_height?.toProto(),
      signer,
    })
  }

  public packAny(): Any {
    return Any.fromPartial({
      typeUrl: '/ibc.core.channel.v1.MsgChannelCloseConfirm',
      value: MsgChannelCloseConfirm_pb.encode(this.toProto()).finish(),
    })
  }

  public static unpackAny(msgAny: Any): MsgChannelCloseConfirm {
    return MsgChannelCloseConfirm.fromProto(
      MsgChannelCloseConfirm_pb.decode(msgAny.value)
    )
  }
}

export namespace MsgChannelCloseConfirm {
  export interface Data {
    '@type': '/ibc.core.channel.v1.MsgChannelCloseConfirm'
    port_id: string
    channel_id: string
    proof_init: string
    proof_height?: Height.Data
    signer: AccAddress
  }
  export type Proto = MsgChannelCloseConfirm_pb
}
