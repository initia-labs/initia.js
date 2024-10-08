import { JSONSerializable } from '../../util/json'
import { base64FromBytes, bytesFromBase64 } from '../../util/polyfill'
import { Blob as Blob_pb } from '@initia/initia.proto/celestia/blob/v1/blob'

export class Blob extends JSONSerializable<any, Blob.Data, Blob.Proto> {
  /**
   * @param namespace_id
   * @param data
   * @param share_version
   * @param namespace_version
   */
  constructor(
    public namespace_id: string,
    public data: string,
    public share_version: number,
    public namespace_version: number
  ) {
    super()
  }

  public static fromAmino(_: any): Blob {
    _
    throw new Error('Amino not supported')
  }

  public toAmino(): any {
    throw new Error('Amino not supported')
  }

  public static fromData(data: Blob.Data): Blob {
    return new Blob(
      data.namespace_id,
      data.data,
      Number.parseInt(data.share_version),
      Number.parseInt(data.namespace_version)
    )
  }

  public toData(): Blob.Data {
    const { namespace_id, data, share_version, namespace_version } = this
    return {
      namespace_id,
      data,
      share_version: share_version.toString(),
      namespace_version: namespace_version.toString(),
    }
  }

  public static fromProto(data: Blob.Proto): Blob {
    return new Blob(
      base64FromBytes(data.namespaceId),
      base64FromBytes(data.data),
      data.shareVersion,
      data.namespaceVersion
    )
  }

  public toProto(): Blob.Proto {
    const { namespace_id, data, share_version, namespace_version } = this
    return Blob_pb.fromPartial({
      namespaceId: bytesFromBase64(namespace_id),
      data: bytesFromBase64(data),
      shareVersion: share_version,
      namespaceVersion: namespace_version,
    })
  }
}

export namespace Blob {
  export interface Data {
    namespace_id: string
    data: string
    share_version: string
    namespace_version: string
  }

  export type Proto = Blob_pb
}
