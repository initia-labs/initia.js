import { APIRequester } from '../APIRequester'
import { DistributionAPI } from './DistributionAPI'
import { Coins } from '../../../core'

const c = new APIRequester('https://lcd.devnet.initia.xyz/')
const distribution = new DistributionAPI(c)

describe('DistributionAPI', () => {
  it('parameters', async () => {
    await expect(distribution.parameters()).resolves.toMatchObject({
      community_tax: expect.any(String),
      withdraw_addr_enabled: expect.any(Boolean),
      reward_weights: expect.arrayContaining([
        expect.objectContaining({
          denom: expect.any(String),
          weight: expect.any(String),
        }),
      ]),
    })
  })

  it('withdrawAddress', async () => {
    await expect(
      distribution.withdrawAddress(
        'init1wlvk4e083pd3nddlfe5quy56e68atra3gu9xfs'
      )
    ).resolves.toEqual('init1wlvk4e083pd3nddlfe5quy56e68atra3gu9xfs')
  })

  it('communityPool', async () => {
    await expect(distribution.communityPool()).resolves.toEqual(
      expect.any(Coins)
    )
  })
})
