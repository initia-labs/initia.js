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
import { MsgUpdateOphostParams } from './MsgUpdateOphostParams'

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
export * from './MsgUpdateOphostParams'

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
  | MsgUpdateOphostParams

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
    | MsgUpdateOphostParams.Amino

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
    | MsgUpdateOphostParams.Data

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
    | MsgUpdateOphostParams.Proto
}
