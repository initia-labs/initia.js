import { MsgSend } from './MsgSend';
import { MsgMultiSend } from './MsgMultiSend';
import { MsgUpdateBankParams } from './MsgUpdateBankParams';
import { MsgSetSendEnabled } from './MsgSetSendEnabled';

export * from './MsgSend';
export * from './MsgMultiSend';
export * from './MsgUpdateBankParams';
export * from './MsgSetSendEnabled';

export type BankMsg =
  | MsgSend
  | MsgMultiSend
  | MsgUpdateBankParams
  | MsgSetSendEnabled;
export namespace BankMsg {
  export type Amino =
    | MsgSend.Amino
    | MsgMultiSend.Amino
    | MsgUpdateBankParams.Amino
    | MsgSetSendEnabled.Amino;
  export type Data =
    | MsgSend.Data
    | MsgMultiSend.Data
    | MsgUpdateBankParams.Data
    | MsgSetSendEnabled.Data;
  export type Proto =
    | MsgSend.Proto
    | MsgMultiSend.Proto
    | MsgUpdateBankParams.Proto
    | MsgSetSendEnabled.Proto;
}
