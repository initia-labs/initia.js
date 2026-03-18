/**
 * Bridge entry point (Node.js) — injects native gRPC transport.
 */
import { createTransport } from './client/transport.node'
import type { ChainInfoProvider } from './provider/types'
import type {
  WatchDepositOptions,
  WatchWithdrawalOptions,
  DepositEvent,
  WithdrawalEvent,
  BridgeWatchHandle,
} from './bridge/types'
import { Bridge as BridgeInternal } from './bridge/bridge'
import {
  watchDeposit as watchDepositInternal,
  watchWithdrawal as watchWithdrawalInternal,
  waitForDeposit as waitForDepositInternal,
  waitForClaimable as waitForClaimableInternal,
} from './bridge/watch'

// Re-export types and utilities unchanged
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
  DepositAndWaitOptions,
  WithdrawAndClaimOptions,
  DepositEvent,
  WithdrawalEvent,
  WatchDepositOptions,
  WatchWithdrawalOptions,
  BridgeWatchHandle,
  RoutableAsset,
} from './bridge/types'
export { calculateWithdrawalHash } from './bridge/hash'
export { fetchWithdrawals, fetchWithdrawal, type FetchWithdrawalsOptions } from './bridge/executor'

// Transport-injecting wrappers — consumer API stays 3-param
export function createBridge(provider: ChainInfoProvider, routerUrl?: string): BridgeInternal {
  return new BridgeInternal(provider, createTransport, routerUrl)
}

// Re-export Bridge class for type usage (consumers should use createBridge() for construction)
export { BridgeInternal as Bridge }

export function watchDeposit(
  provider: ChainInfoProvider,
  options: WatchDepositOptions,
  callback: (event: DepositEvent) => void
): BridgeWatchHandle {
  return watchDepositInternal(provider, options, callback)
}

export function watchWithdrawal(
  provider: ChainInfoProvider,
  options: WatchWithdrawalOptions,
  callback: (event: WithdrawalEvent) => void
): BridgeWatchHandle {
  return watchWithdrawalInternal(provider, options, callback, createTransport)
}

export function waitForDeposit(
  provider: ChainInfoProvider,
  options: WatchDepositOptions & { timeout?: number }
): Promise<DepositEvent & { status: 'finalized' }> {
  return waitForDepositInternal(provider, options)
}

export function waitForClaimable(
  provider: ChainInfoProvider,
  options: WatchWithdrawalOptions & { timeout?: number }
): Promise<WithdrawalEvent & { status: 'claimable' }> {
  return waitForClaimableInternal(provider, options, createTransport)
}
