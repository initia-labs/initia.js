import { describe, it, expect } from 'vitest'
import { APIRequester } from '../APIRequester'
import { RewardAPI } from './RewardAPI'
import { RewardParams } from '../../../core'

const c = new APIRequester('https://rest.testnet.initia.xyz')
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

  it('params', async () => {
    const params = await api.parameters()
    expect(params).toEqual(expect.any(RewardParams))
  })
})
