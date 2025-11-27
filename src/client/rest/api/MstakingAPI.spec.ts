import { describe, it, expect } from 'vitest'
import { APIRequester } from '../APIRequester'
import { MstakingAPI } from './MstakingAPI'
import { Coins, MstakingParams, ValConsPublicKey } from '../../../core'

const c = new APIRequester('https://rest.testnet.initia.xyz')
const api = new MstakingAPI(c)

describe('MstakingAPI', () => {
  it('delegations without parameter should throw an error', async () => {
    await expect(api.delegations()).rejects.toThrowError()
  })

  it('unbondingDelegations without parameter should throw an error', async () => {
    await expect(api.unbondingDelegations()).rejects.toThrowError()
  })

  it('validators', async () => {
    const validators = await api.validators().then((v) => v[0])

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
    await expect(api.pool()).resolves.toMatchObject({
      bonded_tokens: expect.any(Coins),
      not_bonded_tokens: expect.any(Coins),
      voting_power_weights: expect.any(Coins),
    })
  })

  it('params', async () => {
    const params = await api.parameters()
    expect(params).toEqual(expect.any(MstakingParams))
  })
})
