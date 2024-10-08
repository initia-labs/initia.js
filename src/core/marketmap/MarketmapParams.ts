import { AccAddress } from '../bech32'
import { JSONSerializable } from '../../util/json'
import { Params as Params_pb } from '@initia/initia.proto/connect/marketmap/v2/params'

export class MarketmapParams extends JSONSerializable<
  MarketmapParams.Amino,
  MarketmapParams.Data,
  MarketmapParams.Proto
> {
  /**
   * @param market_authorities the list of authority accounts that are able to control updating the marketmap
   * @param admin the address that can remove addresses from the MarketAuthorities list
   */
  constructor(
    public market_authorities: AccAddress[],
    public admin: AccAddress
  ) {
    super()
  }

  public static fromAmino(data: MarketmapParams.Amino): MarketmapParams {
    return new MarketmapParams(data.market_authorities, data.admin)
  }

  public toAmino(): MarketmapParams.Amino {
    const { market_authorities, admin } = this
    return { market_authorities, admin }
  }

  public static fromData(data: MarketmapParams.Data): MarketmapParams {
    return new MarketmapParams(data.market_authorities, data.admin)
  }

  public toData(): MarketmapParams.Data {
    const { market_authorities, admin } = this
    return { market_authorities, admin }
  }

  public static fromProto(data: MarketmapParams.Proto): MarketmapParams {
    return new MarketmapParams(data.marketAuthorities, data.admin)
  }

  public toProto(): MarketmapParams.Proto {
    const { market_authorities, admin } = this
    return Params_pb.fromPartial({
      marketAuthorities: market_authorities,
      admin,
    })
  }
}

export namespace MarketmapParams {
  export interface Amino {
    market_authorities: AccAddress[]
    admin: AccAddress
  }

  export interface Data {
    market_authorities: AccAddress[]
    admin: AccAddress
  }

  export type Proto = Params_pb
}
