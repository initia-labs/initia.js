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
   * Query the account info.
   * @param address address of account to look up
   */
  public async accountInfo(
    address: AccAddress,
    params: APIParams = {},
    headers: Record<string, string> = {}
  ): Promise<Account> {
    const { account } = await this.c.get<{
      account: BaseAccount.Data | ModuleAccount.Data
    }>(`/cosmos/auth/v1beta1/accounts/${address}`, params, headers)
    return Account.fromData(account)
  }

  /**
   * Query the module account info.
   * @param address name of module account to look up
   */
  public async moduleAccount(
    name: string,
    params: APIParams = {},
    headers: Record<string, string> = {}
  ): Promise<ModuleAccount> {
    const { account } = await this.c.get<{ account: ModuleAccount.Data }>(
      `/cosmos/auth/v1beta1/module_accounts/${name}`,
      params,
      headers
    )
    return ModuleAccount.fromData(account)
  }

  /**
   * Query the parameters of the auth module.
   */
  public async parameters(
    params: APIParams = {},
    headers: Record<string, string> = {}
  ): Promise<AuthParams> {
    return this.c
      .get<{
        params: AuthParams.Data
      }>(`/cosmos/auth/v1beta1/params`, params, headers)
      .then((d) => AuthParams.fromData(d.params))
  }
}
