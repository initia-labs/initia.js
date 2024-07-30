import { MsgAuctionBid } from './MsgAuctionBid'
import { MsgUpdateAuctionParams } from './MsgUpdateAuctionParams'

export * from './MsgAuctionBid'
export * from './MsgUpdateAuctionParams'

export type AuctionMsg = MsgAuctionBid | MsgUpdateAuctionParams
export namespace AuctionMsg {
  export type Amino = MsgAuctionBid.Amino | MsgUpdateAuctionParams.Amino
  export type Data = MsgAuctionBid.Data | MsgUpdateAuctionParams.Data
  export type Proto = MsgAuctionBid.Proto | MsgUpdateAuctionParams.Proto
}
