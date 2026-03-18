/**
 * Example: Query at specific block height
 *
 * Demonstrates historical state queries using QueryOptions.height:
 * 1. Get current block height
 * 2. Query balance at current vs historical height
 *
 * Balance changes over time due to staking rewards and fees,
 * making it useful for demonstrating historical queries.
 */

import { createInitiaContext } from 'initia.js'
import { SENDER } from './constants'

async function main() {
  const ctx = await createInitiaContext({ network: 'testnet' })
  const address = SENDER.bech32

  // -------------------------------------------------------------------------
  // 1. Get current block height
  // -------------------------------------------------------------------------
  console.log('=== Get Current Block Height ===\n')

  const latestBlock = await ctx.client.tendermint.getLatestBlock({})
  const currentHeight = latestBlock.block?.header?.height
  if (!currentHeight) throw new Error('Failed to get current block height')
  console.log('Current height:', currentHeight)

  // -------------------------------------------------------------------------
  // 2. Query balance at current height (default behavior)
  // -------------------------------------------------------------------------
  console.log('\n=== Current Balance ===\n')

  const currentBalance = await ctx.client.bank.balance({ address, denom: 'uinit' })
  console.log('uinit balance:', currentBalance.balance?.amount ?? '0')

  // -------------------------------------------------------------------------
  // 3. Query at historical height using QueryOptions.height
  // -------------------------------------------------------------------------
  console.log('\n=== Historical Balance (100 blocks ago) ===\n')

  const historicalHeight = currentHeight - 100n
  console.log('Historical height:', historicalHeight)

  // The SDK injects `x-cosmos-block-height` header automatically
  const historicalBalance = await ctx.client.bank.balance(
    { address, denom: 'uinit' },
    { height: historicalHeight }
  )
  console.log('uinit balance:', historicalBalance.balance?.amount ?? '0')

  // -------------------------------------------------------------------------
  // 4. Compare
  // -------------------------------------------------------------------------
  console.log('\n=== Comparison ===\n')

  const current = BigInt(currentBalance.balance?.amount ?? '0')
  const historical = BigInt(historicalBalance.balance?.amount ?? '0')
  const diff = current - historical

  const toInit = (uinit: bigint) => (Number(uinit) / 1_000_000).toFixed(6)

  console.log(`Current:    ${toInit(current)} INIT`)
  console.log(`Historical: ${toInit(historical)} INIT`)
  console.log(`Difference: ${diff >= 0n ? '+' : ''}${toInit(diff)} INIT (in 100 blocks)`)
}

main().catch(console.error)
