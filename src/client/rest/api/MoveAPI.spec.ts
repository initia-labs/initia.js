import { APIRequester } from '../APIRequester'
import { MoveAPI } from './MoveAPI'
import { Module, MoveParams } from '../../../core'

const c = new APIRequester('https://rest.testnet.initia.xyz')
const api = new MoveAPI(c)

describe('MoveAPI', () => {
  it('modules', async () => {
    const modules = await api.modules('0x1')
    for (const module of modules[0]) {
      expect(module).toEqual(expect.any(Module))
    }
  })

  it('denom&metadata', async () => {
    const metadata = await api.metadata('uinit')
    expect(metadata).toEqual(expect.any(String))
    const denom = await api.denom(metadata)
    expect(denom).toEqual('uinit')
  })

  it('params', async () => {
    const params = await api.parameters()
    expect(params).toEqual(expect.any(MoveParams))
  })
})
