import { describe, it, expect } from 'vitest'
import { APIRequester } from '../APIRequester'
import { IbcNftAPI } from './IbcNftAPI'
import { IbcNftParams, NftClassTrace } from '../../../core'

const c = new APIRequester('https://rest.testnet.initia.xyz')
const api = new IbcNftAPI(c)

describe('IbcNftAPI', () => {
  it('class traces', async () => {
    const traces = await api.classTraces()
    for (const trace of traces[0]) {
      expect(trace).toEqual(expect.any(NftClassTrace))
    }
  })

  it('params', async () => {
    const params = await api.parameters()
    expect(params).toEqual(expect.any(IbcNftParams))
  })
})
