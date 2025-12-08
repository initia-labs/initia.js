import { MsgAddBridgeExecutor } from './MsgAddBridgeExecutor'
import { MsgAddFeeWhitelistAddresses } from './MsgAddFeeWhitelistAddresses'
import { MsgUpdateSequencer } from './MsgUpdateSequencer'
import { MsgAddAttestor } from './MsgAddAttestor'
import { MsgRemoveAttestor } from './MsgRemoveAttestor'
import { MsgFinalizeTokenDeposit } from './MsgFinalizeTokenDeposit'
import { MsgInitiateTokenWithdrawal } from './MsgInitiateTokenWithdrawal'
import { MsgRemoveBridgeExecutor } from './MsgRemoveBridgeExecutor'
import { MsgRemoveFeeWhitelistAddresses } from './MsgRemoveFeeWhitelistAddresses'
import { MsgExecuteMessages } from './MsgExecuteMessages'
import { MsgSpendFeePool } from './MsgSpendFeePool'
import { MsgUpdateMinGasPrices } from './MsgUpdateMinGasPrices'
import { MsgUpdateOpchildAdmin } from './MsgUpdateOpchildAdmin'
import { MsgSetBridgeInfo } from './MsgSetBridgeInfo'
import { MsgUpdateOracle } from './MsgUpdateOracle'
import { MsgRegisterL2MigrationInfo } from './MsgRegisterL2MigrationInfo'
import { MsgMigrateToken } from './MsgMigrateToken'
import { MsgUpdateOpchildParams } from './MsgUpdateOpchildParams'

export * from './MsgAddBridgeExecutor'
export * from './MsgAddFeeWhitelistAddresses'
export * from './MsgUpdateSequencer'
export * from './MsgAddAttestor'
export * from './MsgRemoveAttestor'
export * from './MsgFinalizeTokenDeposit'
export * from './MsgInitiateTokenWithdrawal'
export * from './MsgRemoveBridgeExecutor'
export * from './MsgRemoveFeeWhitelistAddresses'
export * from './MsgExecuteMessages'
export * from './MsgSpendFeePool'
export * from './MsgUpdateMinGasPrices'
export * from './MsgUpdateOpchildAdmin'
export * from './MsgSetBridgeInfo'
export * from './MsgUpdateOracle'
export * from './MsgRegisterL2MigrationInfo'
export * from './MsgMigrateToken'
export * from './MsgUpdateOpchildParams'

export type OpchildMsg =
  | MsgAddBridgeExecutor
  | MsgAddFeeWhitelistAddresses
  | MsgUpdateSequencer
  | MsgAddAttestor
  | MsgRemoveAttestor
  | MsgFinalizeTokenDeposit
  | MsgInitiateTokenWithdrawal
  | MsgRemoveBridgeExecutor
  | MsgRemoveFeeWhitelistAddresses
  | MsgExecuteMessages
  | MsgSpendFeePool
  | MsgUpdateMinGasPrices
  | MsgUpdateOpchildAdmin
  | MsgSetBridgeInfo
  | MsgUpdateOracle
  | MsgRegisterL2MigrationInfo
  | MsgMigrateToken
  | MsgUpdateOpchildParams

export namespace OpchildMsg {
  export type Amino =
    | MsgAddBridgeExecutor.Amino
    | MsgAddFeeWhitelistAddresses.Amino
    | MsgUpdateSequencer.Amino
    | MsgAddAttestor.Amino
    | MsgRemoveAttestor.Amino
    | MsgFinalizeTokenDeposit.Amino
    | MsgInitiateTokenWithdrawal.Amino
    | MsgRemoveBridgeExecutor.Amino
    | MsgRemoveFeeWhitelistAddresses.Amino
    | MsgExecuteMessages.Amino
    | MsgSpendFeePool.Amino
    | MsgUpdateMinGasPrices.Amino
    | MsgUpdateOpchildAdmin.Amino
    | MsgSetBridgeInfo.Amino
    | MsgUpdateOracle.Amino
    | MsgRegisterL2MigrationInfo.Amino
    | MsgMigrateToken.Amino
    | MsgUpdateOpchildParams.Amino

  export type Data =
    | MsgAddBridgeExecutor.Data
    | MsgAddFeeWhitelistAddresses.Data
    | MsgUpdateSequencer.Data
    | MsgAddAttestor.Data
    | MsgRemoveAttestor.Data
    | MsgFinalizeTokenDeposit.Data
    | MsgInitiateTokenWithdrawal.Data
    | MsgRemoveBridgeExecutor.Data
    | MsgRemoveFeeWhitelistAddresses.Data
    | MsgExecuteMessages.Data
    | MsgSpendFeePool.Data
    | MsgUpdateMinGasPrices.Data
    | MsgUpdateOpchildAdmin.Data
    | MsgSetBridgeInfo.Data
    | MsgUpdateOracle.Data
    | MsgRegisterL2MigrationInfo.Data
    | MsgMigrateToken.Data
    | MsgUpdateOpchildParams.Data

  export type Proto =
    | MsgAddBridgeExecutor.Proto
    | MsgAddFeeWhitelistAddresses.Proto
    | MsgUpdateSequencer.Proto
    | MsgAddAttestor.Proto
    | MsgRemoveAttestor.Proto
    | MsgFinalizeTokenDeposit.Proto
    | MsgInitiateTokenWithdrawal.Proto
    | MsgRemoveBridgeExecutor.Proto
    | MsgRemoveFeeWhitelistAddresses.Proto
    | MsgExecuteMessages.Proto
    | MsgSpendFeePool.Proto
    | MsgUpdateMinGasPrices.Proto
    | MsgUpdateOpchildAdmin.Proto
    | MsgSetBridgeInfo.Proto
    | MsgUpdateOracle.Proto
    | MsgRegisterL2MigrationInfo.Proto
    | MsgMigrateToken.Proto
    | MsgUpdateOpchildParams.Proto
}
