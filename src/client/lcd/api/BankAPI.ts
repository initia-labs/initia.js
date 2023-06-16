import { BaseAPI } from './BaseAPI';
import { Coins, AccAddress, BankParams } from '../../../core';
import { APIParams, Pagination, PaginationOptions } from '../APIRequester';

export interface SendEnabled {
  denom: string;
  enabled: boolean;
}

export namespace SendEnabled {
  export interface Data {
    denom: string;
    enabled: boolean;
  }
}

export class BankAPI extends BaseAPI {
  /**
   * Look up the balance of an account by its address.
   * @param address address of account to look up.
   */
  public async balance(
    address: AccAddress,
    params: Partial<PaginationOptions & APIParams> = {}
  ): Promise<[Coins, Pagination]> {
    return this.c
      .get<{
        balances: Coins.Data;
        pagination: Pagination;
      }>(`/cosmos/bank/v1beta1/balances/${address}`, params)
      .then(d => [Coins.fromData(d.balances), d.pagination]);
  }

  /**
   * Get the total supply of tokens in circulation for all denominations.
   */
  public async total(
    params: Partial<PaginationOptions & APIParams> = {}
  ): Promise<[Coins, Pagination]> {
    return this.c
      .get<{ supply: Coins.Data; pagination: Pagination }>(
        `/cosmos/bank/v1beta1/supply`,
        params
      )
      .then(d => [Coins.fromData(d.supply), d.pagination]);
  }

  /**
   * Lqueries the spenable balance of all coins for a single account.
   * @param address address of account to look up.
   */
  public async spendableBalances(
    address: AccAddress,
    params: Partial<PaginationOptions & APIParams> = {}
  ): Promise<[Coins, Pagination]> {
    return this.c
      .get<{
        balances: Coins.Data;
        pagination: Pagination;
      }>(`/cosmos/bank/v1beta1/spendable_balances/${address}`, params)
      .then(d => [Coins.fromData(d.balances), d.pagination]);
  }

  public async parameters(params: APIParams = {}): Promise<BankParams> {
    return this.c
      .get<{ params: BankParams.Data }>(`/cosmos/bank/v1beta1/params`, params)
      .then(({ params: d }) => BankParams.fromData(d));
  }
}
