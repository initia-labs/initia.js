import { MsgStoreCodeAdmin } from './MsgStoreCodeAdmin'

export * from './MsgStoreCodeAdmin'

export type WasmExtensionMsg = MsgStoreCodeAdmin

export namespace WasmExtensionMsg {
  export type Amino = MsgStoreCodeAdmin.Amino
  export type Data = MsgStoreCodeAdmin.Data
  export type Proto = MsgStoreCodeAdmin.Proto
}
