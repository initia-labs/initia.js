import { describe, it, expect } from 'vitest'
import { APIRequester } from '../APIRequester'
import { GroupAPI } from './GroupAPI'
import { GroupInfo } from '../../../core'

const c = new APIRequester('https://rest.testnet.initia.xyz')
const api = new GroupAPI(c)

describe('GroupAPI', () => {
  it('groups', async () => {
    const groups = await api.groups()
    for (const group of groups[0]) {
      expect(group).toEqual(expect.any(GroupInfo))
    }
  })
})
