import { JSONSerializable } from '../../../util/json'
import { AccAddress } from '../../bech32'
import { Any } from '@initia/initia.proto/google/protobuf/any'
import { MsgPayForBlobs as MsgPayForBlobs_pb } from '@initia/initia.proto/celestia/blob/v1/tx'

export class MsgPayForBlobs extends JSONSerializable<
  any,
  MsgPayForBlobs.Data,
  MsgPayForBlobs.Proto
> {
  /**
   * @param signer the bech32 encoded signer address
   * @param namespaces list of namespaces that the blobs are associated with
   * @param blob_sizes list of blob sizes (one per blob) in bytes
   * @param share_commitments list of share commitments (one per blob)
   * @param share_versions the versions of the share format that the blobs should use when included in a block
   */
  constructor(
    public signer: AccAddress,
    public namespaces: string[],
    public blob_sizes: number[],
    public share_commitments: string[],
    public share_versions: number[]
  ) {
    super()
  }

  public static fromAmino(_: any): MsgPayForBlobs {
    throw new Error('Amino not supported')
  }

  public toAmino(): any {
    throw new Error('Amino not supported')
  }

  public static fromData(data: MsgPayForBlobs.Data): MsgPayForBlobs {
    const {
      signer,
      namespaces,
      blob_sizes,
      share_commitments,
      share_versions,
    } = data
    return new MsgPayForBlobs(
      signer,
      namespaces,
      blob_sizes.map(parseInt),
      share_commitments,
      share_versions.map(parseInt)
    )
  }

  public toData(): MsgPayForBlobs.Data {
    const {
      signer,
      namespaces,
      blob_sizes,
      share_commitments,
      share_versions,
    } = this
    return {
      '@type': '/celestia.blob.v1.MsgPayForBlobs',
      signer,
      namespaces,
      blob_sizes: blob_sizes.map((size) => size.toFixed()),
      share_commitments,
      share_versions: share_versions.map((version) => version.toFixed()),
    }
  }

  public static fromProto(data: MsgPayForBlobs.Proto): MsgPayForBlobs {
    return new MsgPayForBlobs(
      data.signer,
      data.namespaces.map((namespace) =>
        Buffer.from(namespace).toString('base64')
      ),
      data.blobSizes,
      data.shareCommitments.map((commitment) =>
        Buffer.from(commitment).toString('base64')
      ),
      data.shareVersions
    )
  }

  public toProto(): MsgPayForBlobs.Proto {
    const {
      signer,
      namespaces,
      blob_sizes,
      share_commitments,
      share_versions,
    } = this
    return MsgPayForBlobs_pb.fromPartial({
      signer,
      namespaces: namespaces.map((namespace) =>
        Buffer.from(namespace, 'base64')
      ),
      blobSizes: blob_sizes,
      shareCommitments: share_commitments.map((commitment) =>
        Buffer.from(commitment, 'base64')
      ),
      shareVersions: share_versions,
    })
  }

  public packAny(): Any {
    return Any.fromPartial({
      typeUrl: '/celestia.blob.v1.MsgPayForBlobs',
      value: MsgPayForBlobs_pb.encode(this.toProto()).finish(),
    })
  }

  public static unpackAny(msgAny: Any): MsgPayForBlobs {
    return MsgPayForBlobs.fromProto(MsgPayForBlobs_pb.decode(msgAny.value))
  }
}

export namespace MsgPayForBlobs {
  export interface Data {
    '@type': '/celestia.blob.v1.MsgPayForBlobs'
    signer: AccAddress
    namespaces: string[]
    blob_sizes: string[]
    share_commitments: string[]
    share_versions: string[]
  }

  export type Proto = MsgPayForBlobs_pb
}
