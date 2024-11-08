import { JSONSerializable } from '../../../util/json'
import { AccAddress } from '../../bech32'
import { Any } from '@initia/initia.proto/google/protobuf/any'
import { MsgExecuteJSON as MsgExecuteJSON_pb } from '@initia/initia.proto/initia/move/v1/tx'

/**
 * MsgExecuteJSON runs a entry function with the given message.
 */
export class MsgExecuteJSON extends JSONSerializable<
  MsgExecuteJSON.Amino,
  MsgExecuteJSON.Data,
  MsgExecuteJSON.Proto
> {
  public type_args: string[]
  public args: string[]

  /**
   * @param sender the actor that signed the messages
   * @param module_address the address of the module deployer
   * @param module_name the name of module to execute
   * @param function_name the name of function to execute
   * @param type_args the type arguments of a function to execute
   * @param args the arguments of a function to execute in json stringify format
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

  public static fromAmino(data: MsgExecuteJSON.Amino): MsgExecuteJSON {
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
    return new MsgExecuteJSON(
      sender,
      module_address,
      module_name,
      function_name,
      type_args ?? [],
      args ?? []
    )
  }

  public toAmino(): MsgExecuteJSON.Amino {
    const {
      sender,
      module_address,
      module_name,
      function_name,
      type_args,
      args,
    } = this

    return {
      type: 'move/MsgExecuteJSON',
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

  public static fromData(data: MsgExecuteJSON.Data): MsgExecuteJSON {
    const {
      sender,
      module_address,
      module_name,
      function_name,
      type_args,
      args,
    } = data
    return new MsgExecuteJSON(
      sender,
      module_address,
      module_name,
      function_name,
      type_args,
      args
    )
  }

  public toData(): MsgExecuteJSON.Data {
    const {
      sender,
      module_address,
      module_name,
      function_name,
      type_args,
      args,
    } = this
    return {
      '@type': '/initia.move.v1.MsgExecuteJSON',
      sender,
      module_address,
      module_name,
      function_name,
      type_args,
      args,
    }
  }

  public static fromProto(data: MsgExecuteJSON.Proto): MsgExecuteJSON {
    return new MsgExecuteJSON(
      data.sender,
      data.moduleAddress,
      data.moduleName,
      data.functionName,
      data.typeArgs,
      data.args
    )
  }

  public toProto(): MsgExecuteJSON.Proto {
    const {
      sender,
      module_address,
      module_name,
      function_name,
      type_args,
      args,
    } = this
    return MsgExecuteJSON_pb.fromPartial({
      sender,
      moduleAddress: module_address,
      moduleName: module_name,
      functionName: function_name,
      typeArgs: type_args,
      args,
    })
  }

  public packAny(): Any {
    return Any.fromPartial({
      typeUrl: '/initia.move.v1.MsgExecuteJSON',
      value: MsgExecuteJSON_pb.encode(this.toProto()).finish(),
    })
  }

  public static unpackAny(msgAny: Any): MsgExecuteJSON {
    return MsgExecuteJSON.fromProto(MsgExecuteJSON_pb.decode(msgAny.value))
  }
}

export namespace MsgExecuteJSON {
  export interface Amino {
    type: 'move/MsgExecuteJSON'
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
    '@type': '/initia.move.v1.MsgExecuteJSON'
    sender: AccAddress
    module_address: AccAddress
    module_name: string
    function_name: string
    type_args: string[]
    args: string[]
  }

  export type Proto = MsgExecuteJSON_pb
}
