/**
 * Example: Cache Management
 *
 * This example demonstrates how caching works in initia.js:
 * 1. Automatic ABI caching (Move modules, EVM contracts)
 * 2. Denom↔Contract caching (each direction cached independently)
 * 3. Request deduplication (concurrent calls share one network request)
 * 4. Using clearCache() after contract deployments
 * 5. Multi-chain cache isolation
 *
 * Cached data:
 * - Move module ABI (immutable after deployment)
 * - EVM denom↔contract mappings (immutable)
 *
 * Cache is in-memory LRU with 64 entries per type. No TTL — all cached data is treated as immutable.
 */

import { createInitiaContext } from 'initia.js'
import { createMoveContract } from 'initia.js/move'

async function main() {
  const ctx = await createInitiaContext({ network: 'testnet' })
  console.log('Connected to:', ctx.chainId)

  // ===========================================================================
  // 1. Automatic ABI Caching
  // ===========================================================================
  console.log('\n=== ABI Caching Demo ===\n')

  // First call: Fetches ABI from network
  console.log('First call (network fetch)...')
  const start1 = performance.now()
  const contract1 = await createMoveContract(ctx, '0x1', 'coin')
  const fetchTime = performance.now() - start1
  console.log(`  Took: ${fetchTime.toFixed(2)}ms`)
  console.log(`  Module: ${contract1.moduleName}`)

  // Second call: Returns from cache (no network request)
  console.log('\nSecond call (cached)...')
  const start2 = performance.now()
  await createMoveContract(ctx, '0x1', 'coin')
  const cacheTime = performance.now() - start2
  console.log(`  Took: ${cacheTime.toFixed(2)}ms`)
  console.log(`  Speedup: ${(fetchTime / cacheTime).toFixed(1)}x`)

  // ===========================================================================
  // 2. Request Deduplication
  // ===========================================================================
  console.log('\n=== Request Deduplication Demo ===\n')

  // Clear cache first to demonstrate deduplication
  ctx.client.clearCache()

  // Fire 5 concurrent requests for the same module
  // Only ONE network request is made — all 5 share the same in-flight promise
  console.log('Firing 5 concurrent requests for 0x1::coin...')
  const start3 = performance.now()
  const results = await Promise.all([
    createMoveContract(ctx, '0x1', 'coin'),
    createMoveContract(ctx, '0x1', 'coin'),
    createMoveContract(ctx, '0x1', 'coin'),
    createMoveContract(ctx, '0x1', 'coin'),
    createMoveContract(ctx, '0x1', 'coin'),
  ])
  const dedupTime = performance.now() - start3
  console.log(`  All 5 resolved in: ${dedupTime.toFixed(2)}ms`)
  console.log(`  All same instance: ${results.every(r => r === results[0])}`)

  // ===========================================================================
  // 3. clearCache() Usage
  // ===========================================================================
  console.log('\n=== clearCache() Demo ===\n')

  // Populate cache
  console.log('Populating cache...')
  await createMoveContract(ctx, '0x1', 'coin')

  // Verify cache is working
  const start4 = performance.now()
  await createMoveContract(ctx, '0x1', 'coin')
  const cached = performance.now() - start4
  console.log(`  Cached lookup: ${cached.toFixed(2)}ms`)

  // Clear cache (e.g., after deploying new contract version)
  console.log('\nClearing cache...')
  ctx.client.clearCache()
  console.log('  Cache cleared')

  // Next call will fetch from network again
  const start5 = performance.now()
  await createMoveContract(ctx, '0x1', 'coin')
  const fresh = performance.now() - start5
  console.log(`  Fresh lookup after clear: ${fresh.toFixed(2)}ms`)

  // ===========================================================================
  // 4. When to Clear Cache
  // ===========================================================================
  console.log('\n=== When to Clear Cache ===\n')
  console.log('Use ctx.client.clearCache() after:')
  console.log('  1. Deploying/upgrading a Move module (ABI changed)')
  console.log('  2. Creating new ERC20 wrappers (new denom↔contract mapping)')
  console.log('  3. During testing (ensure fresh state)')

  // ===========================================================================
  // 5. Multi-Chain Cache Isolation
  // ===========================================================================
  console.log('\n=== Multi-Chain Cache Isolation ===\n')
  console.log('Cache keys are prefixed with chainId:')
  console.log('  initiation-2:move:0x1:coin')
  console.log('  move-1:move:0x1:coin')
  console.log('')
  console.log('Same module on different chains = separate cache entries.')
  console.log("clearCache() only affects that client's chain.")

  // ===========================================================================
  // 6. Denom↔Contract Caching (Minievm)
  // ===========================================================================
  console.log('\n=== Denom↔Contract Caching (Minievm) ===\n')
  console.log('On Minievm chains, denom↔contract mappings are cached per direction:')
  console.log('  ctx.client.evm.contractAddrByDenom({ denom: "uusdc" })  // caches denom→contract')
  console.log('  ctx.client.evm.denom({ contractAddr: addr })            // caches contract→denom')
  console.log('Each direction is cached independently after its first lookup.')

  // ===========================================================================
  // Summary
  // ===========================================================================
  console.log('\n=== Summary ===')
  console.log('- ABI is automatically cached after first fetch')
  console.log('- Concurrent requests share one network call')
  console.log('- Use ctx.client.clearCache() after contract deployments')
  console.log('- Each chain has isolated cache (chainId in key)')
  console.log('- Denom mappings are cached per direction')
}

main().catch(console.error)
