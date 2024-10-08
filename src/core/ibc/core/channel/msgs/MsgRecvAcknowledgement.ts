import { JSONSerializable } from '../../../../../util/json'
import { base64FromBytes, bytesFromBase64 } from '../../../../../util/polyfill'
import { AccAddress } from '../../../../bech32'
import { Any } from '@initia/initia.proto/google/protobuf/any'
import { MsgAcknowledgement as MsgAcknowledgement_pb } from '@initia/initia.proto/ibc/core/channel/v1/tx'
import { Packet, Height } from '../../../core'

/**
 * MsgAcknowledgement receives incoming IBC acknowledgement
 */
export class MsgAcknowledgement extends JSONSerializable<
  any,
  MsgAcknowledgement.Data,
  MsgAcknowledgement.Proto
> {
  /**
   * @param packet
   * @param acknowledgement
   * @param proof_acked
   * @param proof_height
   * @param signer signer address
   */
  constructor(
    public packet: Packet | undefined,
    public acknowledgement: string,
    public proof_acked: string,
    public proof_height: Height | undefined,
    public signer: AccAddress
  ) {
    super()
  }

  public static fromAmino(_: any): MsgAcknowledgement {
    _
    throw new Error('Amino not supported')
  }

  public toAmino(): any {
    throw new Error('Amino not supported')
  }

  public static fromData(data: MsgAcknowledgement.Data): MsgAcknowledgement {
    const { packet, acknowledgement, proof_acked, proof_height, signer } = data
    return new MsgAcknowledgement(
      packet ? Packet.fromData(packet) : undefined,
      proof_acked,
      acknowledgement,
      proof_height ? Height.fromData(proof_height) : undefined,
      signer
    )
  }

  public toData(): MsgAcknowledgement.Data {
    const { packet, acknowledgement, proof_acked, proof_height, signer } = this
    return {
      '@type': '/ibc.core.channel.v1.MsgAcknowledgement',
      packet: packet?.toData(),
      acknowledgement,
      proof_acked,
      proof_height: proof_height?.toData(),
      signer,
    }
  }

  public static fromProto(proto: MsgAcknowledgement.Proto): MsgAcknowledgement {
    return new MsgAcknowledgement(
      proto.packet ? Packet.fromProto(proto.packet) : undefined,
      base64FromBytes(proto.acknowledgement),
      base64FromBytes(proto.proofAcked),
      proto.proofHeight ? Height.fromProto(proto.proofHeight) : undefined,
      proto.signer
    )
  }

  public toProto(): MsgAcknowledgement.Proto {
    const { packet, acknowledgement, proof_acked, proof_height, signer } = this
    return MsgAcknowledgement_pb.fromPartial({
      packet: packet?.toProto(),
      acknowledgement: bytesFromBase64(acknowledgement),
      proofAcked: bytesFromBase64(proof_acked),
      proofHeight: proof_height?.toProto(),
      signer,
    })
  }

  public packAny(): Any {
    return Any.fromPartial({
      typeUrl: '/ibc.core.channel.v1.MsgAcknowledgement',
      value: MsgAcknowledgement_pb.encode(this.toProto()).finish(),
    })
  }

  public static unpackAny(msgAny: Any): MsgAcknowledgement {
    return MsgAcknowledgement.fromProto(
      MsgAcknowledgement_pb.decode(msgAny.value)
    )
  }
}

export namespace MsgAcknowledgement {
  export interface Data {
    '@type': '/ibc.core.channel.v1.MsgAcknowledgement'
    packet?: Packet.Data
    acknowledgement: string
    proof_acked: string
    proof_height?: Height.Data
    signer: AccAddress
  }
  export type Proto = MsgAcknowledgement_pb
}
