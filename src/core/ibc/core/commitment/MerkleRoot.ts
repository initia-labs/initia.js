import { MerkleRoot as MerkleRoot_pb } from '@initia/initia.proto/ibc/core/commitment/v1/commitment'
import { JSONSerializable } from '../../../../util/json'
import { base64FromBytes, bytesFromBase64 } from '../../../../util/polyfill'

// MerkleRoot defines a merkle root hash.
// In the Cosmos SDK, the AppHash of a block header becomes the root.
export class MerkleRoot extends JSONSerializable<
  MerkleRoot.Amino,
  MerkleRoot.Data,
  MerkleRoot.Proto
> {
  /**
   * @param hash
   */
  constructor(public hash: string) {
    super()
  }

  public static fromAmino(_: any): MerkleRoot {
    _
    throw new Error('Amino not supported')
  }

  public toAmino(): any {
    throw new Error('Amino not supported')
  }

  public static fromData(data: MerkleRoot.Data): MerkleRoot {
    return new MerkleRoot(data.hash)
  }

  public toData(): MerkleRoot.Data {
    const res: MerkleRoot.Data = {
      hash: this.hash,
    }
    return res
  }

  public static fromProto(proto: MerkleRoot.Proto): MerkleRoot {
    return new MerkleRoot(base64FromBytes(proto.hash))
  }

  public toProto(): MerkleRoot.Proto {
    return MerkleRoot_pb.fromPartial({
      hash: bytesFromBase64(this.hash),
    })
  }
}

export namespace MerkleRoot {
  export interface Amino {
    hash: string
  }

  export interface Data {
    hash: string
  }

  export type Proto = MerkleRoot_pb
}
