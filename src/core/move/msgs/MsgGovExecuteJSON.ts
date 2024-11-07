import { JSONSerializable } from '../../../util/json'
import { AccAddress } from '../../bech32'
import { Any } from '@initia/initia.proto/google/protobuf/any'
import { MsgGovExecuteJSON as MsgGovExecuteJSON_pb } from '@initia/initia.proto/initia/move/v1/tx'

/**
 * MsgGovExecuteJSON runs a entry function with the given message via gov proposal.
 */
export class MsgGovExecuteJSON extends JSONSerializable<
  MsgGovExecuteJSON.Amino,
  MsgGovExecuteJSON.Data,
  MsgGovExecuteJSON.Proto
> {
  public type_args: string[]
  public args: string[]

  /**
   * @param authority the address that controls the module
   * @param sender the actor that signed the messages
   * @param module_address module deployer address
   * @param module_name name of module to execute
   * @param function_name name of function to execute
   * @param type_args type arguments of function to execute
   * @param args arguments of function to execute
   */
  constructor(
    public authority: AccAddress,
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

  public static fromAmino(data: MsgGovExecuteJSON.Amino): MsgGovExecuteJSON {
    const {
      value: {
        authority,
        sender,
        module_address,
        module_name,
        function_name,
        type_args,
        args,
      },
    } = data

    return new MsgGovExecuteJSON(
      authority,
      sender,
      module_address,
      module_name,
      function_name,
      type_args ?? [],
      args ?? []
    )
  }

  public toAmino(): MsgGovExecuteJSON.Amino {
    const {
      authority,
      sender,
      module_address,
      module_name,
      function_name,
      type_args,
      args,
    } = this

    return {
      type: 'move/MsgGovExecuteJSON',
      value: {
        authority,
        sender,
        module_address,
        module_name,
        function_name,
        type_args: type_args.length === 0 ? undefined : type_args,
        args: args.length === 0 ? undefined : args,
      },
    }
  }

  public static fromData(data: MsgGovExecuteJSON.Data): MsgGovExecuteJSON {
    const {
      authority,
      sender,
      module_address,
      module_name,
      function_name,
      type_args,
      args,
    } = data

    return new MsgGovExecuteJSON(
      authority,
      sender,
      module_address,
      module_name,
      function_name,
      type_args,
      args
    )
  }

  public toData(): MsgGovExecuteJSON.Data {
    const {
      authority,
      sender,
      module_address,
      module_name,
      function_name,
      type_args,
      args,
    } = this

    return {
      '@type': '/initia.move.v1.MsgGovExecuteJSON',
      authority,
      sender,
      module_address,
      module_name,
      function_name,
      type_args,
      args,
    }
  }

  public static fromProto(data: MsgGovExecuteJSON.Proto): MsgGovExecuteJSON {
    return new MsgGovExecuteJSON(
      data.authority,
      data.sender,
      data.moduleAddress,
      data.moduleName,
      data.functionName,
      data.typeArgs,
      data.args
    )
  }

  public toProto(): MsgGovExecuteJSON.Proto {
    const {
      authority,
      sender,
      module_address,
      module_name,
      function_name,
      type_args,
      args,
    } = this

    return MsgGovExecuteJSON_pb.fromPartial({
      authority,
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
      typeUrl: '/initia.move.v1.MsgGovExecuteJSON',
      value: MsgGovExecuteJSON_pb.encode(this.toProto()).finish(),
    })
  }

  public static unpackAny(msgAny: Any): MsgGovExecuteJSON {
    return MsgGovExecuteJSON.fromProto(
      MsgGovExecuteJSON_pb.decode(msgAny.value)
    )
  }
}

export namespace MsgGovExecuteJSON {
  export interface Amino {
    type: 'move/MsgGovExecuteJSON'
    value: {
      authority: AccAddress
      sender: AccAddress
      module_address: AccAddress
      module_name: string
      function_name: string
      type_args?: string[]
      args?: string[]
    }
  }

  export interface Data {
    '@type': '/initia.move.v1.MsgGovExecuteJSON'
    authority: AccAddress
    sender: AccAddress
    module_address: AccAddress
    module_name: string
    function_name: string
    type_args: string[]
    args: string[]
  }

  export type Proto = MsgGovExecuteJSON_pb
}
