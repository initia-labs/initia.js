import { BaseAPI } from './BaseAPI'
import { APIParams } from '../APIRequester'
import { CurrencyPair, QuotePrice } from '../../../core'

export interface GetPriceResponse {
  price: QuotePrice
  nonce: number
  decimals: number
  id: number
}

export namespace GetPriceResponse {
  export interface Data {
    price: QuotePrice.Data
    nonce: string
    decimals: string
    id: string
  }
}

export class OracleAPI extends BaseAPI {
  /**
   * Query all the currency pairs the oracle module is tracking price-data for.
   */
  public async currencyPairs(
    params: APIParams = {},
    headers: Record<string, string> = {}
  ): Promise<CurrencyPair[]> {
    return this.c
      .get<{
        currency_pairs: CurrencyPair.Data[]
      }>(`/connect/oracle/v2/get_all_tickers`, params, headers)
      .then((d) => d.currency_pairs.map(CurrencyPair.fromData))
  }

  /**
   * Query the latest quote prices for the given currency pair ids.
   * @param pair the pair that the user wishes to query
   */
  public async prices(
    pairs: CurrencyPair[],
    headers: Record<string, string> = {}
  ): Promise<GetPriceResponse[]> {
    const params = new URLSearchParams()
    for (const pair of pairs) {
      params.append('currency_pair_ids', pair.toString())
    }

    return this.c
      .get<{
        prices: GetPriceResponse.Data[]
      }>(`/connect/oracle/v2/get_prices`, params, headers)
      .then((d) =>
        d.prices.map((p) => ({
          price: QuotePrice.fromData(p.price),
          nonce: Number(p.nonce),
          decimals: Number(p.decimals),
          id: Number(p.id),
        }))
      )
  }

  /**
   * Query the latest quote price for the given currency pair.
   * @param pair the pair that the user wishes to query
   */
  public async price(
    pair: CurrencyPair,
    params: APIParams = {},
    headers: Record<string, string> = {}
  ): Promise<GetPriceResponse> {
    return this.c
      .get<GetPriceResponse.Data>(
        `/connect/oracle/v2/get_price`,
        {
          ...params,
          currency_pair: pair.toString(),
        },
        headers
      )
      .then((d) => ({
        price: QuotePrice.fromData(d.price),
        nonce: Number(d.nonce),
        decimals: Number(d.decimals),
        id: Number(d.id),
      }))
  }
}
