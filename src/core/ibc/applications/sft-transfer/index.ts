import { MsgSftTransfer } from './msgs/MsgSftTransfer';

export * from './msgs/MsgSftTransfer';
export * from './SemiFungibleTokenPacketData';
export * from './SftClassTrace';

export type IbcSftMsg = MsgSftTransfer;
export namespace IbcSftMsg {
  export type Data = MsgSftTransfer.Data;
  export type Amino = MsgSftTransfer.Amino;
  export type Proto = MsgSftTransfer.Proto;
}
