import { MsgDelegate } from './MsgDelegate';
import { MsgUndelegate } from './MsgUndelegate';
import { MsgBeginRedelegate } from './MsgBeginRedelegate';
import { MsgCreateValidator } from './MsgCreateValidator';
import { MsgEditValidator } from './MsgEditValidator';
import { MsgUpdateMstakingParams } from './MsgUpdateMstakingParams';

export * from './MsgDelegate';
export * from './MsgUndelegate';
export * from './MsgBeginRedelegate';
export * from './MsgCreateValidator';
export * from './MsgEditValidator';
export * from './MsgUpdateMstakingParams';

export type MstakingMsg =
  | MsgDelegate
  | MsgUndelegate
  | MsgBeginRedelegate
  | MsgCreateValidator
  | MsgEditValidator
  | MsgUpdateMstakingParams;

export namespace MstakingMsg {
  export type Amino =
    | MsgDelegate.Amino
    | MsgUndelegate.Amino
    | MsgBeginRedelegate.Amino
    | MsgCreateValidator.Amino
    | MsgEditValidator.Amino
    | MsgUpdateMstakingParams.Amino;
  export type Data =
    | MsgDelegate.Data
    | MsgUndelegate.Data
    | MsgBeginRedelegate.Data
    | MsgCreateValidator.Data
    | MsgEditValidator.Data
    | MsgUpdateMstakingParams.Data;
  export type Proto =
    | MsgDelegate.Proto
    | MsgUndelegate.Proto
    | MsgBeginRedelegate.Proto
    | MsgCreateValidator.Proto
    | MsgEditValidator.Proto
    | MsgUpdateMstakingParams.Proto;
}
