import { APIRequester } from '../APIRequester'
import { MstakingAPI } from './MstakingAPI'
import { Coins, Duration, ValConsPublicKey } from '../../../core'

const c = new APIRequester('https://rest.devnet.initia.xyz')
const mstaking = new MstakingAPI(c)

describe('MstakingAPI', () => {
  it('parameters', async () => {
    await expect(mstaking.parameters()).resolves.toMatchObject({
      unbonding_time: expect.any(Duration),
      max_validators: expect.any(Number),
      max_entries: expect.any(Number),
      historical_entries: expect.any(Number),
      bond_denoms: expect.any(Array<string>),
      min_voting_power: expect.any(Number),
      min_commission_rate: expect.any(String),
    })
  })

  it('delegations without parameter should throw an error', async () => {
    await expect(mstaking.delegations()).rejects.toThrowError()
  })

  it('unbondingDelegations without parameter should throw an error', async () => {
    await expect(mstaking.unbondingDelegations()).rejects.toThrowError()
  })

  it('validators', async () => {
    const validators = await mstaking.validators().then((v) => v[0])

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
    })
  })

  it('pool', async () => {
    await expect(mstaking.pool()).resolves.toMatchObject({
      bonded_tokens: expect.any(Coins),
      not_bonded_tokens: expect.any(Coins),
    })
  })
})
