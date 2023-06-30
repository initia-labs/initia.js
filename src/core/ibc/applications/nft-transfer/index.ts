import { MsgNftTransfer } from './msgs/MsgNftTransfer';
import { MsgUpdateIbcNftParams } from './msgs/MsgUpdateIbcNftParams';

export * from './msgs/MsgNftTransfer';
export * from './msgs/MsgUpdateIbcNftParams';
export * from './NonFungibleTokenPacketData';
export * from './NftClassTrace';
export * from './IbcNftParams';

export type IbcNftMsg = MsgNftTransfer | MsgUpdateIbcNftParams;
export namespace IbcNftMsg {
  export type Amino = MsgNftTransfer.Amino | MsgUpdateIbcNftParams.Amino;
  export type Data = MsgNftTransfer.Data | MsgUpdateIbcNftParams.Data;
  export type Proto = MsgNftTransfer.Proto | MsgUpdateIbcNftParams.Proto;
}
