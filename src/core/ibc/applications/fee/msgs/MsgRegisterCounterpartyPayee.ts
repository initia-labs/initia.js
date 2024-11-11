import { JSONSerializable } from '../../../../../util/json'
import { Any } from '@initia/initia.proto/google/protobuf/any'
import { MsgRegisterCounterpartyPayee as MsgRegisterCounterpartyPayee_pb } from '@initia/initia.proto/ibc/applications/fee/v1/tx'

/**
 * MsgRegisterCounterpartyPayee is called by the relayer on each channelEnd and allows them to specify the counterparty
 * payee address before relaying. This ensures they will be properly compensated for forward relaying since
 * the destination chain must include the registered counterparty payee address in the acknowledgement. This function
 * may be called more than once by a relayer, in which case, the latest counterparty payee address is always used.
 */
export class MsgRegisterCounterpartyPayee extends JSONSerializable<
  any,
  MsgRegisterCounterpartyPayee.Data,
  MsgRegisterCounterpartyPayee.Proto
> {
  /**
   * @param port_id unique port identifier
   * @param channel_id unique channel identifier
   * @param relayer the relayer address
   * @param counterparty_payee the counterparty payee address
   */
  constructor(
    public port_id: string,
    public channel_id: string,
    public relayer: string,
    public counterparty_payee: string
  ) {
    super()
  }

  public static fromAmino(_: any): MsgRegisterCounterpartyPayee {
    throw new Error('Amino not supported')
  }

  public toAmino(): any {
    throw new Error('Amino not supported')
  }

  public static fromData(
    data: MsgRegisterCounterpartyPayee.Data
  ): MsgRegisterCounterpartyPayee {
    const { port_id, channel_id, relayer, counterparty_payee } = data

    return new MsgRegisterCounterpartyPayee(
      port_id,
      channel_id,
      relayer,
      counterparty_payee
    )
  }

  public toData(): MsgRegisterCounterpartyPayee.Data {
    const { port_id, channel_id, relayer, counterparty_payee } = this
    return {
      '@type': '/ibc.applications.fee.v1.MsgRegisterCounterpartyPayee',
      port_id,
      channel_id,
      relayer,
      counterparty_payee,
    }
  }

  public static fromProto(
    proto: MsgRegisterCounterpartyPayee.Proto
  ): MsgRegisterCounterpartyPayee {
    return new MsgRegisterCounterpartyPayee(
      proto.portId,
      proto.channelId,
      proto.relayer,
      proto.counterpartyPayee
    )
  }

  public toProto(): MsgRegisterCounterpartyPayee.Proto {
    const { port_id, channel_id, relayer, counterparty_payee } = this
    return MsgRegisterCounterpartyPayee_pb.fromPartial({
      portId: port_id,
      channelId: channel_id,
      relayer,
      counterpartyPayee: counterparty_payee,
    })
  }

  public packAny(): Any {
    return Any.fromPartial({
      typeUrl: '/ibc.applications.fee.v1.MsgRegisterCounterpartyPayee',
      value: MsgRegisterCounterpartyPayee_pb.encode(this.toProto()).finish(),
    })
  }

  public static unpackAny(msgAny: Any): MsgRegisterCounterpartyPayee {
    return MsgRegisterCounterpartyPayee.fromProto(
      MsgRegisterCounterpartyPayee_pb.decode(msgAny.value)
    )
  }
}

export namespace MsgRegisterCounterpartyPayee {
  export interface Data {
    '@type': '/ibc.applications.fee.v1.MsgRegisterCounterpartyPayee'
    port_id: string
    channel_id: string
    relayer: string
    counterparty_payee: string
  }

  export type Proto = MsgRegisterCounterpartyPayee_pb
}
