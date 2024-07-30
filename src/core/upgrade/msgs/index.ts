import { MsgSoftwareUpgrade } from './MsgSoftwareUpgrade'
import { MsgCancelUpgrade } from './MsgCancelUpgrade'

export * from './MsgSoftwareUpgrade'
export * from './MsgCancelUpgrade'

export type UpgradeMsg = MsgSoftwareUpgrade | MsgCancelUpgrade
export namespace UpgradeMsg {
  export type Amino = MsgSoftwareUpgrade.Amino | MsgCancelUpgrade.Amino
  export type Data = MsgSoftwareUpgrade.Data | MsgCancelUpgrade.Data
  export type Proto = MsgSoftwareUpgrade.Proto | MsgCancelUpgrade.Proto
}
