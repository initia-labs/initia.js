/**
 * Example: Connect to Osmosis using CosmosRegistryProvider
 *
 * This example demonstrates how to:
 * 1. Use CosmosRegistryProvider to access Cosmos ecosystem chains
 * 2. Query balances and blocks on Osmosis mainnet
 * 3. Compare with CustomProvider for manual configuration
 * 4. (Optional) Use Osmosis-specific BSR packages for chain-specific queries
 *
 * CosmosRegistryProvider uses the chain-registry npm package, which provides
 * data for all Cosmos ecosystem chains (Osmosis, Noble, Cosmos Hub, etc.).
 *
 * Prerequisites:
 * - Standard queries work with existing dependencies
 * - For Osmosis-specific modules (pools, gamm), install:
 *   npm install @buf/osmosis-labs_osmosis.bufbuild_es
 *   npm install @buf/osmosis-labs_osmosis.connectrpc_es
 *
 * Note: Osmosis BSR packages are from 2022 and may have compatibility issues
 * with the current chain. Standard Cosmos SDK queries are recommended.
 */

import { createCosmosContext } from 'initia.js'
import { CustomProvider, type ChainInfo, type ChainInfoForType } from 'initia.js/provider'
import { CosmosRegistryProvider } from 'initia.js/cosmos'
import { timestampDate, type Timestamp } from '@bufbuild/protobuf/wkt'

// Helper to safely convert Timestamp to Date
function toDate(ts: Timestamp | undefined): Date | undefined {
  return ts ? timestampDate(ts) : undefined
}

// =============================================================================
// Example 1: Using CosmosRegistryProvider (Recommended)
// =============================================================================

async function exampleWithCosmosRegistry() {
  console.log('=== Example 1: CosmosRegistryProvider (Recommended) ===\n')

  // Create provider - data is bundled from chain-registry npm package
  const provider = new CosmosRegistryProvider()

  // List some available chains
  console.log('Sample of available Cosmos chains:')
  const sampleChains = provider.listChains().slice(0, 5)
  for (const chain of sampleChains) {
    console.log(`  - ${chain.chainId} (${chain.chainName}) [${chain.network}]`)
  }
  console.log(`  ... and ${provider.listChains().length - 5} more chains`)
  console.log()

  // Get Osmosis mainnet
  const osmosis = provider.getChainInfo('osmosis-1')
  if (!osmosis) {
    throw new Error('Osmosis chain not found')
  }

  console.log('Osmosis mainnet config:')
  console.log(`  Chain ID: ${osmosis.chainId}`)
  console.log(`  Chain Type: ${osmosis.chainType}`)
  console.log(`  Network: ${osmosis.network}`)
  console.log(`  Bech32 Prefix: ${osmosis.bech32Prefix}`)
  console.log(`  Native Denom: ${osmosis.nativeDenom}`)
  console.log(`  REST: ${osmosis.rest}`)
  console.log(`  gRPC-Web: ${osmosis.grpcWeb}`)
  console.log()

  // Get other chains
  const noble = provider.getChainInfo('noble-1')
  const cosmoshub = provider.getChainInfo('cosmoshub-4')
  console.log('Other chains available:')
  console.log(`  Noble: ${noble?.chainId} (${noble?.bech32Prefix})`)
  console.log(`  Cosmos Hub: ${cosmoshub?.chainId} (${cosmoshub?.bech32Prefix})`)
  console.log()

  return osmosis
}

// =============================================================================
// Example 2: Filtering chains by options
// =============================================================================

async function exampleWithFiltering() {
  console.log('=== Example 2: Filtering Chains ===\n')

  // Only mainnet chains
  const mainnetProvider = new CosmosRegistryProvider({ testnet: false })
  console.log(`Mainnet chains: ${mainnetProvider.listChains().length}`)

  // Only testnet chains
  const testnetProvider = new CosmosRegistryProvider({ mainnet: false })
  console.log(`Testnet chains: ${testnetProvider.listChains().length}`)

  // Only specific chains
  const selectedProvider = new CosmosRegistryProvider({
    chainNames: ['osmosis', 'noble', 'cosmoshub'],
  })
  console.log(`Selected chains: ${selectedProvider.listChains().length}`)
  for (const chain of selectedProvider.listChains()) {
    console.log(`  - ${chain.chainId}`)
  }
  console.log()
}

// =============================================================================
// Example 3: Using CustomProvider (Manual Configuration)
// =============================================================================

