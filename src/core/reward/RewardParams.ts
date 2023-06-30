import { JSONSerializable } from '../../util/json';
import { Params as Params_pb } from '@initia/initia.proto/initia/reward/v1/types';
import Long from 'long';

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
    public dilution_period: number,
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
      Number.parseInt(dilution_period),
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
        dilution_period: dilution_period.toString(),
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
      Number.parseInt(dilution_period),
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
      dilution_period: dilution_period.toString(),
      release_rate,
      dilution_rate,
      release_enabled,
    };
  }

  public static fromProto(data: RewardParams.Proto): RewardParams {
    return new RewardParams(
      data.rewardDenom,
      data.dilutionPeriod.toNumber(),
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
      dilutionPeriod: Long.fromNumber(dilution_period),
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
      dilution_period: string;
      release_rate: string;
      dilution_rate: string;
      release_enabled: boolean;
    };
  }

  export interface Data {
    '@type': '/initia.reward.v1.Params';
    reward_denom: string;
    dilution_period: string;
    release_rate: string;
    dilution_rate: string;
    release_enabled: boolean;
  }

  export type Proto = Params_pb;
}
