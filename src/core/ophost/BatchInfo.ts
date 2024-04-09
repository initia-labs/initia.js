import { JSONSerializable } from '../../util/json';
import { BatchInfo as BatchInfo_pb } from '@initia/opinit.proto/opinit/ophost/v1/types';

export class BatchInfo extends JSONSerializable<
  BatchInfo.Amino,
  BatchInfo.Data,
  BatchInfo.Proto
> {
  /**
   * @param submitter the address of the batch submitter
   * @param chain the target chain
   */
  constructor(public submitter: string, public chain: string) {
    super();
  }

  public static fromAmino(data: BatchInfo.Amino): BatchInfo {
    const { submitter, chain } = data;
    return new BatchInfo(submitter, chain);
  }

  public toAmino(): BatchInfo.Amino {
    const { submitter, chain } = this;
    return { submitter, chain };
  }

  public static fromData(data: BatchInfo.Data): BatchInfo {
    const { submitter, chain } = data;
    return new BatchInfo(submitter, chain);
  }

  public toData(): BatchInfo.Data {
    const { submitter, chain } = this;
    return { submitter, chain };
  }

  public static fromProto(data: BatchInfo.Proto): BatchInfo {
    return new BatchInfo(data.submitter, data.chain);
  }

  public toProto(): BatchInfo.Proto {
    const { submitter, chain } = this;
    return BatchInfo_pb.fromPartial({
      submitter,
      chain,
    });
  }
}

export namespace BatchInfo {
  export interface Amino {
    submitter: string;
    chain: string;
  }

  export interface Data {
    submitter: string;
    chain: string;
  }

  export type Proto = BatchInfo_pb;
}
