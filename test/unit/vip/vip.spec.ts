/**
 * Unit tests for VIP module.
 *
 * Mocks createMoveContract to verify:
 * - Address resolution and error handling
 * - Execute method arg mapping (optional params, array transforms)
 * - getClaimableRewards() base64 decode + l2Score conversion
 * - claimRewards() proof → Message[] mapping
 * - voteGauge() votes array → parallel arrays
 */

import { describe, it, expect, vi, beforeEach } from 'vitest'
import { base64 } from '@scure/base'

// =============================================================================
// Mocks
// =============================================================================

// Capture calls to contract proxies
const executeCalls: Array<{ fn: string; sender: string; args: unknown[] }> = []
const viewCalls: Array<{ fn: string; args: unknown[] }> = []
const resourceCalls: Array<{ address: string; structTag: string }> = []

function createMockProxy(calls: typeof executeCalls | typeof viewCalls, returnValue?: unknown) {
  return new Proxy(
    {},
    {
      get(_, fnName: string) {
        return (...proxyArgs: unknown[]) => {
          if (calls === executeCalls) {
            // execute proxy: (sender, { args })
            const [sender, opts] = proxyArgs as [string, { args: unknown[] }]
            calls.push({ fn: fnName, sender, args: opts?.args ?? [] })
            return { schema: {}, value: {} } // mock Message
          }
          // view proxy: ({ args })
          const [opts] = proxyArgs as [{ args: unknown[] }]
          calls.push({ fn: fnName, sender: '', args: opts?.args ?? [] })
          return Promise.resolve(returnValue)
        }
      },
    }
  )
}

let viewReturnValue: unknown = []
let resourceReturnValue: unknown = {}

const mockContract = {
  execute: createMockProxy(executeCalls),
  view: new Proxy(
    {},
    {
      get(_, fnName: string) {
        return (opts: { args: unknown[] }) => {
          viewCalls.push({ fn: fnName, args: opts?.args ?? [] })
          return Promise.resolve(viewReturnValue)
        }
      },
    }
  ),
  resource: (address: string, structTag: string) => {
    resourceCalls.push({ address, structTag })
    return Promise.resolve(resourceReturnValue)
  },
  moduleAddress: '0xtest',
  moduleName: 'test',
  abi: { address: '0xtest', name: 'test', exposed_functions: [], structs: [] },
}

vi.mock('../../../src/contracts/move/contract', () => ({
  createMoveContract: () => mockContract,
}))

vi.mock('../../../src/vip/indexer', () => ({
  createVipIndexer: () => ({
    getVestingPositions: vi.fn(),
  }),
}))

// Must import after mocks
const { createVip } = await import('../../../src/vip/vip')

// =============================================================================
// Test helpers
// =============================================================================

function makeMockCtx(chainId = 'initiation-2', address = 'init1testaddr') {
  return {
    address,
    chainInfo: {
      chainId,
      chainName: 'test',
      chainType: 'initia' as const,
      network: 'testnet' as const,
    },
    client: { move: {} },
  } as Parameters<typeof createVip>[0]
}

// =============================================================================
// Tests
// =============================================================================

