import { MsgCreate } from './MsgCreate'
import { MsgCreate2 } from './MsgCreate2'
import { MsgCall } from './MsgCall'
import { MsgUpdateEvmParams } from './MsgUpdateEvmParams'

export * from './MsgCreate'
export * from './MsgCreate2'
export * from './MsgCall'
export * from './MsgUpdateEvmParams'

export type EvmMsg = MsgCreate | MsgCreate2 | MsgCall | MsgUpdateEvmParams

export namespace EvmMsg {
  export type Amino =
    | MsgCreate.Amino
    | MsgCreate2.Amino
    | MsgCall.Amino
    | MsgUpdateEvmParams.Amino
  export type Data =
    | MsgCreate.Data
    | MsgCreate2.Data
    | MsgCall.Data
    | MsgUpdateEvmParams.Data
  export type Proto =
    | MsgCreate.Proto
    | MsgCreate2.Proto
    | MsgCall.Proto
    | MsgUpdateEvmParams.Proto
}
