import { JSONSerializable } from '../../../util/json';
import { PublishAuthorization as PublishAuthorization_pb } from '@initia/initia.proto/initia/move/v1/authz';
import { Any } from '@initia/initia.proto/google/protobuf/any';

export class PublishAuthorization extends JSONSerializable<
  PublishAuthorization.Amino,
  PublishAuthorization.Data,
  PublishAuthorization.Proto
> {
  constructor(public module_names: string[]) {
    super();
  }

  public static fromAmino(
    data: PublishAuthorization.Amino
  ): PublishAuthorization {
    return new PublishAuthorization(data.value.module_names);
  }

  public toAmino(): PublishAuthorization.Amino {
    return {
      type: 'move/PublishAuthorization',
      value: { module_names: this.module_names },
    };
  }

  public static fromData(
    data: PublishAuthorization.Data
  ): PublishAuthorization {
    return new PublishAuthorization(data.module_names);
  }

  public toData(): PublishAuthorization.Data {
    return {
      '@type': '/initia.move.v1.PublishAuthorization',
      module_names: this.module_names,
    };
  }

  public static fromProto(
    proto: PublishAuthorization.Proto
  ): PublishAuthorization {
    return new PublishAuthorization(proto.moduleNames);
  }

  public toProto(): PublishAuthorization.Proto {
    return PublishAuthorization_pb.fromPartial({
      moduleNames: this.module_names,
    });
  }

  public packAny(): Any {
    return Any.fromPartial({
      typeUrl: '/initia.move.v1.PublishAuthorization',
      value: PublishAuthorization_pb.encode(this.toProto()).finish(),
    });
  }

  public static unpackAny(msgAny: Any): PublishAuthorization {
    return PublishAuthorization.fromProto(
      PublishAuthorization_pb.decode(msgAny.value)
    );
  }
}

export namespace PublishAuthorization {
  export interface Amino {
    type: 'move/PublishAuthorization';
    value: {
      module_names: string[];
    };
  }

  export interface Data {
    '@type': '/initia.move.v1.PublishAuthorization';
    module_names: string[];
  }

  export type Proto = PublishAuthorization_pb;
}
