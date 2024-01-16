import { JSONSerializable } from '../../../util/json';
import { AccAddress } from '../../bech32';
import { Any } from '@initia/initia.proto/google/protobuf/any';
import { MsgRemoveCurrencyPairs as MsgRemoveCurrencyPairs_pb } from '@initia/initia.proto/slinky/oracle/v1/tx';

export class MsgRemoveCurrencyPairs extends JSONSerializable<
  MsgRemoveCurrencyPairs.Amino,
  MsgRemoveCurrencyPairs.Data,
  MsgRemoveCurrencyPairs.Proto
> {
  /**
   * @param authority
   * @param currency_pair_ids the stringified representation of a currency-pairs (base/quote) to be removed from the module's state
   */
  constructor(
    public authority: AccAddress,
    public currency_pair_ids: string[]
  ) {
    super();
  }

  public static fromAmino(
    data: MsgRemoveCurrencyPairs.Amino
  ): MsgRemoveCurrencyPairs {
    const {
      value: { authority, currency_pair_ids },
    } = data;
    return new MsgRemoveCurrencyPairs(authority, currency_pair_ids);
  }

  public toAmino(): MsgRemoveCurrencyPairs.Amino {
    const { authority, currency_pair_ids } = this;
    return {
      type: 'slinky/x/oracle/MsgSetCurrencyPairs',
      value: {
        authority,
        currency_pair_ids,
      },
    };
  }

  public static fromData(
    data: MsgRemoveCurrencyPairs.Data
  ): MsgRemoveCurrencyPairs {
    const { authority, currency_pair_ids } = data;
    return new MsgRemoveCurrencyPairs(authority, currency_pair_ids);
  }

  public toData(): MsgRemoveCurrencyPairs.Data {
    const { authority, currency_pair_ids } = this;
    return {
      '@type': '/slinky.oracle.v1.MsgRemoveCurrencyPairs',
      authority,
      currency_pair_ids,
    };
  }

  public static fromProto(
    data: MsgRemoveCurrencyPairs.Proto
  ): MsgRemoveCurrencyPairs {
    return new MsgRemoveCurrencyPairs(data.authority, data.currencyPairIds);
  }

  public toProto(): MsgRemoveCurrencyPairs.Proto {
    const { authority, currency_pair_ids } = this;
    return MsgRemoveCurrencyPairs_pb.fromPartial({
      authority,
      currencyPairIds: currency_pair_ids,
    });
  }

  public packAny(): Any {
    return Any.fromPartial({
      typeUrl: '/slinky.oracle.v1.MsgRemoveCurrencyPairs',
      value: MsgRemoveCurrencyPairs_pb.encode(this.toProto()).finish(),
    });
  }

  public static unpackAny(msgAny: Any): MsgRemoveCurrencyPairs {
    return MsgRemoveCurrencyPairs.fromProto(
      MsgRemoveCurrencyPairs_pb.decode(msgAny.value)
    );
  }
}

export namespace MsgRemoveCurrencyPairs {
  export interface Amino {
    type: 'slinky/x/oracle/MsgSetCurrencyPairs';
    value: {
      authority: AccAddress;
      currency_pair_ids: string[];
    };
  }

  export interface Data {
    '@type': '/slinky.oracle.v1.MsgRemoveCurrencyPairs';
    authority: AccAddress;
    currency_pair_ids: string[];
  }

  export type Proto = MsgRemoveCurrencyPairs_pb;
}
