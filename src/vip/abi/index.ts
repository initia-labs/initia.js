import { LOCK_STAKING_MAINNET_ABI } from './lock-staking-mainnet'
import { LOCK_STAKING_TESTNET_ABI } from './lock-staking-testnet'
import { WEIGHT_VOTE_MAINNET_ABI } from './weight-vote-mainnet'
import { WEIGHT_VOTE_TESTNET_ABI } from './weight-vote-testnet'
import { VIP_MAINNET_ABI } from './vip-mainnet'
import { VIP_TESTNET_ABI } from './vip-testnet'

export {
  LOCK_STAKING_MAINNET_ABI,
  LOCK_STAKING_TESTNET_ABI,
  WEIGHT_VOTE_MAINNET_ABI,
  WEIGHT_VOTE_TESTNET_ABI,
  VIP_MAINNET_ABI,
  VIP_TESTNET_ABI,
}

const TESTNET_CHAIN_IDS = new Set(['initiation-2'])

export interface VipAbiMainnet {
  lockStakingAbi: typeof LOCK_STAKING_MAINNET_ABI
  weightVoteAbi: typeof WEIGHT_VOTE_MAINNET_ABI
  vipAbi: typeof VIP_MAINNET_ABI
}

export interface VipAbiTestnet {
  lockStakingAbi: typeof LOCK_STAKING_TESTNET_ABI
  weightVoteAbi: typeof WEIGHT_VOTE_TESTNET_ABI
  vipAbi: typeof VIP_TESTNET_ABI
}

/**
 * Resolves the correct VIP ABI set for a given chain ID.
 *
 * All three modules (vip, weight_vote, lock_staking) are deployed at different
 * addresses on mainnet vs testnet. Unknown chainId defaults to mainnet ABI.
 */
export function getVipAbi(
  chainId: string,
  networkOverride?: 'mainnet' | 'testnet'
): VipAbiMainnet | VipAbiTestnet {
  const isTestnet = networkOverride ? networkOverride === 'testnet' : TESTNET_CHAIN_IDS.has(chainId)
  if (isTestnet) {
    return {
      lockStakingAbi: LOCK_STAKING_TESTNET_ABI,
      weightVoteAbi: WEIGHT_VOTE_TESTNET_ABI,
      vipAbi: VIP_TESTNET_ABI,
    }
  }
  return {
    lockStakingAbi: LOCK_STAKING_MAINNET_ABI,
    weightVoteAbi: WEIGHT_VOTE_MAINNET_ABI,
    vipAbi: VIP_MAINNET_ABI,
  }
}
