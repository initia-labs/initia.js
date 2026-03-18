import { LOCK_STAKING_ABI } from './lock-staking'
import { WEIGHT_VOTE_ABI } from './weight-vote'
import { VIP_MAINNET_ABI } from './vip-mainnet'
import { VIP_TESTNET_ABI } from './vip-testnet'

export { LOCK_STAKING_ABI, WEIGHT_VOTE_ABI, VIP_MAINNET_ABI, VIP_TESTNET_ABI }

const TESTNET_CHAIN_IDS = new Set(['initiation-2'])

/**
 * Resolves the correct VIP ABI set for a given chain ID.
 *
 * - lock_staking and weight_vote ABIs are shared across networks.
 * - vip ABI differs: mainnet has 30 functions, testnet has 28.
 * - Unknown chainId defaults to mainnet ABI (supports custom forks with options.vipAddress).
 */
export function getVipAbi(chainId: string) {
  const vipAbi = TESTNET_CHAIN_IDS.has(chainId) ? VIP_TESTNET_ABI : VIP_MAINNET_ABI

  return {
    lockStakingAbi: LOCK_STAKING_ABI,
    weightVoteAbi: WEIGHT_VOTE_ABI,
    vipAbi,
  }
}
