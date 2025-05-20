import { describe, it, expect } from 'vitest'
import { APIRequester } from '../APIRequester'
import { OracleAPI } from './OracleAPI'
import { CurrencyPair, QuotePrice } from '../../../core'

const c = new APIRequester('https://rest.testnet.initia.xyz')
const api = new OracleAPI(c)

describe('OracleAPI', () => {
  it('currency pairs', async () => {
    const pairs = await api.currencyPairs()
    for (const pair of pairs) {
      expect(pair).toEqual(expect.any(CurrencyPair))
    }
  })

  it('price', async () => {
    const pairs = await api.currencyPairs()
    const price = await api.price(pairs[0])
    expect(price.price).toEqual(expect.any(QuotePrice))
  })
})
