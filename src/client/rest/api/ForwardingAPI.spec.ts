import { APIRequester } from '../APIRequester'
import { ForwardingAPI } from './ForwardingAPI'

const c = new APIRequester('https://rest.testnet.initia.xyz')
const api = new ForwardingAPI(c)

describe('ForwardingAPI', () => {
  it('denoms', async () => {
    const denoms = await api.denoms()
    for (const denom of denoms[0]) {
      expect(denom).toEqual(expect.any(String))
    }
  })
})
