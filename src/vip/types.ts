import type { Numeric } from '../types'
import type { Message } from '../msgs/types'
import type { TypedMoveContract } from '../contracts/move/types'
import type { LOCK_STAKING_ABI } from './abi/lock-staking'
import type { WEIGHT_VOTE_ABI } from './abi/weight-vote'
import type { VIP_TESTNET_ABI } from './abi/vip-testnet'

// =============================================================================
// Vip Interface
// =============================================================================

export interface Vip {
  // === Lock Staking ===
  delegate(params: DelegateParams): Message
  provideAndDelegate(params: ProvideAndDelegateParams): Message
  stableswapProvideAndDelegate(params: StableswapProvideAndDelegateParams): Message
  undelegate(params: UndelegateParams): Message
  redelegate(params: RedelegateParams): Message
  extendLock(params: ExtendLockParams): Message
  claimStakingRewards(): Message

  // === Gauge Voting ===
  voteGauge(params: GaugeVoteParams): Message
  voteGaugeByAmount(params: GaugeVoteByAmountParams): Message

  // === VIP Rewards ===
  claimRewards(rewards: ClaimableReward[]): Message[]
  claimRewardsRaw(params: ClaimRewardsRawParams): Message

  // === Queries ===
  getVestingPositions(address?: string): Promise<VestingPosition[]>
  getPosition(params: GetPositionParams, address?: string): Promise<PositionInfo | undefined>
  getPositions(address?: string): Promise<PositionInfo[]>
  getVotingPower(address?: string): Promise<bigint>
  getStageInfo(): Promise<StageInfo>
  getVoteInfo(cycle?: number, address?: string): Promise<VoteInfo>
  getClaimableRewards(address?: string): Promise<ClaimableReward[]>

  // === Move Contract Proxies (escape hatch) ===
  contracts: {
    lockStaking: TypedMoveContract<typeof LOCK_STAKING_ABI>
    weightVote: TypedMoveContract<typeof WEIGHT_VOTE_ABI>
    vip: TypedMoveContract<typeof VIP_TESTNET_ABI>
  }
}

// =============================================================================
// Parameter Interfaces
// =============================================================================

export interface DelegateParams {
  metadata: string
  amount: Numeric
  releaseTime: number
  validator: string
}

export interface ProvideAndDelegateParams {
  lpMetadata: string
  coinAAmount: Numeric
  coinBAmount: Numeric
  minLiquidity?: Numeric
  releaseTime: number
  validator: string
}

export interface StableswapProvideAndDelegateParams {
  lpMetadata: string
  amounts: Numeric[]
  minLiquidity?: Numeric
  releaseTime: number
  validator: string
}

export interface UndelegateParams {
  metadata: string
  amount?: Numeric
  releaseTime: number
  validator: string
}

export interface RedelegateParams {
  metadata: string
  amount?: Numeric
  srcReleaseTime: number
  srcValidator: string
  dstReleaseTime: number
  dstValidator: string
}

export interface ExtendLockParams {
  metadata: string
  amount?: Numeric
  releaseTime: number
  validator: string
  newReleaseTime: number
}

export interface GaugeVoteParams {
  cycle: number
  votes: Array<{ bridgeId: number; weight: number }>
}

export interface GaugeVoteByAmountParams {
  cycle: number
  votes: Array<{ bridgeId: number; amount: Numeric }>
}

export interface ClaimRewardsRawParams {
  bridgeId: number
  version: number
  stages: number[]
  merkleProofs: Uint8Array[][]
  l2Scores: Numeric[]
}

export interface GetPositionParams {
  metadata: string
  validator: string
  releaseTime?: number
}

// =============================================================================
// Response Interfaces
// =============================================================================

export interface ClaimableReward {
  bridgeId: number
  version: number
  startStage: number
  endStage: number
  claimableReward: bigint
  /** Internal proof data used by claimRewards() */
  _proof: {
    stages: number[]
    merkleProofs: Uint8Array[][]
    /** Single score per position; replicated for each stage in batch claim */
    l2Score: bigint
  }
}

/** Vesting position from VIP API (indexer) */
export interface VestingPosition {
  bridgeId: number
  version: number
  startStage: number
  endStage: number
  startTime: string
  initialReward: bigint
  claimableReward: bigint
  claimedReward: bigint
  lockedReward: bigint
  claimed: boolean
  /** Single merkle proof path (sibling hashes from leaf to root) */
  merkleProofs: string[]
  l2Score: string
  minimumScore: number
}

/** Normalized from lock_staking.get_locked_delegations */
export interface PositionInfo {
  metadata: string
  validator: string
  shares: bigint
  stakedAmount: bigint
  releaseTime: number
}

/** From vip ModuleStore resource */
export interface StageInfo {
  currentStage: number
  stageStartTime: Date
  stageEndTime: Date
}

/** From weight_vote.get_weight_vote */
export interface VoteInfo {
  maxVotingPower: bigint
  votingPower: bigint
  weights: Array<{ bridgeId: number; weight: bigint }>
}

// =============================================================================
// VIP Indexer
// =============================================================================

export interface VipIndexer {
  getVestingPositions(address: string): Promise<VestingPosition[]>
}

export interface VipIndexerOptions {
  network?: 'mainnet' | 'testnet'
  baseUrl?: string
}

// =============================================================================
// VIP Options
// =============================================================================

export interface VipOptions {
  vipAddress?: string
  indexer?: VipIndexer
}