async function exampleWithCustomProvider() {
  console.log('=== Example 3: CustomProvider (Manual) ===\n')

  // For cases where you need manual configuration or custom endpoints
  const customOsmosis: ChainInfo = {
    chainId: 'osmosis-1',
    chainName: 'Osmosis (Custom)',
    chainType: 'other',
    network: 'mainnet',
    rest: 'https://lcd.osmosis.zone',
    grpc: 'osmosis.lavenderfive.com:443',
    grpcWeb: 'https://osmosis-grpc-web.publicnode.com:443',
    nativeDenom: 'uosmo',
    bech32Prefix: 'osmo',
  }

  const provider = new CustomProvider([customOsmosis])
  console.log(`Custom provider chains: ${provider.listChains().length}`)

  const chainInfo = provider.getChainInfo('osmosis-1')
  console.log(`Custom Osmosis REST: ${chainInfo?.rest}`)
  console.log()

  return chainInfo
}

// =============================================================================
// Example 4: Query Osmosis using BaseClient
// =============================================================================

async function queryOsmosis(chainInfo: ChainInfoForType<'other'>) {
  console.log('=== Example 4: Query Osmosis ===\n')

  // Create context (uses BaseClient for 'other' chainType)
  const ctx = createCosmosContext(chainInfo)
  const client = ctx.client

  // Sample Osmosis address (validator)
  const sampleAddress = 'osmo1clpqr4nrk4khgkxj78fcwwh6dl3uw4ep88n0y4'

  try {
    // Query balance
    console.log('Querying balance...')
    const balanceResponse = await client.bank.balance({
      address: sampleAddress,
      denom: 'uosmo',
    })
    console.log(`  Address: ${sampleAddress}`)
    console.log(
      `  Balance: ${balanceResponse.balance?.amount ?? '0'} ${balanceResponse.balance?.denom ?? 'uosmo'}`
    )
    console.log()

    // Query all balances
    console.log('Querying all balances...')
    const allBalancesResponse = await client.bank.allBalances({
      address: sampleAddress,
    })
    console.log(`  Total tokens: ${allBalancesResponse.balances.length}`)
    for (const c of allBalancesResponse.balances.slice(0, 5)) {
      console.log(`    - ${c.amount} ${c.denom}`)
    }
    if (allBalancesResponse.balances.length > 5) {
      console.log(`    ... and ${allBalancesResponse.balances.length - 5} more`)
    }
    console.log()

    // Query latest block
    console.log('Querying latest block...')
    const blockResponse = await client.tendermint.getLatestBlock({})
    const header = blockResponse.block?.header
    console.log(`  Chain ID: ${header?.chainId}`)
    console.log(`  Height: ${header?.height}`)
    console.log(`  Time: ${toDate(header?.time)?.toISOString()}`)
    console.log()

    // Query node info
    console.log('Querying node info...')
    const nodeInfoResponse = await client.tendermint.getNodeInfo({})
    const nodeInfo = nodeInfoResponse.defaultNodeInfo
    console.log(`  Moniker: ${nodeInfo?.moniker}`)
    console.log(`  Network: ${nodeInfo?.network}`)
    console.log(`  Version: ${nodeInfo?.version}`)
    console.log()
  } catch (error) {
    console.error('Query failed:', error)
  }
}

// =============================================================================
// Example 5: Osmosis-specific queries (requires BSR package)
// =============================================================================

async function queryOsmosisSpecific(_chainInfo: ChainInfo) {
  console.log('=== Example 5: Osmosis-specific Queries ===\n')
  console.log('To use Osmosis-specific modules (pools, gamm, etc.):')
  console.log('1. Install BSR packages:')
  console.log('   npm install @buf/osmosis-labs_osmosis.bufbuild_es')
  console.log('   npm install @buf/osmosis-labs_osmosis.connectrpc_es')
  console.log()
  console.log('2. Import and use Osmosis services via modules callback:')
  console.log(`
   import { createCosmosContext } from 'initia.js'
   import { Query as PoolManagerQuery } from '@buf/osmosis-labs_osmosis.bufbuild_es/...'

   const ctx = createCosmosContext(chainInfo, {
     modules: (base) => base.addModule('poolManager', { query: PoolManagerQuery })
   })
   const pools = await ctx.client.poolManager.pools({})
  `)
  console.log()
  console.log('Note: BSR packages (2022) may have compatibility issues with current chain.')
  console.log()
}

// =============================================================================
// Main
// =============================================================================

async function main() {
  console.log('Osmosis CosmosRegistryProvider Example')
  console.log('======================================\n')

  // Example 1: Using CosmosRegistryProvider (recommended)
  const chainInfo = await exampleWithCosmosRegistry()

  // Example 2: Filtering chains
  await exampleWithFiltering()

  // Example 3: Using CustomProvider (manual)
  await exampleWithCustomProvider()

  // Example 4: Query Osmosis (standard Cosmos SDK)
  await queryOsmosis(chainInfo as ChainInfoForType<'other'>)

  // Example 5: Osmosis-specific queries (BSR package required)
  await queryOsmosisSpecific(chainInfo)

  console.log('Done!')
}

main().catch(console.error)
