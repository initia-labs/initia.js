import { MsgNftTransfer } from './MsgNftTransfer'
import { MsgUpdateIbcNftParams } from './MsgUpdateIbcNftParams'

export * from './MsgNftTransfer'
export * from './MsgUpdateIbcNftParams'

export type IbcNftMsg = MsgNftTransfer | MsgUpdateIbcNftParams
export namespace IbcNftMsg {
  export type Amino = MsgNftTransfer.Amino | MsgUpdateIbcNftParams.Amino
  export type Data = MsgNftTransfer.Data | MsgUpdateIbcNftParams.Data
  export type Proto = MsgNftTransfer.Proto | MsgUpdateIbcNftParams.Proto
}
