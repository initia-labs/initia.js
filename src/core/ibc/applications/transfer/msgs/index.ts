import { MsgTransfer } from './MsgTransfer';
import { MsgUpdateIbcTransferParams } from './MsgUpdateIbcTransferParams';

export * from './MsgTransfer';
export * from './MsgUpdateIbcTransferParams';

export type IbcTransferMsg = MsgTransfer | MsgUpdateIbcTransferParams;
export namespace IbcTransferMsg {
  export type Amino = MsgTransfer.Amino;
  export type Data = MsgTransfer.Data | MsgUpdateIbcTransferParams.Data;
  export type Proto = MsgTransfer.Proto | MsgUpdateIbcTransferParams.Proto;
}
