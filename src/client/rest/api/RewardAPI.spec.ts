import { Duration } from '../../../core'
import { APIRequester } from '../APIRequester'
import { RewardAPI } from './RewardAPI'

const c = new APIRequester('https://rest.devnet.initia.xyz/')
const api = new RewardAPI(c)

describe('RewardAPI', () => {
  it('last_dilution_timestamp', async () => {
    await expect(api.last_dilution_timestamp()).resolves.toEqual(
      expect.any(String)
    )
  })

  it('annual provisions', async () => {
    await expect(api.annualProvisions()).resolves.toEqual(expect.any(String))
  })

  it('parameters', async () => {
    await expect(api.parameters()).resolves.toMatchObject({
      reward_denom: expect.any(String),
      dilution_period: expect.any(Duration),
      release_rate: expect.any(String),
      dilution_rate: expect.any(String),
      release_enabled: expect.any(Boolean),
    })
  })
})
