import { MsgSetPermissionedRelayers } from './MsgSetPermissionedRelayers'
import { MsgHaltChannel } from './MsgHaltChannel'
import { MsgResumeChannel } from './MsgResumeChannel'

export * from './MsgSetPermissionedRelayers'
export * from './MsgHaltChannel'
export * from './MsgResumeChannel'

export type IbcPermMsg =
  | MsgSetPermissionedRelayers
  | MsgHaltChannel
  | MsgResumeChannel
export namespace IbcPermMsg {
  export type Amino =
    | MsgSetPermissionedRelayers.Amino
    | MsgHaltChannel.Amino
    | MsgResumeChannel.Amino
  export type Data =
    | MsgSetPermissionedRelayers.Data
    | MsgHaltChannel.Data
    | MsgResumeChannel.Data
  export type Proto =
    | MsgSetPermissionedRelayers.Proto
    | MsgHaltChannel.Proto
    | MsgResumeChannel.Proto
}
