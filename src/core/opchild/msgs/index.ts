import { MsgAddValidator } from './MsgAddValidator';
import { MsgRemoveValidator } from './MsgRemoveValidator';
import { MsgFinalizeTokenDeposit } from './MsgFinalizeTokenDeposit';
import { MsgInitiateTokenWithdrawal } from './MsgInitiateTokenWithdrawal';
import { MsgExecuteMessages } from './MsgExecuteMessages';
import { MsgSpendFeePool } from './MsgSpendFeePool';
import { MsgSetBridgeInfo } from './MsgSetBridgeInfo';
import { MsgUpdateOracle } from './MsgUpdateOracle';
import { MsgUpdateOpchildParams } from './MsgUpdateOpchildParams';

export * from './MsgAddValidator';
export * from './MsgRemoveValidator';
export * from './MsgFinalizeTokenDeposit';
export * from './MsgInitiateTokenWithdrawal';
export * from './MsgExecuteMessages';
export * from './MsgSpendFeePool';
export * from './MsgSetBridgeInfo';
export * from './MsgUpdateOracle';
export * from './MsgUpdateOpchildParams';

export type OpchildMsg =
  | MsgAddValidator
  | MsgRemoveValidator
  | MsgFinalizeTokenDeposit
  | MsgInitiateTokenWithdrawal
  | MsgExecuteMessages
  | MsgSpendFeePool
  | MsgSetBridgeInfo
  | MsgUpdateOracle
  | MsgUpdateOpchildParams;

export namespace OpchildMsg {
  export type Amino =
    | MsgAddValidator.Amino
    | MsgRemoveValidator.Amino
    | MsgFinalizeTokenDeposit.Amino
    | MsgInitiateTokenWithdrawal.Amino
    | MsgExecuteMessages.Amino
    | MsgSpendFeePool.Amino
    | MsgSetBridgeInfo.Amino
    | MsgUpdateOracle.Amino
    | MsgUpdateOpchildParams.Amino;

  export type Data =
    | MsgAddValidator.Data
    | MsgRemoveValidator.Data
    | MsgFinalizeTokenDeposit.Data
    | MsgInitiateTokenWithdrawal.Data
    | MsgExecuteMessages.Data
    | MsgSpendFeePool.Data
    | MsgSetBridgeInfo.Data
    | MsgUpdateOracle.Data
    | MsgUpdateOpchildParams.Data;

  export type Proto =
    | MsgAddValidator.Proto
    | MsgRemoveValidator.Proto
    | MsgFinalizeTokenDeposit.Proto
    | MsgInitiateTokenWithdrawal.Proto
    | MsgExecuteMessages.Proto
    | MsgSpendFeePool.Proto
    | MsgSetBridgeInfo.Proto
    | MsgUpdateOracle.Proto
    | MsgUpdateOpchildParams.Proto;
}
