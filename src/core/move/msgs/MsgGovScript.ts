import { JSONSerializable } from '../../../util/json'
import { AccAddress } from '../../bech32'
import { Any } from '@initia/initia.proto/google/protobuf/any'
import { MsgGovScript as MsgGovScript_pb } from '@initia/initia.proto/initia/move/v1/tx'

/**
 * @deprecated Use `MsgGovScriptJSON` instead.
 *
 * MsgGovScript runs a script with the given message via gov proposal.
 */
export class MsgGovScript extends JSONSerializable<
  MsgGovScript.Amino,
  MsgGovScript.Data,
  MsgGovScript.Proto
> {
  public type_args: string[]
  public args: string[]

  /**
   * @param authority the address that controls the module
   * @param sender the actor that signed the messages
   * @param code_bytes the script bytes code to execute
   * @param type_args type arguments of function to execute
   * @param args arguments of function to execute
   */
  constructor(
    public authority: AccAddress,
    public sender: AccAddress,
    public code_bytes: string,
    type_args: string[] = [],
    args: string[] = []
  ) {
    super()
    this.type_args = type_args
    this.args = args
  }

  public static fromAmino(data: MsgGovScript.Amino): MsgGovScript {
    const {
      value: { authority, sender, code_bytes, type_args, args },
    } = data

    return new MsgGovScript(
      authority,
      sender,
      code_bytes,
      type_args ?? [],
      args ?? []
    )
  }

  public toAmino(): MsgGovScript.Amino {
    const { authority, sender, code_bytes, type_args, args } = this
    return {
      type: 'move/MsgGovScript',
      value: {
        authority,
        sender,
        code_bytes,
        type_args: type_args.length === 0 ? undefined : type_args,
        args: args.length === 0 ? undefined : args,
      },
    }
  }

  public static fromData(data: MsgGovScript.Data): MsgGovScript {
    const { authority, sender, code_bytes, type_args, args } = data
    return new MsgGovScript(authority, sender, code_bytes, type_args, args)
  }

  public toData(): MsgGovScript.Data {
    const { authority, sender, code_bytes, type_args, args } = this
    return {
      '@type': '/initia.move.v1.MsgGovScript',
      authority,
      sender,
      code_bytes,
      type_args,
      args,
    }
  }

  public static fromProto(data: MsgGovScript.Proto): MsgGovScript {
    return new MsgGovScript(
      data.authority,
      data.sender,
      Buffer.from(data.codeBytes).toString('base64'),
      data.typeArgs,
      data.args.map((arg) => Buffer.from(arg).toString('base64'))
    )
  }

  public toProto(): MsgGovScript.Proto {
    const { authority, sender, code_bytes, type_args, args } = this
    return MsgGovScript_pb.fromPartial({
      authority,
      sender,
      codeBytes: Buffer.from(code_bytes, 'base64'),
      typeArgs: type_args,
      args: args.map((arg) => Buffer.from(arg, 'base64')),
    })
  }

  public packAny(): Any {
    return Any.fromPartial({
      typeUrl: '/initia.move.v1.MsgGovScript',
      value: MsgGovScript_pb.encode(this.toProto()).finish(),
    })
  }

  public static unpackAny(msgAny: Any): MsgGovScript {
    return MsgGovScript.fromProto(MsgGovScript_pb.decode(msgAny.value))
  }
}

export namespace MsgGovScript {
  export interface Amino {
    type: 'move/MsgGovScript'
    value: {
      authority: AccAddress
      sender: AccAddress
      code_bytes: string
      type_args?: string[]
      args?: string[]
    }
  }

  export interface Data {
    '@type': '/initia.move.v1.MsgGovScript'
    authority: AccAddress
    sender: AccAddress
    code_bytes: string
    type_args: string[]
    args: string[]
  }

  export type Proto = MsgGovScript_pb
}
