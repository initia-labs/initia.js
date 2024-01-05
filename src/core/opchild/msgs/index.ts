import { MsgAddValidator } from './MsgAddValidator';
import { MsgRemoveValidator } from './MsgRemoveValidator';
import { MsgFinalizeTokenDeposit } from './MsgFinalizeTokenDeposit';
import { MsgInitiateTokenWithdrawal } from './MsgInitiateTokenWithdrawal';
import { MsgExecuteMessages } from './MsgExecuteMessages';
import { MsgSpendFeePool } from './MsgSpendFeePool';
import { MsgUpdateOpchildParams } from './MsgUpdateOpchildParams';

export * from './MsgAddValidator';
export * from './MsgRemoveValidator';
export * from './MsgFinalizeTokenDeposit';
export * from './MsgInitiateTokenWithdrawal';
export * from './MsgExecuteMessages';
export * from './MsgSpendFeePool';
export * from './MsgUpdateOpchildParams';

export type OpchildMsg =
  | MsgAddValidator
  | MsgRemoveValidator
  | MsgFinalizeTokenDeposit
  | MsgInitiateTokenWithdrawal
  | MsgExecuteMessages
  | MsgSpendFeePool
  | MsgUpdateOpchildParams;

export namespace OpchildMsg {
  export type Amino =
    | MsgAddValidator.Amino
    | MsgRemoveValidator.Amino
    | MsgFinalizeTokenDeposit.Amino
    | MsgInitiateTokenWithdrawal.Amino
    | MsgExecuteMessages.Amino
    | MsgSpendFeePool.Amino
    | MsgUpdateOpchildParams.Amino;

  export type Data =
    | MsgAddValidator.Data
    | MsgRemoveValidator.Data
    | MsgFinalizeTokenDeposit.Data
    | MsgInitiateTokenWithdrawal.Data
    | MsgExecuteMessages.Data
    | MsgSpendFeePool.Data
    | MsgUpdateOpchildParams.Data;

  export type Proto =
    | MsgAddValidator.Proto
    | MsgRemoveValidator.Proto
    | MsgFinalizeTokenDeposit.Proto
    | MsgInitiateTokenWithdrawal.Proto
    | MsgExecuteMessages.Proto
    | MsgSpendFeePool.Proto
    | MsgUpdateOpchildParams.Proto;
}
