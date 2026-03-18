/**
 * OPInit Bridge type definitions.
 *
 * Types for L1 ↔ L2 deposit, withdrawal, and claim operations.
 */

import type { Numeric } from '../types'
import type { Coin } from '../core/coin'
import type { Message } from '../msgs/types'

/**
 * Deposit options for L1 → L2 token transfer.
 *
 * Use `toChain` for automatic bridgeId resolution from provider,
 * or `bridgeId` for direct specification.
 */
export type DepositOptions = {
  sender: string
  /** L2 recipient address. Defaults to sender if omitted. */
  to?: string
  /** Amount to deposit. String format parsed via parseCoin (e.g., '1000000uinit'). */
  amount: Coin | string
  /** Hook data for L2 execution. Defaults to empty bytes. */
  data?: Uint8Array
} & ({ toChain: string; bridgeId?: never } | { toChain?: never; bridgeId: Numeric })

/**
 * Withdrawal options for L2 → L1 token transfer.
 */
export interface WithdrawOptions {
  sender: string
  /** L1 recipient address. Defaults to sender if omitted. */
  to?: string
  /** Amount to withdraw. String format parsed via parseCoin. */
  amount: Coin | string
}

/**
 * Claim options for finalizing a withdrawal on L1.
 */
export interface ClaimOptions {
  /** Claim executor address (usually the withdrawal recipient). */
  sender: string
  /** Withdrawal data obtained from getWithdrawals(). Must have status 'claimable'. */
  withdrawal: WithdrawalInfo
}

/**
 * Withdrawal information including Executor-provided proof data.
 *
 * Populated by Executor API (basic fields + proof data) and
 * L1 ophost queries (status determination).
 */
export interface WithdrawalInfo {
  sequence: bigint
  /** L2 sender address. */
  from: string
  /** L1 recipient address. */
  to: string
  amount: Coin
  outputIndex: bigint
  bridgeId: bigint
  txHash: string
  /** Withdrawal lifecycle status, determined by L1 queries. */
  status: WithdrawalStatus

  /** Merkle proofs from Executor (hex-encoded). */
  withdrawalProofs: string[]
  /** Output version from Executor (hex-encoded). */
  version: string
  /** Storage root from Executor (hex-encoded). */
  storageRoot: string
  /** Last block hash from Executor (hex-encoded). */
  lastBlockHash: string
}

/**
 * Withdrawal lifecycle status.
 *
 * - pending: Not yet included in any proposed output.
 * - waiting: Included in output, awaiting finalization period.
 * - claimable: Finalization period passed, ready to claim on L1.
 * - claimed: Already finalized on L1.
 */
export type WithdrawalStatus =
  | { status: 'pending' }
  | { status: 'waiting'; claimableAt: Date }
  | { status: 'claimable' }
  | { status: 'claimed' }

// =============================================================================
// Router types — Smart routing via Router API
// =============================================================================

/**
 * Options for finding a transfer route.
 */
export interface RouteOptions {
  /** Transfer amount in minimal denomination (e.g., '1000000'). */
  amount: string
  /** Source chain and asset. */
  source: { chainId: string; denom: string }
  /** Destination chain and asset. */
  dest: { chainId: string; denom: string }
  /** Allow routes that may involve risk (default: true). */
  allowUnsafe?: boolean
  /** Prefer faster routes (default: false). */
  goFast?: boolean
  /** Force an Optimistic withdrawal route. */
  isOpWithdraw?: boolean
}

/**
 * A resolved transfer route from the Router API.
 *
 * Contains amounts, operations, and the raw server response needed
 * for buildTransferMsgs().
 */
export interface Route {
  amountIn: string
  amountOut: string
  source: { chainId: string; denom: string; symbol?: string }
  dest: { chainId: string; denom: string; symbol?: string }
  /** Normalized operations (for display purposes). */
  operations: RouteOperation[]
  estimatedDurationSeconds?: number
  usdAmountIn?: string
  usdAmountOut?: string
  warnings?: string[]
  extraInfos?: string[]
  extraWarnings?: string[]
  /** True if getOpHook() + signOpHook() must be called before buildTransferMsgs(). */
  requiresOpHook?: boolean
  /** @internal Server's original response. Used by buildTransferMsgs(); not intended for user access. */
  _raw: unknown
}

/**
 * A single operation within a route.
 */
