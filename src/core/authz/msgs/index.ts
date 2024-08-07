import { MsgGrantAuthorization } from './MsgGrantAuthorization'
import { MsgRevokeAuthorization } from './MsgRevokeAuthorization'
import { MsgExecAuthorized } from './MsgExecAuthorized'

export * from './MsgGrantAuthorization'
export * from './MsgRevokeAuthorization'
export * from './MsgExecAuthorized'

export type AuthzMsg =
  | MsgGrantAuthorization
  | MsgRevokeAuthorization
  | MsgExecAuthorized

export namespace AuthzMsg {
  export type Amino =
    | MsgGrantAuthorization.Amino
    | MsgRevokeAuthorization.Amino
    | MsgExecAuthorized.Amino
  export type Data =
    | MsgGrantAuthorization.Data
    | MsgRevokeAuthorization.Data
    | MsgExecAuthorized.Data
  export type Proto =
    | MsgGrantAuthorization.Proto
    | MsgRevokeAuthorization.Proto
    | MsgExecAuthorized.Proto
}
