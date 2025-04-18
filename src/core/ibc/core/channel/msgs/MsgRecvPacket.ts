import { JSONSerializable } from '../../../../../util/json'
import { AccAddress } from '../../../../bech32'
import { Any } from '@initia/initia.proto/google/protobuf/any'
import { MsgRecvPacket as MsgRecvPacket_pb } from '@initia/initia.proto/ibc/core/channel/v1/tx'
import { Packet, Height } from '../../../core'

/**
 * MsgRecvPacket receives incoming IBC packet.
 */
export class MsgRecvPacket extends JSONSerializable<
  any,
  MsgRecvPacket.Data,
  MsgRecvPacket.Proto
> {
  /**
   * @param packet
   * @param proof_commitment
   * @param proof_height
   * @param signer signer address
   */
  constructor(
    public packet: Packet | undefined,
    public proof_commitment: string,
    public proof_height: Height | undefined,
    public signer: AccAddress
  ) {
    super()
  }

  public static fromAmino(_: any): MsgRecvPacket {
    throw new Error('Amino not supported')
  }

  public toAmino(): any {
    throw new Error('Amino not supported')
  }

  public static fromData(data: MsgRecvPacket.Data): MsgRecvPacket {
    const { packet, proof_commitment, proof_height, signer } = data
    return new MsgRecvPacket(
      packet ? Packet.fromData(packet) : undefined,
      proof_commitment,
      proof_height ? Height.fromData(proof_height) : undefined,
      signer
    )
  }

  public toData(): MsgRecvPacket.Data {
    const { packet, proof_commitment, proof_height, signer } = this
    return {
      '@type': '/ibc.core.channel.v1.MsgRecvPacket',
      packet: packet?.toData(),
      proof_commitment,
      proof_height: proof_height?.toData(),
      signer,
    }
  }

  public static fromProto(proto: MsgRecvPacket.Proto): MsgRecvPacket {
    return new MsgRecvPacket(
      proto.packet ? Packet.fromProto(proto.packet) : undefined,
      Buffer.from(proto.proofCommitment).toString('base64'),
      proto.proofHeight ? Height.fromProto(proto.proofHeight) : undefined,
      proto.signer
    )
  }

  public toProto(): MsgRecvPacket.Proto {
    const { packet, proof_commitment, proof_height, signer } = this
    return MsgRecvPacket_pb.fromPartial({
      packet: packet?.toProto(),
      proofCommitment: Buffer.from(proof_commitment, 'base64'),
      proofHeight: proof_height?.toProto(),
      signer,
    })
  }

  public packAny(): Any {
    return Any.fromPartial({
      typeUrl: '/ibc.core.channel.v1.MsgRecvPacket',
      value: MsgRecvPacket_pb.encode(this.toProto()).finish(),
    })
  }

  public static unpackAny(msgAny: Any): MsgRecvPacket {
    return MsgRecvPacket.fromProto(MsgRecvPacket_pb.decode(msgAny.value))
  }
}

export namespace MsgRecvPacket {
  export interface Data {
    '@type': '/ibc.core.channel.v1.MsgRecvPacket'
    packet?: Packet.Data
    proof_commitment: string
    proof_height?: Height.Data
    signer: AccAddress
  }
  export type Proto = MsgRecvPacket_pb
}
