import { base64 } from '@scure/base'
import { createMoveContract } from '../contracts/move/contract'
import type { ChainContext } from '../wallet/chain-context'
import { VIP_ADDRESSES } from './constants'
import { getVipAbi } from './abi'
import { createVipIndexer } from './indexer'
import type {
  Vip,
  VipOptions,
  VipContracts,
  VestingPosition,
  ClaimableReward,
  PositionInfo,
  StageInfo,
  VoteInfo,
} from './types'

// =============================================================================
// Factory
// =============================================================================

/**
 * Creates a VIP client for lock staking, gauge voting, and reward claims.
 *
 * @param ctx - ChainContext for Initia L1 (requires move service)
 * @param options - Override VIP address, network, or indexer
 * @returns Vip instance with curated methods and contract proxies
 */
export function createVip(
  ctx: ChainContext<'initia'>,
  options: VipOptions & { network: 'testnet' }
): Vip<'testnet'>
export function createVip(
  ctx: ChainContext<'initia'>,
  options: VipOptions & { network: 'mainnet' }
): Vip<'mainnet'>
export function createVip(ctx: ChainContext<'initia'>, options?: VipOptions): Vip
export function createVip(
  ctx: ChainContext<'initia'>,
  options?: VipOptions
): Vip<'mainnet'> | Vip<'testnet'> {
  // Detect network from chain context, allow explicit override
  const detectedNetwork = ctx.chainInfo.network === 'testnet' ? 'testnet' : 'mainnet'
  const effectiveNetwork = options?.network ?? detectedNetwork

  // Prevent mixed-network state: if network overridden, require explicit address
  if (options?.network && options.network !== detectedNetwork && !options.vipAddress) {
    throw new Error(
      `Network override "${options.network}" requires explicit vipAddress. ` +
        `Chain ${ctx.chainInfo.chainId} detected as "${detectedNetwork}".`
    )
  }

  // Resolve VIP contract address
  const vipAddress = options?.vipAddress ?? VIP_ADDRESSES[ctx.chainInfo.chainId]
  if (!vipAddress) {
    throw new Error(
      `No VIP address for chain ${ctx.chainInfo.chainId}. ` +
        `Provide options.vipAddress for custom networks.`
    )
  }

  // Create typed contract instances with resolved address
  const { lockStakingAbi, weightVoteAbi, vipAbi } = getVipAbi(
    ctx.chainInfo.chainId,
    effectiveNetwork
  )
  const addr = vipAddress as `0x${string}`

  const lockStaking = createMoveContract(ctx, {
    ...lockStakingAbi,
    address: addr,
  } as typeof lockStakingAbi)
  const weightVote = createMoveContract(ctx, {
    ...weightVoteAbi,
    address: addr,
  } as typeof weightVoteAbi)
  const vipContract = createMoveContract(ctx, { ...vipAbi, address: addr } as typeof vipAbi)

  // Create indexer using effective network (respects override)
  const indexer = options?.indexer ?? createVipIndexer({ network: effectiveNetwork })

  // Helper: resolve address from explicit param or ctx.address
  function requireAddress(addressOverride?: string): string {
    const address = addressOverride ?? ctx.address
    if (!address) {
      throw new Error(
        'VIP operations require an address. Provide an address parameter or create context with signer.'
      )
    }
    return address
  }

  // =========================================================================
  // Lock Staking Methods
  // =========================================================================

  return {
    delegate(params) {
      return lockStaking.execute.delegate(requireAddress(), {
        args: [params.metadata, params.amount as bigint, params.releaseTime, params.validator],
      })
    },

    provideAndDelegate(params) {
      return lockStaking.execute.provide_delegate(requireAddress(), {
        args: [
          params.lpMetadata,
          params.coinAAmount as bigint,
          params.coinBAmount as bigint,
          params.minLiquidity != null ? (params.minLiquidity as bigint) : null,
          params.releaseTime,
          params.validator,
        ],
      })
    },

    stableswapProvideAndDelegate(params) {
      return lockStaking.execute.stableswap_provide_delegate(requireAddress(), {
        args: [
          params.lpMetadata,
          params.amounts as bigint[],
          params.minLiquidity != null ? (params.minLiquidity as bigint) : null,
          params.releaseTime,
          params.validator,
        ],
      })
    },

    undelegate(params) {
      return lockStaking.execute.undelegate(requireAddress(), {
        args: [
          params.metadata,
          params.amount != null ? (params.amount as bigint) : null,
          params.releaseTime,
          params.validator,
        ],
      })
    },

    redelegate(params) {
      return lockStaking.execute.redelegate(requireAddress(), {
        args: [
          params.metadata,
          params.amount != null ? (params.amount as bigint) : null,
          params.srcReleaseTime,
          params.srcValidator,
          params.dstReleaseTime,
          params.dstValidator,
        ],
      })
    },

    extendLock(params) {
      return lockStaking.execute.extend(requireAddress(), {
        args: [
          params.metadata,
          params.amount != null ? (params.amount as bigint) : null,
          params.releaseTime,
          params.validator,
          params.newReleaseTime,
        ],
      })
    },

    claimStakingRewards() {
      return lockStaking.execute.withdraw_delegator_reward(requireAddress(), { args: [] })
    },

    // =========================================================================
    // Gauge Voting Methods
    // =========================================================================

    voteGauge(params) {
      const bridgeIds = params.votes.map(v => v.bridgeId)
      const weights = params.votes.map(v => v.weight)
      return weightVote.execute.vote(requireAddress(), {
        args: [params.cycle, bridgeIds, weights],
      })
    },

    voteGaugeByAmount(params) {
      const bridgeIds = params.votes.map(v => v.bridgeId)
      const amounts = params.votes.map(v => v.amount) as bigint[]
      return weightVote.execute.vote_with_amount(requireAddress(), {
        args: [params.cycle, bridgeIds, amounts],
      })
    },

    // =========================================================================
    // VIP Reward Methods
    // =========================================================================

    async getVestingPositions(addressOverride?: string): Promise<VestingPosition[]> {
      const address = requireAddress(addressOverride)
      return indexer.getVestingPositions(address)
    },

    async getClaimableRewards(addressOverride?: string): Promise<ClaimableReward[]> {
      const address = requireAddress(addressOverride)
      const positions = await indexer.getVestingPositions(address)

      return positions.map(pos => {
        const stages = Array.from(
          { length: pos.endStage - pos.startStage + 1 },
          (_, i) => pos.startStage + i
        )

        // Single proof path decoded, then replicated for each stage
        const decodedProof = pos.merkleProofs.map(b64 => base64.decode(b64))
        const merkleProofs = stages.map(() => decodedProof)

        const l2Score = BigInt(pos.l2Score)

        return {
          bridgeId: pos.bridgeId,
          version: pos.version,
          startStage: pos.startStage,
          endStage: pos.endStage,
          claimableReward: pos.claimableReward,
          _proof: { stages, merkleProofs, l2Score },
        }
      })
    },

    claimRewards(rewards) {
      return rewards.map(r =>
        this.claimRewardsRaw({
          bridgeId: r.bridgeId,
          version: r.version,
          stages: r._proof.stages,
          merkleProofs: r._proof.merkleProofs,
          l2Scores: r._proof.stages.map(() => r._proof.l2Score),
        })
      )
    },

    claimRewardsRaw(params) {
      return vipContract.execute.batch_claim_user_reward_script(requireAddress(), {
        args: [
          params.bridgeId,
          params.version,
          params.stages,
          params.merkleProofs,
          params.l2Scores as bigint[],
        ],
      })
    },

    // =========================================================================
    // Query Methods
    // =========================================================================

    async getPosition(params, addressOverride?: string): Promise<PositionInfo | undefined> {
      const address = requireAddress(addressOverride) as `0x${string}`
      const result = (await lockStaking.view.get_locked_delegations({
        args: [address],
      })) as Array<{
        metadata: string
        validator: string
        locked_share: string
        amount: bigint
        release_time: bigint
      }>

      const match = result.find(d => {
        if (d.metadata !== params.metadata) return false
        if (d.validator !== params.validator) return false
        if (params.releaseTime !== undefined && Number(d.release_time) !== params.releaseTime) {
          return false
        }
        return true
      })

      if (!match) return undefined

      return {
        metadata: match.metadata,
        validator: match.validator,
        shares: BigInt(match.locked_share),
        stakedAmount: BigInt(match.amount),
        releaseTime: Number(match.release_time),
      }
    },

    async getPositions(addressOverride?: string): Promise<PositionInfo[]> {
      const address = requireAddress(addressOverride) as `0x${string}`
      const result = (await lockStaking.view.get_locked_delegations({
        args: [address],
      })) as Array<{
        metadata: string
        validator: string
        locked_share: string
        amount: bigint
        release_time: bigint
      }>

      return result.map(d => ({
        metadata: d.metadata,
        validator: d.validator,
        shares: BigInt(d.locked_share),
        stakedAmount: BigInt(d.amount),
        releaseTime: Number(d.release_time),
      }))
    },

    async getVotingPower(addressOverride?: string): Promise<bigint> {
      const address = requireAddress(addressOverride) as `0x${string}`
      return await weightVote.view.get_voting_power({ args: [address] })
    },

    async getStageInfo(): Promise<StageInfo> {
      const structTag = `${addr}::vip::ModuleStore`
      const store = (await vipContract.resource(addr, structTag)) as {
        stage: string
        stage_start_time: string
        stage_end_time: string
      }

      return {
        currentStage: Number(store.stage),
        stageStartTime: new Date(Number(store.stage_start_time) * 1000),
        stageEndTime: new Date(Number(store.stage_end_time) * 1000),
      }
    },

    async getVoteInfo(cycle?: number, addressOverride?: string): Promise<VoteInfo> {
      const address = requireAddress(addressOverride) as `0x${string}`

      let resolvedCycle = cycle
      if (resolvedCycle === undefined) {
        // Get current cycle from weight_vote ModuleStore
        const structTag = `${addr}::weight_vote::ModuleStore`
        const store = (await weightVote.resource(addr, structTag)) as {
          current_cycle: string
        }
        resolvedCycle = Number(store.current_cycle)
      }

      const result = (await weightVote.view.get_weight_vote({
        args: [resolvedCycle as unknown as bigint, address],
      })) as {
        max_voting_power: bigint
        voting_power: bigint
        weights: Array<{ bridge_id: bigint; weight: string }>
      }

      return {
        maxVotingPower: BigInt(result.max_voting_power),
        votingPower: BigInt(result.voting_power),
        weights: result.weights.map(w => ({
          bridgeId: Number(w.bridge_id),
          weight: BigInt(w.weight),
        })),
      }
    },

    // =========================================================================
    // Contract Proxies (escape hatch)
    // =========================================================================

    contracts: {
      lockStaking,
      weightVote,
      vip: vipContract,
    } as unknown as VipContracts,
  }
}
