import { MsgAddCurrencyPairs } from './MsgAddCurrencyPairs'
import { MsgRemoveCurrencyPairs } from './MsgRemoveCurrencyPairs'

export * from './MsgAddCurrencyPairs'
export * from './MsgRemoveCurrencyPairs'

export type OracleMsg = MsgAddCurrencyPairs | MsgRemoveCurrencyPairs

export namespace OracleMsg {
  export type Amino = MsgAddCurrencyPairs.Amino | MsgRemoveCurrencyPairs.Amino
  export type Data = MsgAddCurrencyPairs.Data | MsgRemoveCurrencyPairs.Data
  export type Proto = MsgAddCurrencyPairs.Proto | MsgRemoveCurrencyPairs.Proto
}
