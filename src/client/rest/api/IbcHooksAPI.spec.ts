import { describe, it, expect } from 'vitest'
import { APIRequester } from '../APIRequester'
import { IbcHooksAPI } from './IbcHooksAPI'
import { ACL, IbcHooksParams } from '../../../core'

const c = new APIRequester('https://rest.testnet.initia.xyz')
const api = new IbcHooksAPI(c)

describe('IbcHooksAPI', () => {
  it('acls', async () => {
    const acls = await api.acls()
    for (const acl of acls[0]) {
      expect(acl).toEqual(expect.any(ACL))
    }
  })

  it('params', async () => {
    const params = await api.parameters()
    expect(params).toEqual(expect.any(IbcHooksParams))
  })
})
