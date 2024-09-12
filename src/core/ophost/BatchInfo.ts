import { JSONSerializable } from '../../util/json'
import { AccAddress } from '../bech32'
import {
  BatchInfo as BatchInfo_pb,
  BatchInfo_ChainType as ChainType,
  batchInfo_ChainTypeFromJSON as chainTypeFromJSON,
  batchInfo_ChainTypeToJSON as chainTypeToJSON,
} from '@initia/opinit.proto/opinit/ophost/v1/types'

export class BatchInfo extends JSONSerializable<
  BatchInfo.Amino,
  BatchInfo.Data,
  BatchInfo.Proto
> {
  /**
   * @param submitter the address of the batch submitter
   * @param chain_type the target chain type
   */
  constructor(
    public submitter: AccAddress,
    public chain_type: ChainType
  ) {
    super()
  }

  public static fromAmino(data: BatchInfo.Amino): BatchInfo {
    const { submitter, chain_type } = data
    return new BatchInfo(submitter, chainTypeFromJSON(chain_type))
  }

  public toAmino(): BatchInfo.Amino {
    const { submitter, chain_type } = this
    return { submitter, chain_type: chainTypeToJSON(chain_type) }
  }

  public static fromData(data: BatchInfo.Data): BatchInfo {
    const { submitter, chain_type } = data
    return new BatchInfo(submitter, chainTypeFromJSON(chain_type))
  }

  public toData(): BatchInfo.Data {
    const { submitter, chain_type } = this
    return { submitter, chain_type: chainTypeToJSON(chain_type) }
  }

  public static fromProto(data: BatchInfo.Proto): BatchInfo {
    return new BatchInfo(data.submitter, data.chainType)
  }

  public toProto(): BatchInfo.Proto {
    const { submitter, chain_type } = this
    return BatchInfo_pb.fromPartial({
      submitter,
      chainType: chain_type,
    })
  }
}

export namespace BatchInfo {
  export interface Amino {
    submitter: AccAddress
    chain_type: string
  }

  export interface Data {
    submitter: AccAddress
    chain_type: string
  }

  export type Proto = BatchInfo_pb
}
