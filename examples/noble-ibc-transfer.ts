/**
 * Example: Noble USDC IBC Transfer using CosmosRegistryProvider
 *
 * This example demonstrates how to:
 * 1. Use CosmosRegistryProvider to access Noble chain (no manual config needed)
 * 2. Query USDC balance using ChainContext high-level API
 * 3. Create IBC transfer message using ctx.msgs.ibc.transfer()
 * 4. Transfer USDC from Noble to Osmosis
 *
 * Noble is the native issuance chain for USDC in the Cosmos ecosystem.
 * This example shows how to use initia.js with any Cosmos SDK chain.
 *
 * Prerequisites:
 * - No additional packages needed (uses existing Cosmos SDK BSR)
 * - Valid Noble address with USDC balance
 * - IBC channel ID for Noble → destination chain
 *
 * Channel IDs can be found at:
 * - https://github.com/cosmos/chain-registry/tree/master/_IBC
 * - https://www.mintscan.io/noble/relayers
 */

import { MnemonicKey, createChainContext, coin } from 'initia.js'
import { CosmosRegistryProvider } from 'initia.js/cosmos'
import { TEST_MNEMONIC } from './constants'

// =============================================================================
// IBC Channel Information
// =============================================================================

/**
 * IBC Channel IDs for Noble.
 *
 * Find up-to-date channel IDs at:
 * - https://github.com/cosmos/chain-registry/tree/master/_IBC
 * - https://www.mintscan.io/noble/relayers
 *
 * Common Noble channels:
 * - Noble → Osmosis: channel-1
 * - Noble → Cosmos Hub: channel-4
 * - Noble → dYdX: channel-33
 */
const IBC_CHANNELS = {
  'noble-to-osmosis': 'channel-1',
  'noble-to-cosmoshub': 'channel-4',
  'noble-to-dydx': 'channel-33',
}

// =============================================================================
// Example: Setup CosmosRegistryProvider
// =============================================================================

async function setupProvider() {
  console.log('=== Setup: CosmosRegistryProvider with Noble + Osmosis ===\n')

  // Create provider - data is automatically loaded from chain-registry
  // Filter to just the chains we need for this example
  const provider = new CosmosRegistryProvider({
    chainNames: ['noble', 'osmosis'],
  })

  console.log('Available chains:')
  for (const chain of provider.listChains()) {
    console.log(`  - ${chain.chainId} (${chain.chainName}) [${chain.network}]`)
    console.log(`    Bech32: ${chain.bech32Prefix}, Denom: ${chain.nativeDenom}`)
  }
  console.log()

  return provider
}

// =============================================================================
// Example: Query USDC Balance on Noble
// =============================================================================

async function queryNobleBalance(provider: CosmosRegistryProvider, address: string) {
  console.log('=== Query: USDC Balance on Noble ===\n')

  const chainInfo = provider.getChainInfo('noble-1')
  if (!chainInfo) throw new Error('Noble chain not found in provider')

  // Create query-only context (no signer needed)
  const ctx = createChainContext(chainInfo)

  try {
    console.log(`Address: ${address}`)

    // Query USDC balance using high-level API
    const usdcBalances = await ctx.getBalance({ address, denom: 'uusdc' })
    const amount = usdcBalances[0]?.amount ?? '0'
    const usdcAmount = Number(amount) / 1_000_000

    console.log(`USDC Balance: ${usdcAmount.toFixed(6)} USDC (${amount} uusdc)`)
    console.log()

    // Query all balances
    const allBalances = await ctx.getBalance({ address })
    console.log(`Total tokens: ${allBalances.length}`)
    for (const bal of allBalances) {
      console.log(`  - ${bal.amount} ${bal.denom}`)
    }
    console.log()

    return BigInt(amount)
  } catch (error) {
    console.error('Balance query failed:', error)
    return 0n
  }
}

// =============================================================================
// Example: IBC Transfer using ChainContext
// =============================================================================

