import { MsgRegisterForwardingAccount } from './MsgRegisterForwardingAccount';
import { MsgClearForwardingAccount } from './MsgClearForwardingAccount';

export * from './MsgRegisterForwardingAccount';
export * from './MsgClearForwardingAccount';

export type ForwardingMsg =
  | MsgRegisterForwardingAccount
  | MsgClearForwardingAccount;

export namespace ForwardingMsg {
  export type Amino =
    | MsgRegisterForwardingAccount.Amino
    | MsgClearForwardingAccount.Amino;

  export type Data =
    | MsgRegisterForwardingAccount.Data
    | MsgClearForwardingAccount.Data;

  export type Proto =
    | MsgRegisterForwardingAccount.Proto
    | MsgClearForwardingAccount.Proto;
}
