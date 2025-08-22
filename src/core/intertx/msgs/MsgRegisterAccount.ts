import { JSONSerializable } from '../../../util/json'
import { AccAddress } from '../../bech32'
import { Any } from '@initia/initia.proto/google/protobuf/any'
import {
  orderFromJSON,
  orderToJSON,
} from '@initia/initia.proto/ibc/core/channel/v1/channel'
import { MsgRegisterAccount as MsgRegisterAccount_pb } from '@initia/initia.proto/initia/intertx/v1/tx'
import { ChannelOrder } from '../../ibc'

export class MsgRegisterAccount extends JSONSerializable<
  MsgRegisterAccount.Amino,
  MsgRegisterAccount.Data,
  MsgRegisterAccount.Proto
> {
  /**
   * @param owner
   * @param connection_id
   * @param version
   * @param ordering
   */
  constructor(
    public owner: AccAddress,
    public connection_id: string,
    public version: string,
    public ordering: ChannelOrder
  ) {
    super()
  }

  public static fromAmino(data: MsgRegisterAccount.Amino): MsgRegisterAccount {
    const {
      value: { owner, connection_id, version, ordering },
    } = data

    return new MsgRegisterAccount(
      owner,
      connection_id,
      version,
      orderFromJSON(ordering)
    )
  }

  public toAmino(): MsgRegisterAccount.Amino {
    const { owner, connection_id, version, ordering } = this
    return {
      type: 'intertx/MsgRegisterAccount',
      value: { owner, connection_id, version, ordering: orderToJSON(ordering) },
    }
  }

  public static fromData(data: MsgRegisterAccount.Data): MsgRegisterAccount {
    const { owner, connection_id, version, ordering } = data
    return new MsgRegisterAccount(
      owner,
      connection_id,
      version,
      orderFromJSON(ordering)
    )
  }

  public toData(): MsgRegisterAccount.Data {
    const { owner, connection_id, version, ordering } = this
    return {
      '@type': '/initia.intertx.v1.MsgRegisterAccount',
      owner,
      connection_id,
      version,
      ordering: orderToJSON(ordering),
    }
  }

  public static fromProto(proto: MsgRegisterAccount.Proto): MsgRegisterAccount {
    return new MsgRegisterAccount(
      proto.owner,
      proto.connectionId,
      proto.version,
      proto.ordering
    )
  }

  public toProto(): MsgRegisterAccount.Proto {
    const { owner, connection_id, version, ordering } = this
    return MsgRegisterAccount_pb.fromPartial({
      owner,
      connectionId: connection_id,
      version,
      ordering,
    })
  }

  public packAny(): Any {
    return Any.fromPartial({
      typeUrl: '/initia.intertx.v1.MsgRegisterAccount',
      value: MsgRegisterAccount_pb.encode(this.toProto()).finish(),
    })
  }

  public static unpackAny(msgAny: Any): MsgRegisterAccount {
    return MsgRegisterAccount.fromProto(
      MsgRegisterAccount_pb.decode(msgAny.value)
    )
  }
}

export namespace MsgRegisterAccount {
  export interface Amino {
    type: 'intertx/MsgRegisterAccount'
    value: {
      owner: AccAddress
      connection_id: string
      version: string
      ordering: string
    }
  }

  export interface Data {
    '@type': '/initia.intertx.v1.MsgRegisterAccount'
    owner: AccAddress
    connection_id: string
    version: string
    ordering: string
  }

  export type Proto = MsgRegisterAccount_pb
}
