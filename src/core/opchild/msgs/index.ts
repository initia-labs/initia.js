import { MsgAddBridgeExecutor } from './MsgAddBridgeExecutor'
import { MsgAddFeeWhitelistAddresses } from './MsgAddFeeWhitelistAddresses'
import { MsgAddValidator } from './MsgAddValidator'
import { MsgRemoveValidator } from './MsgRemoveValidator'
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
import { MsgUpdateOpchildParams } from './MsgUpdateOpchildParams'

export * from './MsgAddBridgeExecutor'
export * from './MsgAddFeeWhitelistAddresses'
export * from './MsgAddValidator'
export * from './MsgRemoveValidator'
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
export * from './MsgUpdateOpchildParams'

export type OpchildMsg =
  | MsgAddBridgeExecutor
  | MsgAddFeeWhitelistAddresses
  | MsgAddValidator
  | MsgRemoveValidator
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
  | MsgUpdateOpchildParams

export namespace OpchildMsg {
  export type Amino =
    | MsgAddBridgeExecutor.Amino
    | MsgAddFeeWhitelistAddresses.Amino
    | MsgAddValidator.Amino
    | MsgRemoveValidator.Amino
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
    | MsgUpdateOpchildParams.Amino

  export type Data =
    | MsgAddBridgeExecutor.Data
    | MsgAddFeeWhitelistAddresses.Data
    | MsgAddValidator.Data
    | MsgRemoveValidator.Data
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
    | MsgUpdateOpchildParams.Data

  export type Proto =
    | MsgAddBridgeExecutor.Proto
    | MsgAddFeeWhitelistAddresses.Proto
    | MsgAddValidator.Proto
    | MsgRemoveValidator.Proto
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
    | MsgUpdateOpchildParams.Proto
}
