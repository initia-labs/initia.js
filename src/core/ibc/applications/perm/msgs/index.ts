import { MsgUpdateIbcPermAdmin } from './MsgUpdateIbcPermAdmin'
import { MsgUpdatePermissionedRelayers } from './MsgUpdatePermissionedRelayers'

export * from './MsgUpdateIbcPermAdmin'
export * from './MsgUpdatePermissionedRelayers'

export type IbcPermMsg = MsgUpdateIbcPermAdmin | MsgUpdatePermissionedRelayers
export namespace IbcPermMsg {
  export type Amino =
    | MsgUpdateIbcPermAdmin.Amino
    | MsgUpdatePermissionedRelayers.Amino
  export type Data =
    | MsgUpdateIbcPermAdmin.Data
    | MsgUpdatePermissionedRelayers.Data
  export type Proto =
    | MsgUpdateIbcPermAdmin.Proto
    | MsgUpdatePermissionedRelayers.Proto
}
