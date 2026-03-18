/**
 * Custom Chain Example
 *
 * Demonstrates connecting to an external Cosmos SDK L1 chain
 * with custom proto modules, using CustomProvider and composeProviders.
 *
 * Base cosmos modules (from createBaseConfig):
 *   auth, bank, tx, tendermint, ibc, ibcIca, authz,
 *   feegrant, group, crisis, upgrade, consensus, cosmosAuth
 *
 * Also included (Initia-specific, may return UNIMPLEMENTED on non-Initia chains):
 *   ibcHooks, interTx
 *
 * Usage:
 *   npx tsx examples/custom-chain.ts
 */

import { createCosmosContext } from 'initia.js'
import { CustomProvider, composeProviders, type ChainInfoForType } from 'initia.js/provider'
import { CosmosRegistryProvider } from 'initia.js/cosmos'
import { timestampDate, type Timestamp } from '@bufbuild/protobuf/wkt'

// Helper to safely convert Timestamp to Date
function toDate(ts: Timestamp | undefined): Date | undefined {
  return ts ? timestampDate(ts) : undefined
}

// =============================================================================
// 1. CustomProvider — define chain info manually
// =============================================================================

async function demoCustomProvider() {
  console.log('=== 1. CustomProvider — manual chain configuration ===\n')

  const provider = new CustomProvider([
    {
      chainId: 'osmosis-1',
      chainName: 'Osmosis',
      chainType: 'other',
      network: 'mainnet',
      grpc: 'grpc.osmosis.zone:443',
      nativeDenom: 'uosmo',
      bech32Prefix: 'osmo', // chain-specific
      slip44: 118, // cosmos default
    },
  ])

  console.log(
    'Chains:',
    provider.listChains().map(c => `${c.chainId} (${c.bech32Prefix})`)
  )
  console.log()

  // Create context — no signer needed for queries
  const chainInfo = provider.getChainInfo('osmosis-1') as ChainInfoForType<'other'>
  if (!chainInfo) throw new Error('Chain not found')

  const ctx = createCosmosContext(chainInfo)

  // Query latest block
  try {
    const block = await ctx.client.tendermint.getLatestBlock({})
    const header = block.block?.header
    console.log('Osmosis latest block:')
    console.log(`  Height: ${header?.height}`)
    console.log(`  Time: ${toDate(header?.time)?.toISOString()}`)
    console.log(`  Chain ID: ${header?.chainId}`)
  } catch (err) {
    console.log('  (query failed — gRPC endpoint may be unreachable)')
    console.log(`  Error: ${err instanceof Error ? err.message : String(err)}`)
  }
  console.log()
}

// =============================================================================
// 2. CosmosRegistryProvider — bundled chain-registry data
// =============================================================================

async function demoCosmosRegistry() {
  console.log('=== 2. CosmosRegistryProvider — bundled data ===\n')

  try {
    const cosmos = new CosmosRegistryProvider()
    const sampleChains = cosmos.listChains().slice(0, 5)
    console.log(`Available chains: ${cosmos.listChains().length} total`)
    for (const chain of sampleChains) {
      console.log(`  - ${chain.chainId} (${chain.chainName})`)
    }
    console.log('  ...')
  } catch (err) {
    console.log('  (CosmosRegistryProvider unavailable — chain-registry data issue)')
    console.log(`  Error: ${err instanceof Error ? err.message : String(err)}`)
  }
  console.log()
}

// =============================================================================
// 3. composeProviders — combine multiple providers
// =============================================================================

async function demoComposeProviders() {
  console.log('=== 3. composeProviders — multi-provider composition ===\n')

  // Using two CustomProviders to avoid CosmosRegistryProvider data issues
  const providerA = new CustomProvider([
    {
      chainId: 'osmosis-1',
      chainName: 'Osmosis',
      chainType: 'other',
      network: 'mainnet',
      grpc: 'grpc.osmosis.zone:443',
      nativeDenom: 'uosmo',
      bech32Prefix: 'osmo',
    },
  ])
  const custom = new CustomProvider([
    {
      chainId: 'my-local-1',
      chainName: 'My Local Chain',
      chainType: 'other',
      network: 'local',
      grpc: 'localhost:9090',
      nativeDenom: 'utoken',
      bech32Prefix: 'local',
    },
  ])

  // Option 1: composeProviders utility
  const composed = composeProviders(providerA, custom)
  console.log('Composed provider chains:')
  for (const chain of composed.listChains()) {
    console.log(`  - ${chain.chainId} (from ${chain.network})`)
  }
  console.log()

  // Option 2: providers option on typed factory (async)
  // const ctx = await createCosmosContext({
  //   providers: [cosmos, custom],
  //   chainId: 'osmosis-1',
  // })

  console.log('Both options produce the same result.')
  console.log('First provider wins for duplicate chain IDs.')
  console.log()
}

// =============================================================================
// 4. modules callback — adding custom proto modules
// =============================================================================

async function demoModulesCallback() {
  console.log('=== 4. modules callback — custom proto modules ===\n')

  // For a real custom module, you would import from your BSR package:
  //   import { LiquidStakingQuery } from '@buf/some-chain/some-chain.bufbuild_es/...'
  //   import { LiquidStakingTxMsg } from '@buf/some-chain/some-chain.bufbuild_es/...'
  //
  // Here we use the cosmos-sdk bank service as a placeholder to demonstrate the pattern.

  const { Query: BankQuery } =
    await import('@buf/cosmos_cosmos-sdk.bufbuild_es/cosmos/bank/v1beta1/query_pb')

  const provider = new CustomProvider([
    {
      chainId: 'osmosis-1',
      chainName: 'Osmosis',
      chainType: 'other',
      network: 'mainnet',
      grpc: 'grpc.osmosis.zone:443',
      nativeDenom: 'uosmo',
      bech32Prefix: 'osmo',
    },
  ])

  // Use the async overload with provider + modules callback
  const ctx = await createCosmosContext({
    provider,
    chainId: 'osmosis-1',
    modules: base => base.addModule('customQuery', { query: BankQuery }),
  })

  // Base cosmos modules are preserved
  console.log('Available services:')
  console.log('  bank:', 'bank' in ctx.client ? '✓' : '✗')
  console.log('  tendermint:', 'tendermint' in ctx.client ? '✓' : '✗')
  console.log('  ibc:', 'ibc' in ctx.client ? '✓' : '✗')

  // Custom module is also available
  console.log('  customQuery:', 'customQuery' in ctx.client ? '✓' : '✗')
  console.log()

  // Query using the custom module (same as bank.balance, just under a different name)
  try {
    const result = await (ctx.client as Record<string, any>).customQuery.balance({
      address: 'osmo1fl48vsnmsdzcv85q5d2q4z5ajdha8yu3aq6l09',
      denom: 'uosmo',
    })
    console.log('Custom module query result:')
    console.log(`  balance: ${result.balance?.amount} ${result.balance?.denom}`)
  } catch (err) {
    console.log('  (query failed — gRPC endpoint may be unreachable)')
    console.log(`  Error: ${err instanceof Error ? err.message : String(err)}`)
  }
  console.log()

  // withSigner preserves custom modules
  // const ctx2 = ctx.withSigner(myKey)
  // ctx2.client.customQuery.balance(...)  // still typed ✓
}

// =============================================================================
// Main
// =============================================================================

async function main() {
  console.log('Custom Chain Example')
  console.log('====================\n')

  await demoCustomProvider()
  await demoCosmosRegistry()
  await demoComposeProviders()
  await demoModulesCallback()

  console.log('Done!')
}

main().catch(console.error)
