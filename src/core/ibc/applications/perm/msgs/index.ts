import { MsgSetPermissionedRelayers } from './MsgSetPermissionedRelayers'

export * from './MsgSetPermissionedRelayers'

export type IbcPermMsg = MsgSetPermissionedRelayers
export namespace IbcPermMsg {
  export type Amino = MsgSetPermissionedRelayers.Amino
  export type Data = MsgSetPermissionedRelayers.Data
  export type Proto = MsgSetPermissionedRelayers.Proto
}
