import { describe, it, expect } from 'vitest'
import { APIRequester } from '../APIRequester'
import { EvidenceAPI } from './EvidenceAPI'
import { Equivocation } from '../../../core'

const c = new APIRequester('https://rest.testnet.initia.xyz')
const api = new EvidenceAPI(c)

describe('EvidenceAPI', () => {
  it('evidences', async () => {
    const evidences = await api.evidences()
    for (const evidence of evidences[0]) {
      expect(evidence).toEqual(expect.any(Equivocation))
    }
  })
})
