import { BaseAPI } from './BaseAPI';
import { CurrencyPrice, IbcQuotePrice } from '../../../core';
import { APIParams, Pagination, PaginationOptions } from '../APIRequester';

export class IbcFetchpriceAPI extends BaseAPI {
  public async prices(
    currencyIds: string[],
    params: APIParams = {}
  ): Promise<CurrencyPrice[]> {
    return this.c
      .get<{
        prices: CurrencyPrice.Data[];
      }>(
        `/ibc/apps/fetchprice/consumer/v1/prices?currency_ids=${currencyIds}`,
        params
      )
      .then(d => d.prices.map(CurrencyPrice.fromData));
  }

  public async price(
    currencyId: string,
    params: APIParams = {}
  ): Promise<IbcQuotePrice> {
    return this.c
      .get<{
        price: IbcQuotePrice.Data;
      }>(
        `/ibc/apps/fetchprice/consumer/v1/prices?currency_id=${currencyId}`,
        params
      )
      .then(d => IbcQuotePrice.fromData(d.price));
  }

  public async allPrices(
    params: Partial<PaginationOptions & APIParams> = {}
  ): Promise<[CurrencyPrice[], Pagination]> {
    return this.c
      .get<{
        prices: CurrencyPrice.Data[];
        pagination: Pagination;
      }>(`/ibc/apps/fetchprice/consumer/v1/prices/all`, params)
      .then(d => [d.prices.map(CurrencyPrice.fromData), d.pagination]);
  }
}