describe('createVip', () => {
  beforeEach(() => {
    executeCalls.length = 0
    viewCalls.length = 0
    resourceCalls.length = 0
    viewReturnValue = []
    resourceReturnValue = {}
  })

  // ===========================================================================
  // Address Resolution
  // ===========================================================================

  describe('address resolution', () => {
    it('should resolve address from known chainId', () => {
      const vip = createVip(makeMockCtx('initiation-2'))
      expect(vip).toBeDefined()
      expect(vip.contracts).toBeDefined()
    })

    it('should throw for unknown chainId without override', () => {
      expect(() => createVip(makeMockCtx('unknown-chain'))).toThrow('No VIP address')
    })

    it('should accept options.vipAddress override', () => {
      const vip = createVip(makeMockCtx('unknown-chain'), {
        vipAddress: '0xcustom',
      })
      expect(vip).toBeDefined()
    })
  })

  // ===========================================================================
  // Execute Methods — Arg Mapping
  // ===========================================================================

  describe('execute methods', () => {
    it('delegate: should map named params to args', () => {
      const vip = createVip(makeMockCtx())
      vip.delegate({
        metadata: '0x1::native_uinit::Coin',
        amount: 1000000n,
        releaseTime: 1700000000,
        validator: 'initvaloper1abc',
      })

      expect(executeCalls).toHaveLength(1)
      expect(executeCalls[0].fn).toBe('delegate')
      expect(executeCalls[0].sender).toBe('init1testaddr')
      expect(executeCalls[0].args).toEqual([
        '0x1::native_uinit::Coin',
        1000000n,
        1700000000,
        'initvaloper1abc',
      ])
    })

    it('undelegate: amount undefined should encode as null (Option::None)', () => {
      const vip = createVip(makeMockCtx())
      vip.undelegate({
        metadata: '0x1::native_uinit::Coin',
        releaseTime: 1700000000,
        validator: 'initvaloper1abc',
      })

      expect(executeCalls[0].args[1]).toBeNull()
    })

    it('provideAndDelegate: minLiquidity undefined should encode as null (Option::None)', () => {
      const vip = createVip(makeMockCtx())
      vip.provideAndDelegate({
        lpMetadata: '0x1::lp',
        coinAAmount: 100n,
        coinBAmount: 200n,
        releaseTime: 1700000000,
        validator: 'initvaloper1abc',
      })

      expect(executeCalls[0].fn).toBe('provide_delegate')
      expect(executeCalls[0].args[3]).toBeNull() // minLiquidity → Option::None
    })

    it('claimStakingRewards: should call withdraw_delegator_reward with empty args', () => {
      const vip = createVip(makeMockCtx())
      vip.claimStakingRewards()

      expect(executeCalls[0].fn).toBe('withdraw_delegator_reward')
      expect(executeCalls[0].args).toEqual([])
    })
  })

  // ===========================================================================
  // Gauge Voting — Array Transform
  // ===========================================================================

  describe('gauge voting', () => {
    it('voteGauge: should transform votes to parallel arrays', () => {
      const vip = createVip(makeMockCtx())
      vip.voteGauge({
        cycle: 5,
        votes: [
          { bridgeId: 1, weight: 0.5 },
          { bridgeId: 2, weight: 0.3 },
          { bridgeId: 3, weight: 0.2 },
        ],
      })

      expect(executeCalls[0].fn).toBe('vote')
      expect(executeCalls[0].args).toEqual([5, [1, 2, 3], [0.5, 0.3, 0.2]])
    })

    it('voteGaugeByAmount: should transform votes to parallel arrays', () => {
      const vip = createVip(makeMockCtx())
      vip.voteGaugeByAmount({
        cycle: 5,
        votes: [
          { bridgeId: 1, amount: 100n },
          { bridgeId: 2, amount: 200n },
        ],
      })

      expect(executeCalls[0].fn).toBe('vote_with_amount')
      expect(executeCalls[0].args).toEqual([5, [1, 2], [100n, 200n]])
    })
  })

  // ===========================================================================
  // getClaimableRewards — Proof Transform
  // ===========================================================================

  describe('getClaimableRewards', () => {
    it('should decode base64 merkle proofs and replicate per stage', async () => {
      const proof1 = new Uint8Array([1, 2, 3])
      const proof2 = new Uint8Array([4, 5, 6])

      const mockIndexer = {
        getVestingPositions: vi.fn().mockResolvedValue([
          {
            bridgeId: 1,
            version: 2,
            startStage: 10,
            endStage: 12,
            claimableReward: 5000n,
            merkleProofs: [base64.encode(proof1), base64.encode(proof2)],
            l2Score: '999',
          },
        ]),
      }

      const vip = createVip(makeMockCtx(), { indexer: mockIndexer })
      const rewards = await vip.getClaimableRewards()

      expect(rewards).toHaveLength(1)

      const r = rewards[0]
      expect(r.bridgeId).toBe(1)
      expect(r.version).toBe(2)
      expect(r.startStage).toBe(10)
      expect(r.endStage).toBe(12)
      expect(r.claimableReward).toBe(5000n)

      // Proof data
      expect(r._proof.stages).toEqual([10, 11, 12])
      expect(r._proof.l2Score).toBe(999n)

      // Merkle proof path replicated for each stage (3 stages)
      expect(r._proof.merkleProofs).toHaveLength(3)
      // Each stage gets the same decoded proof path
      const expectedProof = [proof1, proof2]
      expect(r._proof.merkleProofs[0]).toEqual(expectedProof)
      expect(r._proof.merkleProofs[1]).toEqual(expectedProof)
      expect(r._proof.merkleProofs[2]).toEqual(expectedProof)
    })
  })

  // ===========================================================================
  // claimRewards — Proof → Message Mapping
  // ===========================================================================

  describe('claimRewards', () => {
    it('should map ClaimableReward[] to Message[] via _proof', () => {
      const vip = createVip(makeMockCtx())

      const proof1 = new Uint8Array([1, 2])
      const proof2 = new Uint8Array([3, 4])

      const msgs = vip.claimRewards([
        {
          bridgeId: 1,
          version: 2,
          startStage: 5,
          endStage: 6,
          claimableReward: 1000n,
          _proof: {
            stages: [5, 6],
            merkleProofs: [[proof1], [proof2]],
            l2Score: 500n,
          },
        },
      ])

      expect(msgs).toHaveLength(1)

      // Verify the execute call
      expect(executeCalls).toHaveLength(1)
      expect(executeCalls[0].fn).toBe('batch_claim_user_reward_script')
      expect(executeCalls[0].args).toEqual([
        1, // bridgeId
        2, // version
        [5, 6], // stages
        [[proof1], [proof2]], // merkleProofs
        [500n, 500n], // l2Scores replicated per stage
      ])
    })
  })

  // ===========================================================================
  // Query Methods
  // ===========================================================================

  describe('query methods', () => {
    it('getPositions: should call get_locked_delegations and normalize', async () => {
      viewReturnValue = [
        {
          metadata: '0x1::native_uinit::Coin',
          validator: 'initvaloper1abc',
          locked_share: '1000',
          amount: 500n,
          release_time: 1700000000n,
        },
      ]

      const vip = createVip(makeMockCtx())
      const positions = await vip.getPositions()

      expect(viewCalls[0].fn).toBe('get_locked_delegations')
      expect(viewCalls[0].args).toEqual(['init1testaddr'])

      expect(positions).toHaveLength(1)
      expect(positions[0]).toEqual({
        metadata: '0x1::native_uinit::Coin',
        validator: 'initvaloper1abc',
        shares: 1000n,
        stakedAmount: 500n,
        releaseTime: 1700000000,
      })
    })

    it('getPosition: should filter by metadata+validator+releaseTime', async () => {
      viewReturnValue = [
        {
          metadata: '0x1::native_uinit::Coin',
          validator: 'initvaloper1abc',
          locked_share: '1000',
          amount: 500n,
          release_time: 1700000000n,
        },
        {
          metadata: '0x1::lp',
          validator: 'initvaloper1xyz',
          locked_share: '2000',
          amount: 800n,
          release_time: 1800000000n,
        },
      ]

      const vip = createVip(makeMockCtx())

      const found = await vip.getPosition({
        metadata: '0x1::lp',
        validator: 'initvaloper1xyz',
      })
      expect(found?.metadata).toBe('0x1::lp')

      const notFound = await vip.getPosition({
        metadata: '0x1::nonexistent',
        validator: 'initvaloper1abc',
      })
      expect(notFound).toBeUndefined()
    })

    it('getVotingPower: should call weight_vote.get_voting_power', async () => {
      viewReturnValue = 42000n

      const vip = createVip(makeMockCtx())
      const power = await vip.getVotingPower()

      expect(viewCalls[0].fn).toBe('get_voting_power')
      expect(power).toBe(42000n)
    })

    it('getStageInfo: should query ModuleStore resource', async () => {
      resourceReturnValue = {
        stage: '15',
        stage_start_time: '1700000000',
        stage_end_time: '1700100000',
      }

      const vip = createVip(makeMockCtx())
      const info = await vip.getStageInfo()

      expect(resourceCalls).toHaveLength(1)
      expect(resourceCalls[0].structTag).toContain('::vip::ModuleStore')

      expect(info.currentStage).toBe(15)
      expect(info.stageStartTime).toEqual(new Date(1700000000 * 1000))
      expect(info.stageEndTime).toEqual(new Date(1700100000 * 1000))
    })

    it('getVoteInfo with explicit cycle: should call get_weight_vote', async () => {
      viewReturnValue = {
        max_voting_power: 10000n,
        voting_power: 5000n,
        weights: [
          { bridge_id: 1n, weight: '500000000000000000' },
          { bridge_id: 2n, weight: '300000000000000000' },
        ],
      }

      const vip = createVip(makeMockCtx())
      const info = await vip.getVoteInfo(7)

      expect(viewCalls[0].fn).toBe('get_weight_vote')
      expect(viewCalls[0].args).toEqual([7, 'init1testaddr'])

      expect(info.maxVotingPower).toBe(10000n)
      expect(info.votingPower).toBe(5000n)
      expect(info.weights).toHaveLength(2)
      expect(info.weights[0].bridgeId).toBe(1)
      expect(info.weights[1].bridgeId).toBe(2)
    })
  })

  // ===========================================================================
  // Address override for query methods
  // ===========================================================================

  describe('address override', () => {
    it('getPositions: should use overridden address instead of ctx.address', async () => {
      viewReturnValue = []
      const vip = createVip(makeMockCtx())
      await vip.getPositions('init1override')

      expect(viewCalls[0].args).toEqual(['init1override'])
    })

    it('getPosition: should use overridden address', async () => {
      viewReturnValue = []
      const vip = createVip(makeMockCtx())
      await vip.getPosition({ metadata: '0x1::lp', validator: 'v1' }, 'init1override')

      expect(viewCalls[0].args).toEqual(['init1override'])
    })

    it('getVotingPower: should use overridden address', async () => {
      viewReturnValue = 0n
      const vip = createVip(makeMockCtx())
      await vip.getVotingPower('init1override')

      expect(viewCalls[0].args).toEqual(['init1override'])
    })

    it('getVoteInfo: should use overridden address', async () => {
      viewReturnValue = { max_voting_power: 0n, voting_power: 0n, weights: [] }
      const vip = createVip(makeMockCtx())
      await vip.getVoteInfo(1, 'init1override')

      expect(viewCalls[0].fn).toBe('get_weight_vote')
      expect(viewCalls[0].args).toEqual([1, 'init1override'])
    })

    it('getClaimableRewards: should use overridden address', async () => {
      const mockIndexer = {
        getVestingPositions: vi.fn().mockResolvedValue([]),
      }
      const vip = createVip(makeMockCtx(), { indexer: mockIndexer })
      await vip.getClaimableRewards('init1override')

      expect(mockIndexer.getVestingPositions).toHaveBeenCalledWith('init1override')
    })

    it('query methods should work without ctx.address when override is provided', async () => {
      viewReturnValue = []
      const ctx = makeMockCtx('initiation-2', undefined as unknown as string)
      ;(ctx as { address: undefined }).address = undefined
      const vip = createVip(ctx)

      // Should NOT throw because address override is provided
      await vip.getPositions('init1override')
      expect(viewCalls[0].args).toEqual(['init1override'])
    })
  })

  // ===========================================================================
  // Address requirement
  // ===========================================================================

  describe('address requirement', () => {
    it('should throw when ctx.address is undefined for execute methods', () => {
      const ctx = makeMockCtx('initiation-2', undefined as unknown as string)
      ;(ctx as { address: undefined }).address = undefined
      const vip = createVip(ctx)

      expect(() =>
        vip.delegate({
          metadata: '0x1::native_uinit::Coin',
          amount: 100n,
          releaseTime: 1700000000,
          validator: 'initvaloper1abc',
        })
      ).toThrow('require an address')
    })

    it('should throw when ctx.address is undefined and no override for query methods', async () => {
      const ctx = makeMockCtx('initiation-2', undefined as unknown as string)
      ;(ctx as { address: undefined }).address = undefined
      const vip = createVip(ctx)

      await expect(vip.getPositions()).rejects.toThrow('require an address')
      await expect(vip.getVotingPower()).rejects.toThrow('require an address')
    })
  })
})
