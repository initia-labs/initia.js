import { JSONSerializable } from '../../../util/json'
import { AccAddress } from '../../bech32'
import { MsgRecordBatch as MsgRecordBatch_pb } from '@initia/opinit.proto/opinit/ophost/v1/tx'
import { Any } from '@initia/initia.proto/google/protobuf/any'
import Long from 'long'

export class MsgRecordBatch extends JSONSerializable<
  MsgRecordBatch.Amino,
  MsgRecordBatch.Data,
  MsgRecordBatch.Proto
> {
  /**
   * @param submitter
   * @param bridge_id
   * @param batch_bytes
   */
  constructor(
    public submitter: AccAddress,
    public bridge_id: number,
    public batch_bytes: string
  ) {
    super()
  }

  public static fromAmino(data: MsgRecordBatch.Amino): MsgRecordBatch {
    const {
      value: { submitter, bridge_id, batch_bytes },
    } = data
    return new MsgRecordBatch(submitter, parseInt(bridge_id), batch_bytes)
  }

  public toAmino(): MsgRecordBatch.Amino {
    const { submitter, bridge_id, batch_bytes } = this
    return {
      type: 'ophost/MsgRecordBatch',
      value: {
        submitter,
        bridge_id: bridge_id.toString(),
        batch_bytes,
      },
    }
  }

  public static fromData(data: MsgRecordBatch.Data): MsgRecordBatch {
    const { submitter, bridge_id, batch_bytes } = data
    return new MsgRecordBatch(submitter, parseInt(bridge_id), batch_bytes)
  }

  public toData(): MsgRecordBatch.Data {
    const { submitter, bridge_id, batch_bytes } = this
    return {
      '@type': '/opinit.ophost.v1.MsgRecordBatch',
      submitter,
      bridge_id: bridge_id.toString(),
      batch_bytes,
    }
  }

  public static fromProto(data: MsgRecordBatch.Proto): MsgRecordBatch {
    return new MsgRecordBatch(
      data.submitter,
      data.bridgeId.toNumber(),
      Buffer.from(data.batchBytes).toString('base64')
    )
  }

  public toProto(): MsgRecordBatch.Proto {
    const { submitter, bridge_id, batch_bytes } = this
    return MsgRecordBatch_pb.fromPartial({
      submitter,
      bridgeId: Long.fromNumber(bridge_id),
      batchBytes: batch_bytes ? Buffer.from(batch_bytes, 'base64') : undefined,
    })
  }

  public packAny(): Any {
    return Any.fromPartial({
      typeUrl: '/opinit.ophost.v1.MsgRecordBatch',
      value: MsgRecordBatch_pb.encode(this.toProto()).finish(),
    })
  }

  public static unpackAny(msgAny: Any): MsgRecordBatch {
    return MsgRecordBatch.fromProto(MsgRecordBatch_pb.decode(msgAny.value))
  }
}

export namespace MsgRecordBatch {
  export interface Amino {
    type: 'ophost/MsgRecordBatch'
    value: {
      submitter: AccAddress
      bridge_id: string
      batch_bytes: string
    }
  }

  export interface Data {
    '@type': '/opinit.ophost.v1.MsgRecordBatch'
    submitter: AccAddress
    bridge_id: string
    batch_bytes: string
  }

  export type Proto = MsgRecordBatch_pb
}
