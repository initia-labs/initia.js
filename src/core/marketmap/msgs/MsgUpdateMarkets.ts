import { JSONSerializable } from '../../../util/json'
import { AccAddress } from '../../bech32'
import { Any } from '@initia/initia.proto/google/protobuf/any'
import { MsgUpdateMarkets as MsgUpdateMarkets_pb } from '@initia/initia.proto/connect/marketmap/v2/tx'
import { Market } from '../Market'

/**
 * MsgUpdateMarkets updates markets from the given message.
 */
export class MsgUpdateMarkets extends JSONSerializable<
  MsgUpdateMarkets.Amino,
  MsgUpdateMarkets.Data,
  MsgUpdateMarkets.Proto
> {
  /**
   * @param authority the signer of this transaction
   * @param update_markets the list of all markets to be updated for the given transaction
   */
  constructor(
    public authority: AccAddress,
    public update_markets: Market[]
  ) {
    super()
  }

  public static fromAmino(data: MsgUpdateMarkets.Amino): MsgUpdateMarkets {
    const {
      value: { authority, update_markets },
    } = data
    return new MsgUpdateMarkets(authority, update_markets.map(Market.fromAmino))
  }

  public toAmino(): MsgUpdateMarkets.Amino {
    const { authority, update_markets } = this
    return {
      type: 'connect/x/marketmap/MsgUpdateMarkets',
      value: {
        authority,
        update_markets: update_markets.map((msg) => msg.toAmino()),
      },
    }
  }

  public static fromData(data: MsgUpdateMarkets.Data): MsgUpdateMarkets {
    const { authority, update_markets } = data
    return new MsgUpdateMarkets(authority, update_markets.map(Market.fromData))
  }

  public toData(): MsgUpdateMarkets.Data {
    const { authority, update_markets } = this
    return {
      '@type': '/connect.marketmap.v2.MsgUpdateMarkets',
      authority,
      update_markets: update_markets.map((msg) => msg.toData()),
    }
  }

  public static fromProto(data: MsgUpdateMarkets.Proto): MsgUpdateMarkets {
    return new MsgUpdateMarkets(
      data.authority,
      data.updateMarkets.map(Market.fromProto)
    )
  }

  public toProto(): MsgUpdateMarkets.Proto {
    const { authority, update_markets } = this
    return MsgUpdateMarkets_pb.fromPartial({
      authority,
      updateMarkets: update_markets.map((c) => c.toProto()),
    })
  }

  public packAny(): Any {
    return Any.fromPartial({
      typeUrl: '/connect.marketmap.v2.MsgUpdateMarkets',
      value: MsgUpdateMarkets_pb.encode(this.toProto()).finish(),
    })
  }

  public static unpackAny(msgAny: Any): MsgUpdateMarkets {
    return MsgUpdateMarkets.fromProto(MsgUpdateMarkets_pb.decode(msgAny.value))
  }
}

export namespace MsgUpdateMarkets {
  export interface Amino {
    type: 'connect/x/marketmap/MsgUpdateMarkets'
    value: {
      authority: AccAddress
      update_markets: Market.Amino[]
    }
  }

  export interface Data {
    '@type': '/connect.marketmap.v2.MsgUpdateMarkets'
    authority: AccAddress
    update_markets: Market.Data[]
  }

  export type Proto = MsgUpdateMarkets_pb
}
