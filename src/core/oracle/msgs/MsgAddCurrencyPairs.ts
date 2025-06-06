import { JSONSerializable } from '../../../util/json'
import { AccAddress } from '../../bech32'
import { Any } from '@initia/initia.proto/google/protobuf/any'
import { MsgAddCurrencyPairs as MsgAddCurrencyPairs_pb } from '@initia/initia.proto/connect/oracle/v2/tx'
import { CurrencyPair } from '../CurrencyPair'

/**
 * MsgAddCurrencyPairs will be used only by governance to update the set of
 * available CurrencyPairs. Given a set of CurrencyPair objects, update
 * the available currency pairs in the module.
 */
export class MsgAddCurrencyPairs extends JSONSerializable<
  MsgAddCurrencyPairs.Amino,
  MsgAddCurrencyPairs.Data,
  MsgAddCurrencyPairs.Proto
> {
  /**
   * @param authority
   * @param currency_pairs set of CurrencyPairs to be added to the module
   */
  constructor(
    public authority: AccAddress,
    public currency_pairs: CurrencyPair[]
  ) {
    super()
  }

  public static fromAmino(
    data: MsgAddCurrencyPairs.Amino
  ): MsgAddCurrencyPairs {
    const {
      value: { authority, currency_pairs },
    } = data
    return new MsgAddCurrencyPairs(
      authority,
      currency_pairs.map(CurrencyPair.fromAmino)
    )
  }

  public toAmino(): MsgAddCurrencyPairs.Amino {
    const { authority, currency_pairs } = this
    return {
      type: 'connect/x/oracle/MsgAddCurrencyPairs',
      value: {
        authority,
        currency_pairs: currency_pairs.map((msg) => msg.toAmino()),
      },
    }
  }

  public static fromData(data: MsgAddCurrencyPairs.Data): MsgAddCurrencyPairs {
    const { authority, currency_pairs } = data
    return new MsgAddCurrencyPairs(
      authority,
      currency_pairs.map(CurrencyPair.fromData)
    )
  }

  public toData(): MsgAddCurrencyPairs.Data {
    const { authority, currency_pairs } = this
    return {
      '@type': '/connect.oracle.v2.MsgAddCurrencyPairs',
      authority,
      currency_pairs: currency_pairs.map((msg) => msg.toData()),
    }
  }

  public static fromProto(
    data: MsgAddCurrencyPairs.Proto
  ): MsgAddCurrencyPairs {
    return new MsgAddCurrencyPairs(
      data.authority,
      data.currencyPairs.map(CurrencyPair.fromProto)
    )
  }

  public toProto(): MsgAddCurrencyPairs.Proto {
    const { authority, currency_pairs } = this
    return MsgAddCurrencyPairs_pb.fromPartial({
      authority,
      currencyPairs: currency_pairs.map((c) => c.toProto()),
    })
  }

  public packAny(): Any {
    return Any.fromPartial({
      typeUrl: '/connect.oracle.v2.MsgAddCurrencyPairs',
      value: MsgAddCurrencyPairs_pb.encode(this.toProto()).finish(),
    })
  }

  public static unpackAny(msgAny: Any): MsgAddCurrencyPairs {
    return MsgAddCurrencyPairs.fromProto(
      MsgAddCurrencyPairs_pb.decode(msgAny.value)
    )
  }
}

export namespace MsgAddCurrencyPairs {
  export interface Amino {
    type: 'connect/x/oracle/MsgAddCurrencyPairs'
    value: {
      authority: AccAddress
      currency_pairs: CurrencyPair.Amino[]
    }
  }

  export interface Data {
    '@type': '/connect.oracle.v2.MsgAddCurrencyPairs'
    authority: AccAddress
    currency_pairs: CurrencyPair.Data[]
  }

  export type Proto = MsgAddCurrencyPairs_pb
}
