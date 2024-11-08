import { JSONSerializable } from '../../util/json'
import { BatchInfoWithOutput as BatchInfoWithOutput_pb } from '@initia/opinit.proto/opinit/ophost/v1/types'
import { BatchInfo } from './BatchInfo'
import { Output } from './Output'

/**
 * BatchInfoWithOutput defines the batch information with output.
 */
export class BatchInfoWithOutput extends JSONSerializable<
  BatchInfoWithOutput.Amino,
  BatchInfoWithOutput.Data,
  BatchInfoWithOutput.Proto
> {
  /**
   * @param batch_info
   * @param output
   */
  constructor(
    public batch_info: BatchInfo,
    public output: Output
  ) {
    super()
  }

  public static fromAmino(
    data: BatchInfoWithOutput.Amino
  ): BatchInfoWithOutput {
    const { batch_info, output } = data
    return new BatchInfoWithOutput(
      BatchInfo.fromAmino(batch_info),
      Output.fromAmino(output)
    )
  }

  public toAmino(): BatchInfoWithOutput.Amino {
    const { batch_info, output } = this
    return {
      batch_info: batch_info.toAmino(),
      output: output.toAmino(),
    }
  }

  public static fromData(data: BatchInfoWithOutput.Data): BatchInfoWithOutput {
    const { batch_info, output } = data
    return new BatchInfoWithOutput(
      BatchInfo.fromData(batch_info),
      Output.fromData(output)
    )
  }

  public toData(): BatchInfoWithOutput.Data {
    const { batch_info, output } = this
    return {
      batch_info: batch_info.toData(),
      output: output.toData(),
    }
  }

  public static fromProto(
    data: BatchInfoWithOutput.Proto
  ): BatchInfoWithOutput {
    return new BatchInfoWithOutput(
      BatchInfo.fromProto(data.batchInfo as BatchInfo.Proto),
      Output.fromProto(data.output as Output.Proto)
    )
  }

  public toProto(): BatchInfoWithOutput.Proto {
    const { batch_info, output } = this
    return BatchInfoWithOutput_pb.fromPartial({
      batchInfo: batch_info.toProto(),
      output: output.toProto(),
    })
  }
}

export namespace BatchInfoWithOutput {
  export interface Amino {
    batch_info: BatchInfo.Amino
    output: Output.Amino
  }

  export interface Data {
    batch_info: BatchInfo.Data
    output: Output.Data
  }

  export type Proto = BatchInfoWithOutput_pb
}
