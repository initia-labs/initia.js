import { JSONSerializable } from '../../../util/json';
import { AccAddress } from '../../bech32';
import { Any } from '@initia/initia.proto/google/protobuf/any';
import { MsgExecuteEntryFunction as MsgExecuteEntryFunction_pb } from '@initia/initia.proto/initia/move/v1/tx';

export class MsgExecuteEntryFunction extends JSONSerializable<
  MsgExecuteEntryFunction.Amino,
  MsgExecuteEntryFunction.Data,
  MsgExecuteEntryFunction.Proto
> {
  /**
   * @param sender contract user
   * @param module_addr module deployer address
   * @param module_name name of module to execute
   * @param function_name name of function to execute
   * @param type_args type arguments of function to execute
   * @param args arguments of function to execute
   */
  constructor(
    public sender: AccAddress,
    public module_addr: AccAddress,
    public module_name: string,
    public function_name: string,
    public type_args: string[],
    public args: string[]
  ) {
    super();
  }

  public static fromAmino(data: MsgExecuteEntryFunction.Amino): MsgExecuteEntryFunction {
    const {
      value: { sender, module_addr, module_name, function_name, type_args, args },
    } = data;
    return new MsgExecuteEntryFunction(
      sender,
      module_addr,
      module_name,
      function_name,
      type_args,
      args
    );
  }

  public toAmino(): MsgExecuteEntryFunction.Amino {
    const { sender, module_addr, module_name, function_name, type_args, args } = this;

    return {
      type: 'move/MsgExecuteEntryFunction',
      value: {
        sender,
        module_addr,
        module_name,
        function_name,
        type_args,
        args
      },
    };
  }

  public static fromProto(data: MsgExecuteEntryFunction.Proto): MsgExecuteEntryFunction {
    return new MsgExecuteEntryFunction(
      data.sender,
      data.moduleAddr,
      data.moduleName,
      data.functionName,
      data.typeArgs,
      data.args.map((arg) => Buffer.from(arg).toString('base64'))
    );
  }

  public toProto(): MsgExecuteEntryFunction.Proto {
    const { sender, module_addr, module_name, function_name, type_args, args } = this;
    return MsgExecuteEntryFunction_pb.fromPartial({
      sender,
      moduleAddr: module_addr,
      moduleName: module_name,
      functionName: function_name,
      typeArgs: type_args,
      args: args.map((arg) => Buffer.from(arg, 'base64'))
    });
  }

  public packAny(): Any {
    return Any.fromPartial({
      typeUrl: '/initia.move.v1.MsgExecuteEntryFunction',
      value: MsgExecuteEntryFunction_pb.encode(this.toProto()).finish(),
    });
  }

  public static unpackAny(msgAny: Any): MsgExecuteEntryFunction {
    return MsgExecuteEntryFunction.fromProto(
      MsgExecuteEntryFunction_pb.decode(msgAny.value)
    );
  }

  public static fromData(data: MsgExecuteEntryFunction.Data): MsgExecuteEntryFunction {
    const { sender, module_addr, module_name, function_name, type_args, args } = data;
    return new MsgExecuteEntryFunction(
      sender,
      module_addr,
      module_name,
      function_name,
      type_args,
      args
    );
  }

  public toData(): MsgExecuteEntryFunction.Data {
    const { sender, module_addr, module_name, function_name, type_args, args } = this;
    return {
      '@type': '/initia.move.v1.MsgExecuteEntryFunction',
      sender,
      module_addr,
      module_name,
      function_name,
      type_args,
      args
    };
  }
}

export namespace MsgExecuteEntryFunction {
  export interface Amino {
    type: 'move/MsgExecuteEntryFunction';
    value: {
      sender: AccAddress;
      module_addr: AccAddress;
      module_name: string;
      function_name: string;
      type_args: string[];
      args: string[];
    };
  }

  export interface Data {
    '@type': '/initia.move.v1.MsgExecuteEntryFunction';
    sender: AccAddress;
    module_addr: AccAddress;
    module_name: string;
    function_name: string;
    type_args: string[];
    args: string[];
  }

  export type Proto = MsgExecuteEntryFunction_pb;
}
