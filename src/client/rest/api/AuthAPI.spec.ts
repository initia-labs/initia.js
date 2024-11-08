import { APIRequester } from '../APIRequester'
import { AuthAPI } from './AuthAPI'
import { AuthParams, BaseAccount } from '../../../core'
import { MnemonicKey } from '../../../key'

const c = new APIRequester('https://rest.testnet.initia.xyz')
const api = new AuthAPI(c)

describe('AuthAPI', () => {
  describe('accounts', () => {
    it('account exists', async () => {
      const acct = await api.accountInfo(
        'init1hk0asaef9nxvnj7gjwawv0zz0yd7adcysktpqu'
      )

      expect(acct instanceof BaseAccount).toBe(true)
    })

    it('invalid account', async () => {
      await expect(api.accountInfo('1234')).rejects.toThrow()
    })

    it("account doesn't exist (valid but new account)", async () => {
      const mk = new MnemonicKey()
      await expect(api.accountInfo(mk.accAddress)).rejects.toThrow(
        'status code 404'
      )
    })
  })

  describe('parameters', () => {
    it('params', async () => {
      const params = await api.parameters()
      expect(params).toEqual(expect.any(AuthParams))
    })
  })
})
