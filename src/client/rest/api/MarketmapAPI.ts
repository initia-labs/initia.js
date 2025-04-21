import { BaseAPI } from './BaseAPI'
import { APIParams } from '../APIRequester'
import { CurrencyPair, Market, MarketmapParams } from '../../../core'

export interface MarketMap {
  markets: Record<string, Market>
}

export namespace MarketMap {
  export interface Data {
    markets: Record<string, Market.Data>
  }
}

export class MarketmapAPI extends BaseAPI {
  /**
   * Query the full market map stored in the marketmap module.
   */
  public async marketMap(
    params: APIParams = {},
    headers: Record<string, string> = {}
  ): Promise<MarketMap> {
    return this.c
      .get<{
        market_map: MarketMap.Data
      }>(`/connect/marketmap/v2/marketmap`, params, headers)
      .then((d) => {
        const markets: Record<string, Market> = {}
        for (const [ticker, market] of Object.entries(d.market_map.markets)) {
          markets[ticker] = Market.fromData(market)
        }
        return { markets }
      })
  }

  /**
   * Query all stored markets in the marketmap module as a sorted list.
   */
  public async markets(
    params: APIParams = {},
    headers: Record<string, string> = {}
  ): Promise<Market[]> {
    return this.c
      .get<{
        markets: Market.Data[]
      }>(`/connect/marketmap/v2/markets`, params, headers)
      .then((d) => d.markets.map(Market.fromData))
  }

  /**
   * Query the market stored in the marketmap module.
   * @param pair the currency pair associated with the market being requested
   */
  public async market(
    pair: CurrencyPair,
    params: APIParams = {},
    headers: Record<string, string> = {}
  ): Promise<Market> {
    return this.c
      .get<{ market: Market.Data }>(
        `/connect/marketmap/v2/market`,
        {
          ...params,
          'currency_pair.Base': pair.Base,
          'currency_pair.Quote': pair.Quote,
        },
        headers
      )
      .then((d) => Market.fromData(d.market))
  }

  /**
   * Query the last height the market map was updated at.
   */
  public async lastUpdated(
    params: APIParams = {},
    headers: Record<string, string> = {}
  ): Promise<number> {
    return this.c
      .get<{
        last_updated: string
      }>(`/connect/marketmap/v2/last_updated`, params, headers)
      .then((d) => parseInt(d.last_updated))
  }

  /**
   * Query the parameters of the marketmap module.
   */
  public async parameters(
    params: APIParams = {},
    headers: Record<string, string> = {}
  ): Promise<MarketmapParams> {
    return this.c
      .get<{
        params: MarketmapParams.Data
      }>(`/connect/marketmap/v2/params`, params, headers)
      .then((d) => MarketmapParams.fromData(d.params))
  }
}
