import { JSONSerializable } from '../../../../util/json'
import { Params as Params_pb } from '@initia/initia.proto/ibc/core/connection/v1/connection'
import Long from 'long'

export class IbcConnectionParams extends JSONSerializable<
  IbcConnectionParams.Amino,
  IbcConnectionParams.Data,
  IbcConnectionParams.Proto
> {
  /**
   * @param max_expected_time_per_block maximum expected time per block (in nanoseconds), used to enforce block delay
   */
  constructor(public max_expected_time_per_block: number) {
    super()
  }

  public static fromAmino(
    data: IbcConnectionParams.Amino
  ): IbcConnectionParams {
    const { max_expected_time_per_block } = data
    return new IbcConnectionParams(parseInt(max_expected_time_per_block))
  }

  public toAmino(): IbcConnectionParams.Amino {
    const { max_expected_time_per_block } = this
    return {
      max_expected_time_per_block: max_expected_time_per_block.toString(),
    }
  }

  public static fromData(data: IbcConnectionParams.Data): IbcConnectionParams {
    const { max_expected_time_per_block } = data
    return new IbcConnectionParams(parseInt(max_expected_time_per_block))
  }

  public toData(): IbcConnectionParams.Data {
    const { max_expected_time_per_block } = this
    return {
      max_expected_time_per_block: max_expected_time_per_block.toString(),
    }
  }

  public static fromProto(
    proto: IbcConnectionParams.Proto
  ): IbcConnectionParams {
    return new IbcConnectionParams(proto.maxExpectedTimePerBlock.toNumber())
  }

  public toProto(): IbcConnectionParams.Proto {
    const { max_expected_time_per_block } = this
    return Params_pb.fromPartial({
      maxExpectedTimePerBlock: Long.fromNumber(max_expected_time_per_block),
    })
  }
}

export namespace IbcConnectionParams {
  export interface Amino {
    max_expected_time_per_block: string
  }

  export interface Data {
    max_expected_time_per_block: string
  }

  export type Proto = Params_pb
}
