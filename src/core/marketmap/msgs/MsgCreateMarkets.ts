import { JSONSerializable } from '../../../util/json'
import { AccAddress } from '../../bech32'
import { Any } from '@initia/initia.proto/google/protobuf/any'
import { MsgCreateMarkets as MsgCreateMarkets_pb } from '@initia/initia.proto/connect/marketmap/v2/tx'
import { Market } from '../Market'

export class MsgCreateMarkets extends JSONSerializable<
  MsgCreateMarkets.Amino,
  MsgCreateMarkets.Data,
  MsgCreateMarkets.Proto
> {
  /**
   * @param authority the signer of this transaction
   * @param create_markets the list of all markets to be created for the given transaction
   */
  constructor(
    public authority: AccAddress,
    public create_markets: Market[]
  ) {
    super()
  }

  public static fromAmino(data: MsgCreateMarkets.Amino): MsgCreateMarkets {
    const {
      value: { authority, create_markets },
    } = data
    return new MsgCreateMarkets(authority, create_markets.map(Market.fromAmino))
  }

  public toAmino(): MsgCreateMarkets.Amino {
    const { authority, create_markets } = this
    return {
      type: 'connect/x/marketmap/MsgCreateMarkets',
      value: {
        authority,
        create_markets: create_markets.map((msg) => msg.toAmino()),
      },
    }
  }

  public static fromData(data: MsgCreateMarkets.Data): MsgCreateMarkets {
    const { authority, create_markets } = data
    return new MsgCreateMarkets(authority, create_markets.map(Market.fromData))
  }

  public toData(): MsgCreateMarkets.Data {
    const { authority, create_markets } = this
    return {
      '@type': '/connect.marketmap.v2.MsgCreateMarkets',
      authority,
      create_markets: create_markets.map((msg) => msg.toData()),
    }
  }

  public static fromProto(data: MsgCreateMarkets.Proto): MsgCreateMarkets {
    return new MsgCreateMarkets(
      data.authority,
      data.createMarkets.map(Market.fromProto)
    )
  }

  public toProto(): MsgCreateMarkets.Proto {
    const { authority, create_markets } = this
    return MsgCreateMarkets_pb.fromPartial({
      authority,
      createMarkets: create_markets.map((c) => c.toProto()),
    })
  }

  public packAny(): Any {
    return Any.fromPartial({
      typeUrl: '/connect.marketmap.v2.MsgCreateMarkets',
      value: MsgCreateMarkets_pb.encode(this.toProto()).finish(),
    })
  }

  public static unpackAny(msgAny: Any): MsgCreateMarkets {
    return MsgCreateMarkets.fromProto(MsgCreateMarkets_pb.decode(msgAny.value))
  }
}

export namespace MsgCreateMarkets {
  export interface Amino {
    type: 'connect/x/marketmap/MsgCreateMarkets'
    value: {
      authority: AccAddress
      create_markets: Market.Amino[]
    }
  }

  export interface Data {
    '@type': '/connect.marketmap.v2.MsgCreateMarkets'
    authority: AccAddress
    create_markets: Market.Data[]
  }

  export type Proto = MsgCreateMarkets_pb
}
