/**
 * Example: OPInit Bridge — L1 ↔ L2 Token Transfers
 *
 * Demonstrates:
 * 1. Discover bridgeable L2 chains
 * 2. Deposit (L1 → L2): initiation-2 → evm-1
 * 3. Withdraw (L2 → L1): evm-1 → initiation-2
 * 4. Track withdrawal status (pending → waiting → claimable)
 * 5. Claim (finalize withdrawal on L1)
 *
 * Prerequisites:
 *   TEST_MNEMONIC env var with funded testnet wallet on both chains.
 *
 * Usage:
 *   npx tsx examples/op-bridge.ts discover
 *   npx tsx examples/op-bridge.ts deposit
 *   npx tsx examples/op-bridge.ts withdraw
 *   npx tsx examples/op-bridge.ts status
 *   npx tsx examples/op-bridge.ts claim
 */

import { createChainContext, MnemonicKey } from 'initia.js'
import { createRegistryProvider, type RegistryProvider } from 'initia.js/provider'
import { TEST_MNEMONIC } from './constants'

const L1_CHAIN = 'initiation-2'
const L2_CHAIN = 'evm-1'

// =============================================================================
// 1. Discover bridgeable chains
// =============================================================================

async function discoverExample(provider: RegistryProvider) {
  console.log('=== Discover Bridgeable Chains ===\n')

  const bridge = provider.bridge
  const chains = bridge.listBridgeableChains()

  for (const chain of chains) {
    console.log(`  ${chain.chainId} (${chain.chainType}) — bridgeId: ${chain.opBridgeId}`)
  }

  console.log(`\nTotal: ${chains.length} bridgeable chain(s)`)

  // Resolve bridgeId for a specific chain
  const bridgeId = bridge.getBridgeId(L2_CHAIN)
  console.log(`\n${L2_CHAIN} bridgeId: ${bridgeId}`)
}

// =============================================================================
// 2. Deposit: L1 → L2
// =============================================================================

async function depositExample(provider: RegistryProvider) {
  console.log('=== Deposit: L1 → L2 ===\n')

  const bridge = provider.bridge
  const key = new MnemonicKey({ mnemonic: TEST_MNEMONIC })

  // Connect to L1 (narrowed to 'initia' for type-safe ophost access)
  const l1Info = provider.getChainInfo<'initia'>(L1_CHAIN)
  if (!l1Info) throw new Error(`Chain ${L1_CHAIN} not found`)
  const l1 = createChainContext(l1Info, { signer: key })

  console.log(`From: ${L1_CHAIN} (${key.address})`)
  console.log(`To:   ${L2_CHAIN}`)
  console.log(`Amount: 1000000uinit (1 INIT)\n`)

  // Create deposit message (L1 → L2)
  // toChain auto-resolves bridgeId from provider
  const depositMsg = bridge.deposit({
    sender: key.address,
    toChain: L2_CHAIN,
    amount: '1000000uinit',
    // to: defaults to sender (same address on L2)
  })

  // Sign and broadcast on L1
  const result = await l1.signAndBroadcast([depositMsg], {
    waitForConfirmation: true,
  })

  if (result.code !== 0) {
    throw new Error(`Deposit failed: ${result.rawLog}`)
  }

  console.log('Deposit successful!')
  console.log(`  Tx: ${result.txHash}`)
  console.log(`  Height: ${result.height}`)
  console.log('\nTokens will appear on L2 after the next output proposal.')
}

// =============================================================================
// 3. Withdraw: L2 → L1
// =============================================================================

async function withdrawExample(provider: RegistryProvider) {
  console.log('=== Withdraw: L2 → L1 ===\n')

  const bridge = provider.bridge
  const key = new MnemonicKey({ mnemonic: TEST_MNEMONIC })

  // Connect to L2 (narrowed to 'minievm' for type-safe evm/opchild access)
  const l2Info = provider.getChainInfo<'minievm'>(L2_CHAIN)
  if (!l2Info) throw new Error(`Chain ${L2_CHAIN} not found`)
  const l2 = createChainContext(l2Info, { signer: key })

  console.log(`From: ${L2_CHAIN} (${key.address})`)
  console.log(`To:   ${L1_CHAIN}`)
  console.log(`Amount: 1000000uinit (1 INIT)\n`)

  // Create withdrawal message (L2 → L1)
  const withdrawMsg = bridge.withdraw({
    sender: key.address,
    amount: '1000000uinit',
    // to: defaults to sender (same address on L1)
  })

  // Sign and broadcast on L2
  const result = await l2.signAndBroadcast([withdrawMsg], {
    waitForConfirmation: true,
  })

  if (result.code !== 0) {
    throw new Error(`Withdraw failed: ${result.rawLog}`)
  }

  console.log('Withdrawal initiated!')
  console.log(`  Tx: ${result.txHash}`)
  console.log(`  Height: ${result.height}`)
  console.log('\nWithdrawal must go through finalization period before claiming on L1.')
  console.log('Use `npx tsx examples/op-bridge.ts status` to track progress.')
}

