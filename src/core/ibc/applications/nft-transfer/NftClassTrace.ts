import { ClassTrace as NftClassTrace_pb } from '@initia/initia.proto/ibc/applications/nft_transfer/v1/types'
import { JSONSerializable } from '../../../../util/json'

export class NftClassTrace extends JSONSerializable<
  NftClassTrace.Amino,
  NftClassTrace.Data,
  NftClassTrace.Proto
> {
  /**
   * @param path the chain of port/channel identifiers used for tracing the source of the non fungible token
   * @param base_class_id base class id of the relayed non fungible token
   */
  constructor(
    public path: string,
    public base_class_id: string
  ) {
    super()
  }

  public static fromAmino(data: NftClassTrace.Amino): NftClassTrace {
    const { path, base_class_id } = data
    return new NftClassTrace(path, base_class_id)
  }

  public toAmino(): NftClassTrace.Amino {
    const { path, base_class_id } = this
    const res: NftClassTrace.Amino = {
      path,
      base_class_id,
    }
    return res
  }

  public static fromData(data: NftClassTrace.Data): NftClassTrace {
    const { path, base_class_id } = data
    return new NftClassTrace(path, base_class_id)
  }

  public toData(): NftClassTrace.Data {
    const { path, base_class_id } = this
    const res: NftClassTrace.Data = {
      path,
      base_class_id,
    }
    return res
  }

  public static fromProto(proto: NftClassTrace.Proto): NftClassTrace {
    return new NftClassTrace(proto.path, proto.baseClassId)
  }

  public toProto(): NftClassTrace.Proto {
    const { path, base_class_id } = this
    return NftClassTrace_pb.fromPartial({ path, baseClassId: base_class_id })
  }
}

export namespace NftClassTrace {
  export interface Amino {
    path: string
    base_class_id: string
  }

  export interface Data {
    path: string
    base_class_id: string
  }

  export type Proto = NftClassTrace_pb
}
