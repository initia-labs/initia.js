import { MsgPublish } from './MsgPublish';
import { MsgExecute } from './MsgExecute';
import { MsgScript } from './MsgScript';
import { MsgUpdateMoveParams } from './MsgUpdateMoveParams';

export * from './MsgPublish';
export * from './MsgExecute';
export * from './MsgScript';
export * from './MsgUpdateMoveParams';

export type MoveMsg = MsgPublish | MsgExecute | MsgScript | MsgUpdateMoveParams;

export namespace MoveMsg {
  export type Amino =
    | MsgPublish.Amino
    | MsgExecute.Amino
    | MsgScript.Amino
    | MsgUpdateMoveParams.Amino;
  export type Data =
    | MsgPublish.Data
    | MsgExecute.Data
    | MsgScript.Data
    | MsgUpdateMoveParams.Data;
  export type Proto =
    | MsgPublish.Proto
    | MsgExecute.Proto
    | MsgScript.Proto
    | MsgUpdateMoveParams.Proto;
}
