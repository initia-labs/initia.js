import { BaseAPI } from './BaseAPI'
import { APIParams } from '../APIRequester'
import { CurrencyPair, QuotePrice } from '../../../core'

export class OracleAPI extends BaseAPI {
  public async currencyPairs(params: APIParams = {}): Promise<CurrencyPair[]> {
    return this.c
      .get<{
        currency_pairs: CurrencyPair.Data[]
      }>(`/slinky/oracle/v1/get_all_tickers`, params)
      .then((d) => d.currency_pairs.map(CurrencyPair.fromData))
  }

  public async price(
    pair: CurrencyPair,
    params: APIParams = {}
  ): Promise<QuotePrice> {
    return this.c
      .get<{ price: QuotePrice.Data }>(`/slinky/oracle/v1/get_price`, {
        ...params,
        'currency_pair.Base': pair.Base,
        'currency_pair.Quote': pair.Quote,
      })
      .then((d) => QuotePrice.fromData(d.price))
  }
}
