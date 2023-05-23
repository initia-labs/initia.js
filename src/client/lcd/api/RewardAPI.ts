import { Denom } from '../../../core';
import { APIParams } from '../APIRequester';
import { BaseAPI } from './BaseAPI';

export interface RewardParams {
  reward_denom: Denom;
  dilution_period: string;
  release_rate: string;
  dilution_rate: string;
  release_enabled: boolean;
}

export namespace RewardParams {
  export interface Data {
    reward_denom: string;
    dilution_period: string;
    release_rate: string;
    dilution_rate: string;
    release_enabled: boolean;
  }
}

export class RewardAPI extends BaseAPI {
  /**
   * Gets the last release rate dilution timestamp
   */
  public async last_dilution_timestamp(
    params: APIParams = {}
  ): Promise<string> {
    return this.c
      .get<{ last_dilution_timestamp: string }>(
        `/initia/reward/v1/last_dilution_timestamp`,
        params
      )
      .then(d => d.last_dilution_timestamp);
  }

  /**
   * Gets the current annual provisions value
   */
  public async annualProvisions(params: APIParams = {}): Promise<string> {
    return this.c
      .get<{ annual_provisions: string }>(
        `/initia/reward/v1/annual_provisions`,
        params
      )
      .then(d => d.annual_provisions);
  }

  /**
   * Gets the current reward module's parameters.
   */
  public async parameters(params: APIParams = {}): Promise<RewardParams> {
    return this.c
      .get<{ params: RewardParams.Data }>(`/initia/reward/v1/params`, params)
      .then(({ params: d }) => ({
        reward_denom: d.reward_denom,
        dilution_period: d.dilution_period,
        release_rate: d.release_rate,
        dilution_rate: d.dilution_rate,
        release_enabled: d.release_enabled,
      }));
  }
}
