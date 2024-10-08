import { JSONSerializable } from '../../../util/json'
import { base64FromBytes, bytesFromBase64 } from '../../../util/polyfill'
import { AccAddress } from '../../bech32'
import { Any } from '@initia/initia.proto/google/protobuf/any'
import { MsgScriptJSON as MsgScriptJSON_pb } from '@initia/initia.proto/initia/move/v1/tx'

export class MsgScriptJSON extends JSONSerializable<
  MsgScriptJSON.Amino,
  MsgScriptJSON.Data,
  MsgScriptJSON.Proto
> {
  public type_args: string[]
  public args: string[]

  /**
   * @param sender the actor that signed the messages
   * @param code_bytes the script bytes code to execute
   * @param type_args the type arguments of a function to execute
   * @param args the arguments of a function to execute in json stringify format
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

  public static fromAmino(data: MsgScriptJSON.Amino): MsgScriptJSON {
    const {
      value: { sender, code_bytes, type_args, args },
    } = data
    return new MsgScriptJSON(sender, code_bytes, type_args ?? [], args ?? [])
  }

  public toAmino(): MsgScriptJSON.Amino {
    const { sender, code_bytes, type_args, args } = this

    return {
      type: 'move/MsgScriptJSON',
      value: {
        sender,
        code_bytes,
        type_args: type_args.length === 0 ? undefined : type_args,
        args: args.length === 0 ? undefined : args,
      },
    }
  }

  public static fromData(data: MsgScriptJSON.Data): MsgScriptJSON {
    const { sender, code_bytes, type_args, args } = data
    return new MsgScriptJSON(sender, code_bytes, type_args, args)
  }

  public toData(): MsgScriptJSON.Data {
    const { sender, code_bytes, type_args, args } = this
    return {
      '@type': '/initia.move.v1.MsgScriptJSON',
      sender,
      code_bytes,
      type_args,
      args,
    }
  }

  public static fromProto(data: MsgScriptJSON.Proto): MsgScriptJSON {
    return new MsgScriptJSON(
      data.sender,
      base64FromBytes(data.codeBytes),
      data.typeArgs,
      data.args
    )
  }

  public toProto(): MsgScriptJSON.Proto {
    const { sender, code_bytes, type_args, args } = this
    return MsgScriptJSON_pb.fromPartial({
      sender,
      codeBytes: bytesFromBase64(code_bytes),
      typeArgs: type_args,
      args,
    })
  }

  public packAny(): Any {
    return Any.fromPartial({
      typeUrl: '/initia.move.v1.MsgScriptJSON',
      value: MsgScriptJSON_pb.encode(this.toProto()).finish(),
    })
  }

  public static unpackAny(msgAny: Any): MsgScriptJSON {
    return MsgScriptJSON.fromProto(MsgScriptJSON_pb.decode(msgAny.value))
  }
}

export namespace MsgScriptJSON {
  export interface Amino {
    type: 'move/MsgScriptJSON'
    value: {
      sender: AccAddress
      code_bytes: string
      type_args?: string[]
      args?: string[]
    }
  }

  export interface Data {
    '@type': '/initia.move.v1.MsgScriptJSON'
    sender: AccAddress
    code_bytes: string
    type_args: string[]
    args: string[]
  }

  export type Proto = MsgScriptJSON_pb
}
