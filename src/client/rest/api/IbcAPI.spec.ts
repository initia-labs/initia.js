import { describe, it, expect } from 'vitest'
import { APIRequester } from '../APIRequester'
import { IbcAPI } from './IbcAPI'
import { Height, IbcClientParams } from '../../../core'

const c = new APIRequester('https://rest.testnet.initia.xyz')
const api = new IbcAPI(c)

describe('IbcClientAPI', () => {
  it('client_states', async () => {
    const res = await api.clientStates()
    expect(res).not.toBeNull()
    expect(res).not.toBeUndefined()
  })

  it('client_state', async () => {
    const res = await api.clientState('07-tendermint-0')
    expect(res).not.toBeNull()
    expect(res).not.toBeUndefined()
  })

  it('client_status', async () => {
    const res = await api.clientStatus('07-tendermint-0')
    expect(res).not.toBeNull()
    expect(res).not.toBeUndefined()
  })

  it('consensus_states', async () => {
    const res = await api.consensusStates('07-tendermint-0')
    expect(res).not.toBeNull()
    expect(res).not.toBeUndefined()
  })

  it('channels', async () => {
    const [res, _] = await api.channels()
    expect(res).not.toBeNull()
    expect(res).not.toBeUndefined()
    expect(res.length).toBeGreaterThan(0)
  })

  it('channels for a connection', async () => {
    const [res, height, _] = await api.connectionChannels('connection-3')
    expect(res).not.toBeNull()
    expect(res).not.toBeUndefined()
    expect(height).not.toBeNull()
    expect(height).toBeInstanceOf(Height)
    expect(res.length).toBeGreaterThan(0)
  })

  it('port', async () => {
    const res = await api.port('channel-0', 'transfer')
    expect(res).not.toBeNull()
    expect(res).not.toBeUndefined()
    expect(res).toHaveProperty('channel')
    expect(res).toHaveProperty('proof')
    expect(res).toHaveProperty('proof_height')
  })

  it('connections', async () => {
    const [res, _] = await api.connections()
    expect(res).not.toBeNull()
    expect(res).not.toBeUndefined()
    expect(res.length).toBeGreaterThan(0)
  })

  it('a connection', async () => {
    const res = await api.connection('connection-0')
    expect(res).not.toBeNull()
    expect(res).not.toBeUndefined()
  })

  it('params', async () => {
    const params = await api.parameters()
    expect(params).toEqual(expect.any(IbcClientParams))
  })
})
