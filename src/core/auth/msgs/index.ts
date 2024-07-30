import { MsgUpdateAuthParams } from './MsgUpdateAuthParams'

export * from './MsgUpdateAuthParams'

export type AuthMsg = MsgUpdateAuthParams
export namespace AuthMsg {
  export type Amino = MsgUpdateAuthParams.Amino
  export type Data = MsgUpdateAuthParams.Data
  export type Proto = MsgUpdateAuthParams.Proto
}
