import { describe, it, expect } from 'vitest'
import { APIRequester } from '../APIRequester'
import { MarketmapAPI } from './MarketmapAPI'
import { Market, MarketmapParams } from '../../../core'

const c = new APIRequester('https://rest.testnet.initia.xyz')
const api = new MarketmapAPI(c)

describe('MarketmapAPI', () => {
  it('market map', async () => {
    const marketMap = await api.marketMap()
    for (const market of Object.values(marketMap.markets)) {
      expect(market).toEqual(expect.any(Market))
    }
  })

  it('params', async () => {
    const params = await api.parameters()
    expect(params).toEqual(expect.any(MarketmapParams))
  })
})
