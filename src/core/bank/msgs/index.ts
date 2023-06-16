import { MsgSend } from './MsgSend';
import { MsgMultiSend } from './MsgMultiSend';
import { MsgUpdateBankParams } from './MsgUpdateBankParams';

export * from './MsgSend';
export * from './MsgMultiSend';
export * from './MsgUpdateBankParams';

export type BankMsg = MsgSend | MsgMultiSend | MsgUpdateBankParams;
export namespace BankMsg {
  export type Amino =
    | MsgSend.Amino
    | MsgMultiSend.Amino
    | MsgUpdateBankParams.Amino;
  export type Data =
    | MsgSend.Data
    | MsgMultiSend.Data
    | MsgUpdateBankParams.Data;
  export type Proto =
    | MsgSend.Proto
    | MsgMultiSend.Proto
    | MsgUpdateBankParams.Proto;
}
