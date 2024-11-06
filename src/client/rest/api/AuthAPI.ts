import {
  AccAddress,
  Account,
  ModuleAccount,
  BaseAccount,
  AuthParams,
} from '../../../core'
import { BaseAPI } from './BaseAPI'
import { APIParams } from '../APIRequester'

export class AuthAPI extends BaseAPI {
  /**
   * @param address address of account to look up
   */
  public async accountInfo(
    address: AccAddress,
    params: APIParams = {}
  ): Promise<Account> {
    const { account } = await this.c.get<{
      account: BaseAccount.Data | ModuleAccount.Data
    }>(`/cosmos/auth/v1beta1/accounts/${address}`, params)
    return Account.fromData(account)
  }

  public async moduleAccount(
    name: string,
    params: APIParams = {}
  ): Promise<ModuleAccount> {
    const { account } = await this.c.get<{ account: ModuleAccount.Data }>(
      `/cosmos/auth/v1beta1/module_accounts/${name}`,
      params
    )
    return ModuleAccount.fromData(account)
  }

  public async parameters(params: APIParams = {}): Promise<AuthParams> {
    return this.c
      .get<{ params: AuthParams.Data }>(`/cosmos/auth/v1beta1/params`, params)
      .then((d) => AuthParams.fromData(d.params))
  }
}
