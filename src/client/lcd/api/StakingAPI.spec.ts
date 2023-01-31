import { APIRequester } from '../APIRequester';
import { StakingAPI } from './StakingAPI';
import { Coins } from '../../../core';
import { ValConsPublicKey, Delegation } from '../../../core';

const c = new APIRequester('https://stone-rest.initia.tech/');
const staking = new StakingAPI(c);

describe('StakingAPI', () => {
  it('parameters', async () => {
    await expect(staking.parameters()).resolves.toMatchObject({
      unbonding_time: expect.any(Number),
      max_validators: expect.any(Number),
      max_entries: expect.any(Number),
      historical_entries: expect.any(Number),
      bond_denoms: expect.any(Array<String>),
      min_voting_power: expect.any(Number),
    });
  });

  it('delegations without parameter should throw an error', async () => {
    await expect(staking.delegations()).rejects.toThrowError();
  });

  it('unbondingDelegations without parameter should throw an error', async () => {
    await expect(staking.unbondingDelegations()).rejects.toThrowError();
  });

  it('validators', async () => {
    const validators = await staking.validators().then(v => v[0]);

    expect(validators).toContainEqual({
      operator_address: expect.any(String),
      consensus_pubkey: expect.any(ValConsPublicKey),
      jailed: expect.any(Boolean),
      status: expect.any(String),
      tokens: expect.any(Coins),
      delegator_shares: expect.any(Coins),
      description: {
        moniker: expect.any(String),
        identity: expect.any(String),
        website: expect.any(String),
        details: expect.any(String),
        security_contact: expect.any(String),
      },
      unbonding_height: expect.any(Number),
      unbonding_time: expect.any(Date),
      commission: {
        commission_rates: {
          rate: expect.any(String),
          max_rate: expect.any(String),
          max_change_rate: expect.any(String),
        },
        update_time: expect.any(Date),
      },
      voting_powers: expect.any(Coins),
      voting_power: expect.any(String),
    });
  });

  it('pool', async () => {
    await expect(staking.pool()).resolves.toMatchObject({
      bonded_tokens: expect.any(Coins),
      not_bonded_tokens: expect.any(Coins),
    });
  });
});
