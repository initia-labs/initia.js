import { BaseAPI } from './BaseAPI'
import { Coins, Coin, AccAddress, BankParams, Denom } from '../../../core'
import { APIParams, Pagination, PaginationOptions } from '../APIRequester'

export class BankAPI extends BaseAPI {
  /**
   * Query the balance of an account by its address.
   * @param address address of account to look up
   */
  public async balance(
    address: AccAddress,
    params: Partial<PaginationOptions & APIParams> = {}
  ): Promise<[Coins, Pagination]> {
    return this.c
      .get<{
        balances: Coins.Data
        pagination: Pagination
      }>(`/cosmos/bank/v1beta1/balances/${address}`, params)
      .then((d) => [Coins.fromData(d.balances), d.pagination])
  }

  /**
   * Query the balance of an account by its address and denom.
   * @param address address of account to look up
   * @param denom coin denom to look up
   */
  public async balanceByDenom(
    address: AccAddress,
    denom: Denom,
    params: APIParams = {}
  ): Promise<Coin> {
    return this.c
      .get<{
        balance: Coin.Data
      }>(`/cosmos/bank/v1beta1/balances/${address}/by_denom`, {
        ...params,
        denom,
      })
      .then((d) => Coin.fromData(d.balance))
  }

  /**
   * Query the total supply of tokens in circulation for all denominations.
   */
  public async total(
    params: Partial<PaginationOptions & APIParams> = {}
  ): Promise<[Coins, Pagination]> {
    return this.c
      .get<{
        supply: Coins.Data
        pagination: Pagination
      }>(`/cosmos/bank/v1beta1/supply`, params)
      .then((d) => [Coins.fromData(d.supply), d.pagination])
  }

  /**
   * Query the spenable balance of all coins for a single account.
   * @param address address of account to look up
   */
  public async spendableBalances(
    address: AccAddress,
    params: Partial<PaginationOptions & APIParams> = {}
  ): Promise<[Coins, Pagination]> {
    return this.c
      .get<{
        balances: Coins.Data
        pagination: Pagination
      }>(`/cosmos/bank/v1beta1/spendable_balances/${address}`, params)
      .then((d) => [Coins.fromData(d.balances), d.pagination])
  }

  /**
   * Query the parameters of the bank module.
   */
  public async parameters(params: APIParams = {}): Promise<BankParams> {
    return this.c
      .get<{ params: BankParams.Data }>(`/cosmos/bank/v1beta1/params`, params)
      .then((d) => BankParams.fromData(d.params))
  }
}
