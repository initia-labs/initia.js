import { MsgSend } from './MsgSend';
import { MsgMultiSend } from './MsgMultiSend';
import { MsgUpdateBankParams } from './MsgUpdateBankParams';
import { MsgSetSendEnabled } from './MsgSetSendEnabled';
import { MsgSetDenomMetadata } from './MsgSetDenomMetadata';

export * from './MsgSend';
export * from './MsgMultiSend';
export * from './MsgUpdateBankParams';
export * from './MsgSetSendEnabled';
export * from './MsgSetDenomMetadata';

export type BankMsg =
  | MsgSend
  | MsgMultiSend
  | MsgUpdateBankParams
  | MsgSetSendEnabled
  | MsgSetDenomMetadata;
export namespace BankMsg {
  export type Amino =
    | MsgSend.Amino
    | MsgMultiSend.Amino
    | MsgUpdateBankParams.Amino
    | MsgSetSendEnabled.Amino
    | MsgSetDenomMetadata.Amino;
  export type Data =
    | MsgSend.Data
    | MsgMultiSend.Data
    | MsgUpdateBankParams.Data
    | MsgSetSendEnabled.Data
    | MsgSetDenomMetadata.Data;
  export type Proto =
    | MsgSend.Proto
    | MsgMultiSend.Proto
    | MsgUpdateBankParams.Proto
    | MsgSetSendEnabled.Proto
    | MsgSetDenomMetadata.Proto;
}
