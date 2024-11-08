import { JSONSerializable } from '../../../util/json'
import { AccAddress } from '../../bech32'
import { MarketmapParams } from '../MarketmapParams'
import { Any } from '@initia/initia.proto/google/protobuf/any'
import { MsgParams as MsgParams_pb } from '@initia/initia.proto/connect/marketmap/v2/tx'

export class MsgUpdateMarketmapParams extends JSONSerializable<
  MsgUpdateMarketmapParams.Amino,
  MsgUpdateMarketmapParams.Data,
  MsgUpdateMarketmapParams.Proto
> {
  /**
   * @param authority the address that controls the module
   * @param params the hook parameters to update
   */
  constructor(
    public authority: AccAddress,
    public params: MarketmapParams
  ) {
    super()
  }

  public static fromAmino(
    data: MsgUpdateMarketmapParams.Amino
  ): MsgUpdateMarketmapParams {
    const {
      value: { authority, params },
    } = data
    return new MsgUpdateMarketmapParams(
      authority,
      MarketmapParams.fromAmino(params)
    )
  }

  public toAmino(): MsgUpdateMarketmapParams.Amino {
    const { authority, params } = this
    return {
      type: 'connect/x/marketmap/MsgParams',
      value: {
        authority,
        params: params.toAmino(),
      },
    }
  }

  public static fromData(
    data: MsgUpdateMarketmapParams.Data
  ): MsgUpdateMarketmapParams {
    const { authority, params } = data
    return new MsgUpdateMarketmapParams(
      authority,
      MarketmapParams.fromData(params)
    )
  }

  public toData(): MsgUpdateMarketmapParams.Data {
    const { authority, params } = this
    return {
      '@type': '/connect.marketmap.v2.MsgParams',
      authority,
      params: params.toData(),
    }
  }

  public static fromProto(
    data: MsgUpdateMarketmapParams.Proto
  ): MsgUpdateMarketmapParams {
    return new MsgUpdateMarketmapParams(
      data.authority,
      MarketmapParams.fromProto(data.params as MarketmapParams.Proto)
    )
  }

  public toProto(): MsgUpdateMarketmapParams.Proto {
    const { authority, params } = this
    return MsgParams_pb.fromPartial({
      authority,
      params: params.toProto(),
    })
  }

  public packAny(): Any {
    return Any.fromPartial({
      typeUrl: '/connect.marketmap.v2.MsgParams',
      value: MsgParams_pb.encode(this.toProto()).finish(),
    })
  }

  public static unpackAny(msgAny: Any): MsgUpdateMarketmapParams {
    return MsgUpdateMarketmapParams.fromProto(MsgParams_pb.decode(msgAny.value))
  }
}

export namespace MsgUpdateMarketmapParams {
  export interface Amino {
    type: 'connect/x/marketmap/MsgParams'
    value: {
      authority: AccAddress
      params: MarketmapParams.Amino
    }
  }

  export interface Data {
    '@type': '/connect.marketmap.v2.MsgParams'
    authority: AccAddress
    params: MarketmapParams.Data
  }

  export type Proto = MsgParams_pb
}
