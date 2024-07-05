import { JSONSerializable } from '../../util/json'
import { ProviderConfig } from './ProviderConfig'
import { Ticker } from './Ticker'
import { Market as Market_pb } from '@initia/initia.proto/slinky/marketmap/v1/market'

export class Market extends JSONSerializable<
  Market.Amino,
  Market.Data,
  Market.Proto
> {
  /**
   * @param ticker the price feed for a given asset pair
   * @param provider_configs the list of provider-specific configs for this Market
   */
  constructor(
    public ticker: Ticker,
    public provider_configs: ProviderConfig[]
  ) {
    super()
  }

  public static fromAmino(data: Market.Amino): Market {
    const { ticker, provider_configs } = data
    return new Market(
      Ticker.fromAmino(ticker),
      provider_configs.map(ProviderConfig.fromAmino)
    )
  }

  public toAmino(): Market.Amino {
    const { ticker, provider_configs } = this
    return {
      ticker: ticker.toAmino(),
      provider_configs: provider_configs.map((config) => config.toAmino()),
    }
  }

  public static fromData(data: Market.Data): Market {
    const { ticker, provider_configs } = data
    return new Market(
      Ticker.fromData(ticker),
      provider_configs.map(ProviderConfig.fromData)
    )
  }

  public toData(): Market.Data {
    const { ticker, provider_configs } = this
    return {
      ticker: ticker.toData(),
      provider_configs: provider_configs.map((config) => config.toData()),
    }
  }

  public static fromProto(proto: Market.Proto): Market {
    return new Market(
      Ticker.fromProto(proto.ticker as Ticker.Proto),
      proto.providerConfigs.map(ProviderConfig.fromProto)
    )
  }

  public toProto(): Market.Proto {
    const { ticker, provider_configs } = this
    return Market_pb.fromPartial({
      ticker: ticker.toProto(),
      providerConfigs: provider_configs.map((config) => config.toProto()),
    })
  }
}

export namespace Market {
  export interface Amino {
    ticker: Ticker.Amino
    provider_configs: ProviderConfig.Amino[]
  }

  export interface Data {
    ticker: Ticker.Data
    provider_configs: ProviderConfig.Data[]
  }

  export type Proto = Market_pb
}
