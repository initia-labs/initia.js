import { ClassTrace as SftClassTrace_pb } from '@initia/initia.proto/ibc/applications/sft_transfer/v1/types';
import { JSONSerializable } from '../../../../util/json';

export class SftClassTrace extends JSONSerializable<
  SftClassTrace.Amino,
  SftClassTrace.Data,
  SftClassTrace.Proto
> {
  /**
   * @param path the chain of port/channel identifiers used for tracing the source of the semi fungible token
   * @param base_class_id base class id of the relayed semi fungible token
   */
  constructor(public path: string, public base_class_id: string) {
    super();
  }

  public static fromAmino(data: SftClassTrace.Amino): SftClassTrace {
    const { path, base_class_id } = data;
    return new SftClassTrace(path, base_class_id);
  }

  public toAmino(): SftClassTrace.Amino {
    const { path, base_class_id } = this;
    const res: SftClassTrace.Amino = {
      path,
      base_class_id,
    };
    return res;
  }

  public static fromData(data: SftClassTrace.Data): SftClassTrace {
    const { path, base_class_id } = data;
    return new SftClassTrace(path, base_class_id);
  }

  public toData(): SftClassTrace.Data {
    const { path, base_class_id } = this;
    const res: SftClassTrace.Data = {
      path,
      base_class_id,
    };
    return res;
  }

  public static fromProto(proto: SftClassTrace.Proto): SftClassTrace {
    return new SftClassTrace(proto.path, proto.baseClassId);
  }

  public toProto(): SftClassTrace.Proto {
    const { path, base_class_id } = this;
    return SftClassTrace_pb.fromPartial({ path, baseClassId: base_class_id });
  }
}

export namespace SftClassTrace {
  export interface Amino {
    path: string;
    base_class_id: string;
  }

  export interface Data {
    path: string;
    base_class_id: string;
  }

  export type Proto = SftClassTrace_pb;
}
