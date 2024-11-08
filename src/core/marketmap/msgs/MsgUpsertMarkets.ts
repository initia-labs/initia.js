import { JSONSerializable } from '../../../util/json'
import { AccAddress } from '../../bech32'
import { Any } from '@initia/initia.proto/google/protobuf/any'
import { MsgUpsertMarkets as MsgUpsertMarkets_pb } from '@initia/initia.proto/connect/marketmap/v2/tx'
import { Market } from '../Market'

/**
 * MsgUpsertMarkets wraps both Create / Update markets into a single message.
 * Specifically if a market does not exist it will be created, otherwise it
 * will be updated. The response will be a map between ticker -> updated.
 */
export class MsgUpsertMarkets extends JSONSerializable<
  MsgUpsertMarkets.Amino,
  MsgUpsertMarkets.Data,
  MsgUpsertMarkets.Proto
> {
  /**
   * @param authority the signer of this transaction
   * @param markets the list of all markets to be updated for the given transaction
   */
  constructor(
    public authority: AccAddress,
    public markets: Market[]
  ) {
    super()
  }

  public static fromAmino(data: MsgUpsertMarkets.Amino): MsgUpsertMarkets {
    const {
      value: { authority, markets },
    } = data
    return new MsgUpsertMarkets(authority, markets.map(Market.fromAmino))
  }

  public toAmino(): MsgUpsertMarkets.Amino {
    const { authority, markets } = this
    return {
      type: 'connect/x/marketmap/MsgUpsertMarkets',
      value: {
        authority,
        markets: markets.map((msg) => msg.toAmino()),
      },
    }
  }

  public static fromData(data: MsgUpsertMarkets.Data): MsgUpsertMarkets {
    const { authority, markets } = data
    return new MsgUpsertMarkets(authority, markets.map(Market.fromData))
  }

  public toData(): MsgUpsertMarkets.Data {
    const { authority, markets } = this
    return {
      '@type': '/connect.marketmap.v2.MsgUpsertMarkets',
      authority,
      markets: markets.map((msg) => msg.toData()),
    }
  }

  public static fromProto(data: MsgUpsertMarkets.Proto): MsgUpsertMarkets {
    return new MsgUpsertMarkets(
      data.authority,
      data.markets.map(Market.fromProto)
    )
  }

  public toProto(): MsgUpsertMarkets.Proto {
    const { authority, markets } = this
    return MsgUpsertMarkets_pb.fromPartial({
      authority,
      markets: markets.map((c) => c.toProto()),
    })
  }

  public packAny(): Any {
    return Any.fromPartial({
      typeUrl: '/connect.marketmap.v2.MsgUpsertMarkets',
      value: MsgUpsertMarkets_pb.encode(this.toProto()).finish(),
    })
  }

  public static unpackAny(msgAny: Any): MsgUpsertMarkets {
    return MsgUpsertMarkets.fromProto(MsgUpsertMarkets_pb.decode(msgAny.value))
  }
}

export namespace MsgUpsertMarkets {
  export interface Amino {
    type: 'connect/x/marketmap/MsgUpsertMarkets'
    value: {
      authority: AccAddress
      markets: Market.Amino[]
    }
  }

  export interface Data {
    '@type': '/connect.marketmap.v2.MsgUpsertMarkets'
    authority: AccAddress
    markets: Market.Data[]
  }

  export type Proto = MsgUpsertMarkets_pb
}
