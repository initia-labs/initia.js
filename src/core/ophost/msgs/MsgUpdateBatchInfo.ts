import { JSONSerializable } from '../../../util/json'
import { AccAddress } from '../../bech32'
import { MsgUpdateBatchInfo as MsgUpdateBatchInfo_pb } from '@initia/opinit.proto/opinit/ophost/v1/tx'
import { Any } from '@initia/initia.proto/google/protobuf/any'
import { BatchInfo } from '../BatchInfo'

/**
 * MsgUpdateBatchInfo is a message to change a batch info.
 */
export class MsgUpdateBatchInfo extends JSONSerializable<
  MsgUpdateBatchInfo.Amino,
  MsgUpdateBatchInfo.Data,
  MsgUpdateBatchInfo.Proto
> {
  /**
   * @param authority the address that controls the module
   * @param bridge_id
   * @param new_batch_info
   */
  constructor(
    public authority: AccAddress,
    public bridge_id: number,
    public new_batch_info: BatchInfo
  ) {
    super()
  }

  public static fromAmino(data: MsgUpdateBatchInfo.Amino): MsgUpdateBatchInfo {
    const {
      value: { authority, bridge_id, new_batch_info },
    } = data

    return new MsgUpdateBatchInfo(
      authority,
      parseInt(bridge_id),
      BatchInfo.fromAmino(new_batch_info)
    )
  }

  public toAmino(): MsgUpdateBatchInfo.Amino {
    const { authority, bridge_id, new_batch_info } = this
    return {
      type: 'ophost/MsgUpdateBatchInfo',
      value: {
        authority,
        bridge_id: bridge_id.toFixed(),
        new_batch_info: new_batch_info.toAmino(),
      },
    }
  }

  public static fromData(data: MsgUpdateBatchInfo.Data): MsgUpdateBatchInfo {
    const { authority, bridge_id, new_batch_info } = data
    return new MsgUpdateBatchInfo(
      authority,
      parseInt(bridge_id),
      BatchInfo.fromData(new_batch_info)
    )
  }

  public toData(): MsgUpdateBatchInfo.Data {
    const { authority, bridge_id, new_batch_info } = this
    return {
      '@type': '/opinit.ophost.v1.MsgUpdateBatchInfo',
      authority,
      bridge_id: bridge_id.toFixed(),
      new_batch_info: new_batch_info.toData(),
    }
  }

  public static fromProto(data: MsgUpdateBatchInfo.Proto): MsgUpdateBatchInfo {
    return new MsgUpdateBatchInfo(
      data.authority,
      Number(data.bridgeId),
      BatchInfo.fromProto(data.newBatchInfo as BatchInfo.Proto)
    )
  }

  public toProto(): MsgUpdateBatchInfo.Proto {
    const { authority, bridge_id, new_batch_info } = this
    return MsgUpdateBatchInfo_pb.fromPartial({
      authority,
      bridgeId: BigInt(bridge_id),
      newBatchInfo: new_batch_info.toProto(),
    })
  }

  public packAny(): Any {
    return Any.fromPartial({
      typeUrl: '/opinit.ophost.v1.MsgUpdateBatchInfo',
      value: MsgUpdateBatchInfo_pb.encode(this.toProto()).finish(),
    })
  }

  public static unpackAny(msgAny: Any): MsgUpdateBatchInfo {
    return MsgUpdateBatchInfo.fromProto(
      MsgUpdateBatchInfo_pb.decode(msgAny.value)
    )
  }
}

export namespace MsgUpdateBatchInfo {
  export interface Amino {
    type: 'ophost/MsgUpdateBatchInfo'
    value: {
      authority: AccAddress
      bridge_id: string
      new_batch_info: BatchInfo.Amino
    }
  }

  export interface Data {
    '@type': '/opinit.ophost.v1.MsgUpdateBatchInfo'
    authority: AccAddress
    bridge_id: string
    new_batch_info: BatchInfo.Data
  }

  export type Proto = MsgUpdateBatchInfo_pb
}
