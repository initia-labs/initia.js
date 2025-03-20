import { describe, it, expect } from 'vitest'
import { APIRequester } from '../APIRequester'
import { SlashingAPI } from './SlashingAPI'
import { SlashingParams, ValidatorSigningInfo } from '../../../core'

const c = new APIRequester('https://rest.testnet.initia.xyz')
const api = new SlashingAPI(c)

describe('SlashingAPI', () => {
  it('signing infos', async () => {
    const infos = await api.signingInfos()
    for (const info of infos[0]) {
      expect(info).toEqual(expect.any(ValidatorSigningInfo))
    }
  })

  it('params', async () => {
    const params = await api.parameters()
    expect(params).toEqual(expect.any(SlashingParams))
  })
})