async function ibcTransfer(
  provider: CosmosRegistryProvider,
  senderMnemonic: string,
  receiverAddress: string, // e.g., osmo1...
  amount: string, // e.g., '1000000' for 1 USDC
  channel: string // e.g., 'channel-1' for Noble → Osmosis
) {
  console.log('=== IBC Transfer: Using ChainContext ===\n')

  const chainInfo = provider.getChainInfo('noble-1')
  if (!chainInfo) throw new Error('Noble chain not found in provider')

  // Create key with Noble prefix
  const key = new MnemonicKey({
    mnemonic: senderMnemonic,
    bech32Prefix: chainInfo.bech32Prefix ?? 'noble',
  })

  // Create context with signer — handles account info, signing, and broadcast
  const ctx = createChainContext(chainInfo, { signer: key })

  console.log(`Sender: ${ctx.address}`)
  console.log(`Receiver: ${receiverAddress}`)
  console.log(`Amount: ${amount} uusdc (${Number(amount) / 1_000_000} USDC)`)
  console.log(`Channel: ${channel}`)
  console.log()

  // Create IBC transfer message
  const timeoutNs = BigInt(Date.now() + 10 * 60 * 1000) * 1_000_000n
  const msg = ctx.msgs.ibc.transfer({
    sender: ctx.address!, // sender on Noble
    receiver: receiverAddress, // receiver on Osmosis
    token: coin('uusdc', amount), // Native USDC
    sourcePort: 'transfer',
    sourceChannel: channel, // IBC channel
    timeoutHeight: { revisionNumber: 0n, revisionHeight: 0n },
    timeoutTimestamp: timeoutNs,
    memo: 'USDC transfer via initia.js SDK',
  })

  console.log(`Message Type: ${msg.typeUrl}`)
  console.log()

  // Sign and broadcast in one call
  // Account info (accountNumber, sequence) is fetched automatically
  console.log('Signing and broadcasting...')
  const result = await ctx.signAndBroadcast([msg], {
    memo: 'IBC Transfer: Noble → Osmosis',
    fee: [{ denom: 'uusdc', amount: '0' }], // Noble has 0 fee for transfers
    gasLimit: 200000,
  })

  console.log('Transaction submitted successfully!')
  console.log(`  Tx Hash: ${result.txHash}`)
  console.log(`  Gas Used: ${result.gasUsed}`)
  console.log()
  console.log('Note: IBC transfers typically take 30-60 seconds to complete.')
  console.log(`Check status at: https://www.mintscan.io/noble/tx/${result.txHash}`)

  return result.txHash
}

// =============================================================================
// Example: Query Balance After Transfer
// =============================================================================

async function verifyTransferOnOsmosis(provider: CosmosRegistryProvider, receiverAddress: string) {
  console.log('\n=== Verify: Balance on Osmosis ===\n')

  const chainInfo = provider.getChainInfo('osmosis-1')
  if (!chainInfo) throw new Error('Osmosis chain not found in provider')

  // Query-only context
  const ctx = createChainContext(chainInfo)

  // IBC denom for Noble USDC on Osmosis
  // This is derived from: sha256('transfer/channel-750/uusdc')
  // Channel-750 is Osmosis's channel to Noble
  const ibcUsdcDenom = 'ibc/498A0751C798A0D9A389AA3691123DADA57DAA4FE165D5C75894505B876BA6E4'

  console.log(`Receiver: ${receiverAddress}`)
  console.log(`IBC USDC Denom: ${ibcUsdcDenom}`)
  console.log()

  try {
    const balances = await ctx.getBalance({
      address: receiverAddress,
      denom: ibcUsdcDenom,
    })

    const amount = balances[0]?.amount ?? '0'
    console.log(`USDC Balance on Osmosis: ${Number(amount) / 1_000_000} USDC`)
  } catch {
    console.log('Could not query Osmosis balance (IBC may still be pending)')
  }
}

// =============================================================================
// Main
// =============================================================================

async function main() {
  console.log('Noble USDC IBC Transfer Example')
  console.log('================================\n')

  // Setup provider with Noble and Osmosis
  const provider = await setupProvider()

  // Example Noble address (for query demo)
  const sampleAddress = 'noble1qqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqq5rpdm5'

  // Query balance (read-only, works without mnemonic)
  await queryNobleBalance(provider, sampleAddress)

  // IBC Transfer (requires valid mnemonic and funded account)
  // Set DEMO_TRANSFER=true to perform an actual transfer
  const DEMO_TRANSFER = false

  if (DEMO_TRANSFER) {
    const mnemonic = TEST_MNEMONIC
    const receiverAddress = 'osmo1your_osmosis_address_here...'
    const amount = '1000000' // 1 USDC
    const channel = IBC_CHANNELS['noble-to-osmosis']

    await ibcTransfer(provider, mnemonic, receiverAddress, amount, channel)

    // Verify on Osmosis (after IBC relay completes)
    await verifyTransferOnOsmosis(provider, receiverAddress)
  } else {
    console.log('=== IBC Transfer Demo ===\n')
    console.log('Set DEMO_TRANSFER=true to perform an actual transfer.\n')
  }

  console.log('\nDone!')
}

main().catch(console.error)