export type RouteOperation =
  | { type: 'transfer'; chainId: string; channel: string; denomIn: string; denomOut: string }
  | { type: 'swap'; poolId: string; denomIn: string; denomOut: string }
  | { type: 'op_init_transfer'; denomIn: string; denomOut: string }
  | { type: 'axelar_transfer'; denomIn: string; denomOut: string }
  | { type: 'cctp_transfer'; denomIn: string; denomOut: string }
  | { type: 'layer_zero_transfer'; denomIn: string; denomOut: string }

/**
 * Options for building transfer messages from a route.
 */
export interface BuildTransferMsgsOptions {
  route: Route
  /** Addresses for each chain in the path: [source, ...hops, dest]. */
  addresses: string[]
  /** Slippage tolerance as percentage string (default: '1' = 1%). */
  slippageTolerance?: string
  /** Signed OP Hook data. Required when route.requiresOpHook is true. */
  signedOpHook?: SignedOpHook
  /** Include blacklisted networks (default: false). */
  ignoreBlacklist?: boolean
}

/**
 * A transaction to execute as part of a multi-hop transfer.
 */
export interface TransferTx {
  /** Chain where this transaction should be signed and broadcast. */
  chainId: string
  /** Cosmos messages for signAndBroadcast. */
  cosmosMsgs?: Message[]
  /** EVM transaction data (for native EVM chains). */
  evmTx?: { to: string; data: string; value?: string }
  /** Address that must sign this transaction. */
  signerAddress: string
}

/**
 * Options for requesting OP Hook data.
 */
export interface OpHookOptions {
  sourceAddress: string
  sourceChainId: string
  sourceDenom: string
  destAddress: string
  destChainId: string
  destDenom: string
}

/**
 * Cosmos message in Router API format.
 */
export interface CosmosMsgJson {
  /** JSON-stringified message body */
  msg: string
  /** Protobuf typeUrl (e.g., "/minievm.evm.v1.MsgCall") */
  msg_type_url: string
}

/**
 * OP Hook data returned by the Router API.
 */
export interface OpHookResult {
  chainId: string
  hook: CosmosMsgJson[]
}

/**
 * Signed OP Hook data to pass to buildTransferMsgs().
 */
export interface SignedOpHook {
  hook: string
  signer: string
}

/**
 * Overall transaction state from the Router API.
 */
export type TransferState =
  | 'STATE_SUBMITTED'
  | 'STATE_PENDING'
  | 'STATE_COMPLETED_SUCCESS'
  | 'STATE_COMPLETED_ERROR'
  | 'STATE_ABANDONED'
  | 'STATE_PENDING_ERROR'

/**
 * A single hop in the transfer sequence.
 */
export interface TransferHop {
  srcChainId: string
  dstChainId: string
  state: string
}

/**
 * Asset release info for completed transfers.
 */
export interface TransferAssetRelease {
  chainId: string
  denom: string
  amount?: string
  released: boolean
}

/**
 * Transfer tracking status from the Router API.
 */
export interface TransferStatus {
  /** Overall end-to-end state. */
  state: TransferState
  /** Detailed transfer status for each hop. */
  transfers: unknown[]
  /** Flat list of transfer events in sequence order. */
  transferSequence: TransferHop[]
  /** Next transfer blocking progress, if any. */
  nextBlockingTransfer?: { transferSequenceIndex: number }
  /** Info about released assets at destination. */
  transferAssetRelease?: TransferAssetRelease
  /** Error details if the transaction failed. */
  error?: unknown
}

/**
 * A routable asset from the Router API.
 * Based on @skip-go/client AssetJson + router-api RouterAsset extensions.
 */
export interface RoutableAsset {
  denom: string
  chainId: string
  originDenom: string
  originChainId: string
  symbol?: string
  name?: string
  decimals?: number
  logoUri?: string
  recommendedSymbol?: string
  description?: string
  coingeckoId?: string
  trace: string
  isCw20: boolean
  isEvm: boolean
  isSvm: boolean
  tokenContract?: string
  hidden?: boolean
  forwardContract?: string
  oftOwner?: string
}

/**
 * Query input for cross-chain balance lookup.
 */
export interface BalanceQuery {
  address: string
  denoms: string[]
}

/**
 * Balance result for a single denom.
 */
export interface BalanceResult {
  amount: string
  priceUsd?: string
  valueUsd?: string
}

/**
 * Cross-chain balance response from the Router API.
 * Map of chainId → denom → balance info.
 */
