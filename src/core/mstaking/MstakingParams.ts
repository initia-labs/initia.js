import { JSONSerializable } from '../../util/json'
import { Duration } from '../Duration'
import { Params as Params_pb } from '@initia/initia.proto/initia/mstaking/v1/staking'
import Long from 'long'

export class MstakingParams extends JSONSerializable<
  MstakingParams.Amino,
  MstakingParams.Data,
  MstakingParams.Proto
> {
  /**
   * @param unbonding_time the time duration of unbonding
   * @param max_validators the maximum number of validators
   * @param max_entries the max entries for either unbonding delegation or redelegation (per pair/trio)
   * @param historical_entries the number of historical entries to persist
   * @param bond_denoms the bondable coin denomination
   * @param min_voting_power the chain-wide minimum voting power to get into power update whitelist
   * @param min_commission_rate the chain-wide minimum commission rate that a validator can charge their delegators
   */
  constructor(
    public unbonding_time: Duration,
    public max_validators: number,
    public max_entries: number,
    public historical_entries: number,
    public bond_denoms: string[],
    public min_voting_power: number,
    public min_commission_rate: string
  ) {
    super()
  }

  public static fromAmino(data: MstakingParams.Amino): MstakingParams {
    const {
      value: {
        unbonding_time,
        max_validators,
        max_entries,
        historical_entries,
        bond_denoms,
        min_voting_power,
        min_commission_rate,
      },
    } = data
    return new MstakingParams(
      Duration.fromAmino(unbonding_time),
      max_validators,
      max_entries,
      historical_entries,
      bond_denoms,
      parseInt(min_voting_power),
      min_commission_rate
    )
  }

  public toAmino(): MstakingParams.Amino {
    const {
      unbonding_time,
      max_validators,
      max_entries,
      historical_entries,
      bond_denoms,
      min_voting_power,
      min_commission_rate,
    } = this
    return {
      type: 'mstaking/Params',
      value: {
        unbonding_time: unbonding_time.toAmino(),
        max_validators,
        max_entries,
        historical_entries,
        bond_denoms,
        min_voting_power: min_voting_power.toString(),
        min_commission_rate,
      },
    }
  }

  public static fromData(data: MstakingParams.Data): MstakingParams {
    const {
      unbonding_time,
      max_validators,
      max_entries,
      historical_entries,
      bond_denoms,
      min_voting_power,
      min_commission_rate,
    } = data
    return new MstakingParams(
      Duration.fromData(unbonding_time),
      max_validators,
      max_entries,
      historical_entries,
      bond_denoms,
      parseInt(min_voting_power),
      min_commission_rate
    )
  }

  public toData(): MstakingParams.Data {
    const {
      unbonding_time,
      max_validators,
      max_entries,
      historical_entries,
      bond_denoms,
      min_voting_power,
      min_commission_rate,
    } = this
    return {
      '@type': '/initia.mstaking.v1.Params',
      unbonding_time: unbonding_time.toData(),
      max_validators,
      max_entries,
      historical_entries,
      bond_denoms,
      min_voting_power: min_voting_power.toString(),
      min_commission_rate,
    }
  }

  public static fromProto(data: MstakingParams.Proto): MstakingParams {
    return new MstakingParams(
      Duration.fromProto(data.unbondingTime as Duration.Proto),
      data.maxValidators,
      data.maxEntries,
      data.historicalEntries,
      data.bondDenoms,
      data.minVotingPower.toNumber(),
      data.minCommissionRate
    )
  }

  public toProto(): MstakingParams.Proto {
    const {
      unbonding_time,
      max_validators,
      max_entries,
      historical_entries,
      bond_denoms,
      min_voting_power,
      min_commission_rate,
    } = this
    return Params_pb.fromPartial({
      unbondingTime: unbonding_time.toProto(),
      maxValidators: max_validators,
      maxEntries: max_entries,
      historicalEntries: historical_entries,
      bondDenoms: bond_denoms,
      minVotingPower: Long.fromNumber(min_voting_power),
      minCommissionRate: min_commission_rate,
    })
  }
}

export namespace MstakingParams {
  export interface Amino {
    type: 'mstaking/Params'
    value: {
      unbonding_time: Duration.Amino
      max_validators: number
      max_entries: number
      historical_entries: number
      bond_denoms: string[]
      min_voting_power: string
      min_commission_rate: string
    }
  }

  export interface Data {
    '@type': '/initia.mstaking.v1.Params'
    unbonding_time: Duration.Data
    max_validators: number
    max_entries: number
    historical_entries: number
    bond_denoms: string[]
    min_voting_power: string
    min_commission_rate: string
  }

  export type Proto = Params_pb
}
