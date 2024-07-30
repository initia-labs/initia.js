import { JSONSerializable } from '../../../util/json'
import { AccAddress } from '../../bech32'
import { Any } from '@initia/initia.proto/google/protobuf/any'
import { MsgCreate as MsgCreate_pb } from '@initia/initia.proto/minievm/evm/v1/tx'

export class MsgCreate extends JSONSerializable<
  MsgCreate.Amino,
  MsgCreate.Data,
  MsgCreate.Proto
> {
  /**
   * @param sender the actor that signed the messages
   * @param code hex encoded raw contract bytes code
   */
  constructor(
    public sender: AccAddress,
    public code: string
  ) {
    super()
  }

  public static fromAmino(data: MsgCreate.Amino): MsgCreate {
    const {
      value: { sender, code },
    } = data

    return new MsgCreate(sender, code)
  }

  public toAmino(): MsgCreate.Amino {
    const { sender, code } = this
    return {
      type: 'evm/MsgCreate',
      value: {
        sender,
        code,
      },
    }
  }

  public static fromData(data: MsgCreate.Data): MsgCreate {
    const { sender, code } = data
    return new MsgCreate(sender, code)
  }

  public toData(): MsgCreate.Data {
    const { sender, code } = this
    return {
      '@type': '/minievm.evm.v1.MsgCreate',
      sender,
      code,
    }
  }

  public static fromProto(data: MsgCreate.Proto): MsgCreate {
    return new MsgCreate(data.sender, data.code)
  }

  public toProto(): MsgCreate.Proto {
    const { sender, code } = this
    return MsgCreate_pb.fromPartial({
      sender,
      code,
    })
  }

  public packAny(): Any {
    return Any.fromPartial({
      typeUrl: '/minievm.evm.v1.MsgCreate',
      value: MsgCreate_pb.encode(this.toProto()).finish(),
    })
  }

  public static unpackAny(msgAny: Any): MsgCreate {
    return MsgCreate.fromProto(MsgCreate_pb.decode(msgAny.value))
  }
}

export namespace MsgCreate {
  export interface Amino {
    type: 'evm/MsgCreate'
    value: {
      sender: AccAddress
      code: string
    }
  }

  export interface Data {
    '@type': '/minievm.evm.v1.MsgCreate'
    sender: AccAddress
    code: string
  }

  export type Proto = MsgCreate_pb
}
