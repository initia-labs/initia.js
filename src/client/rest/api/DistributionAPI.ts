import { BaseAPI } from './BaseAPI'
import {
  Coins,
  AccAddress,
  ValAddress,
  DistributionParams,
} from '../../../core'
import { APIParams } from '../APIRequester'

export interface Pool {
  denom: string
  coins: Coins
}

export namespace Pool {
  export interface Data {
    denom: string
    dec_coins: Coins.Data
  }
}

/**
 * Holds the response of delegator rewards query.
 */
export interface Rewards {
  /**
   * An object that maps validator addresses to corresponding rewards earned with that validator
   */
  rewards: Record<string, Pool[]>

  /**
   * Total cumulative rewards across delegations with all validators
   */
  total: Pool[]
}

export namespace Rewards {
  export interface Data {
    rewards: {
      validator_address: ValAddress
      reward: Pool.Data[]
    }[]
    total: Pool.Data[]
  }
}

export class DistributionAPI extends BaseAPI {
  /**
   * Query a delegator's rewards.
   * @param delegator delegator's account address
   */
  public async rewards(
    delegator: AccAddress,
    params: APIParams = {},
    headers: Record<string, string> = {}
  ): Promise<Rewards> {
    const rewardsData = await this.c.get<Rewards.Data>(
      `/initia/distribution/v1/delegators/${delegator}/rewards`,
      params,
      headers
    )

    const rewards: Rewards['rewards'] = {}
    for (const reward of rewardsData.rewards) {
      rewards[reward.validator_address] = reward.reward.map((pool) => ({
        denom: pool.denom,
        coins: Coins.fromData(pool.dec_coins),
      }))
    }
    return {
      rewards,
      total: rewardsData.total.map((pool) => ({
        denom: pool.denom,
        coins: Coins.fromData(pool.dec_coins),
      })),
    }
  }

  /**
   * Query a delegator's rewards by validator.
   * @param delegator delegator's account address
   * @param validator validator's account address
   */
  public async rewardsByValidator(
    delegator: AccAddress,
    validator: AccAddress,
    params: APIParams = {},
    headers: Record<string, string> = {}
  ): Promise<Pool[]> {
    return this.c
      .get<{
        rewards: Pool.Data[]
      }>(
        `/initia/distribution/v1/delegators/${delegator}/rewards/${validator}`,
        params,
        headers
      )
      .then((d) =>
        d.rewards.map((pool) => ({
          denom: pool.denom,
          coins: Coins.fromData(pool.dec_coins),
        }))
      )
  }

  /**
   * Query a validator's rewards.
   * @param validator validator's account address
   */
  public async validatorRewards(
    validator: AccAddress,
    params: APIParams = {},
    headers: Record<string, string> = {}
  ): Promise<Pool[]> {
    return this.c
      .get<{
        rewards: { rewards: Pool.Data[] }
      }>(
        `/initia/distribution/v1/validators/${validator}/outstanding_rewards`,
        params,
        headers
      )
      .then((d) =>
        d.rewards.rewards.map((pool) => ({
          denom: pool.denom,
          coins: Coins.fromData(pool.dec_coins),
        }))
      )
  }

  /**
   * Query a validator's commissions.
   * @param validator validator's operator address
   */
  public async validatorCommission(
    validator: ValAddress,
    params: APIParams = {},
    headers: Record<string, string> = {}
  ): Promise<Pool[]> {
    return this.c
      .get<{
        commission: {
          commissions: Pool.Data[]
        }
      }>(
        `/initia/distribution/v1/validators/${validator}/commission`,
        params,
        headers
      )
      .then((d) =>
        d.commission.commissions.map((pool) => ({
          denom: pool.denom,
          coins: Coins.fromData(pool.dec_coins),
        }))
      )
  }

  /**
   * Query the withdraw address of a delegator, the address to which rewards are withdrawn.
   * @param delegator delegator's account address
   */
  public async withdrawAddress(
    delegator: AccAddress,
    params: APIParams = {},
    headers: Record<string, string> = {}
  ): Promise<AccAddress> {
    return this.c
      .get<{
        withdraw_address: AccAddress
      }>(
        `/cosmos/distribution/v1beta1/delegators/${delegator}/withdraw_address`,
        params,
        headers
      )
      .then((d) => d.withdraw_address)
  }

  /**
   * Query the current value of the community pool.
   */
  public async communityPool(
    params: APIParams = {},
    headers: Record<string, string> = {}
  ): Promise<Coins> {
    return this.c
      .get<{
        pool: Coins.Data
      }>(`/cosmos/distribution/v1beta1/community_pool`, params, headers)
      .then((d) => Coins.fromData(d.pool))
  }

  /**
   * Query the parameters of the distribution module.
   */
  public async parameters(
    params: APIParams = {},
    headers: Record<string, string> = {}
  ): Promise<DistributionParams> {
    return this.c
      .get<{
        params: DistributionParams.Data
      }>(`/initia/distribution/v1/params`, params, headers)
      .then((d) => DistributionParams.fromData(d.params))
  }
}
