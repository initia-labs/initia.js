import { JSONSerializable } from '../../util/json'
import { Denom } from '../Denom'
import { RewardWeight as RewardWeight_pb } from '@initia/initia.proto/initia/distribution/v1/distribution'

/**
 * RewardWeight represents reward allocation ratio between pools.
 */
export class RewardWeight extends JSONSerializable<
  RewardWeight.Amino,
  RewardWeight.Data,
  RewardWeight.Proto
> {
  /**
   * @param denom
   * @param weight
   */
  constructor(
    public denom: Denom,
    public weight: string
  ) {
    super()
  }

  public static fromAmino(data: RewardWeight.Amino): RewardWeight {
    const { denom, weight } = data
    return new RewardWeight(denom, weight)
  }

  public toAmino(): RewardWeight.Amino {
    const { denom, weight } = this
    return {
      denom,
      weight,
    }
  }

  public static fromData(data: RewardWeight.Data): RewardWeight {
    const { denom, weight } = data
    return new RewardWeight(denom, weight)
  }

  public toData(): RewardWeight.Data {
    const { denom, weight } = this
    return {
      denom,
      weight,
    }
  }

  public static fromProto(data: RewardWeight.Proto): RewardWeight {
    return new RewardWeight(data.denom, data.weight)
  }

  public toProto(): RewardWeight.Proto {
    const { denom, weight } = this
    return RewardWeight_pb.fromPartial({
      denom,
      weight,
    })
  }
}

export namespace RewardWeight {
  export interface Amino {
    denom: Denom
    weight: string
  }

  export interface Data {
    denom: Denom
    weight: string
  }

  export type Proto = RewardWeight_pb
}
