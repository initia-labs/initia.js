import { APIRequester } from '../APIRequester';
import { RewardAPI } from './RewardAPI';

const c = new APIRequester('https://stone-rest.initia.tech/');
const api = new RewardAPI(c);

describe('RewardAPI', () => {
  it('annual provisions', async () => {
    await expect(api.annualProvisions()).resolves.toEqual(expect.any(String));
  });

  it('parameters', async () => {
    await expect(api.parameters()).resolves.toMatchObject({
      reward_denom: expect.any(String),
      dilution_period: expect.any(String),
      release_rate: expect.any(String),
      dilution_rate: expect.any(String),
    });
  });
});
