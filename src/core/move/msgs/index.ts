import { MsgPublishModuleBundle } from './MsgPublishModuleBundle';
import { MsgExecuteEntryFunction } from './MsgExecuteEntryFunction';
import { MsgExecuteScript } from './MsgExecuteScript';
import { MsgConvertNativeCoin } from './MsgConvertNativeCoin';
import { MsgConvertMoveCoin } from './MsgConvertMoveCoin';

export * from './MsgPublishModuleBundle';
export * from './MsgExecuteEntryFunction';
export * from './MsgExecuteScript';
export * from './MsgConvertNativeCoin';
export * from './MsgConvertMoveCoin';

export type MoveMsg =
  | MsgPublishModuleBundle
  | MsgExecuteEntryFunction
  | MsgExecuteScript
  | MsgConvertNativeCoin
  | MsgConvertMoveCoin;

export namespace MoveMsg {
  export type Amino =
    | MsgPublishModuleBundle.Amino
    | MsgExecuteEntryFunction.Amino
    | MsgExecuteScript.Amino
    | MsgConvertNativeCoin.Amino
    | MsgConvertMoveCoin.Amino;
  export type Data =
    | MsgPublishModuleBundle.Data
    | MsgExecuteEntryFunction.Data
    | MsgExecuteScript.Data
    | MsgConvertNativeCoin.Data
    | MsgConvertMoveCoin.Data;
  export type Proto =
    | MsgPublishModuleBundle.Proto
    | MsgExecuteEntryFunction.Proto
    | MsgExecuteScript.Proto
    | MsgConvertNativeCoin.Proto
    | MsgConvertMoveCoin.Proto;
}
