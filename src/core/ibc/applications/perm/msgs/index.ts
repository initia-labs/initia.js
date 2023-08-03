import { MsgUpdateChannelRelayer } from './MsgUpdateChannelRelayer';

export * from './MsgUpdateChannelRelayer';

export type IbcPermMsg = MsgUpdateChannelRelayer;
export namespace IbcPermMsg {
  export type Amino = MsgUpdateChannelRelayer.Amino;
  export type Data = MsgUpdateChannelRelayer.Data;
  export type Proto = MsgUpdateChannelRelayer.Proto;
}
