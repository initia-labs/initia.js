import { APIRequester } from '../APIRequester'
import { GovAPI } from './GovAPI'
import { Deposit, Proposal, TallyResult, GovParams } from '../../../core'

const c = new APIRequester('https://rest.testnet.initia.xyz')
const api = new GovAPI(c)

describe('GovAPI', () => {
  it('tally', async () => {
    const tally = await api.tally(1)
    expect(tally).toEqual(expect.any(TallyResult))
  })

  it('proposals', async () => {
    const proposals = await api.proposals()
    for (const proposal of proposals[0]) {
      expect(proposal).toEqual(expect.any(Proposal))
    }
  })

  it('deposits', async () => {
    const proposals = await api.proposals().then(v => v[0])
    const proposalId = proposals[0].id
    const deposits = await api.deposits(proposalId).then(v => v[0][0])
    if (deposits !== undefined) {
      expect(deposits).toEqual(expect.any(Deposit))
    }
  })

  it('params', async () => {
    const params = await api.parameters()
    expect(params).toEqual(expect.any(GovParams))
  })  
})
