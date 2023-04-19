import { ClassTrace as ClassTrace_pb } from '@initia/initia.proto/ibc/applications/nft_transfer/v1/types';
import { JSONSerializable } from '../../../../util/json';

export class ClassTrace extends JSONSerializable<
  ClassTrace.Amino,
  ClassTrace.Data,
  ClassTrace.Proto
> {
  /**
   * @param path the chain of port/channel identifiers used for tracing the source of the non fungible token
   * @param base_class_id base class id of the relayed non fungible token
   */
  constructor(public path: string, public base_class_id: string) {
    super();
  }

  public static fromAmino(data: ClassTrace.Amino): ClassTrace {
    const { path, base_class_id } = data;
    return new ClassTrace(path, base_class_id);
  }

  public toAmino(): ClassTrace.Amino {
    const { path, base_class_id } = this;
    const res: ClassTrace.Amino = {
      path,
      base_class_id,
    };
    return res;
  }

  public static fromData(data: ClassTrace.Data): ClassTrace {
    const { path, base_class_id } = data;
    return new ClassTrace(path, base_class_id);
  }

  public toData(): ClassTrace.Data {
    const { path, base_class_id } = this;
    const res: ClassTrace.Data = {
      path,
      base_class_id,
    };
    return res;
  }

  public static fromProto(proto: ClassTrace.Proto): ClassTrace {
    return new ClassTrace(proto.path, proto.baseClassId);
  }

  public toProto(): ClassTrace.Proto {
    const { path, base_class_id } = this;
    return ClassTrace_pb.fromPartial({ path, baseClassId: base_class_id });
  }
}

export namespace ClassTrace {
  export interface Amino {
    path: string;
    base_class_id: string;
  }

  export interface Data {
    path: string;
    base_class_id: string;
  }

  export type Proto = ClassTrace_pb;
}
