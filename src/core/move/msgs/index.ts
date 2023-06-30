import { MsgPublish } from './MsgPublish';
import { MsgExecute } from './MsgExecute';
import { MsgScript } from './MsgScript';
import { MsgUpdateMoveParams } from './MsgUpdateMoveParams';
import { MsgWhitelist } from './MsgWhitelist';
import { MsgDelist } from './MsgDelist';
import { MsgGovExecute } from './MsgGovExecute';
import { MsgGovPublish } from './MsgGovPublish';
import { MsgGovScript } from './MsgGovScript';

export * from './MsgPublish';
export * from './MsgExecute';
export * from './MsgScript';
export * from './MsgUpdateMoveParams';
export * from './MsgWhitelist';
export * from './MsgDelist';
export * from './MsgGovExecute';
export * from './MsgGovPublish';
export * from './MsgGovScript';

export type MoveMsg =
  | MsgPublish
  | MsgExecute
  | MsgScript
  | MsgUpdateMoveParams
  | MsgWhitelist
  | MsgDelist
  | MsgGovExecute
  | MsgGovPublish
  | MsgGovScript;

export namespace MoveMsg {
  export type Amino =
    | MsgPublish.Amino
    | MsgExecute.Amino
    | MsgScript.Amino
    | MsgUpdateMoveParams.Amino
    | MsgWhitelist.Amino
    | MsgDelist.Amino
    | MsgGovExecute.Amino
    | MsgGovPublish.Amino
    | MsgGovScript.Amino;
  export type Data =
    | MsgPublish.Data
    | MsgExecute.Data
    | MsgScript.Data
    | MsgUpdateMoveParams.Data
    | MsgWhitelist.Data
    | MsgDelist.Data
    | MsgGovExecute.Data
    | MsgGovPublish.Data
    | MsgGovScript.Data;

  export type Proto =
    | MsgPublish.Proto
    | MsgExecute.Proto
    | MsgScript.Proto
    | MsgUpdateMoveParams.Proto
    | MsgWhitelist.Proto
    | MsgDelist.Proto
    | MsgGovExecute.Proto
    | MsgGovPublish.Proto
    | MsgGovScript.Proto;
}
