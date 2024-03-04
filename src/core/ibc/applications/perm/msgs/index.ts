import { MsgSetPermissionedRelayer } from './MsgSetPermissionedRelayer';

export * from './MsgSetPermissionedRelayer';

export type IbcPermMsg = MsgSetPermissionedRelayer;
export namespace IbcPermMsg {
  export type Amino = MsgSetPermissionedRelayer.Amino;
  export type Data = MsgSetPermissionedRelayer.Data;
  export type Proto = MsgSetPermissionedRelayer.Proto;
}