export type RouterBalances = Record<string, Record<string, BalanceResult>>

/**
 * A chain supported by the Router API.
 */
export interface RouterChain {
  chainId: string
  chainName: string
  chainType: string
  pfmEnabled: boolean
  supportsMemo: boolean
  logoUri?: string
  bech32Prefix?: string
  rest?: string
  rpc?: string
  evmFeeAsset?: { decimals: number; name: string; symbol: string }
}

/**
 * Options for cross-chain NFT transfer.
 */
export interface NftTransferOptions {
  fromAddress: string
  fromChainId: string
  toAddress: string
  toChainId: string
  /** Token IDs to transfer (maximum 30). */
  tokenIds: string[]
  /** NFT collection contract address. Pass empty string for Move chains. */
  collectionAddress: string
  /** IBC class ID. Required for cross-chain transfers. */
  classId?: string
  /** IBC class trace for multi-hop transfers. */
  classTrace?: { path: string; baseClassId: string }
  /** Move object addresses (maximum 30). Required for same-chain Move transfers. */
  objectAddresses?: string[]
  /** L1 recovery address for L2→L1→L2 transfers. Defaults to fromAddress. */
  l1RecoverAddress?: string
  /** Outgoing proxy contract address (Wasm chains). */
  outgoingProxy?: string
  /** IBC timeout in seconds (default: 1800). */
  timeout?: number
  /** Include blacklisted networks (default: false). */
  ignoreBlacklist?: boolean
}

/**
 * Result of an NFT transfer message generation.
 */
export interface NftTransferResult {
  msgs: Array<{ typeUrl: string; value: Record<string, unknown> }>
}

// =============================================================================
// High-level helpers
// =============================================================================

/**
 * Options for depositAndWait — deposit L1 → L2 and wait for finalization.
 */
export interface DepositAndWaitOptions {
  sender: string
  /** L2 recipient address. Defaults to sender. */
  to?: string
  /** Target L2 chain (required for watching finalization). */
  toChain: string
  /** Amount to deposit. */
  amount: Coin | string
  /** Hook data for L2 execution. */
  data?: Uint8Array
  /** Sign and broadcast on L1. */
  signAndBroadcast: (msgs: Message[]) => Promise<unknown>
  /** Timeout in milliseconds (default: 5 minutes). */
  timeout?: number
}

/**
 * Options for withdrawAndClaim — withdraw L2 → L1, wait for finalization, and auto-claim.
 */
export interface WithdrawAndClaimOptions {
  sender: string
  /** L1 recipient address. Defaults to sender. */
  to?: string
  /** Amount to withdraw. */
  amount: Coin | string
  /** L2 chain ID. */
  l2ChainId: string
  /** Sign and broadcast withdrawal on L2. */
  signAndBroadcastL2: (msgs: Message[]) => Promise<unknown>
  /** Sign and broadcast claim on L1. */
  signAndBroadcastL1: (msgs: Message[]) => Promise<unknown>
  /** Timeout in milliseconds (default: 2 hours). */
  timeout?: number
}

// =============================================================================
// Bridge Watch types — WebSocket-based real-time monitoring
// =============================================================================

export type DepositEvent =
  | {
      status: 'initiated'
      l1Sequence: bigint
      from: string
      to: string
      amount: string
      bridgeId: bigint
    }
  | {
      status: 'finalized'
      l1Sequence: bigint
      recipient: string
      amount: string
      success: boolean
      reason?: string
    }

export type WithdrawalEvent =
  | { status: 'initiated'; l2Sequence: bigint; from: string; to: string; amount: string }
  | { status: 'proposed'; outputIndex: bigint; l2BlockNumber: bigint }
  | { status: 'waiting'; claimableAt: Date }
  | { status: 'claimable' }
  | { status: 'claimed'; l2Sequence: bigint; from: string; to: string; amount: string }

export interface WatchDepositOptions {
  l2ChainId: string
  l1Sequence?: Numeric
  sender?: string
  recipient?: string
  /** Called on error. If not provided, the watcher logs to console.error and terminates. */
  onError?: (error: unknown) => void
}

export interface WatchWithdrawalOptions {
  l2ChainId: string
  l2Sequence?: Numeric
  sender?: string
  timeout?: number
  /** Called on error. If not provided, the watcher logs to console.error and terminates. */
  onError?: (error: unknown) => void
}

export interface BridgeWatchHandle {
  unsubscribe(): void
}
