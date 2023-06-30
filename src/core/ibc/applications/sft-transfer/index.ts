import { MsgSftTransfer } from './msgs/MsgSftTransfer';
import { MsgUpdateIbcSftParams } from './msgs/MsgUpdateIbcSftParams';

export * from './msgs/MsgSftTransfer';
export * from './msgs/MsgUpdateIbcSftParams';
export * from './SemiFungibleTokenPacketData';
export * from './SftClassTrace';
export * from './IbcSftParams';

export type IbcSftMsg = MsgSftTransfer | MsgUpdateIbcSftParams;
export namespace IbcSftMsg {
  export type Amino = MsgSftTransfer.Amino | MsgUpdateIbcSftParams.Amino;
  export type Data = MsgSftTransfer.Data | MsgUpdateIbcSftParams.Data;
  export type Proto = MsgSftTransfer.Proto | MsgUpdateIbcSftParams.Proto;
}
