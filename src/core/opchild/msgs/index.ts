import { MsgAddValidator } from './MsgAddValidator';
import { MsgRemoveValidator } from './MsgRemoveValidator';
import { MsgFinalizeTokenDeposit } from './MsgFinalizeTokenDeposit';
import { MsgInitiateTokenWithdrawal } from './MsgInitiateTokenWithdrawal';
import { MsgExecuteMessages } from './MsgExecuteMessages';
import { MsgSpendFeePool } from './MsgSpendFeePool';
import { MsgSetBridgeInfo } from './MsgSetBridgeInfo';
import { MsgUpdateOpchildParams } from './MsgUpdateOpchildParams';

export * from './MsgAddValidator';
export * from './MsgRemoveValidator';
export * from './MsgFinalizeTokenDeposit';
export * from './MsgInitiateTokenWithdrawal';
export * from './MsgExecuteMessages';
export * from './MsgSpendFeePool';
export * from './MsgSetBridgeInfo';
export * from './MsgUpdateOpchildParams';

export type OpchildMsg =
  | MsgAddValidator
  | MsgRemoveValidator
  | MsgFinalizeTokenDeposit
  | MsgInitiateTokenWithdrawal
  | MsgExecuteMessages
  | MsgSpendFeePool
  | MsgSetBridgeInfo
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
    | MsgUpdateOpchildParams.Amino;

  export type Data =
    | MsgAddValidator.Data
    | MsgRemoveValidator.Data
    | MsgFinalizeTokenDeposit.Data
    | MsgInitiateTokenWithdrawal.Data
    | MsgExecuteMessages.Data
    | MsgSpendFeePool.Data
    | MsgSetBridgeInfo.Data
    | MsgUpdateOpchildParams.Data;

  export type Proto =
    | MsgAddValidator.Proto
    | MsgRemoveValidator.Proto
    | MsgFinalizeTokenDeposit.Proto
    | MsgInitiateTokenWithdrawal.Proto
    | MsgExecuteMessages.Proto
    | MsgSpendFeePool.Proto
    | MsgSetBridgeInfo.Proto
    | MsgUpdateOpchildParams.Proto;
}
