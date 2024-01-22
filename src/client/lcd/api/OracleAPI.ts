import { BaseAPI } from './BaseAPI';
import { APIParams } from '../APIRequester';
import { CurrencyPair, QuotePrice } from '../../../core';

export class OracleAPI extends BaseAPI {
  public async currencyPairs(
    params: APIParams = {},
    headers: any = {}
  ): Promise<CurrencyPair[]> {
    return this.c
      .get<{ currency_pairs: CurrencyPair.Data[] }>(
        `/slinky/oracle/v1/get_all_tickers`,
        params,
        headers
      )
      .then(d => d.currency_pairs.map(CurrencyPair.fromData));
  }

  public async price(
    pair: CurrencyPair,
    params: APIParams = {},
    header: any = {}
  ): Promise<QuotePrice> {
    return this.c
      .get<{ price: QuotePrice.Data }>(`/slinky/oracle/v1/get_price`, {
        ...params,
        currency_pair_id: pair.toString(),
        header,
      })
      .then(d => QuotePrice.fromData(d.price));
  }
}
