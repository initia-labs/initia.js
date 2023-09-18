import { MsgSftTransfer } from './MsgSftTransfer';
import { MsgUpdateIbcSftParams } from './MsgUpdateIbcSftParams';

export * from './MsgSftTransfer';
export * from './MsgUpdateIbcSftParams';

export type IbcSftMsg = MsgSftTransfer | MsgUpdateIbcSftParams;
export namespace IbcSftMsg {
  export type Amino = MsgSftTransfer.Amino | MsgUpdateIbcSftParams.Amino;
  export type Data = MsgSftTransfer.Data | MsgUpdateIbcSftParams.Data;
  export type Proto = MsgSftTransfer.Proto | MsgUpdateIbcSftParams.Proto;
}
