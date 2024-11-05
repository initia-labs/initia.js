import { JSONSerializable } from '../../util/json'
import { TallyResult as V1TallyResult_pb } from '@initia/initia.proto/cosmos/gov/v1/gov'
import { TallyResult as TallyResult_pb } from '@initia/initia.proto/initia/gov/v1/gov'
import Long from 'long'

export class TallyResult extends JSONSerializable<
  TallyResult.Amino,
  TallyResult.Data,
  TallyResult.Proto
> {
  /**
   * @param tally_height
   * @param total_staking_power
   * @param total_vesting_power
   * @param v1_tally_result // the original TallyResult from cosmos-sdk which contains both staking and vesting power
   */
  constructor(
    public tally_height: number,
    public total_staking_power: string,
    public total_vesting_power: string,
    public v1_tally_result: TallyResult.V1TallyResult
  ) {
    super()
  }

  public static fromAmino(data: TallyResult.Amino): TallyResult {
    const {
      tally_height,
      total_staking_power,
      total_vesting_power,
      v1_tally_result,
    } = data
    return new TallyResult(
      parseInt(tally_height),
      total_staking_power,
      total_vesting_power,
      v1_tally_result
    )
  }

  public toAmino(): TallyResult.Amino {
    const {
      tally_height,
      total_staking_power,
      total_vesting_power,
      v1_tally_result,
    } = this
    return {
      tally_height: tally_height.toString(),
      total_staking_power,
      total_vesting_power,
      v1_tally_result,
    }
  }

  public static fromData(data: TallyResult.Data): TallyResult {
    const {
      tally_height,
      total_staking_power,
      total_vesting_power,
      v1_tally_result,
    } = data
    return new TallyResult(
      parseInt(tally_height),
      total_staking_power,
      total_vesting_power,
      v1_tally_result
    )
  }

  public toData(): TallyResult.Data {
    const {
      tally_height,
      total_staking_power,
      total_vesting_power,
      v1_tally_result,
    } = this
    return {
      tally_height: tally_height.toString(),
      total_staking_power,
      total_vesting_power,
      v1_tally_result,
    }
  }

  public static fromProto(data: TallyResult.Proto): TallyResult {
    return new TallyResult(
      data.tallyHeight.toNumber(),
      data.totalStakingPower,
      data.totalVestingPower,
      {
        yes_count: data.v1TallyResult?.yesCount ?? '0',
        abstain_count: data.v1TallyResult?.abstainCount ?? '0',
        no_count: data.v1TallyResult?.noCount ?? '0',
        no_with_veto_count: data.v1TallyResult?.noWithVetoCount ?? '0',
      }
    )
  }

  public toProto(): TallyResult.Proto {
    const {
      tally_height,
      total_staking_power,
      total_vesting_power,
      v1_tally_result,
    } = this
    return TallyResult_pb.fromPartial({
      tallyHeight: Long.fromNumber(tally_height),
      totalStakingPower: total_staking_power,
      totalVestingPower: total_vesting_power,
      v1TallyResult: V1TallyResult_pb.fromPartial({
        yesCount: v1_tally_result.yes_count,
        abstainCount: v1_tally_result.abstain_count,
        noCount: v1_tally_result.no_count,
        noWithVetoCount: v1_tally_result.no_with_veto_count,
      }),
    })
  }
}

export namespace TallyResult {
  export interface V1TallyResult {
    yes_count: string
    abstain_count: string
    no_count: string
    no_with_veto_count: string
  }

  export interface Amino {
    tally_height: string
    total_staking_power: string
    total_vesting_power: string
    v1_tally_result: V1TallyResult
  }

  export interface Data {
    tally_height: string
    total_staking_power: string
    total_vesting_power: string
    v1_tally_result: V1TallyResult
  }

  export type Proto = TallyResult_pb
}
