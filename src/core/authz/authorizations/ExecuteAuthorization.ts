import { JSONSerializable } from '../../../util/json';
import { ExecuteAuthorization as ExecuteAuthorization_pb } from '@initia/initia.proto/initia/move/v1/authz';
import { ExecuteAuthorizationItem as ExecuteAuthorizationItem_pb } from '@initia/initia.proto/initia/move/v1/types';
import { Any } from '@initia/initia.proto/google/protobuf/any';

export class ExecuteAuthorization extends JSONSerializable<
  any,
  ExecuteAuthorization.Data,
  ExecuteAuthorization.Proto
> {
  constructor(public items: ExecuteAuthorizationItem[]) {
    super();
  }

  public static fromAmino(_: any): ExecuteAuthorization {
    _;
    throw new Error('Amino not supported');
  }

  public toAmino(): any {
    throw new Error('Amino not supported');
  }

  public static fromData(
    data: ExecuteAuthorization.Data
  ): ExecuteAuthorization {
    return new ExecuteAuthorization(
      data.items.map(ExecuteAuthorizationItem.fromData)
    );
  }

  public toData(): ExecuteAuthorization.Data {
    return {
      '@type': '/initia.move.v1.ExecuteAuthorization',
      items: this.items.map(item => item.toData()),
    };
  }

  public static fromProto(
    proto: ExecuteAuthorization.Proto
  ): ExecuteAuthorization {
    return new ExecuteAuthorization(
      proto.items.map(ExecuteAuthorizationItem.fromProto)
    );
  }

  public toProto(): ExecuteAuthorization.Proto {
    return ExecuteAuthorization_pb.fromPartial({
      items: this.items.map(item => item.toProto()),
    });
  }

  public packAny(): Any {
    return Any.fromPartial({
      typeUrl: '/initia.move.v1.ExecuteAuthorization',
      value: ExecuteAuthorization_pb.encode(this.toProto()).finish(),
    });
  }

  public static unpackAny(msgAny: Any): ExecuteAuthorization {
    return ExecuteAuthorization.fromProto(
      ExecuteAuthorization_pb.decode(msgAny.value)
    );
  }
}

export class ExecuteAuthorizationItem extends JSONSerializable<
  any,
  ExecuteAuthorizationItem.Data,
  ExecuteAuthorizationItem.Proto
> {
  constructor(
    public module_address: string,
    public module_name: string,
    public function_names: string[]
  ) {
    super();
  }

  public static fromAmino(_: any): ExecuteAuthorizationItem {
    _;
    throw new Error('Amino not supported');
  }

  public toAmino(): any {
    throw new Error('Amino not supported');
  }

  public static fromData(
    data: ExecuteAuthorizationItem.Data
  ): ExecuteAuthorizationItem {
    const { module_address, module_name, function_names } = data;
    return new ExecuteAuthorizationItem(
      module_address,
      module_name,
      function_names
    );
  }

  public toData(): ExecuteAuthorizationItem.Data {
    const { module_address, module_name, function_names } = this;
    return {
      module_address,
      module_name,
      function_names,
    };
  }

  public static fromProto(
    proto: ExecuteAuthorizationItem.Proto
  ): ExecuteAuthorizationItem {
    return new ExecuteAuthorizationItem(
      proto.moduleAddress,
      proto.moduleName,
      proto.functionNames
    );
  }

  public toProto(): ExecuteAuthorizationItem.Proto {
    return ExecuteAuthorizationItem_pb.fromPartial({
      moduleAddress: this.module_address,
      moduleName: this.module_name,
      functionNames: this.function_names,
    });
  }
}

export namespace ExecuteAuthorizationItem {
  export interface Data {
    module_address: string;
    module_name: string;
    function_names: string[];
  }

  export type Proto = ExecuteAuthorizationItem_pb;
}

export namespace ExecuteAuthorization {
  export interface Data {
    '@type': '/initia.move.v1.ExecuteAuthorization';
    items: ExecuteAuthorizationItem.Data[];
  }

  export type Proto = ExecuteAuthorization_pb;
}
