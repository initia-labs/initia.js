import { MsgChannelOpenInit } from './MsgChannelOpenInit'
import { MsgChannelOpenTry } from './MsgChannelOpenTry'
import { MsgChannelOpenConfirm } from './MsgChannelOpenConfirm'
import { MsgChannelOpenAck } from './MsgChannelOpenAck'
import { MsgChannelCloseInit } from './MsgChannelCloseInit'
import { MsgChannelCloseConfirm } from './MsgChannelCloseConfirm'
import { MsgRecvPacket } from './MsgRecvPacket'
import { MsgAcknowledgement } from './MsgRecvAcknowledgement'
import { MsgTimeout } from './MsgTimeout'
import { MsgTimeoutOnClose } from './MsgTimeoutClose'
import { MsgUpdateIbcChannelParams } from './MsgUpdateIbcChannelParams'

export * from './MsgChannelOpenInit'
export * from './MsgChannelOpenTry'
export * from './MsgChannelOpenConfirm'
export * from './MsgChannelOpenAck'
export * from './MsgChannelCloseInit'
export * from './MsgChannelCloseConfirm'
export * from './MsgRecvPacket'
export * from './MsgRecvAcknowledgement'
export * from './MsgTimeout'
export * from './MsgTimeoutClose'
export * from './MsgUpdateIbcChannelParams'

export type IbcChannelMsg =
  | MsgChannelOpenInit
  | MsgChannelOpenTry
  | MsgChannelOpenConfirm
  | MsgChannelOpenAck
  | MsgChannelCloseInit
  | MsgChannelCloseConfirm
  | MsgRecvPacket
  | MsgAcknowledgement
  | MsgTimeout
  | MsgTimeoutOnClose
  | MsgUpdateIbcChannelParams

export namespace IbcChannelMsg {
  export type Data =
    | MsgChannelOpenInit.Data
    | MsgChannelOpenTry.Data
    | MsgChannelOpenConfirm.Data
    | MsgChannelOpenAck.Data
    | MsgChannelCloseInit.Data
    | MsgChannelCloseConfirm.Data
    | MsgRecvPacket.Data
    | MsgAcknowledgement.Data
    | MsgTimeout.Data
    | MsgTimeoutOnClose.Data
    | MsgUpdateIbcChannelParams.Data

  export type Proto =
    | MsgChannelOpenInit.Proto
    | MsgChannelOpenTry.Proto
    | MsgChannelOpenConfirm.Proto
    | MsgChannelOpenAck.Proto
    | MsgChannelCloseInit.Proto
    | MsgChannelCloseConfirm.Proto
    | MsgRecvPacket.Proto
    | MsgAcknowledgement.Proto
    | MsgTimeout.Proto
    | MsgTimeoutOnClose.Proto
    | MsgUpdateIbcChannelParams.Proto
}
