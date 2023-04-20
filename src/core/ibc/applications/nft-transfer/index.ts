import { MsgNftTransfer } from './msgs/MsgNftTransfer';

export * from './msgs/MsgNftTransfer';
export * from './NonFungibleTokenPacketData';
export * from './ClassTrace';

export type IbcNftMsg = MsgNftTransfer;
export namespace IbcNftMsg {
  export type Data = MsgNftTransfer.Data;
  export type Amino = MsgNftTransfer.Amino;
  export type Proto = MsgNftTransfer.Proto;
}
