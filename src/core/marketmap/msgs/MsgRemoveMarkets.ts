import { JSONSerializable } from '../../../util/json'
import { AccAddress } from '../../bech32'
import { Any } from '@initia/initia.proto/google/protobuf/any'
import { MsgRemoveMarkets as MsgRemoveMarkets_pb } from '@initia/initia.proto/connect/marketmap/v2/tx'
import { Market } from '../Market'

/**
 * MsgRemoveMarkets removes the given markets from the marketmap if they exist in the map and if they are disabled.
 */
export class MsgRemoveMarkets extends JSONSerializable<
  MsgRemoveMarkets.Amino,
  MsgRemoveMarkets.Data,
  MsgRemoveMarkets.Proto
> {
  /**
   * @param authority the signer of this transaction
   * @param markets the list of markets to remove
   */
  constructor(
    public authority: AccAddress,
    public markets: string[]
  ) {
    super()
  }

  public static fromAmino(data: MsgRemoveMarkets.Amino): MsgRemoveMarkets {
    const {
      value: { authority, markets },
    } = data
    return new MsgRemoveMarkets(authority, markets)
  }

  public toAmino(): MsgRemoveMarkets.Amino {
    const { authority, markets } = this
    return {
      type: 'connect/x/marketmap/MsgRemoveMarkets',
      value: {
        authority,
        markets,
      },
    }
  }

  public static fromData(data: MsgRemoveMarkets.Data): MsgRemoveMarkets {
    const { authority, markets } = data
    return new MsgRemoveMarkets(authority, markets)
  }

  public toData(): MsgRemoveMarkets.Data {
    const { authority, markets } = this
    return {
      '@type': '/connect.marketmap.v2.MsgRemoveMarkets',
      authority,
      markets,
    }
  }

  public static fromProto(data: MsgRemoveMarkets.Proto): MsgRemoveMarkets {
    return new MsgRemoveMarkets(
      data.authority,
      data.markets
    )
  }

  public toProto(): MsgRemoveMarkets.Proto {
    const { authority, markets } = this
    return MsgRemoveMarkets_pb.fromPartial({
      authority,
      markets,
    })
  }

  public packAny(): Any {
    return Any.fromPartial({
      typeUrl: '/connect.marketmap.v2.MsgRemoveMarkets',
      value: MsgRemoveMarkets_pb.encode(this.toProto()).finish(),
    })
  }

  public static unpackAny(msgAny: Any): MsgRemoveMarkets {
    return MsgRemoveMarkets.fromProto(MsgRemoveMarkets_pb.decode(msgAny.value))
  }
}

export namespace MsgRemoveMarkets {
  export interface Amino {
    type: 'connect/x/marketmap/MsgRemoveMarkets'
    value: {
      authority: AccAddress
      markets: string[]
    }
  }

  export interface Data {
    '@type': '/connect.marketmap.v2.MsgRemoveMarkets'
    authority: AccAddress
    markets: string[]
  }

  export type Proto = MsgRemoveMarkets_pb
}
