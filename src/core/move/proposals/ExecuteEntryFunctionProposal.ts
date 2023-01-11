import { JSONSerializable } from '../../../util/json';
import { Any } from '@initia/initia.proto/google/protobuf/any';
import { EntryFunctionProposal as EntryFunctionProposal_pb } from '@initia/initia.proto/initia/move//v1/proposal';

/**
 * EntryFunctionProposal gov proposal content type to execute entry function to the system
 */
export class EntryFunctionProposal extends JSONSerializable<
  EntryFunctionProposal.Amino,
  EntryFunctionProposal.Data,
  EntryFunctionProposal.Proto
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
    data: EntryFunctionProposal.Amino
  ): EntryFunctionProposal {
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
    return new EntryFunctionProposal(
      title,
      description,
      module_name,
      function_name,
      type_args,
      args
    );
  }

  public toAmino(): EntryFunctionProposal.Amino {
    const { title, description, module_name, function_name, type_args, args } =
      this;
    return {
      type: 'move/EntryFunctionProposal',
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
    data: EntryFunctionProposal.Data
  ): EntryFunctionProposal {
    const { title, description, module_name, function_name, type_args, args } =
      data;
    return new EntryFunctionProposal(
      title,
      description,
      module_name,
      function_name,
      type_args,
      args
    );
  }

  public toData(): EntryFunctionProposal.Data {
    const { title, description, module_name, function_name, type_args, args } =
      this;
    return {
      '@type': '/initia.move.v1.EntryFunctionProposal',
      title,
      description,
      module_name,
      function_name,
      type_args,
      args,
    };
  }

  public static fromProto(
    proto: EntryFunctionProposal.Proto
  ): EntryFunctionProposal {
    return new EntryFunctionProposal(
      proto.title,
      proto.description,
      proto.moduleName,
      proto.functionName,
      proto.typeArgs,
      proto.args.map(arg => Buffer.from(arg).toString('base64'))
    );
  }

  public toProto(): EntryFunctionProposal.Proto {
    const { title, description, module_name, function_name, type_args, args } =
      this;
    return EntryFunctionProposal_pb.fromPartial({
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
      typeUrl: '/initia.move.v1.EntryFunctionProposal',
      value: EntryFunctionProposal_pb.encode(this.toProto()).finish(),
    });
  }

  public static unpackAny(msgAny: Any): EntryFunctionProposal {
    return EntryFunctionProposal.fromProto(
      EntryFunctionProposal_pb.decode(msgAny.value)
    );
  }
}

export namespace EntryFunctionProposal {
  export interface Amino {
    type: 'move/EntryFunctionProposal';
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
    '@type': '/initia.move.v1.EntryFunctionProposal';
    title: string;
    description: string;
    module_name: string;
    function_name: string;
    type_args: string[];
    args: string[];
  }

  export type Proto = EntryFunctionProposal_pb;
}
