import { JSONSerializable } from '../../util/json'
import { Tx } from '../tx/Tx'
import { Blob } from './Blob'
import { BlobTx as BlobTx_pb } from '@initia/initia.proto/celestia/blob/v1/blob'

export class BlobTx extends JSONSerializable<any, BlobTx.Data, BlobTx.Proto> {
  /**
   * @param tx
   * @param blobs
   * @param type_id
   */
  constructor(
    public tx: Tx,
    public blobs: Blob[],
    public type_id: string
  ) {
    super()
  }

  public static fromAmino(_: any): BlobTx {
    _
    throw new Error('Amino not supported')
  }

  public toAmino(): any {
    throw new Error('Amino not supported')
  }

  public static fromData(data: BlobTx.Data): BlobTx {
    const { tx, blobs, type_id } = data
    return new BlobTx(Tx.fromData(tx), blobs.map(Blob.fromData), type_id)
  }

  public toData(): BlobTx.Data {
    const { tx, blobs, type_id } = this
    return {
      tx: tx.toData(),
      blobs: blobs.map((blob) => blob.toData()),
      type_id,
    }
  }

  public static fromProto(data: BlobTx.Proto): BlobTx {
    return new BlobTx(
      Tx.fromBytes(data.tx),
      data.blobs.map(Blob.fromProto),
      data.typeId
    )
  }

  public toProto(): BlobTx.Proto {
    const { tx, blobs, type_id } = this
    return BlobTx_pb.fromPartial({
      tx: tx.toBytes(),
      blobs: blobs.map((blob) => blob.toProto()),
      typeId: type_id,
    })
  }

  public toBytes(): Uint8Array {
    return BlobTx_pb.encode(this.toProto()).finish()
  }
}

export namespace BlobTx {
  export interface Data {
    tx: Tx.Data
    blobs: Blob.Data[]
    type_id: string
  }

  export type Proto = BlobTx_pb
}
