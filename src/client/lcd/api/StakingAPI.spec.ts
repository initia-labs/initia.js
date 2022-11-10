import { APIRequester } from '../APIRequester';
import { StakingAPI } from './StakingAPI';
import { Coin } from '../../../core/Coin';
import { ValConsPublicKey, Delegation } from '../../../core';

const c = new APIRequester('https://stone-rest.initia.tech/');
const staking = new StakingAPI(c);

const checkDelegations = (delegations: Delegation[]) => {
  expect(delegations).toContainEqual({
    delegator_address: expect.any(String),
    validator_address: expect.any(String),
    shares: expect.any(String),
    balance: expect.any(Coin),
  });
};

describe('StakingAPI', () => {
  it('parameters', async () => {
    await expect(staking.parameters()).resolves.toMatchObject({
      unbonding_time: expect.any(Number),
      max_validators: expect.any(Number),
      max_entries: expect.any(Number),
      historical_entries: expect.any(Number),
      bond_denom: expect.any(String),
    });
  });

  // it('delegations (delegator & validator)', async () => {
  //   const delegations = await staking
  //     .delegations(
  //       'init1rk6tvacasnnyssfnn00zl7wz43pjnpn7vayqv6',
  //       'initvaloper1vk20anceu6h9s00d27pjlvslz3avetkvnwmr35'
  //     )
  //     .then(v => v[0]);

  //   checkDelegations(delegations);
  // });

  // it('delegations (delegator)', async () => {
  //   const delegations = await staking
  //     .delegations('init1rk6tvacasnnyssfnn00zl7wz43pjnpn7vayqv6')
  //     .then(v => v[0]);

  //   checkDelegations(delegations);
  // });

  // it('delegations (validator)', async () => {
  //   const delegations = await staking
  //     .delegations(
  //       undefined,
  //       'initvaloper1vk20anceu6h9s00d27pjlvslz3avetkvnwmr35' // node0
  //     )
  //     .then(v => v[0]);

  //   checkDelegations(delegations);
  // });

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
      tokens: expect.any(String),
      delegator_shares: expect.any(String),
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
      min_self_delegation: expect.any(String),
    });
  });

  it('pool', async () => {
    await expect(staking.pool()).resolves.toMatchObject({
      bonded_tokens: expect.any(Coin),
      not_bonded_tokens: expect.any(Coin),
    });
  });
});
