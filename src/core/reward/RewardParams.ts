import { JSONSerializable } from '../../util/json';
import { Duration } from '../Duration';
import { Params as Params_pb } from '@initia/initia.proto/initia/reward/v1/types';

export class RewardParams extends JSONSerializable<
  RewardParams.Amino,
  RewardParams.Data,
  RewardParams.Proto
> {
  /**
   * @param reward_denom
   * @param dilution_period
   * @param release_rate
   * @param dilution_rate dilution rate of release rate
   * @param release_enabled
   */
  constructor(
    public reward_denom: string,
    public dilution_period: Duration,
    public release_rate: string,
    public dilution_rate: string,
    public release_enabled: boolean
  ) {
    super();
  }

  public static fromAmino(data: RewardParams.Amino): RewardParams {
    const {
      value: {
        reward_denom,
        dilution_period,
        release_rate,
        dilution_rate,
        release_enabled,
      },
    } = data;

    return new RewardParams(
      reward_denom,
      Duration.fromAmino(dilution_period),
      release_rate,
      dilution_rate,
      release_enabled
    );
  }

  public toAmino(): RewardParams.Amino {
    const {
      reward_denom,
      dilution_period,
      release_rate,
      dilution_rate,
      release_enabled,
    } = this;

    return {
      type: 'reward/Params',
      value: {
        reward_denom,
        dilution_period: dilution_period.toAmino(),
        release_rate,
        dilution_rate,
        release_enabled,
      },
    };
  }

  public static fromData(data: RewardParams.Data): RewardParams {
    const {
      reward_denom,
      dilution_period,
      release_rate,
      dilution_rate,
      release_enabled,
    } = data;

    return new RewardParams(
      reward_denom,
      Duration.fromData(dilution_period),
      release_rate,
      dilution_rate,
      release_enabled
    );
  }

  public toData(): RewardParams.Data {
    const {
      reward_denom,
      dilution_period,
      release_rate,
      dilution_rate,
      release_enabled,
    } = this;

    return {
      '@type': '/initia.reward.v1.Params',
      reward_denom,
      dilution_period: dilution_period.toData(),
      release_rate,
      dilution_rate,
      release_enabled,
    };
  }

  public static fromProto(data: RewardParams.Proto): RewardParams {
    return new RewardParams(
      data.rewardDenom,
      Duration.fromProto(data.dilutionPeriod as Duration.Proto),
      data.releaseRate,
      data.dilutionRate,
      data.releaseEnabled
    );
  }

  public toProto(): RewardParams.Proto {
    const {
      reward_denom,
      dilution_period,
      release_rate,
      dilution_rate,
      release_enabled,
    } = this;

    return Params_pb.fromPartial({
      rewardDenom: reward_denom,
      dilutionPeriod: dilution_period.toProto(),
      releaseRate: release_rate,
      dilutionRate: dilution_rate,
      releaseEnabled: release_enabled,
    });
  }
}

export namespace RewardParams {
  export interface Amino {
    type: 'reward/Params';
    value: {
      reward_denom: string;
      dilution_period: Duration.Amino;
      release_rate: string;
      dilution_rate: string;
      release_enabled: boolean;
    };
  }

  export interface Data {
    '@type': '/initia.reward.v1.Params';
    reward_denom: string;
    dilution_period: Duration.Data;
    release_rate: string;
    dilution_rate: string;
    release_enabled: boolean;
  }

  export type Proto = Params_pb;
}
