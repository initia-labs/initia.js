import { describe, it, expect } from 'vitest'
import { APIRequester } from '../APIRequester'
import { DistributionAPI } from './DistributionAPI'
import { Coins, DistributionParams } from '../../../core'

const c = new APIRequester('https://rest.testnet.initia.xyz')
const api = new DistributionAPI(c)

describe('DistributionAPI', () => {
  it('withdrawAddress', async () => {
    await expect(
      api.withdrawAddress(
        'init1wlvk4e083pd3nddlfe5quy56e68atra3gu9xfs'
      )
    ).resolves.toEqual('init1wlvk4e083pd3nddlfe5quy56e68atra3gu9xfs')
  })

  it('communityPool', async () => {
    await expect(api.communityPool()).resolves.toEqual(
      expect.any(Coins)
    )
  })

  it('params', async () => {
    const params = await api.parameters()
    expect(params).toEqual(expect.any(DistributionParams))
  })
})
