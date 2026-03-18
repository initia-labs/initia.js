/**
 * Example: VIP — Lock Staking, Gauge Voting, and Reward Claims
 *
 * Demonstrates:
 * 1. Query stage info and positions
 * 2. Query voting power and vote info
 * 3. Delegate with 30-day lock
 * 4. Vote gauge with multiple bridge weights
 * 5. Claim VIP rewards (indexer + merkle proofs)
 * 6. Escape hatch: direct contract proxy access
 *
 * Prerequisites:
 *   TEST_MNEMONIC env var with funded testnet wallet on Initia L1.
 *
 * Usage:
 *   npx tsx examples/vip.ts query
 *   npx tsx examples/vip.ts delegate
 *   npx tsx examples/vip.ts vote
 *   npx tsx examples/vip.ts claim
 *   npx tsx examples/vip.ts escape-hatch
 */

import { createInitiaContext, MnemonicKey } from 'initia.js'
import { createVip } from 'initia.js/vip'
import { TEST_MNEMONIC } from './constants'

// =============================================================================
// 1. Query: stage info, positions, voting power
// =============================================================================

async function queryExample() {
  console.log('=== VIP Query ===\n')

  const key = new MnemonicKey({ mnemonic: TEST_MNEMONIC })
  const ctx = await createInitiaContext({ network: 'testnet', signer: key })
  const vip = createVip(ctx)

  // Stage info
  const stage = await vip.getStageInfo()
  console.log('Current stage:', stage.currentStage)
  console.log('Stage period:', stage.stageStartTime, '→', stage.stageEndTime)

  // Positions
  const positions = await vip.getPositions()
  console.log('\nPositions:', positions.length)
  for (const pos of positions) {
    console.log(
      `  ${pos.metadata} | ${pos.validator} | amount=${pos.stakedAmount} | unlock=${new Date(pos.releaseTime * 1000).toISOString()}`
    )
  }

  // Voting power
  const power = await vip.getVotingPower()
  console.log('\nVoting power:', power)
}

// =============================================================================
// 2. Delegate with 30-day lock
// =============================================================================

async function delegateExample() {
  console.log('=== VIP Delegate ===\n')

  const key = new MnemonicKey({ mnemonic: TEST_MNEMONIC })
  const ctx = await createInitiaContext({ network: 'testnet', signer: key })
  const vip = createVip(ctx)

  const msg = vip.delegate({
    metadata: '0x1::native_uinit::Coin',
    amount: 1_000_000,
    releaseTime: Math.floor(Date.now() / 1000) + 30 * 24 * 60 * 60,
    validator: 'initvaloper1...', // Replace with actual validator
  })

  const result = await ctx.signAndBroadcast([msg])
  console.log('Delegate tx:', result.txHash)
}

// =============================================================================
// 3. Vote gauge with multiple bridge weights
// =============================================================================

async function voteExample() {
  console.log('=== VIP Gauge Vote ===\n')

  const key = new MnemonicKey({ mnemonic: TEST_MNEMONIC })
  const ctx = await createInitiaContext({ network: 'testnet', signer: key })
  const vip = createVip(ctx)

  // Get current stage to determine cycle
  const stage = await vip.getStageInfo()
  console.log('Current stage:', stage.currentStage)

  const msg = vip.voteGauge({
    cycle: stage.currentStage,
    votes: [
      { bridgeId: 1, weight: 0.5 },
      { bridgeId: 2, weight: 0.3 },
      { bridgeId: 3, weight: 0.2 },
    ],
  })

  const result = await ctx.signAndBroadcast([msg])
  console.log('Vote tx:', result.txHash)
}

// =============================================================================
// 4. Claim VIP rewards
// =============================================================================

async function claimExample() {
  console.log('=== VIP Claim Rewards ===\n')

  const key = new MnemonicKey({ mnemonic: TEST_MNEMONIC })
  const ctx = await createInitiaContext({ network: 'testnet', signer: key })
  const vip = createVip(ctx)

  // Fetch claimable rewards from VIP API (includes merkle proofs)
  const rewards = await vip.getClaimableRewards()
  console.log('Claimable rewards:', rewards.length)

  for (const r of rewards) {
    console.log(
      `  bridgeId=${r.bridgeId} stages=${r.startStage}-${r.endStage} reward=${r.claimableReward}`
    )
  }

  if (rewards.length === 0) {
    console.log('No rewards to claim.')
    return
  }

  // Build claim messages (one per position)
  const msgs = vip.claimRewards(rewards)
  const result = await ctx.signAndBroadcast(msgs)
  console.log('Claim tx:', result.txHash)
}

// =============================================================================
// 5. Escape hatch: direct contract proxy access
// =============================================================================

async function escapeHatchExample() {
  console.log('=== VIP Escape Hatch ===\n')

  const key = new MnemonicKey({ mnemonic: TEST_MNEMONIC })
  const ctx = await createInitiaContext({ network: 'testnet', signer: key })
  const vip = createVip(ctx)

  // Direct view function call via typed proxy
  const delegations = await vip.contracts.lockStaking.view.get_locked_delegations({
    args: [ctx.address! as `0x${string}`],
  })
  console.log('Raw delegations:', delegations)

  // Direct VIP module view
  const bridgeInfos = await vip.contracts.vip.view.get_bridge_infos({ args: [] })
  console.log('Bridge infos:', bridgeInfos)
}

// =============================================================================
// CLI
// =============================================================================

const command = process.argv[2]

switch (command) {
  case 'query':
    queryExample().catch(console.error)
    break
  case 'delegate':
    delegateExample().catch(console.error)
    break
  case 'vote':
    voteExample().catch(console.error)
    break
  case 'claim':
    claimExample().catch(console.error)
    break
  case 'escape-hatch':
    escapeHatchExample().catch(console.error)
    break
  default:
    console.log('Usage: npx tsx examples/vip.ts <query|delegate|vote|claim|escape-hatch>')
}