// =============================================================================
// 4. Track withdrawal status
// =============================================================================

async function statusExample(provider: RegistryProvider) {
  console.log('=== Withdrawal Status ===\n')

  const bridge = provider.bridge
  const key = new MnemonicKey({ mnemonic: TEST_MNEMONIC })

  console.log(`Checking withdrawals for ${key.address} on ${L2_CHAIN}...\n`)

  const withdrawals = await bridge.getWithdrawals(L2_CHAIN, key.address, {
    limit: 10,
  })

  if (withdrawals.length === 0) {
    console.log('No withdrawals found.')
    return
  }

  for (const w of withdrawals) {
    console.log(`Withdrawal #${w.sequence}:`)
    console.log(`  Amount: ${w.amount.amount}${w.amount.denom}`)
    console.log(`  From: ${w.from}`)
    console.log(`  To: ${w.to}`)
    console.log(`  Tx: ${w.txHash}`)

    switch (w.status.status) {
      case 'pending':
        console.log('  Status: PENDING (not yet included in output proposal)')
        break
      case 'waiting':
        console.log(`  Status: WAITING (claimable at ${w.status.claimableAt.toISOString()})`)
        break
      case 'claimable':
        console.log('  Status: CLAIMABLE (ready to finalize on L1)')
        break
      case 'claimed':
        console.log('  Status: CLAIMED (already finalized)')
        break
    }
    console.log()
  }
}

// =============================================================================
// 5. Claim (finalize on L1)
// =============================================================================

async function claimExample(provider: RegistryProvider) {
  console.log('=== Claim Withdrawal on L1 ===\n')

  const bridge = provider.bridge
  const key = new MnemonicKey({ mnemonic: TEST_MNEMONIC })

  // Find claimable withdrawals
  const withdrawals = await bridge.getWithdrawals(L2_CHAIN, key.address)
  const claimable = withdrawals.filter(w => w.status.status === 'claimable')

  if (claimable.length === 0) {
    console.log('No claimable withdrawals found.')
    console.log('Withdrawals need to pass the finalization period before claiming.')
    return
  }

  console.log(`Found ${claimable.length} claimable withdrawal(s)\n`)

  // Claim the first one
  const target = claimable[0]
  console.log(`Claiming withdrawal #${target.sequence}:`)
  console.log(`  Amount: ${target.amount.amount}${target.amount.denom}`)

  // Connect to L1 for claim tx (narrowed to 'initia')
  const l1Info = provider.getChainInfo<'initia'>(L1_CHAIN)
  if (!l1Info) throw new Error(`Chain ${L1_CHAIN} not found`)
  const l1 = createChainContext(l1Info, { signer: key })

  const claimMsg = bridge.claim({
    sender: key.address,
    withdrawal: target,
  })

  const result = await l1.signAndBroadcast([claimMsg], {
    waitForConfirmation: true,
  })

  if (result.code !== 0) {
    throw new Error(`Claim failed: ${result.rawLog}`)
  }

  console.log('\nClaim successful!')
  console.log(`  Tx: ${result.txHash}`)
  console.log(`  Tokens returned to ${target.to} on ${L1_CHAIN}`)
}

// =============================================================================
// Main
// =============================================================================

async function main() {
  const provider = await createRegistryProvider({ network: 'testnet' })
  const demo = process.argv[2] || 'discover'

  switch (demo) {
    case 'discover':
      return discoverExample(provider)
    case 'deposit':
      return depositExample(provider)
    case 'withdraw':
      return withdrawExample(provider)
    case 'status':
      return statusExample(provider)
    case 'claim':
      return claimExample(provider)
    default:
      console.log('Available demos: discover, deposit, withdraw, status, claim')
  }
}

main().catch(err => {
  console.error('Error:', err)
  process.exit(1)
})
