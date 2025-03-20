import { describe, it, expect } from 'vitest'
import { APIRequester } from '../APIRequester'
import { UpgradeAPI } from './UpgradeAPI'
import { Plan } from '../../../core'

const c = new APIRequester('https://rest.testnet.initia.xyz')
const api = new UpgradeAPI(c)

describe('UpgradeAPI', () => {
  describe('applied_plan', () => {
    it('0 for invalid name', async () => {
      const height = await api.appliedPlan('there_is_no_plan_like_this')
      expect(height).toEqual(0)
    })
  })

  describe('current_plan', () => {
    it('null plan', async () => {
      const plan = await api.currentPlan()
      expect(plan == null || plan instanceof Plan)
    })
  })

  describe('node_versions', () => {
    it('module count', async () => {
      expect(await api.moduleVersions()).toHaveLength(34)
    })
  })
})
