import { MsgPublish } from './MsgPublish';
import { MsgExecute } from './MsgExecute';
import { MsgScript } from './MsgScript';
import { MsgUpdateMoveParams } from './MsgUpdateMoveParams';
import { MsgWhitelist } from './MsgWhitelist';
import { MsgDelist } from './MsgDelist';

export * from './MsgPublish';
export * from './MsgExecute';
export * from './MsgScript';
export * from './MsgUpdateMoveParams';
export * from './MsgWhitelist';
export * from './MsgDelist';

export type MoveMsg =
  | MsgPublish
  | MsgExecute
  | MsgScript
  | MsgUpdateMoveParams
  | MsgWhitelist
  | MsgDelist;

export namespace MoveMsg {
  export type Amino =
    | MsgPublish.Amino
    | MsgExecute.Amino
    | MsgScript.Amino
    | MsgUpdateMoveParams.Amino
    | MsgWhitelist.Amino
    | MsgDelist.Amino;
  export type Data =
    | MsgPublish.Data
    | MsgExecute.Data
    | MsgScript.Data
    | MsgUpdateMoveParams.Data
    | MsgWhitelist.Data
    | MsgDelist.Data;
  export type Proto =
    | MsgPublish.Proto
    | MsgExecute.Proto
    | MsgScript.Proto
    | MsgUpdateMoveParams.Proto
    | MsgWhitelist.Proto
    | MsgDelist.Proto;
}
