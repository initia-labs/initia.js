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
  public async marketMap(params: APIParams = {}): Promise<MarketMap> {
    return this.c
      .get<{
        market_map: MarketMap.Data
      }>(`/connect/marketmap/v2/marketmap`, params)
      .then((d) => {
        const markets: Record<string, Market> = {}
        for (const [ticker, market] of Object.entries(d.market_map.markets)) {
          markets[ticker] = Market.fromData(market)
        }
        return { markets }
      })
  }

  public async market(
    pair: CurrencyPair,
    params: APIParams = {}
  ): Promise<Market> {
    return this.c
      .get<{ market: Market.Data }>(`/connect/marketmap/v2/market`, {
        ...params,
        'currency_pair.Base': pair.Base,
        'currency_pair.Quote': pair.Quote,
      })
      .then((d) => Market.fromData(d.market))
  }

  public async lastUpdated(params: APIParams = {}): Promise<number> {
    return this.c
      .get<{
        last_updated: string
      }>(`/connect/marketmap/v2/last_updated`, params)
      .then((d) => Number.parseInt(d.last_updated))
  }

  public async parameters(params: APIParams = {}): Promise<MarketmapParams> {
    return this.c
      .get<{
        params: MarketmapParams.Data
      }>(`/connect/marketmap/v2/params`, params)
      .then((d) => MarketmapParams.fromData(d.params))
  }
}
