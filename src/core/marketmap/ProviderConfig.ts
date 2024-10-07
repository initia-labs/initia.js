import { JSONSerializable } from '../../util/json'
import { CurrencyPair } from '../oracle'
import { ProviderConfig as ProviderConfig_pb } from '@initia/initia.proto/connect/marketmap/v2/market'

export class ProviderConfig extends JSONSerializable<
  ProviderConfig.Amino,
  ProviderConfig.Data,
  ProviderConfig.Proto
> {
  /**
   * @param name the name of the provider for which the configuration is being set
   * @param off_chain_ticker the off-chain representation of the ticker
   * @param normalize_by_pair the currency pair for this ticker to be normalized by
   * @param invert boolean indicating if the BASE and QUOTE of the market should be inverted
   * @param metadata_JSON the string of JSON that encodes any extra configuration for the given provider config
   */
  constructor(
    public name: string,
    public off_chain_ticker: string,
    public normalize_by_pair: CurrencyPair | undefined,
    public invert: boolean,
    public metadata_JSON: string
  ) {
    super()
  }

  public static fromAmino(data: ProviderConfig.Amino): ProviderConfig {
    const { name, off_chain_ticker, normalize_by_pair, invert, metadata_JSON } =
      data
    return new ProviderConfig(
      name,
      off_chain_ticker,
      normalize_by_pair ? CurrencyPair.fromAmino(normalize_by_pair) : undefined,
      invert,
      metadata_JSON
    )
  }

  public toAmino(): ProviderConfig.Amino {
    const { name, off_chain_ticker, normalize_by_pair, invert, metadata_JSON } =
      this
    return {
      name,
      off_chain_ticker,
      normalize_by_pair: normalize_by_pair?.toAmino(),
      invert,
      metadata_JSON,
    }
  }

  public static fromData(data: ProviderConfig.Data): ProviderConfig {
    const { name, off_chain_ticker, normalize_by_pair, invert, metadata_JSON } =
      data
    return new ProviderConfig(
      name,
      off_chain_ticker,
      normalize_by_pair ? CurrencyPair.fromData(normalize_by_pair) : undefined,
      invert,
      metadata_JSON
    )
  }

  public toData(): ProviderConfig.Data {
    const { name, off_chain_ticker, normalize_by_pair, invert, metadata_JSON } =
      this
    return {
      name,
      off_chain_ticker,
      normalize_by_pair: normalize_by_pair?.toData(),
      invert,
      metadata_JSON,
    }
  }

  public static fromProto(proto: ProviderConfig.Proto): ProviderConfig {
    return new ProviderConfig(
      proto.name,
      proto.offChainTicker,
      proto.normalizeByPair
        ? CurrencyPair.fromProto(proto.normalizeByPair)
        : undefined,
      proto.invert,
      proto.metadataJSON
    )
  }

  public toProto(): ProviderConfig.Proto {
    const { name, off_chain_ticker, normalize_by_pair, invert, metadata_JSON } =
      this
    return ProviderConfig_pb.fromPartial({
      name,
      offChainTicker: off_chain_ticker,
      normalizeByPair: normalize_by_pair?.toProto(),
      invert,
      metadataJSON: metadata_JSON,
    })
  }
}

export namespace ProviderConfig {
  export interface Amino {
    name: string
    off_chain_ticker: string
    normalize_by_pair?: CurrencyPair.Amino
    invert: boolean
    metadata_JSON: string
  }

  export interface Data {
    name: string
    off_chain_ticker: string
    normalize_by_pair?: CurrencyPair.Data
    invert: boolean
    metadata_JSON: string
  }

  export type Proto = ProviderConfig_pb
}
