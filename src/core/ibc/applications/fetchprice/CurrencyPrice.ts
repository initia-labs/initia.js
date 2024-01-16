import { JSONSerializable } from '../../../../util/json';
import { CurrencyPrice as CurrencyPrice_pb } from '@initia/initia.proto/ibc/applications/fetchprice/v1/types';
import { IbcQuotePrice } from './IbcQuotePrice';

export class CurrencyPrice extends JSONSerializable<
  CurrencyPrice.Amino,
  CurrencyPrice.Data,
  CurrencyPrice.Proto
> {
  /**
   * @param currency_id the string with "BASE/QUOTE" format
   * @param quote_price
   */
  constructor(public currency_id: string, public quote_price: IbcQuotePrice) {
    super();
  }

  public static fromAmino(data: CurrencyPrice.Amino): CurrencyPrice {
    const { currency_id, quote_price } = data;
    return new CurrencyPrice(currency_id, IbcQuotePrice.fromAmino(quote_price));
  }

  public toAmino(): CurrencyPrice.Amino {
    const { currency_id, quote_price } = this;
    return {
      currency_id,
      quote_price: quote_price.toAmino(),
    };
  }

  public static fromData(data: CurrencyPrice.Data): CurrencyPrice {
    const { currency_id, quote_price } = data;
    return new CurrencyPrice(currency_id, IbcQuotePrice.fromData(quote_price));
  }

  public toData(): CurrencyPrice.Data {
    const { currency_id, quote_price } = this;
    return {
      currency_id,
      quote_price: quote_price.toData(),
    };
  }

  public static fromProto(proto: CurrencyPrice.Proto): CurrencyPrice {
    return new CurrencyPrice(
      proto.currencyId,
      IbcQuotePrice.fromProto(proto.quotePrice as IbcQuotePrice.Proto)
    );
  }

  public toProto(): CurrencyPrice.Proto {
    const { currency_id, quote_price } = this;
    return CurrencyPrice_pb.fromPartial({
      currencyId: currency_id,
      quotePrice: quote_price.toProto(),
    });
  }
}

export namespace CurrencyPrice {
  export interface Amino {
    currency_id: string;
    quote_price: IbcQuotePrice.Amino;
  }

  export interface Data {
    currency_id: string;
    quote_price: IbcQuotePrice.Data;
  }

  export type Proto = CurrencyPrice_pb;
}
