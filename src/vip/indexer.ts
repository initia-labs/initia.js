import { fetchJson } from '../util/fetch'
import { VIP_API_BASE_URLS } from './constants'
import type { VipIndexer, VipIndexerOptions, VestingPosition } from './types'

// =============================================================================
// Raw response types — snake_case from VIP API
// =============================================================================

/** Top-level item: one per bridge */
interface RawBridgeEntry {
  bridge_id: number
  version: number
  data: RawVestingData[]
}

/** Nested data item: one per stage range within a bridge */
interface RawVestingData {
  bridge_id: number
  version: number
  start_stage: number
  end_stage: number
  start_time: string
  merkle_proofs: string[]
  total_score: number
  user_score: number
  minimum_score: number
  initial_reward: number
  claimed_reward: number
  claimable_reward: number
  locked_reward: number
  claimed: boolean
}

// =============================================================================
// Factory
// =============================================================================

/**
 * Creates a VIP API client for fetching merkle proofs and vesting positions.
 *
 * @param options - Network selection or custom base URL
 * @returns VipIndexer instance
 */
export function createVipIndexer(options?: VipIndexerOptions): VipIndexer {
  const baseUrl = options?.baseUrl ?? VIP_API_BASE_URLS[options?.network ?? 'mainnet']

  if (!baseUrl) {
    throw new Error(`Unknown VIP API network: ${options?.network}`)
  }

  return {
    async getVestingPositions(address: string): Promise<VestingPosition[]> {
      const raw = await fetchJson<RawBridgeEntry[]>(`${baseUrl}/vesting/positions/${address}`)
      return raw.flatMap(entry => entry.data.map(d => normalizeVestingData(d)))
    },
  }
}

// =============================================================================
// Normalization
// =============================================================================

function normalizeVestingData(raw: RawVestingData): VestingPosition {
  return {
    bridgeId: raw.bridge_id,
    version: raw.version,
    startStage: raw.start_stage,
    endStage: raw.end_stage,
    startTime: raw.start_time,
    initialReward: BigInt(raw.initial_reward),
    claimableReward: BigInt(raw.claimable_reward),
    claimedReward: BigInt(raw.claimed_reward),
    lockedReward: BigInt(raw.locked_reward),
    claimed: raw.claimed,
    merkleProofs: raw.merkle_proofs,
    l2Score: String(raw.user_score),
    minimumScore: raw.minimum_score,
  }
}
