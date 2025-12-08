import { MsgRecordBatch } from './MsgRecordBatch'
import { MsgCreateBridge } from './MsgCreateBridge'
import { MsgProposeOutput } from './MsgProposeOutput'
import { MsgDeleteOutput } from './MsgDeleteOutput'
import { MsgInitiateTokenDeposit } from './MsgInitiateTokenDeposit'
import { MsgFinalizeTokenWithdrawal } from './MsgFinalizeTokenWithdrawal'
import { MsgUpdateProposer } from './MsgUpdateProposer'
import { MsgUpdateChallenger } from './MsgUpdateChallenger'
import { MsgUpdateBatchInfo } from './MsgUpdateBatchInfo'
import { MsgUpdateMetadata } from './MsgUpdateMetadata'
import { MsgUpdateOracleConfig } from './MsgUpdateOracleConfig'
import { MsgUpdateOphostParams } from './MsgUpdateOphostParams'
import { MsgUpdateFinalizationPeriod } from './MsgUpdateFinalizationPeriod'
import { MsgDisableBridge } from './MsgDisableBridge'
import { MsgRegisterL1MigrationInfo } from './MsgRegisterL1MigrationInfo'

export * from './MsgRecordBatch'
export * from './MsgCreateBridge'
export * from './MsgProposeOutput'
export * from './MsgDeleteOutput'
export * from './MsgInitiateTokenDeposit'
export * from './MsgFinalizeTokenWithdrawal'
export * from './MsgUpdateProposer'
export * from './MsgUpdateChallenger'
export * from './MsgUpdateBatchInfo'
export * from './MsgUpdateMetadata'
export * from './MsgUpdateOracleConfig'
export * from './MsgUpdateOphostParams'
export * from './MsgUpdateFinalizationPeriod'
export * from './MsgDisableBridge'
export * from './MsgRegisterL1MigrationInfo'

export type OphostMsg =
  | MsgRecordBatch
  | MsgCreateBridge
  | MsgProposeOutput
  | MsgDeleteOutput
  | MsgInitiateTokenDeposit
  | MsgFinalizeTokenWithdrawal
  | MsgUpdateProposer
  | MsgUpdateChallenger
  | MsgUpdateBatchInfo
  | MsgUpdateMetadata
  | MsgUpdateOracleConfig
  | MsgUpdateOphostParams
  | MsgUpdateFinalizationPeriod
  | MsgDisableBridge
  | MsgRegisterL1MigrationInfo

export namespace OphostMsg {
  export type Amino =
    | MsgRecordBatch.Amino
    | MsgCreateBridge.Amino
    | MsgProposeOutput.Amino
    | MsgDeleteOutput.Amino
    | MsgInitiateTokenDeposit.Amino
    | MsgFinalizeTokenWithdrawal.Amino
    | MsgUpdateProposer.Amino
    | MsgUpdateChallenger.Amino
    | MsgUpdateBatchInfo.Amino
    | MsgUpdateMetadata.Amino
    | MsgUpdateOracleConfig.Amino
    | MsgUpdateOphostParams.Amino
    | MsgUpdateFinalizationPeriod.Amino
    | MsgDisableBridge.Amino
    | MsgRegisterL1MigrationInfo.Amino

  export type Data =
    | MsgRecordBatch.Data
    | MsgCreateBridge.Data
    | MsgProposeOutput.Data
    | MsgDeleteOutput.Data
    | MsgInitiateTokenDeposit.Data
    | MsgFinalizeTokenWithdrawal.Data
    | MsgUpdateProposer.Data
    | MsgUpdateChallenger.Data
    | MsgUpdateBatchInfo.Data
    | MsgUpdateMetadata.Data
    | MsgUpdateOracleConfig.Data
    | MsgUpdateOphostParams.Data
    | MsgUpdateFinalizationPeriod.Data
    | MsgDisableBridge.Data
    | MsgRegisterL1MigrationInfo.Data

  export type Proto =
    | MsgRecordBatch.Proto
    | MsgCreateBridge.Proto
    | MsgProposeOutput.Proto
    | MsgDeleteOutput.Proto
    | MsgInitiateTokenDeposit.Proto
    | MsgFinalizeTokenWithdrawal.Proto
    | MsgUpdateProposer.Proto
    | MsgUpdateChallenger.Proto
    | MsgUpdateBatchInfo.Proto
    | MsgUpdateMetadata.Proto
    | MsgUpdateOracleConfig.Proto
    | MsgUpdateOphostParams.Proto
    | MsgUpdateFinalizationPeriod.Proto
    | MsgDisableBridge.Proto
    | MsgRegisterL1MigrationInfo.Proto
}
