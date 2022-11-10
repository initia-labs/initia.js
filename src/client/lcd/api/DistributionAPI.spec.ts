import { APIRequester } from '../APIRequester';
import { DistributionAPI } from './DistributionAPI';
import { Coins } from '../../../core';

const c = new APIRequester('https://stone-rest.initia.tech/');
const distribution = new DistributionAPI(c);

describe('DistributionAPI', () => {
  it('parameters', async () => {
    await expect(distribution.parameters()).resolves.toMatchObject({
      community_tax: expect.any(String),
      base_proposer_reward: expect.any(String),
      bonus_proposer_reward: expect.any(String),
      withdraw_addr_enabled: expect.any(Boolean),
    });
  });

  it('rewards', async () => {
    await expect(
      distribution.rewards('init1wlvk4e083pd3nddlfe5quy56e68atra3gu9xfs')
    ).resolves.toMatchObject({
      rewards: expect.anything(),
      total: expect.any(Coins),
    });
  });

  it('withdrawAddress', async () => {
    await expect(
      distribution.withdrawAddress(
        'init1wlvk4e083pd3nddlfe5quy56e68atra3gu9xfs'
      )
    ).resolves.toEqual('init1wlvk4e083pd3nddlfe5quy56e68atra3gu9xfs');
  });

  it('communityPool', async () => {
    await expect(distribution.communityPool()).resolves.toEqual(
      expect.any(Coins)
    );
  });
});
