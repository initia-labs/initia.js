import { MsgRegisterAccount } from './MsgRegisterAccount'
import { MsgSubmitTx } from './MsgSubmitTx'

export * from './MsgRegisterAccount'
export * from './MsgSubmitTx'

export type InterTxMsg = MsgRegisterAccount | MsgSubmitTx
export namespace InterTxMsg {
  export type Amino = MsgRegisterAccount.Amino | MsgSubmitTx.Amino
  export type Data = MsgRegisterAccount.Data | MsgSubmitTx.Data
  export type Proto = MsgRegisterAccount.Proto | MsgSubmitTx.Proto
}
