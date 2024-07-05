import { MsgCreateClient } from './MsgCreateClient'
import { MsgSubmitMisbehaviour } from './MsgSubmitMisbehaviour'
import { MsgUpdateClient } from './MsgUpdateClient'
import { MsgUpgradeClient } from './MsgUpgradeClient'
import { MsgRecoverClient } from './MsgRecoverClient'
import { MsgIBCSoftwareUpgrade } from './MsgIBCSoftwareUpgrade'
import { MsgUpdateIbcClientParams } from './MsgUpdateIbcClientParams'

export * from './MsgCreateClient'
export * from './MsgUpdateClient'
export * from './MsgUpgradeClient'
export * from './MsgSubmitMisbehaviour'
export * from './MsgRecoverClient'
export * from './MsgIBCSoftwareUpgrade'
export * from './MsgUpdateIbcClientParams'

export type IbcClientMsg =
  | MsgCreateClient
  | MsgUpdateClient
  | MsgUpgradeClient
  | MsgSubmitMisbehaviour
  | MsgRecoverClient
  | MsgIBCSoftwareUpgrade
  | MsgUpdateIbcClientParams

export namespace IbcClientMsg {
  export type Data =
    | MsgCreateClient.Data
    | MsgUpdateClient.Data
    | MsgUpgradeClient.Data
    | MsgSubmitMisbehaviour.Data
    | MsgRecoverClient.Data
    | MsgIBCSoftwareUpgrade.Data
    | MsgUpdateIbcClientParams.Data

  export type Proto =
    | MsgCreateClient.Proto
    | MsgUpdateClient.Proto
    | MsgUpgradeClient.Proto
    | MsgSubmitMisbehaviour.Proto
    | MsgRecoverClient.Proto
    | MsgIBCSoftwareUpgrade.Proto
    | MsgUpdateIbcClientParams.Proto
}
