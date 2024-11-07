import { JSONSerializable } from '../../../util/json'
import { AccAddress } from '../../bech32'
import { Any } from '@initia/initia.proto/google/protobuf/any'
import { MsgExecute as MsgExecute_pb } from '@initia/initia.proto/initia/move/v1/tx'

/**
 * @deprecated Use `MsgExecuteJSON` instead.
 *
 * MsgExecute runs a entry function with the given message.
 */
export class MsgExecute extends JSONSerializable<
  MsgExecute.Amino,
  MsgExecute.Data,
  MsgExecute.Proto
> {
  public type_args: string[]
  public args: string[]

  /**
   * @param sender the actor that signed the messages
   * @param module_address module deployer address
   * @param module_name name of module to execute
   * @param function_name name of function to execute
   * @param type_args type arguments of function to execute
   * @param args arguments of function to execute
   */
  constructor(
    public sender: AccAddress,
    public module_address: AccAddress,
    public module_name: string,
    public function_name: string,
    type_args: string[] = [],
    args: string[] = []
  ) {
    super()
    this.type_args = type_args
    this.args = args
  }

  public static fromAmino(data: MsgExecute.Amino): MsgExecute {
    const {
      value: {
        sender,
        module_address,
        module_name,
        function_name,
        type_args,
        args,
      },
    } = data
    return new MsgExecute(
      sender,
      module_address,
      module_name,
      function_name,
      type_args ?? [],
      args ?? []
    )
  }

  public toAmino(): MsgExecute.Amino {
    const {
      sender,
      module_address,
      module_name,
      function_name,
      type_args,
      args,
    } = this

    return {
      type: 'move/MsgExecute',
      value: {
        sender,
        module_address,
        module_name,
        function_name,
        type_args: type_args.length === 0 ? undefined : type_args,
        args: args.length === 0 ? undefined : args,
      },
    }
  }

  public static fromData(data: MsgExecute.Data): MsgExecute {
    const {
      sender,
      module_address,
      module_name,
      function_name,
      type_args,
      args,
    } = data
    return new MsgExecute(
      sender,
      module_address,
      module_name,
      function_name,
      type_args,
      args
    )
  }

  public toData(): MsgExecute.Data {
    const {
      sender,
      module_address,
      module_name,
      function_name,
      type_args,
      args,
    } = this
    return {
      '@type': '/initia.move.v1.MsgExecute',
      sender,
      module_address,
      module_name,
      function_name,
      type_args,
      args,
    }
  }

  public static fromProto(data: MsgExecute.Proto): MsgExecute {
    return new MsgExecute(
      data.sender,
      data.moduleAddress,
      data.moduleName,
      data.functionName,
      data.typeArgs,
      data.args.map((arg) => Buffer.from(arg).toString('base64'))
    )
  }

  public toProto(): MsgExecute.Proto {
    const {
      sender,
      module_address,
      module_name,
      function_name,
      type_args,
      args,
    } = this
    return MsgExecute_pb.fromPartial({
      sender,
      moduleAddress: module_address,
      moduleName: module_name,
      functionName: function_name,
      typeArgs: type_args,
      args: args.map((arg) => Buffer.from(arg, 'base64')),
    })
  }

  public packAny(): Any {
    return Any.fromPartial({
      typeUrl: '/initia.move.v1.MsgExecute',
      value: MsgExecute_pb.encode(this.toProto()).finish(),
    })
  }

  public static unpackAny(msgAny: Any): MsgExecute {
    return MsgExecute.fromProto(MsgExecute_pb.decode(msgAny.value))
  }
}

export namespace MsgExecute {
  export interface Amino {
    type: 'move/MsgExecute'
    value: {
      sender: AccAddress
      module_address: AccAddress
      module_name: string
      function_name: string
      type_args?: string[]
      args?: string[]
    }
  }

  export interface Data {
    '@type': '/initia.move.v1.MsgExecute'
    sender: AccAddress
    module_address: AccAddress
    module_name: string
    function_name: string
    type_args: string[]
    args: string[]
  }

  export type Proto = MsgExecute_pb
}
