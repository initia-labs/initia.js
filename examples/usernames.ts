/**
 * Example: Initia Usernames (.init domains)
 *
 * This example demonstrates how to:
 * 1. Resolve usernames or addresses with resolve()
 * 2. Basic name↔address resolution
 * 3. Use address format options (hex / bech32)
 * 4. Query records and metadata
 * 5. Check availability and get image URLs
 * 6. Control caching behavior
 * 7. Handle unsupported chains
 *
 * Uses testnet — run with: npx tsx examples/usernames.ts
 */

import { createChainContext, createInitiaContext } from 'initia.js'
import { createRegistryProvider } from 'initia.js/provider'
import { UsernameServiceError } from 'initia.js/usernames'

async function main() {
  const ctx = await createInitiaContext({ network: 'testnet' })

  // =========================================================================
  // 1. resolve() — Username or Address → Address
  // =========================================================================
  console.log('=== resolve() ===\n')

  // Username → resolved address
  const resolved = await ctx.usernames.resolve('init')
  console.log('resolve("init"):', resolved)

  // Address → returned as-is (API lookup finds no username, falls through)
  const passthrough = await ctx.usernames.resolve('0x0000000000000000000000000000000000000001')
  console.log('resolve(address):', passthrough)

  // =========================================================================
  // 2. Basic Resolution
  // =========================================================================
  console.log('\n=== Basic Resolution ===\n')

  // Name → Address (all input formats accepted)
  const address = await ctx.usernames.getAddress('init')
  console.log('getAddress("init"):', address)

  // Same result with .init suffix or mixed case
  const address2 = await ctx.usernames.getAddress('init.init')
  const address3 = await ctx.usernames.getAddress('INIT.INIT')
  console.log('All formats match:', address === address2 && address2 === address3)

  // Address → Name (returns display name with .init suffix)
  if (address) {
    const name = await ctx.usernames.getName(address)
    console.log('getName(address):', name) // 'init.init'
  }

  // Not found → undefined (no error thrown)
  const unknown = await ctx.usernames.getAddress('zzz_nonexistent_12345')
  console.log('Unknown name:', unknown) // undefined

  // =========================================================================
  // 3. Address Format Options
  // =========================================================================
  console.log('\n=== Address Format ===\n')

  if (address) {
    console.log('Default (hex):', address)

    const bech32 = await ctx.usernames.getAddress('init', { format: 'bech32' })
    console.log('Bech32:', bech32) // init1...
  }

  // =========================================================================
  // 4. Record & Metadata
  // =========================================================================
  console.log('\n=== Record & Metadata ===\n')

  const record = await ctx.usernames.getRecord('init')
  if (record) {
    console.log('Name:', record.name)
    console.log('Address:', record.address)
    console.log('Expires:', new Date(record.expiresAt).toISOString())

    // Check expiration
    const daysLeft = (record.expiresAt - Date.now()) / (24 * 60 * 60 * 1000)
    console.log(`Days until expiry: ${Math.floor(daysLeft)}`)
  }

  const metadata = await ctx.usernames.getMetadata('init')
  if (metadata) {
    console.log('Description:', metadata.description)
    console.log('Image:', metadata.image)
  }

  // =========================================================================
  // 5. Utilities
  // =========================================================================
  console.log('\n=== Utilities ===\n')

  // Image URL (synchronous, no API call)
  console.log('Image URL:', ctx.usernames.getImageUrl('init'))

  // Check if a name is available for registration
  const taken = await ctx.usernames.isAvailable('init')
  console.log('"init" available:', taken) // false

  const available = await ctx.usernames.isAvailable('zzz_nonexistent_12345')
  console.log('"zzz_nonexistent_12345" available:', available) // true

  // =========================================================================
  // 6. Cache Control
  // =========================================================================
  console.log('\n=== Cache Control ===\n')

  // Second call uses cache (no API call)
  const cached = await ctx.usernames.getAddress('init')
  console.log('Cached result:', cached)

  // Force fresh data (skip cache)
  const fresh = await ctx.usernames.getAddress('init', { skipCache: true })
  console.log('Fresh result:', fresh)

  // Don't store result in cache (one-off lookup)
  await ctx.usernames.getAddress('init', { cacheTtl: 0 })

  // Invalidate specific entry
  ctx.usernames.invalidateCache('init')

  // Clear all cached entries
  ctx.usernames.clearCache()

  // =========================================================================
  // 7. Unsupported Chains
  // =========================================================================
  console.log('\n=== Unsupported Chain ===\n')

  // Demonstrate error handling for L2 chains (no usernames support).
  // Provider is needed here to enumerate L2 chains via listChains().
  const provider = await createRegistryProvider({ network: 'testnet' })
  const l2Chain = provider.listChains().find(c => c.chainType !== 'initia')
  if (l2Chain) {
    const l2ctx = createChainContext(l2Chain)
    try {
      await l2ctx.usernames.getAddress('init')
    } catch (e) {
      if (e instanceof UsernameServiceError) {
        console.log(`${l2Chain.chainType}: ${e.message}`)
      }
    }
  }
}

main().catch(console.error)
