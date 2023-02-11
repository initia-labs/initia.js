import { JSONSerializable } from '../../../util/json';
import { Any } from '@initia/initia.proto/google/protobuf/any';
import { ExecuteProposal as ExecuteProposal_pb } from '@initia/initia.proto/initia/move//v1/proposal';

/**
 * ExecuteProposal gov proposal content type to execute entry function to the system
 */
export class ExecuteProposal extends JSONSerializable<
  ExecuteProposal.Amino,
  ExecuteProposal.Data,
  ExecuteProposal.Proto
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
    data: ExecuteProposal.Amino
  ): ExecuteProposal {
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
    return new ExecuteProposal(
      title,
      description,
      module_name,
      function_name,
      type_args,
      args
    );
  }

  public toAmino(): ExecuteProposal.Amino {
    const { title, description, module_name, function_name, type_args, args } =
      this;
    return {
      type: 'move/ExecuteProposal',
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
    data: ExecuteProposal.Data
  ): ExecuteProposal {
    const { title, description, module_name, function_name, type_args, args } =
      data;
    return new ExecuteProposal(
      title,
      description,
      module_name,
      function_name,
      type_args,
      args
    );
  }

  public toData(): ExecuteProposal.Data {
    const { title, description, module_name, function_name, type_args, args } =
      this;
    return {
      '@type': '/initia.move.v1.ExecuteProposal',
      title,
      description,
      module_name,
      function_name,
      type_args,
      args,
    };
  }

  public static fromProto(
    proto: ExecuteProposal.Proto
  ): ExecuteProposal {
    return new ExecuteProposal(
      proto.title,
      proto.description,
      proto.moduleName,
      proto.functionName,
      proto.typeArgs,
      proto.args.map(arg => Buffer.from(arg).toString('base64'))
    );
  }

  public toProto(): ExecuteProposal.Proto {
    const { title, description, module_name, function_name, type_args, args } =
      this;
    return ExecuteProposal_pb.fromPartial({
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
      typeUrl: '/initia.move.v1.ExecuteProposal',
      value: ExecuteProposal_pb.encode(this.toProto()).finish(),
    });
  }

  public static unpackAny(msgAny: Any): ExecuteProposal {
    return ExecuteProposal.fromProto(
      ExecuteProposal_pb.decode(msgAny.value)
    );
  }
}

export namespace ExecuteProposal {
  export interface Amino {
    type: 'move/ExecuteProposal';
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
    '@type': '/initia.move.v1.ExecuteProposal';
    title: string;
    description: string;
    module_name: string;
    function_name: string;
    type_args: string[];
    args: string[];
  }

  export type Proto = ExecuteProposal_pb;
}
