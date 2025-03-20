import { describe, it, expect } from 'vitest'
import { APIRequester } from '../APIRequester'
import { BankAPI } from './BankAPI'
import { BankParams } from '../../../core'

const c = new APIRequester('https://rest.testnet.initia.xyz')
const api = new BankAPI(c)

describe('BankAPI', () => {
  describe('balance', () => {
    it('account exists', async () => {
      await api.balance('init1wlvk4e083pd3nddlfe5quy56e68atra3gu9xfs')
    })

    it('invalid account', async () => {
      await expect(api.balance('1234')).rejects.toThrow()
    })
  })

  it('total supply', async () => {
    const totalSupply = await api.total()
    expect(totalSupply[0].toArray().length).toBeGreaterThan(0)
  })

  describe('parameters', () => {
    it('params', async () => {
      const params = await api.parameters()
      expect(params).toEqual(expect.any(BankParams))
    })
  })
})
