/**
 * Example: Oracle Price Feed
 *
 * Queries real-time price data from the on-chain oracle module (0x1::oracle).
 *
 * The oracle exposes a single view function:
 *   get_price(pair_id: String) → (price: u256, timestamp: u64, decimals: u64)
 *
 * Pair IDs follow the "{SYMBOL}/USD" format (e.g., "BTC/USD", "INIT/USD").
 * The actual USD price is: price / 10^decimals.
 */

import { createInitiaContext } from 'initia.js'

// Supported pair IDs (non-exhaustive — oracle supports any pair the validator set feeds)
const PAIRS = ['INIT/USD', 'BTC/USD', 'ETH/USD', 'USDC/USD'] as const

interface OraclePrice {
  pair: string
  price: bigint
  timestamp: number
  decimals: number
  usdPrice: number
}

function parseOracleResponse(pair: string, data: string): OraclePrice {
  const [priceStr, timestampStr, decimalsStr] = JSON.parse(data) as [string, string, string]
  const price = BigInt(priceStr)
  const decimals = Number(decimalsStr)
  const timestamp = Number(timestampStr)
  return {
    pair,
    price,
    timestamp,
    decimals,
    usdPrice: Number(price) / 10 ** decimals,
  }
}

async function main() {
  const ctx = await createInitiaContext({ network: 'mainnet' })

  // -------------------------------------------------------------------------
  // 1. Query a single price
  // -------------------------------------------------------------------------
  console.log('=== Single Price Query ===\n')

  const response = await ctx.client.move.viewJSON({
    address: '0x1',
    moduleName: 'oracle',
    functionName: 'get_price',
    typeArgs: [],
    args: [JSON.stringify('BTC/USD')],
  })

  const btc = parseOracleResponse('BTC/USD', response.data)
  console.log(`${btc.pair}: $${btc.usdPrice.toLocaleString()}`)
  console.log(`  Raw: ${btc.price} (decimals=${btc.decimals})`)
  console.log(`  Timestamp: ${new Date(btc.timestamp * 1000).toISOString()}`)

  // -------------------------------------------------------------------------
  // 2. Query multiple prices
  // -------------------------------------------------------------------------
  console.log('\n=== Multiple Price Queries ===\n')

  const prices = await Promise.all(
    PAIRS.map(async pair => {
      const res = await ctx.client.move.viewJSON({
        address: '0x1',
        moduleName: 'oracle',
        functionName: 'get_price',
        typeArgs: [],
        args: [JSON.stringify(pair)],
      })
      return parseOracleResponse(pair, res.data)
    })
  )

  for (const p of prices) {
    const age = Math.floor(Date.now() / 1000) - p.timestamp
    console.log(`${p.pair.padEnd(10)} $${p.usdPrice.toLocaleString().padStart(14)}  (${age}s ago)`)
  }

  // -------------------------------------------------------------------------
  // 3. Error handling for unknown pairs
  // -------------------------------------------------------------------------
  console.log('\n=== Error Handling ===\n')

  try {
    await ctx.client.move.viewJSON({
      address: '0x1',
      moduleName: 'oracle',
      functionName: 'get_price',
      typeArgs: [],
      args: [JSON.stringify('UNKNOWN/USD')],
    })
  } catch (e) {
    // Unknown pair_id throws VM_EXTENSION_ERROR
    console.log('Expected error for unknown pair:', (e as Error).message.slice(0, 100))
  }
}

main().catch(console.error)
