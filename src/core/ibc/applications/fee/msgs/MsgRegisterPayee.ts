import { JSONSerializable } from '../../../../../util/json'
import { Any } from '@initia/initia.proto/google/protobuf/any'
import { MsgRegisterPayee as MsgRegisterPayee_pb } from '@initia/initia.proto/ibc/applications/fee/v1/tx'

/**
 * MsgRegisterPayee is called by the relayer on each channelEnd and allows them to set an optional
 * payee to which reverse and timeout relayer packet fees will be paid out. The payee should be registered on
 * the source chain from which packets originate as this is where fee distribution takes place. This function may be
 * called more than once by a relayer, in which case, the latest payee is always used.
 */
export class MsgRegisterPayee extends JSONSerializable<
  any,
  MsgRegisterPayee.Data,
  MsgRegisterPayee.Proto
> {
  /**
   * @param port_id unique port identifier
   * @param channel_id unique channel identifier
   * @param relayer the relayer address
   * @param payee the payee address
   */
  constructor(
    public port_id: string,
    public channel_id: string,
    public relayer: string,
    public payee: string
  ) {
    super()
  }

  public static fromAmino(_: any): MsgRegisterPayee {
    throw new Error('Amino not supported')
  }

  public toAmino(): any {
    throw new Error('Amino not supported')
  }

  public static fromData(data: MsgRegisterPayee.Data): MsgRegisterPayee {
    const { port_id, channel_id, relayer, payee } = data

    return new MsgRegisterPayee(port_id, channel_id, relayer, payee)
  }

  public toData(): MsgRegisterPayee.Data {
    const { port_id, channel_id, relayer, payee } = this
    return {
      '@type': '/ibc.applications.fee.v1.MsgRegisterPayee',
      port_id,
      channel_id,
      relayer,
      payee,
    }
  }

  public static fromProto(proto: MsgRegisterPayee.Proto): MsgRegisterPayee {
    return new MsgRegisterPayee(
      proto.portId,
      proto.channelId,
      proto.relayer,
      proto.payee
    )
  }

  public toProto(): MsgRegisterPayee.Proto {
    const { port_id, channel_id, relayer, payee } = this
    return MsgRegisterPayee_pb.fromPartial({
      portId: port_id,
      channelId: channel_id,
      relayer,
      payee,
    })
  }

  public packAny(): Any {
    return Any.fromPartial({
      typeUrl: '/ibc.applications.fee.v1.MsgRegisterPayee',
      value: MsgRegisterPayee_pb.encode(this.toProto()).finish(),
    })
  }

  public static unpackAny(msgAny: Any): MsgRegisterPayee {
    return MsgRegisterPayee.fromProto(MsgRegisterPayee_pb.decode(msgAny.value))
  }
}

export namespace MsgRegisterPayee {
  export interface Data {
    '@type': '/ibc.applications.fee.v1.MsgRegisterPayee'
    port_id: string
    channel_id: string
    relayer: string
    payee: string
  }

  export type Proto = MsgRegisterPayee_pb
}
