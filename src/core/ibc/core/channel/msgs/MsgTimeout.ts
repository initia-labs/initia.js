import { JSONSerializable } from '../../../../../util/json'
import { AccAddress } from '../../../../bech32'
import { Any } from '@initia/initia.proto/google/protobuf/any'
import { MsgTimeout as MsgTimeout_pb } from '@initia/initia.proto/ibc/core/channel/v1/tx'
import { Packet, Height } from '../../../core'

/**
 * MsgTimeout receives timed-out packet.
 */
export class MsgTimeout extends JSONSerializable<
  any,
  MsgTimeout.Data,
  MsgTimeout.Proto
> {
  /**
   * @param packet
   * @param proof_unreceived
   * @param proof_height
   * @param next_seuqnce_recv
   * @param signer signer address
   */
  constructor(
    public packet: Packet | undefined,
    public proof_unreceived: string,
    public proof_height: Height | undefined,
    public next_sequence_recv: number,
    public signer: AccAddress
  ) {
    super()
  }

  public static fromAmino(_: any): MsgTimeout {
    throw new Error('Amino not supported')
  }

  public toAmino(): any {
    throw new Error('Amino not supported')
  }

  public static fromData(data: MsgTimeout.Data): MsgTimeout {
    const {
      packet,
      proof_unreceived,
      proof_height,
      next_sequence_recv,
      signer,
    } = data
    return new MsgTimeout(
      packet ? Packet.fromData(packet) : undefined,
      proof_unreceived,
      proof_height ? Height.fromData(proof_height) : undefined,
      parseInt(next_sequence_recv),
      signer
    )
  }

  public toData(): MsgTimeout.Data {
    const {
      packet,
      proof_unreceived,
      proof_height,
      next_sequence_recv,
      signer,
    } = this
    return {
      '@type': '/ibc.core.channel.v1.MsgTimeout',
      packet: packet?.toData(),
      proof_unreceived,
      proof_height: proof_height?.toData(),
      next_sequence_recv: next_sequence_recv.toFixed(),
      signer,
    }
  }

  public static fromProto(proto: MsgTimeout.Proto): MsgTimeout {
    return new MsgTimeout(
      proto.packet ? Packet.fromProto(proto.packet) : undefined,
      Buffer.from(proto.proofUnreceived).toString('base64'),
      proto.proofHeight ? Height.fromProto(proto.proofHeight) : undefined,
      Number(proto.nextSequenceRecv),
      proto.signer
    )
  }

  public toProto(): MsgTimeout.Proto {
    const {
      packet,
      proof_unreceived,
      proof_height,
      next_sequence_recv,
      signer,
    } = this
    return MsgTimeout_pb.fromPartial({
      packet: packet?.toProto(),
      proofUnreceived: Buffer.from(proof_unreceived, 'base64'),
      proofHeight: proof_height?.toProto(),
      nextSequenceRecv: BigInt(next_sequence_recv),
      signer,
    })
  }

  public packAny(): Any {
    return Any.fromPartial({
      typeUrl: '/ibc.core.channel.v1.MsgTimeout',
      value: MsgTimeout_pb.encode(this.toProto()).finish(),
    })
  }

  public static unpackAny(msgAny: Any): MsgTimeout {
    return MsgTimeout.fromProto(MsgTimeout_pb.decode(msgAny.value))
  }
}

export namespace MsgTimeout {
  export interface Data {
    '@type': '/ibc.core.channel.v1.MsgTimeout'
    packet?: Packet.Data
    proof_unreceived: string
    proof_height?: Height.Data
    next_sequence_recv: string
    signer: AccAddress
  }
  export type Proto = MsgTimeout_pb
}
