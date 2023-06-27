import { JSONSerializable } from '../../util/json';
import { Duration } from '../Duration';
import { EvidenceParams as EvidenceParams_pb } from '@initia/initia.proto/tendermint/types/params';
import Long from 'long';

export class EvidenceParams extends JSONSerializable<
  EvidenceParams.Amino,
  EvidenceParams.Data,
  EvidenceParams.Proto
> {
  /**
   * @param max_age_num_blocks Max age of evidence in blocks, MaxAgeDuration / average block time
   * @param max_age_duration Max age of evidence in time
   * @param max_bytes the maximum size of total evidence in bytes that can be committed in a single block
   */
  constructor(
    public max_age_num_blocks: number,
    public max_age_duration: Duration,
    public max_bytes: number
  ) {
    super();
  }

  public static fromAmino(data: EvidenceParams.Amino): EvidenceParams {
    const { max_age_num_blocks, max_age_duration, max_bytes } = data;
    return new EvidenceParams(
      Number.parseInt(max_age_num_blocks),
      Duration.fromAmino(max_age_duration),
      Number.parseInt(max_bytes)
    );
  }

  public toAmino(): EvidenceParams.Amino {
    const { max_age_num_blocks, max_age_duration, max_bytes } = this;
    return {
      max_age_num_blocks: max_age_num_blocks.toString(),
      max_age_duration: max_age_duration.toAmino(),
      max_bytes: max_bytes.toString(),
    };
  }

  public static fromData(data: EvidenceParams.Data): EvidenceParams {
    const { max_age_num_blocks, max_age_duration, max_bytes } = data;
    return new EvidenceParams(
      Number.parseInt(max_age_num_blocks),
      Duration.fromData(max_age_duration),
      Number.parseInt(max_bytes)
    );
  }

  public toData(): EvidenceParams.Data {
    const { max_age_num_blocks, max_age_duration, max_bytes } = this;
    return {
      max_age_num_blocks: max_age_num_blocks.toString(),
      max_age_duration: max_age_duration.toData(),
      max_bytes: max_bytes.toString(),
    };
  }

  public static fromProto(data: EvidenceParams.Proto): EvidenceParams {
    return new EvidenceParams(
      data.maxAgeNumBlocks.toNumber(),
      Duration.fromProto(data.maxAgeDuration as Duration.Proto),
      data.maxBytes.toNumber()
    );
  }

  public toProto(): EvidenceParams.Proto {
    const { max_age_num_blocks, max_age_duration, max_bytes } = this;
    return EvidenceParams_pb.fromPartial({
      maxAgeNumBlocks: Long.fromNumber(max_age_num_blocks),
      maxAgeDuration: max_age_duration.toProto(),
      maxBytes: Long.fromNumber(max_bytes),
    });
  }
}

export namespace EvidenceParams {
  export interface Amino {
    max_age_num_blocks: string;
    max_age_duration: Duration.Amino;
    max_bytes: string;
  }

  export interface Data {
    max_age_num_blocks: string;
    max_age_duration: Duration.Data;
    max_bytes: string;
  }

  export type Proto = EvidenceParams_pb;
}
