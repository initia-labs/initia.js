import { JSONSerializable } from '../../../util/json';
import { Any } from '@initia/initia.proto/google/protobuf/any';
import { ExecuteEntryFunctionProposal as ExecuteEntryFunctionProposal_pb } from '@initia/initia.proto/initia/move//v1/proposal';

/**
 * ExecuteEntryFunctionProposal gov proposal content type to execute entry function to the system
 */
export class ExecuteEntryFunctionProposal extends JSONSerializable<
  ExecuteEntryFunctionProposal.Amino,
  ExecuteEntryFunctionProposal.Data,
  ExecuteEntryFunctionProposal.Proto
> {
  /**
   * @param title a short summary
   * @param description a human readable text
   * @param module_name a move module name
   * @param function_name a move function name
   * @param type_args move function type args
   * @param args move function args
   */
  constructor(
    public title: string,
    public description: string,
    public module_name: string,
    public function_name: string,
    public type_args: string[],
    public args: string[]
  ) {
    super();
  }

  public static fromAmino(
    data: ExecuteEntryFunctionProposal.Amino
  ): ExecuteEntryFunctionProposal {
    const {
      value: {
        title,
        description,
        module_name,
        function_name,
        type_args,
        args,
      },
    } = data;
    return new ExecuteEntryFunctionProposal(
      title,
      description,
      module_name,
      function_name,
      type_args,
      args
    );
  }

  public toAmino(): ExecuteEntryFunctionProposal.Amino {
    const { title, description, module_name, function_name, type_args, args } =
      this;
    return {
      type: 'move/ExecuteEntryFunctionProposal',
      value: {
        title,
        description,
        module_name,
        function_name,
        type_args,
        args,
      },
    };
  }

  public static fromData(
    data: ExecuteEntryFunctionProposal.Data
  ): ExecuteEntryFunctionProposal {
    const { title, description, module_name, function_name, type_args, args } =
      data;
    return new ExecuteEntryFunctionProposal(
      title,
      description,
      module_name,
      function_name,
      type_args,
      args
    );
  }

  public toData(): ExecuteEntryFunctionProposal.Data {
    const { title, description, module_name, function_name, type_args, args } =
      this;
    return {
      '@type': '/initia.move.v1.ExecuteEntryFunctionProposal',
      title,
      description,
      module_name,
      function_name,
      type_args,
      args,
    };
  }

  public static fromProto(
    proto: ExecuteEntryFunctionProposal.Proto
  ): ExecuteEntryFunctionProposal {
    return new ExecuteEntryFunctionProposal(
      proto.title,
      proto.description,
      proto.moduleName,
      proto.functionName,
      proto.typeArgs,
      proto.args.map(arg => Buffer.from(arg).toString('base64'))
    );
  }

  public toProto(): ExecuteEntryFunctionProposal.Proto {
    const { title, description, module_name, function_name, type_args, args } =
      this;
    return ExecuteEntryFunctionProposal_pb.fromPartial({
      title,
      description,
      moduleName: module_name,
      functionName: function_name,
      typeArgs: type_args,
      args: args.map(arg => Buffer.from(arg, 'base64')),
    });
  }

  public packAny(): Any {
    return Any.fromPartial({
      typeUrl: '/initia.move.v1.ExecuteEntryFunctionProposal',
      value: ExecuteEntryFunctionProposal_pb.encode(this.toProto()).finish(),
    });
  }

  public static unpackAny(msgAny: Any): ExecuteEntryFunctionProposal {
    return ExecuteEntryFunctionProposal.fromProto(
      ExecuteEntryFunctionProposal_pb.decode(msgAny.value)
    );
  }
}

export namespace ExecuteEntryFunctionProposal {
  export interface Amino {
    type: 'move/ExecuteEntryFunctionProposal';
    value: {
      title: string;
      description: string;
      module_name: string;
      function_name: string;
      type_args: string[];
      args: string[];
    };
  }

  export interface Data {
    '@type': '/initia.move.v1.ExecuteEntryFunctionProposal';
    title: string;
    description: string;
    module_name: string;
    function_name: string;
    type_args: string[];
    args: string[];
  }

  export type Proto = ExecuteEntryFunctionProposal_pb;
}
