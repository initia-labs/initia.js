import { MsgPublish } from './MsgPublish'
import { MsgExecute } from './MsgExecute'
import { MsgExecuteJSON } from './MsgExecuteJSON'
import { MsgScript } from './MsgScript'
import { MsgScriptJSON } from './MsgScriptJSON'
import { MsgUpdateMoveParams } from './MsgUpdateMoveParams'
import { MsgWhitelist } from './MsgWhitelist'
import { MsgDelist } from './MsgDelist'
import { MsgGovExecute } from './MsgGovExecute'
import { MsgGovExecuteJSON } from './MsgGovExecuteJSON'
import { MsgGovPublish } from './MsgGovPublish'
import { MsgGovScript } from './MsgGovScript'
import { MsgGovScriptJSON } from './MsgGovScriptJSON'

export * from './MsgPublish'
export * from './MsgExecute'
export * from './MsgExecuteJSON'
export * from './MsgScript'
export * from './MsgScriptJSON'
export * from './MsgUpdateMoveParams'
export * from './MsgWhitelist'
export * from './MsgDelist'
export * from './MsgGovExecute'
export * from './MsgGovExecuteJSON'
export * from './MsgGovPublish'
export * from './MsgGovScript'
export * from './MsgGovScriptJSON'

export type MoveMsg =
  | MsgPublish
  | MsgExecute
  | MsgExecuteJSON
  | MsgScript
  | MsgScriptJSON
  | MsgUpdateMoveParams
  | MsgWhitelist
  | MsgDelist
  | MsgGovExecute
  | MsgGovExecuteJSON
  | MsgGovPublish
  | MsgGovScript
  | MsgGovScriptJSON

export namespace MoveMsg {
  export type Amino =
    | MsgPublish.Amino
    | MsgExecute.Amino
    | MsgExecuteJSON.Amino
    | MsgScript.Amino
    | MsgScriptJSON.Amino
    | MsgUpdateMoveParams.Amino
    | MsgWhitelist.Amino
    | MsgDelist.Amino
    | MsgGovExecute.Amino
    | MsgGovExecuteJSON.Amino
    | MsgGovPublish.Amino
    | MsgGovScript.Amino
    | MsgGovScriptJSON.Amino

  export type Data =
    | MsgPublish.Data
    | MsgExecute.Data
    | MsgExecuteJSON.Data
    | MsgScript.Data
    | MsgScriptJSON.Data
    | MsgUpdateMoveParams.Data
    | MsgWhitelist.Data
    | MsgDelist.Data
    | MsgGovExecute.Data
    | MsgGovExecuteJSON.Data
    | MsgGovPublish.Data
    | MsgGovScript.Data
    | MsgGovScriptJSON.Data

  export type Proto =
    | MsgPublish.Proto
    | MsgExecute.Proto
    | MsgExecuteJSON.Proto
    | MsgScript.Proto
    | MsgScriptJSON.Proto
    | MsgUpdateMoveParams.Proto
    | MsgWhitelist.Proto
    | MsgDelist.Proto
    | MsgGovExecute.Proto
    | MsgGovExecuteJSON.Proto
    | MsgGovPublish.Proto
    | MsgGovScript.Proto
    | MsgGovScriptJSON.Proto
}
