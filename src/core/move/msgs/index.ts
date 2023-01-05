import { MsgPublishModuleBundle } from './MsgPublishModuleBundle';
import { MsgExecuteEntryFunction } from './MsgExecuteEntryFunction';
import { MsgExecuteScript } from './MsgExecuteScript';

export * from './MsgPublishModuleBundle';
export * from './MsgExecuteEntryFunction';
export * from './MsgExecuteScript';

export type MoveMsg =
  | MsgPublishModuleBundle
  | MsgExecuteEntryFunction
  | MsgExecuteScript;

export namespace MoveMsg {
  export type Amino =
    | MsgPublishModuleBundle.Amino
    | MsgExecuteEntryFunction.Amino
    | MsgExecuteScript.Amino;
  export type Data =
    | MsgPublishModuleBundle.Data
    | MsgExecuteEntryFunction.Data
    | MsgExecuteScript.Data;
  export type Proto =
    | MsgPublishModuleBundle.Proto
    | MsgExecuteEntryFunction.Proto
    | MsgExecuteScript.Proto;
}
