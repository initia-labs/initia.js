import { describe, it, expect } from 'vitest'
import { APIRequester } from '../APIRequester'
import { IbcTransferAPI } from './IbcTransferAPI'
import { DenomTrace, IbcTransferParams } from '../../../core'

const c = new APIRequester('https://rest.testnet.initia.xyz')
const api = new IbcTransferAPI(c)

describe('IbcTransferAPI', () => {
  it('denomTraces', async () => {
    const denomTraces = await api.denomTraces().then((v) => v[0])
    denomTraces.forEach(function (denomTrace: DenomTrace.Data) {
      expect(denomTrace.path).toMatch('transfer/channel-')
      expect(denomTrace.base_denom).not.toBeUndefined()
    })
  })

  it('params', async () => {
    const params = await api.parameters()
    expect(params).toEqual(expect.any(IbcTransferParams))
  })
})
