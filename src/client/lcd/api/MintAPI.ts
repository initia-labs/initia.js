import { Denom } from '../../../core';
import { APIParams } from '../APIRequester';
import { BaseAPI } from './BaseAPI';

export interface MintingParams {
  mint_denom: Denom;
  inflation_rate_change: string;
  inflation_max: string;
  inflation_min: string;
  goal_bonded: string;
  blocks_per_year: number;
}

export namespace MintingParams {
  export interface Data {
    mint_denom: string;
    inflation_rate_change: string;
    inflation_max: string;
    inflation_min: string;
    goal_bonded: string;
    blocks_per_year: string;
  }
}

export class MintAPI extends BaseAPI {
  /**
   * Gets the current minting inflation value
   */
  public async inflation(params: APIParams = {}): Promise<string> {
    return this.c
      .get<{ inflation: string }>(`/cosmos/mint/v1beta1/inflation`, params)
      .then(d => d.inflation);
  }

  /**
   * Gets the current minting annual provisions value
   */
  public async annualProvisions(params: APIParams = {}): Promise<string> {
    return this.c
      .get<{ annual_provisions: string }>(
        `cosmos/mint/v1beta1/annual_provisions`,
        params
      )
      .then(d => d.annual_provisions);
  }

  /**
   * Gets the current minting module's parameters.
   */
  public async parameters(params: APIParams = {}): Promise<MintingParams> {
    return this.c
      .get<{ params: MintingParams.Data }>(
        `/cosmos/mint/v1beta1/params`,
        params
      )
      .then(({ params: d }) => ({
        mint_denom: d.mint_denom,
        inflation_rate_change: d.inflation_rate_change,
        inflation_max: d.inflation_max,
        inflation_min: d.inflation_min,
        goal_bonded: d.goal_bonded,
        blocks_per_year: Number.parseInt(d.blocks_per_year),
      }));
  }
}
