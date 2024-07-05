import { MsgStoreCode } from './MsgStoreCode'
import { MsgInstantiateContract } from './MsgInstantiateContract'
import { MsgInstantiateContractV2 } from './MsgInstantiateContractV2'
import { MsgExecuteContract } from './MsgExecuteContract'
import { MsgMigrateContract } from './MsgMigrateContract'
import { MsgUpdateAdmin } from './MsgUpdateAdmin'
import { MsgClearAdmin } from './MsgClearAdmin'
import { MsgUpdateInstantiateConfig } from './MsgUpdateInstantiateConfig'
import { MsgUpdateWasmParams } from './MsgUpdateWasmParams'
import { MsgSudoContract } from './MsgSudoContract'
import { MsgPinCodes } from './MsgPinCodes'
import { MsgUnpinCodes } from './MsgUnpinCodes'
import { MsgStoreAndInstantiateContract } from './MsgStoreAndInstantiateContract'
import { MsgStoreAndMigrateContract } from './MsgStoreAndMigrateContract'
import { MsgAddCodeUploadParamsAddresses } from './MsgAddCodeUploadParamsAddresses'
import { MsgRemoveCodeUploadParamsAddresses } from './MsgRemoveCodeUploadParamsAddresses'
import { MsgUpdateContractLabel } from './MsgUpdateContractLabel'

export * from './MsgStoreCode'
export * from './MsgInstantiateContract'
export * from './MsgInstantiateContractV2'
export * from './MsgExecuteContract'
export * from './MsgMigrateContract'
export * from './MsgUpdateAdmin'
export * from './MsgClearAdmin'
export * from './MsgUpdateInstantiateConfig'
export * from './MsgUpdateWasmParams'
export * from './MsgSudoContract'
export * from './MsgPinCodes'
export * from './MsgUnpinCodes'
export * from './MsgStoreAndInstantiateContract'
export * from './MsgStoreAndMigrateContract'
export * from './MsgAddCodeUploadParamsAddresses'
export * from './MsgRemoveCodeUploadParamsAddresses'
export * from './MsgUpdateContractLabel'

export type WasmMsg =
  | MsgStoreCode
  | MsgInstantiateContract
  | MsgInstantiateContractV2
  | MsgExecuteContract
  | MsgMigrateContract
  | MsgUpdateAdmin
  | MsgClearAdmin
  | MsgUpdateInstantiateConfig
  | MsgUpdateWasmParams
  | MsgSudoContract
  | MsgPinCodes
  | MsgUnpinCodes
  | MsgStoreAndInstantiateContract
  | MsgStoreAndMigrateContract
  | MsgAddCodeUploadParamsAddresses
  | MsgRemoveCodeUploadParamsAddresses
  | MsgUpdateContractLabel

export namespace WasmMsg {
  export type Amino =
    | MsgStoreCode.Amino
    | MsgInstantiateContract.Amino
    | MsgInstantiateContractV2.Amino
    | MsgExecuteContract.Amino
    | MsgMigrateContract.Amino
    | MsgUpdateAdmin.Amino
    | MsgClearAdmin.Amino
    | MsgUpdateInstantiateConfig.Amino
    | MsgUpdateWasmParams.Amino
    | MsgSudoContract.Amino
    | MsgPinCodes.Amino
    | MsgUnpinCodes.Amino
    | MsgStoreAndInstantiateContract.Amino
    | MsgStoreAndMigrateContract.Amino
    | MsgAddCodeUploadParamsAddresses.Amino
    | MsgRemoveCodeUploadParamsAddresses.Amino
    | MsgUpdateContractLabel.Amino
  export type Data =
    | MsgStoreCode.Data
    | MsgInstantiateContract.Data
    | MsgInstantiateContractV2.Data
    | MsgExecuteContract.Data
    | MsgMigrateContract.Data
    | MsgUpdateAdmin.Data
    | MsgClearAdmin.Data
    | MsgUpdateInstantiateConfig.Data
    | MsgUpdateWasmParams.Data
    | MsgSudoContract.Data
    | MsgPinCodes.Data
    | MsgUnpinCodes.Data
    | MsgStoreAndInstantiateContract.Data
    | MsgStoreAndMigrateContract.Data
    | MsgAddCodeUploadParamsAddresses.Data
    | MsgRemoveCodeUploadParamsAddresses.Data
    | MsgUpdateContractLabel.Data
  export type Proto =
    | MsgStoreCode.Proto
    | MsgInstantiateContract.Proto
    | MsgInstantiateContractV2.Proto
    | MsgExecuteContract.Proto
    | MsgMigrateContract.Proto
    | MsgUpdateAdmin.Proto
    | MsgClearAdmin.Proto
    | MsgUpdateInstantiateConfig.Proto
    | MsgUpdateWasmParams.Proto
    | MsgSudoContract.Proto
    | MsgPinCodes.Proto
    | MsgUnpinCodes.Proto
    | MsgStoreAndInstantiateContract.Proto
    | MsgStoreAndMigrateContract.Proto
    | MsgAddCodeUploadParamsAddresses.Proto
    | MsgRemoveCodeUploadParamsAddresses.Proto
    | MsgUpdateContractLabel.Proto
}
