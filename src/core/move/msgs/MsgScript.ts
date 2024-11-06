import { JSONSerializable } from '../../../util/json'
import { AccAddress } from '../../bech32'
import { Any } from '@initia/initia.proto/google/protobuf/any'
import { MsgScript as MsgScript_pb } from '@initia/initia.proto/initia/move/v1/tx'

export class MsgScript extends JSONSerializable<
  MsgScript.Amino,
  MsgScript.Data,
  MsgScript.Proto
> {
  public type_args: string[]
  public args: string[]

  /**
   * @param sender the actor that signed the messages
   * @param code_bytes the script bytes code to execute
   * @param type_args type arguments of function to execute
   * @param args arguments of function to execute
   */
  constructor(
    public sender: AccAddress,
    public code_bytes: string,
    type_args: string[] = [],
    args: string[] = []
  ) {
    super()
    this.type_args = type_args
    this.args = args
  }

  public static fromAmino(data: MsgScript.Amino): MsgScript {
    const {
      value: { sender, code_bytes, type_args, args },
    } = data
    return new MsgScript(sender, code_bytes, type_args ?? [], args ?? [])
  }

  public toAmino(): MsgScript.Amino {
    const { sender, code_bytes, type_args, args } = this

    return {
      type: 'move/MsgScript',
      value: {
        sender,
        code_bytes,
        type_args: type_args.length === 0 ? undefined : type_args,
        args: args.length === 0 ? undefined : args,
      },
    }
  }

  public static fromData(data: MsgScript.Data): MsgScript {
    const { sender, code_bytes, type_args, args } = data
    return new MsgScript(sender, code_bytes, type_args, args)
  }

  public toData(): MsgScript.Data {
    const { sender, code_bytes, type_args, args } = this
    return {
      '@type': '/initia.move.v1.MsgScript',
      sender,
      code_bytes,
      type_args,
      args,
    }
  }

  public static fromProto(data: MsgScript.Proto): MsgScript {
    return new MsgScript(
      data.sender,
      Buffer.from(data.codeBytes).toString('base64'),
      data.typeArgs,
      data.args.map((arg) => Buffer.from(arg).toString('base64'))
    )
  }

  public toProto(): MsgScript.Proto {
    const { sender, code_bytes, type_args, args } = this
    return MsgScript_pb.fromPartial({
      sender,
      codeBytes: Buffer.from(code_bytes, 'base64'),
      typeArgs: type_args,
      args: args.map((arg) => Buffer.from(arg, 'base64')),
    })
  }

  public packAny(): Any {
    return Any.fromPartial({
      typeUrl: '/initia.move.v1.MsgScript',
      value: MsgScript_pb.encode(this.toProto()).finish(),
    })
  }

  public static unpackAny(msgAny: Any): MsgScript {
    return MsgScript.fromProto(MsgScript_pb.decode(msgAny.value))
  }
}

export namespace MsgScript {
  export interface Amino {
    type: 'move/MsgScript'
    value: {
      sender: AccAddress
      code_bytes: string
      type_args?: string[]
      args?: string[]
    }
  }

  export interface Data {
    '@type': '/initia.move.v1.MsgScript'
    sender: AccAddress
    code_bytes: string
    type_args: string[]
    args: string[]
  }

  export type Proto = MsgScript_pb
}
