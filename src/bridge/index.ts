/**
 * Unified Bridge for OPInit L1 ↔ L2 transfers and smart routing.
 */

export type {
  DepositOptions,
  WithdrawOptions,
  ClaimOptions,
  WithdrawalInfo,
  WithdrawalStatus,
  RouteOptions,
  Route,
  RouteOperation,
  BuildTransferMsgsOptions,
  TransferTx,
  OpHookOptions,
  OpHookResult,
  SignedOpHook,
  TransferStatus,
  TransferState,
  TransferHop,
  TransferAssetRelease,
  RoutableAsset,
  RouterChain,
  BalanceQuery,
  BalanceResult,
  RouterBalances,
  NftTransferOptions,
  NftTransferResult,
  DepositAndWaitOptions,
  WithdrawAndClaimOptions,
} from './types'

export type {
  DepositEvent,
  WithdrawalEvent,
  WatchDepositOptions,
  WatchWithdrawalOptions,
  BridgeWatchHandle,
} from './types'

export { Bridge } from './bridge'
export { calculateWithdrawalHash } from './hash'
export { fetchWithdrawals, fetchWithdrawal, type FetchWithdrawalsOptions } from './executor'
export { watchDeposit, watchWithdrawal, waitForDeposit, waitForClaimable } from './watch'
