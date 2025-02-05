import { MsgCreateMarkets } from './MsgCreateMarkets'
import { MsgUpdateMarkets } from './MsgUpdateMarkets'
import { MsgUpsertMarkets } from './MsgUpsertMarkets'
import { MsgRemoveMarkets } from './MsgRemoveMarkets'
import { MsgRemoveMarketAuthorities } from './MsgRemoveMarketAuthorities'
import { MsgUpdateMarketmapParams } from './MsgUpdateMarketmapParams'

export * from './MsgCreateMarkets'
export * from './MsgUpdateMarkets'
export * from './MsgUpsertMarkets'
export * from './MsgRemoveMarkets'
export * from './MsgRemoveMarketAuthorities'
export * from './MsgUpdateMarketmapParams'

export type MarketmapMsg =
  | MsgCreateMarkets
  | MsgUpdateMarkets
  | MsgUpsertMarkets
  | MsgRemoveMarkets
  | MsgRemoveMarketAuthorities
  | MsgUpdateMarketmapParams

export namespace MarketmapMsg {
  export type Amino =
    | MsgCreateMarkets.Amino
    | MsgUpdateMarkets.Amino
    | MsgUpsertMarkets.Amino
    | MsgRemoveMarkets.Amino
    | MsgRemoveMarketAuthorities.Amino
    | MsgUpdateMarketmapParams.Amino

  export type Data =
    | MsgCreateMarkets.Data
    | MsgUpdateMarkets.Data
    | MsgUpsertMarkets.Data
    | MsgRemoveMarkets.Data
    | MsgRemoveMarketAuthorities.Data
    | MsgUpdateMarketmapParams.Data

  export type Proto =
    | MsgCreateMarkets.Proto
    | MsgUpdateMarkets.Proto
    | MsgUpsertMarkets.Proto
    | MsgRemoveMarkets.Proto
    | MsgRemoveMarketAuthorities.Proto
    | MsgUpdateMarketmapParams.Proto
}
