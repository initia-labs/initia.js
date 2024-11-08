import { JSONSerializable } from '../../../util/json'
import { AccAddress } from '../../bech32'
import { Any } from '@initia/initia.proto/google/protobuf/any'
import { MsgGovScriptJSON as MsgGovScriptJSON_pb } from '@initia/initia.proto/initia/move/v1/tx'

/**
 * MsgGovScriptJSON runs a script with the given message via gov proposal.
 */
export class MsgGovScriptJSON extends JSONSerializable<
  MsgGovScriptJSON.Amino,
  MsgGovScriptJSON.Data,
  MsgGovScriptJSON.Proto
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

  public static fromAmino(data: MsgGovScriptJSON.Amino): MsgGovScriptJSON {
    const {
      value: { authority, sender, code_bytes, type_args, args },
    } = data

    return new MsgGovScriptJSON(
      authority,
      sender,
      code_bytes,
      type_args ?? [],
      args ?? []
    )
  }

  public toAmino(): MsgGovScriptJSON.Amino {
    const { authority, sender, code_bytes, type_args, args } = this
    return {
      type: 'move/MsgGovScriptJSON',
      value: {
        authority,
        sender,
        code_bytes,
        type_args: type_args.length === 0 ? undefined : type_args,
        args: args.length === 0 ? undefined : args,
      },
    }
  }

  public static fromData(data: MsgGovScriptJSON.Data): MsgGovScriptJSON {
    const { authority, sender, code_bytes, type_args, args } = data
    return new MsgGovScriptJSON(authority, sender, code_bytes, type_args, args)
  }

  public toData(): MsgGovScriptJSON.Data {
    const { authority, sender, code_bytes, type_args, args } = this
    return {
      '@type': '/initia.move.v1.MsgGovScriptJSON',
      authority,
      sender,
      code_bytes,
      type_args,
      args,
    }
  }

  public static fromProto(data: MsgGovScriptJSON.Proto): MsgGovScriptJSON {
    return new MsgGovScriptJSON(
      data.authority,
      data.sender,
      Buffer.from(data.codeBytes).toString('base64'),
      data.typeArgs,
      data.args
    )
  }

  public toProto(): MsgGovScriptJSON.Proto {
    const { authority, sender, code_bytes, type_args, args } = this
    return MsgGovScriptJSON_pb.fromPartial({
      authority,
      sender,
      codeBytes: Buffer.from(code_bytes, 'base64'),
      typeArgs: type_args,
      args,
    })
  }

  public packAny(): Any {
    return Any.fromPartial({
      typeUrl: '/initia.move.v1.MsgGovScriptJSON',
      value: MsgGovScriptJSON_pb.encode(this.toProto()).finish(),
    })
  }

  public static unpackAny(msgAny: Any): MsgGovScriptJSON {
    return MsgGovScriptJSON.fromProto(MsgGovScriptJSON_pb.decode(msgAny.value))
  }
}

export namespace MsgGovScriptJSON {
  export interface Amino {
    type: 'move/MsgGovScriptJSON'
    value: {
      authority: AccAddress
      sender: AccAddress
      code_bytes: string
      type_args?: string[]
      args?: string[]
    }
  }

  export interface Data {
    '@type': '/initia.move.v1.MsgGovScriptJSON'
    authority: AccAddress
    sender: AccAddress
    code_bytes: string
    type_args: string[]
    args: string[]
  }

  export type Proto = MsgGovScriptJSON_pb
}
