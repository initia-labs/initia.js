import { MsgPublish } from './MsgPublish';
import { MsgExecute } from './MsgExecute';
import { MsgScript } from './MsgScript';

export * from './MsgPublish';
export * from './MsgExecute';
export * from './MsgScript';

export type MoveMsg = MsgPublish | MsgExecute | MsgScript;

export namespace MoveMsg {
  export type Amino = MsgPublish.Amino | MsgExecute.Amino | MsgScript.Amino;
  export type Data = MsgPublish.Data | MsgExecute.Data | MsgScript.Data;
  export type Proto = MsgPublish.Proto | MsgExecute.Proto | MsgScript.Proto;
}
