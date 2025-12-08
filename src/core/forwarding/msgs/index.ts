import { MsgRegisterForwardingAccount } from './MsgRegisterForwardingAccount'
import { MsgClearForwardingAccount } from './MsgClearForwardingAccount'
import { MsgSetAllowedDenoms } from './MsgSetAllowedDenoms'
import { MsgSetMemo } from './MsgSetMemo'

export * from './MsgRegisterForwardingAccount'
export * from './MsgClearForwardingAccount'
export * from './MsgSetAllowedDenoms'
export * from './MsgSetMemo'

export type ForwardingMsg =
  | MsgRegisterForwardingAccount
  | MsgClearForwardingAccount
  | MsgSetAllowedDenoms
  | MsgSetMemo

export namespace ForwardingMsg {
  export type Amino =
    | MsgRegisterForwardingAccount.Amino
    | MsgClearForwardingAccount.Amino
    | MsgSetAllowedDenoms.Amino
    | MsgSetMemo.Amino

  export type Data =
    | MsgRegisterForwardingAccount.Data
    | MsgClearForwardingAccount.Data
    | MsgSetAllowedDenoms.Data
    | MsgSetMemo.Data

  export type Proto =
    | MsgRegisterForwardingAccount.Proto
    | MsgClearForwardingAccount.Proto
    | MsgSetAllowedDenoms.Proto
    | MsgSetMemo.Proto
}
