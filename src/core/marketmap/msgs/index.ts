import { MsgCreateMarkets } from './MsgCreateMarkets';
import { MsgUpdateMarkets } from './MsgUpdateMarkets';
import { MsgRemoveMarketAuthorities } from './MsgRemoveMarketAuthorities';
import { MsgUpdateMarketmapParams } from './MsgUpdateMarketmapParams';

export * from './MsgCreateMarkets';
export * from './MsgUpdateMarkets';
export * from './MsgRemoveMarketAuthorities';
export * from './MsgUpdateMarketmapParams';

export type MarketmapMsg =
  | MsgCreateMarkets
  | MsgUpdateMarkets
  | MsgRemoveMarketAuthorities
  | MsgUpdateMarketmapParams;

export namespace MarketmapMsg {
  export type Amino =
    | MsgCreateMarkets.Amino
    | MsgUpdateMarkets.Amino
    | MsgRemoveMarketAuthorities.Amino
    | MsgUpdateMarketmapParams.Amino;

  export type Data =
    | MsgCreateMarkets.Data
    | MsgUpdateMarkets.Data
    | MsgRemoveMarketAuthorities.Data
    | MsgUpdateMarketmapParams.Data;

  export type Proto =
    | MsgCreateMarkets.Proto
    | MsgUpdateMarkets.Proto
    | MsgRemoveMarketAuthorities.Proto
    | MsgUpdateMarketmapParams.Proto;
}
