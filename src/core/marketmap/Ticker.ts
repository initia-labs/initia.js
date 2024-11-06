import { JSONSerializable } from '../../util/json'
import { CurrencyPair } from '../oracle'
import { Ticker as Ticker_pb } from '@initia/initia.proto/connect/marketmap/v2/market'

export class Ticker extends JSONSerializable<
  Ticker.Amino,
  Ticker.Data,
  Ticker.Proto
> {
  /**
   * @param currency_pair the currency pair for this ticker
   * @param decimals the number of decimal places for the ticker
   * @param min_provider_count the minimum number of providers required to consider the ticker valid
   * @param enabled the flag that denotes if the Ticker is enabled for price fetching by an oracle
   * @param metadata_JSON the string of JSON that encodes any extra configuration for the given ticker
   */
  constructor(
    public currency_pair: CurrencyPair,
    public decimals: number,
    public min_provider_count: number,
    public enabled: boolean,
    public metadata_JSON: string
  ) {
    super()
  }

  public static fromAmino(data: Ticker.Amino): Ticker {
    const {
      currency_pair,
      decimals,
      min_provider_count,
      enabled,
      metadata_JSON,
    } = data
    return new Ticker(
      CurrencyPair.fromAmino(currency_pair),
      parseInt(decimals),
      parseInt(min_provider_count),
      enabled,
      metadata_JSON
    )
  }

  public toAmino(): Ticker.Amino {
    const {
      currency_pair,
      decimals,
      min_provider_count,
      enabled,
      metadata_JSON,
    } = this
    return {
      currency_pair: currency_pair.toAmino(),
      decimals: decimals.toFixed(),
      min_provider_count: min_provider_count.toFixed(),
      enabled,
      metadata_JSON,
    }
  }

  public static fromData(data: Ticker.Data): Ticker {
    const {
      currency_pair,
      decimals,
      min_provider_count,
      enabled,
      metadata_JSON,
    } = data
    return new Ticker(
      CurrencyPair.fromData(currency_pair),
      parseInt(decimals),
      parseInt(min_provider_count),
      enabled,
      metadata_JSON
    )
  }

  public toData(): Ticker.Data {
    const {
      currency_pair,
      decimals,
      min_provider_count,
      enabled,
      metadata_JSON,
    } = this
    return {
      currency_pair: currency_pair.toData(),
      decimals: decimals.toFixed(),
      min_provider_count: min_provider_count.toFixed(),
      enabled,
      metadata_JSON,
    }
  }

  public static fromProto(proto: Ticker.Proto): Ticker {
    return new Ticker(
      CurrencyPair.fromProto(proto.currencyPair as CurrencyPair.Proto),
      proto.decimals.toNumber(),
      proto.minProviderCount.toNumber(),
      proto.enabled,
      proto.metadataJSON
    )
  }

  public toProto(): Ticker.Proto {
    const {
      currency_pair,
      decimals,
      min_provider_count,
      enabled,
      metadata_JSON,
    } = this
    return Ticker_pb.fromPartial({
      currencyPair: currency_pair,
      decimals,
      minProviderCount: min_provider_count,
      enabled,
      metadataJSON: metadata_JSON,
    })
  }
}

export namespace Ticker {
  export interface Amino {
    currency_pair: CurrencyPair.Amino
    decimals: string
    min_provider_count: string
    enabled: boolean
    metadata_JSON: string
  }

  export interface Data {
    currency_pair: CurrencyPair.Data
    decimals: string
    min_provider_count: string
    enabled: boolean
    metadata_JSON: string
  }

  export type Proto = Ticker_pb
}
