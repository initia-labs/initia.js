import { MsgCreateMarkets } from './MsgCreateMarkets'
import { MsgUpdateMarkets } from './MsgUpdateMarkets'
import { MsgUpsertMarkets } from './MsgUpsertMarkets'
import { MsgRemoveMarketAuthorities } from './MsgRemoveMarketAuthorities'
import { MsgUpdateMarketmapParams } from './MsgUpdateMarketmapParams'

export * from './MsgCreateMarkets'
export * from './MsgUpdateMarkets'
export * from './MsgUpsertMarkets'
export * from './MsgRemoveMarketAuthorities'
export * from './MsgUpdateMarketmapParams'

export type MarketmapMsg =
  | MsgCreateMarkets
  | MsgUpdateMarkets
  | MsgUpsertMarkets
  | MsgRemoveMarketAuthorities
  | MsgUpdateMarketmapParams

export namespace MarketmapMsg {
  export type Amino =
    | MsgCreateMarkets.Amino
    | MsgUpdateMarkets.Amino
    | MsgUpsertMarkets.Amino
    | MsgRemoveMarketAuthorities.Amino
    | MsgUpdateMarketmapParams.Amino

  export type Data =
    | MsgCreateMarkets.Data
    | MsgUpdateMarkets.Data
    | MsgUpsertMarkets.Data
    | MsgRemoveMarketAuthorities.Data
    | MsgUpdateMarketmapParams.Data

  export type Proto =
    | MsgCreateMarkets.Proto
    | MsgUpdateMarkets.Proto
    | MsgUpsertMarkets.Proto
    | MsgRemoveMarketAuthorities.Proto
    | MsgUpdateMarketmapParams.Proto
}
