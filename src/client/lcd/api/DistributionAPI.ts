import { BaseAPI } from './BaseAPI';
import { Coins, AccAddress, ValAddress } from '../../../core';
import { APIParams } from '../APIRequester';

export interface DistributionParams {
  /**
   * Community tax rate.
   */
  community_tax: string;

  /**
   * Base reward for proposer of block.
   */
  base_proposer_reward: string;

  /**
   * Bonus reward for proposer of block.
   */
  bonus_proposer_reward: string;

  /**
   * Whether withdrawals are currently enabled.
   */
  withdraw_addr_enabled: boolean;
}

export namespace DistributionParams {
  export interface Data {
    community_tax: string;
    base_proposer_reward: string;
    bonus_proposer_reward: string;
    withdraw_addr_enabled: boolean;
  }
}

export interface Pool {
  denom: string;
  coins: Coins;
}

export namespace Pool {
  export interface Data {
    denom: string;
    dec_coins: Coins.Data;
  }
}

/**
 * Holds the response of delegator rewards query
 */
export interface Rewards {
  /**
   * An object that maps validator addresses to corresponding rewards earned with that validator
   */
  rewards: {
    [validator: string]: Pool[];
  };

  /**
   * Total cumulative rewards across delegations with all validators
   */
  total: Pool[];
}

export namespace Rewards {
  export interface Data {
    rewards: {
      validator_address: ValAddress;
      reward: Pool.Data[];
    }[];
    total: Pool.Data[];
  }
}

export class DistributionAPI extends BaseAPI {
  /**
   * Gets a delegator's rewards.
   * @param delegator delegator's account address
   */
  public async rewards(
    delegator: AccAddress,
    params: APIParams = {}
  ): Promise<Rewards> {
    const rewardsData = await this.c.get<Rewards.Data>(
      `/initia/distribution/v1/delegators/${delegator}/rewards`,
      params
    );

    const rewards: Rewards['rewards'] = {};
    for (const reward of rewardsData.rewards) {
      rewards[reward.validator_address] = reward.reward.map(pool => ({
        denom: pool.denom,
        coins: Coins.fromData(pool.dec_coins),
      }));
    }
    return {
      rewards,
      total: rewardsData.total.map(pool => ({
        denom: pool.denom,
        coins: Coins.fromData(pool.dec_coins),
      })),
    };
  }

  /**
   * Gets a delegator's rewards by validator.
   * @param delegator delegator's account address
   * @param validator validator's account address
   */
  public async rewardsByValidator(
    delegator: AccAddress,
    validator: AccAddress,
    params: APIParams = {}
  ): Promise<Pool[]> {
    return this.c
      .get<{ rewards: Pool.Data[] }>(
        `/initia/distribution/v1/delegators/${delegator}/rewards/${validator}`,
        params
      )
      .then(d =>
        d.rewards.map(pool => ({
          denom: pool.denom,
          coins: Coins.fromData(pool.dec_coins),
        }))
      );
  }

  /**
   * Gets a delegator's rewards by validator.
   * @param delegator delegator's account address
   * @param validator validator's account address
   */
  public async validatorRewards(
    validator: AccAddress,
    params: APIParams = {}
  ): Promise<Pool[]> {
    return this.c
      .get<{
        rewards: { rewards: Pool.Data[] };
      }>(
        `/initia/distribution/v1/validators/${validator}/outstanding_rewards`,
        params
      )
      .then(d =>
        d.rewards.rewards.map(pool => ({
          denom: pool.denom,
          coins: Coins.fromData(pool.dec_coins),
        }))
      );
  }

  /**
   * Gets a validator's rewards.
   * @param validator validator's operator address
   */
  public async validatorCommission(
    validator: ValAddress,
    params: APIParams = {}
  ): Promise<Pool[]> {
    return this.c
      .get<{
        commission: {
          commissions: Pool.Data[];
        };
      }>(`/initia/distribution/v1/validators/${validator}/commission`, params)
      .then(d =>
        d.commission.commissions.map(pool => ({
          denom: pool.denom,
          coins: Coins.fromData(pool.dec_coins),
        }))
      );
  }

  /**
   * Gets the withdraw address of a delegator, the address to which rewards are withdrawn.
   * @param delegator
   */
  public async withdrawAddress(
    delegator: AccAddress,
    params: APIParams = {}
  ): Promise<AccAddress> {
    return this.c
      .get<{ withdraw_address: AccAddress }>(
        `/cosmos/distribution/v1beta1/delegators/${delegator}/withdraw_address`,
        params
      )
      .then(d => d.withdraw_address);
  }

  /**
   * Gets the current value of the community pool.
   */
  public async communityPool(params: APIParams = {}): Promise<Coins> {
    return this.c
      .get<{ pool: Coins.Data }>(
        `/cosmos/distribution/v1beta1/community_pool`,
        params
      )
      .then(d => Coins.fromData(d.pool));
  }

  /**
   * Gets the current distribution parameters.
   */
  public async parameters(params: APIParams = {}): Promise<DistributionParams> {
    return this.c
      .get<{ params: DistributionParams.Data }>(
        `/cosmos/distribution/v1beta1/params`,
        params
      )
      .then(({ params: d }) => ({
        base_proposer_reward: d.base_proposer_reward,
        community_tax: d.community_tax,
        bonus_proposer_reward: d.bonus_proposer_reward,
        withdraw_addr_enabled: d.withdraw_addr_enabled,
      }));
  }
}
