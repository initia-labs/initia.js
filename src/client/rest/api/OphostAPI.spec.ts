import { describe, it, expect } from 'vitest'
import { APIRequester } from '../APIRequester'
import { OphostAPI } from './OphostAPI'
import { BridgeInfo, OphostParams } from '../../../core'

const c = new APIRequester('https://rest.testnet.initia.xyz')
const api = new OphostAPI(c)

describe('OphostAPI', () => {
  it('bridge infos', async () => {
    const bridgeInfos = await api.bridgeInfos()
    for (const info of bridgeInfos[0]) {
      expect(info).toEqual(expect.any(BridgeInfo))
    }
  })

  it('params', async () => {
    const params = await api.parameters()
    expect(params).toEqual(expect.any(OphostParams))
  })
})
