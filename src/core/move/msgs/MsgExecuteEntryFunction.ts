import { JSONSerializable } from '../../../util/json';
import { AccAddress } from '../../bech32';
import { Any } from '@initia/initia.proto/google/protobuf/any';
import { MsgExecuteEntryFunction as MsgExecuteEntryFunction_pb } from '@initia/initia.proto/initia/move/v1/tx';
import { argsEncodeWithABI } from '../../../util';
import { ModuleABI } from '../types';

export class MsgExecuteEntryFunction extends JSONSerializable<
  MsgExecuteEntryFunction.Amino,
  MsgExecuteEntryFunction.Data,
  MsgExecuteEntryFunction.Proto
> {
  public module_address: string;
  public type_args: string[];
  public args: string[];

  /**
   * @param sender contract user
   * @param module_address module deployer address
   * @param module_name name of module to execute
   * @param function_name name of function to execute
   * @param type_args type arguments of function to execute
   * @param args arguments of function to execute
   */
  constructor(
    public sender: AccAddress,
    module_address: AccAddress,
    public module_name: string,
    public function_name: string,
    type_args: string[] = [],
    args: string[] = []
  ) {
    super();
    this.module_address = module_address.startsWith('0x')
      ? AccAddress.fromHex(module_address)
      : module_address;

    this.type_args = type_args;
    this.args = args;
  }

  public static fromAmino(
    data: MsgExecuteEntryFunction.Amino
  ): MsgExecuteEntryFunction {
    const {
      value: {
        sender,
        module_address,
        module_name,
        function_name,
        type_args,
        args,
      },
    } = data;
    return new MsgExecuteEntryFunction(
      sender,
      module_address,
      module_name,
      function_name,
      type_args,
      args
    );
  }

  public toAmino(): MsgExecuteEntryFunction.Amino {
    const {
      sender,
      module_address,
      module_name,
      function_name,
      type_args,
      args,
    } = this;

    return {
      type: 'move/MsgExecuteEntryFunction',
      value: {
        sender,
        module_address,
        module_name,
        function_name,
        type_args,
        args,
      },
    };
  }

  public static fromProto(
    data: MsgExecuteEntryFunction.Proto
  ): MsgExecuteEntryFunction {
    return new MsgExecuteEntryFunction(
      data.sender,
      data.moduleAddr,
      data.moduleName,
      data.functionName,
      data.typeArgs,
      data.args.map(arg => Buffer.from(arg).toString('base64'))
    );
  }

  public toProto(): MsgExecuteEntryFunction.Proto {
    const {
      sender,
      module_address,
      module_name,
      function_name,
      type_args,
      args,
    } = this;
    return MsgExecuteEntryFunction_pb.fromPartial({
      sender,
      moduleAddr: module_address,
      moduleName: module_name,
      functionName: function_name,
      typeArgs: type_args,
      args: args.map(arg => Buffer.from(arg, 'base64')),
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

  public static fromData(
    data: MsgExecuteEntryFunction.Data
  ): MsgExecuteEntryFunction {
    const {
      sender,
      module_address,
      module_name,
      function_name,
      type_args,
      args,
    } = data;
    return new MsgExecuteEntryFunction(
      sender,
      module_address,
      module_name,
      function_name,
      type_args,
      args
    );
  }

  public toData(): MsgExecuteEntryFunction.Data {
    const {
      sender,
      module_address,
      module_name,
      function_name,
      type_args,
      args,
    } = this;
    return {
      '@type': '/initia.move.v1.MsgExecuteEntryFunction',
      sender,
      module_address,
      module_name,
      function_name,
      type_args,
      args,
    };
  }

  /**
   * Generate `MsgExecuteEntryFunction` from plain arguments(not bcs encoded).
   *
   * @example
   * // In case of the types of arguments are ['u64', 'u64']
   * const abi = await lcd.move.module('init1def...', 'pair').then(res => res.abi)
   *
   * // msg that was generated with not encoded arguments
   * consg msg1 = MsgExectueEntryFunction.fromPlainArgs(
   *   'init1abc...', // sender
   *   'init1def...', // module owner
   *   'pair', // moudle name
   *   'provide_liquidity', // function name
   *   [],
   *   [1000000000000, 2000000000000],
   *   abi
   * );
   *
   * // msg that was generated with the constructor
   * const msg2 = new MsgExecuteEntryFunction(
   *   'init1abc...', // sender
   *   'init1def...', // module owner
   *   'pair', // moudle name
   *   'provide_liquidity', // function name
   *   [],
   *   [
   *     bcs.serialize('u64', 1000000000000),
   *     bcs.serialize('u64', 2000000000000),
   *   ]
   * );
   *
   * console.assert(msg1.toJSON(), msg2.toJSON()
   *
   * @param sender
   * @param module_address
   * @param module_name
   * @param function_name
   * @param type_args
   * @param args
   * @param abi // base64 encoded module abi
   * @returns
   */
  public static fromPlainArgs(
    sender: AccAddress,
    module_address: AccAddress,
    module_name: string,
    function_name: string,
    type_args: string[] = [],
    args: any[] = [],
    abi: string
  ): MsgExecuteEntryFunction {
    const module: ModuleABI = JSON.parse(Buffer.from(abi, 'base64').toString());

    const functionAbi = module.exposed_functions.find(
      exposedFunction => exposedFunction.name === function_name
    );

    if (!functionAbi) {
      throw Error('function not found');
    }

    return new MsgExecuteEntryFunction(
      sender,
      module_address,
      module_name,
      function_name,
      type_args,
      argsEncodeWithABI(args, functionAbi)
    );
  }
}

export namespace MsgExecuteEntryFunction {
  export interface Amino {
    type: 'move/MsgExecuteEntryFunction';
    value: {
      sender: AccAddress;
      module_address: AccAddress;
      module_name: string;
      function_name: string;
      type_args: string[];
      args: string[];
    };
  }

  export interface Data {
    '@type': '/initia.move.v1.MsgExecuteEntryFunction';
    sender: AccAddress;
    module_address: AccAddress;
    module_name: string;
    function_name: string;
    type_args: string[];
    args: string[];
  }

  export type Proto = MsgExecuteEntryFunction_pb;
}
