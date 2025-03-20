import { describe, it, expect } from 'vitest'
import { APIRequester } from '../APIRequester'
import { AuctionAPI } from './AuctionAPI'
import { AuctionParams } from '../../../core'

const c = new APIRequester('https://rest.testnet.initia.xyz')
const api = new AuctionAPI(c)

describe('AuctionAPI', () => {
  it('params', async () => {
    const params = await api.parameters()
    expect(params).toEqual(expect.any(AuctionParams))
  })
})
