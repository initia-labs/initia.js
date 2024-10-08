import { JSONSerializable } from '../../../util/json'
import { base64FromBytes, bytesFromBase64 } from '../../../util/polyfill'
import { AccAddress } from '../../bech32'
import { Any } from '@initia/initia.proto/google/protobuf/any'
import { MsgGovExecute as MsgGovExecute_pb } from '@initia/initia.proto/initia/move/v1/tx'

export class MsgGovExecute extends JSONSerializable<
  MsgGovExecute.Amino,
  MsgGovExecute.Data,
  MsgGovExecute.Proto
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

  public static fromAmino(data: MsgGovExecute.Amino): MsgGovExecute {
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

    return new MsgGovExecute(
      authority,
      sender,
      module_address,
      module_name,
      function_name,
      type_args ?? [],
      args ?? []
    )
  }

  public toAmino(): MsgGovExecute.Amino {
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
      type: 'move/MsgGovExecute',
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

  public static fromData(data: MsgGovExecute.Data): MsgGovExecute {
    const {
      authority,
      sender,
      module_address,
      module_name,
      function_name,
      type_args,
      args,
    } = data

    return new MsgGovExecute(
      authority,
      sender,
      module_address,
      module_name,
      function_name,
      type_args,
      args
    )
  }

  public toData(): MsgGovExecute.Data {
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
      '@type': '/initia.move.v1.MsgGovExecute',
      authority,
      sender,
      module_address,
      module_name,
      function_name,
      type_args,
      args,
    }
  }

  public static fromProto(data: MsgGovExecute.Proto): MsgGovExecute {
    return new MsgGovExecute(
      data.authority,
      data.sender,
      data.moduleAddress,
      data.moduleName,
      data.functionName,
      data.typeArgs,
      data.args.map(base64FromBytes)
    )
  }

  public toProto(): MsgGovExecute.Proto {
    const {
      authority,
      sender,
      module_address,
      module_name,
      function_name,
      type_args,
      args,
    } = this

    return MsgGovExecute_pb.fromPartial({
      authority,
      sender,
      moduleAddress: module_address,
      moduleName: module_name,
      functionName: function_name,
      typeArgs: type_args,
      args: args.map(bytesFromBase64),
    })
  }

  public packAny(): Any {
    return Any.fromPartial({
      typeUrl: '/initia.move.v1.MsgGovExecute',
      value: MsgGovExecute_pb.encode(this.toProto()).finish(),
    })
  }

  public static unpackAny(msgAny: Any): MsgGovExecute {
    return MsgGovExecute.fromProto(MsgGovExecute_pb.decode(msgAny.value))
  }
}

export namespace MsgGovExecute {
  export interface Amino {
    type: 'move/MsgGovExecute'
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
    '@type': '/initia.move.v1.MsgGovExecute'
    authority: AccAddress
    sender: AccAddress
    module_address: AccAddress
    module_name: string
    function_name: string
    type_args: string[]
    args: string[]
  }

  export type Proto = MsgGovExecute_pb
}
