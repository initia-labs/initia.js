import { MsgActivate } from './MsgActivate';
import { MsgDeactivate } from './MsgDeactivate';
import { MsgUpdateIbcFetchpriceParams } from './MsgUpdateIbcFetchpriceParams';

export * from './MsgActivate';
export * from './MsgDeactivate';
export * from './MsgUpdateIbcFetchpriceParams';

export type IbcFetchpriceMsg =
  | MsgActivate
  | MsgDeactivate
  | MsgUpdateIbcFetchpriceParams;

export namespace IbcFetchpriceMsg {
  export type Amino =
    | MsgActivate.Amino
    | MsgDeactivate.Amino
    | MsgUpdateIbcFetchpriceParams.Amino;

  export type Data =
    | MsgActivate.Data
    | MsgDeactivate.Data
    | MsgUpdateIbcFetchpriceParams.Data;

  export type Proto =
    | MsgActivate.Proto
    | MsgDeactivate.Proto
    | MsgUpdateIbcFetchpriceParams.Proto;
}
