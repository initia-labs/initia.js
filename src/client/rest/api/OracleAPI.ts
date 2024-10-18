import { BaseAPI } from './BaseAPI'
import { APIParams } from '../APIRequester'
import { CurrencyPair, QuotePrice } from '../../../core'

export class OracleAPI extends BaseAPI {
  public async currencyPairs(params: APIParams = {}): Promise<CurrencyPair[]> {
    return this.c
      .get<{
        currency_pairs: CurrencyPair.Data[]
      }>(`/connect/oracle/v2/get_all_tickers`, params)
      .then((d) => d.currency_pairs.map(CurrencyPair.fromData))
  }

  public async price(
    pair: CurrencyPair,
    params: APIParams = {}
  ): Promise<QuotePrice> {
    return this.c
      .get<{ price: QuotePrice.Data }>(`/connect/oracle/v2/get_price`, {
        ...params,
        currency_pair: pair.toString(),
      })
      .then((d) => QuotePrice.fromData(d.price))
  }
}
