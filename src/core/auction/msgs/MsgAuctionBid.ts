import { JSONSerializable } from '../../../util/json';
import { AccAddress } from '../../bech32';
import { Coin } from '../../Coin';
import { Any } from '@initia/initia.proto/google/protobuf/any';
import { MsgAuctionBid as MsgAuctionBid_pb } from '@initia/initia.proto/sdk/auction/v1/tx';

export class MsgAuctionBid extends JSONSerializable<
  MsgAuctionBid.Amino,
  MsgAuctionBid.Data,
  MsgAuctionBid.Proto
> {
  /**
   * @param bidder the address of the account that is submitting a bid to the auction
   * @param bid the amount of coins that the bidder is bidding to participate in the auction
   * @param transactions the bytes of the transactions that the bidder wants to bundle together
   */
  constructor(
    public bidder: AccAddress,
    public bid: Coin,
    public transactions: string[]
  ) {
    super();
  }

  public static fromAmino(data: MsgAuctionBid.Amino): MsgAuctionBid {
    const {
      value: { bidder, bid, transactions },
    } = data;
    return new MsgAuctionBid(bidder, Coin.fromAmino(bid), transactions);
  }

  public toAmino(): MsgAuctionBid.Amino {
    const { bidder, bid, transactions } = this;
    return {
      type: 'block-sdk/x/auction/MsgAuctionBid',
      value: {
        bidder,
        bid: bid.toAmino(),
        transactions,
      },
    };
  }

  public static fromData(data: MsgAuctionBid.Data): MsgAuctionBid {
    const { bidder, bid, transactions } = data;
    return new MsgAuctionBid(bidder, Coin.fromData(bid), transactions);
  }

  public toData(): MsgAuctionBid.Data {
    const { bidder, bid, transactions } = this;
    return {
      '@type': '/sdk.auction.v1.MsgAuctionBid',
      bidder,
      bid: bid.toData(),
      transactions,
    };
  }

  public static fromProto(data: MsgAuctionBid.Proto): MsgAuctionBid {
    return new MsgAuctionBid(
      data.bidder,
      Coin.fromProto(data.bid as Coin),
      data.transactions.map(tx => Buffer.from(tx).toString('base64'))
    );
  }

  public toProto(): MsgAuctionBid.Proto {
    const { bidder, bid, transactions } = this;
    return MsgAuctionBid_pb.fromPartial({
      bidder,
      bid: bid.toProto(),
      transactions: transactions.map(tx => Buffer.from(tx, 'base64')),
    });
  }

  public packAny(): Any {
    return Any.fromPartial({
      typeUrl: '/sdk.auction.v1.MsgAuctionBid',
      value: MsgAuctionBid_pb.encode(this.toProto()).finish(),
    });
  }

  public static unpackAny(msgAny: Any): MsgAuctionBid {
    return MsgAuctionBid.fromProto(MsgAuctionBid_pb.decode(msgAny.value));
  }
}

export namespace MsgAuctionBid {
  export interface Amino {
    type: 'block-sdk/x/auction/MsgAuctionBid';
    value: {
      bidder: AccAddress;
      bid: Coin.Amino;
      transactions: string[];
    };
  }

  export interface Data {
    '@type': '/sdk.auction.v1.MsgAuctionBid';
    bidder: AccAddress;
    bid: Coin.Data;
    transactions: string[];
  }

  export type Proto = MsgAuctionBid_pb;
}
