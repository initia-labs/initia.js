import { MsgVerifyInvariant } from './MsgVerifyInvariant'
import { MsgUpdateCrisisParams } from './MsgUpdateCrisisParams'

export * from './MsgVerifyInvariant'
export * from './MsgUpdateCrisisParams'

export type CrisisMsg = MsgVerifyInvariant | MsgUpdateCrisisParams
export namespace CrisisMsg {
  export type Amino = MsgVerifyInvariant.Amino | MsgUpdateCrisisParams.Amino
  export type Data = MsgVerifyInvariant.Data | MsgUpdateCrisisParams.Data
  export type Proto = MsgVerifyInvariant.Proto | MsgUpdateCrisisParams.Proto
}
