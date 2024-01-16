import { JSONSerializable } from '../../../../util/json';
import { QuotePrice as QuotePrice_pb } from '@initia/initia.proto/ibc/applications/fetchprice/v1/types';
import Long from 'long';

export class IbcQuotePrice extends JSONSerializable<
  IbcQuotePrice.Amino,
  IbcQuotePrice.Data,
  IbcQuotePrice.Proto
> {
  /**
   * @param price
   * @param decimals the number of decimals that the quote-price is represented in
   * @param block_timestamp tracks the block height associated with this price update
   * @param block_height block height of provider chain
   */
  constructor(
    public price: string,
    public decimals: number,
    public block_timestamp: Date,
    public block_height: number
  ) {
    super();
  }

  public static fromAmino(data: IbcQuotePrice.Amino): IbcQuotePrice {
    const { price, decimals, block_timestamp, block_height } = data;
    return new IbcQuotePrice(
      price,
      Number.parseInt(decimals),
      new Date(block_timestamp),
      Number.parseInt(block_height)
    );
  }

  public toAmino(): IbcQuotePrice.Amino {
    const { price, decimals, block_timestamp, block_height } = this;
    return {
      price,
      decimals: decimals.toString(),
      block_timestamp: block_timestamp.toISOString(),
      block_height: block_height.toString(),
    };
  }

  public static fromData(data: IbcQuotePrice.Data): IbcQuotePrice {
    const { price, decimals, block_timestamp, block_height } = data;
    return new IbcQuotePrice(
      price,
      Number.parseInt(decimals),
      new Date(block_timestamp),
      Number.parseInt(block_height)
    );
  }

  public toData(): IbcQuotePrice.Data {
    const { price, decimals, block_timestamp, block_height } = this;
    return {
      price,
      decimals: decimals.toString(),
      block_timestamp: block_timestamp.toISOString(),
      block_height: block_height.toString(),
    };
  }

  public static fromProto(proto: IbcQuotePrice.Proto): IbcQuotePrice {
    return new IbcQuotePrice(
      proto.price,
      proto.decimals.toNumber(),
      proto.blockTimestamp as Date,
      proto.blockHeight.toNumber()
    );
  }

  public toProto(): IbcQuotePrice.Proto {
    const { price, decimals, block_timestamp, block_height } = this;
    return QuotePrice_pb.fromPartial({
      price,
      decimals: Long.fromNumber(decimals),
      blockTimestamp: block_timestamp,
      blockHeight: Long.fromNumber(block_height),
    });
  }
}

export namespace IbcQuotePrice {
  export interface Amino {
    price: string;
    decimals: string;
    block_timestamp: string;
    block_height: string;
  }

  export interface Data {
    price: string;
    decimals: string;
    block_timestamp: string;
    block_height: string;
  }

  export type Proto = QuotePrice_pb;
}
