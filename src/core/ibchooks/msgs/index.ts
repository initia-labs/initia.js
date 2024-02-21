import { MsgUpdateACL } from './MsgUpdateACL';
import { MsgUpdateIbcHooksParams } from './MsgUpdateIbcHooksParams';

export * from './MsgUpdateACL';
export * from './MsgUpdateIbcHooksParams';

export type IbcHooksMsg = MsgUpdateACL | MsgUpdateIbcHooksParams;

export namespace IbcHooksMsg {
  export type Amino = MsgUpdateACL.Amino | MsgUpdateIbcHooksParams.Amino;
  export type Data = MsgUpdateACL.Data | MsgUpdateIbcHooksParams.Data;
  export type Proto = MsgUpdateACL.Proto | MsgUpdateIbcHooksParams.Proto;
}
