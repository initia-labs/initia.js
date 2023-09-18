import { MsgAuctionBid } from './MsgAuctionBid';
import { MsgUpdateBuilderParams } from './MsgUpdateBuilderParams';

export * from './MsgAuctionBid';
export * from './MsgUpdateBuilderParams';

export type BuilderMsg = MsgAuctionBid | MsgUpdateBuilderParams;
export namespace BuilderMsg {
  export type Amino = MsgAuctionBid.Amino | MsgUpdateBuilderParams.Amino;
  export type Data = MsgAuctionBid.Data | MsgUpdateBuilderParams.Data;
  export type Proto = MsgAuctionBid.Proto | MsgUpdateBuilderParams.Proto;
}
