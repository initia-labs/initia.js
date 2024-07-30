import { MsgCreate } from './MsgCreate'
import { MsgCall } from './MsgCall'
import { MsgUpdateEvmParams } from './MsgUpdateEvmParams'

export * from './MsgCreate'
export * from './MsgCall'
export * from './MsgUpdateEvmParams'

export type EvmMsg = MsgCreate | MsgCall | MsgUpdateEvmParams

export namespace EvmMsg {
  export type Amino = MsgCreate.Amino | MsgCall.Amino | MsgUpdateEvmParams.Amino

  export type Data = MsgCreate.Data | MsgCall.Data | MsgUpdateEvmParams.Data

  export type Proto = MsgCreate.Proto | MsgCall.Proto | MsgUpdateEvmParams.Proto
}
