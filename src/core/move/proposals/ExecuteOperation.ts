import { JSONSerializable } from '../../../util/json';
import { Any } from '@initia/initia.proto/google/protobuf/any';
import { ExecuteOperation as ExecuteOperation_pb } from '@initia/initia.proto/initia/move//v1/proposal';
import { AccAddress } from '../../bech32';

/**
 * ExecuteOperation gov proposal operation type to execute entry function to the system
 */
export class ExecuteOperation extends JSONSerializable<
  ExecuteOperation.Amino,
  ExecuteOperation.Data,
  ExecuteOperation.Proto
> {
  /**
   * @param module_address module address of entry function
   * @param module_name move module name
   * @param function_name move function name
   * @param type_args move function type args
   * @param args move function args
   */
  constructor(
    public module_address: AccAddress,
    public module_name: string,
    public function_name: string,
    public type_args: string[],
    public args: string[]
  ) {
    super();
  }

  public static fromAmino(
    data: ExecuteOperation.Amino
  ): ExecuteOperation {
    const {
      value: {
        module_address,
        module_name,
        function_name,
        type_args,
        args,
      },
    } = data;
    return new ExecuteOperation(
      module_address,
      module_name,
      function_name,
      type_args,
      args
    );
  }

  public toAmino(): ExecuteOperation.Amino {
    const { module_address, module_name, function_name, type_args, args } = this;
    return {
      type: 'move/ExecuteOperation',
      value: {
        module_address,
        module_name,
        function_name,
        type_args,
        args,
      },
    };
  }

  public static fromData(
    data: ExecuteOperation.Data
  ): ExecuteOperation {
    const { module_address, module_name, function_name, type_args, args } =
      data;
    return new ExecuteOperation(
      module_address,
      module_name,
      function_name,
      type_args,
      args
    );
  }

  public toData(): ExecuteOperation.Data {
    const { module_address, module_name, function_name, type_args, args } = this;
    return {
      '@type': '/initia.move.v1.ExecuteOperation',
      module_address,
      module_name,
      function_name,
      type_args,
      args,
    };
  }

  public static fromProto(
    proto: ExecuteOperation.Proto
  ): ExecuteOperation {
    return new ExecuteOperation(
      proto.moduleAddress,
      proto.moduleName,
      proto.functionName,
      proto.typeArgs,
      proto.args.map(arg => Buffer.from(arg).toString('base64'))
    );
  }

  public toProto(): ExecuteOperation.Proto {
    const { module_address, module_name, function_name, type_args, args } = this;
    return ExecuteOperation_pb.fromPartial({
      moduleAddress: module_address,
      moduleName: module_name,
      functionName: function_name,
      typeArgs: type_args,
      args: args.map(arg => Buffer.from(arg, 'base64')),
    });
  }

  public packAny(): Any {
    return Any.fromPartial({
      typeUrl: '/initia.move.v1.ExecuteOperation',
      value: ExecuteOperation_pb.encode(this.toProto()).finish(),
    });
  }

  public static unpackAny(msgAny: Any): ExecuteOperation {
    return ExecuteOperation.fromProto(
      ExecuteOperation_pb.decode(msgAny.value)
    );
  }
}

export namespace ExecuteOperation {
  export interface Amino {
    type: 'move/ExecuteOperation';
    value: {
      module_address: string;
      module_name: string;
      function_name: string;
      type_args: string[];
      args: string[];
    };
  }

  export interface Data {
    '@type': '/initia.move.v1.ExecuteOperation';
    module_address: string;
    module_name: string;
    function_name: string;
    type_args: string[];
    args: string[];
  }

  export type Proto = ExecuteOperation_pb;
}
