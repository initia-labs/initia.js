/**
 * Example: Asset & IBC Data Provider API
 *
 * Demonstrates the ChainDataProvider system for:
 * 1. Asset lookup and amount conversion
 * 2. Cross-chain transfer path discovery (getTransferPath + getOpBridge)
 * 3. CompositeProvider multi-ecosystem setup
 *
 * No network calls required — all data comes from bundled registries.
 */

import { coin } from 'initia.js'
import {
  createRegistryProvider,
  CustomProvider,
  CompositeProvider,
  type ChainDataProvider,
} from 'initia.js/provider'
import { CosmosRegistryProvider } from 'initia.js/cosmos'

// =============================================================================
// Example 1: Asset Lookup + Amount Conversion
// =============================================================================

async function assetLookupExample(provider: ChainDataProvider) {
  console.log('=== Example 1: Asset Lookup + Amount Conversion ===\n')

  // List all assets for a chain
  const osmosisAssets = await provider.getAssets('osmosis-1')
  console.log(`Osmosis assets: ${osmosisAssets.length}`)
  for (const a of osmosisAssets.slice(0, 3)) {
    console.log(`  - ${a.symbol} (${a.denom}) [${a.decimals} decimals]`)
  }
  if (osmosisAssets.length > 3) {
    console.log(`  ... and ${osmosisAssets.length - 3} more`)
  }
  console.log()

  // Find specific asset by denom
  const uosmo = await provider.findAsset('uosmo', 'osmosis-1')
  if (uosmo) {
    console.log(`Found: ${uosmo.symbol} (${uosmo.name})`)
    console.log(`  Decimals: ${uosmo.decimals}`)
    console.log(`  Type: ${uosmo.typeAsset ?? 'native'}`)
    console.log()

    // Amount conversion: base → display
    const displayAmount = await provider.toDisplayAmount(coin('uosmo', '1500000'), 'osmosis-1')
    console.log(`1500000 uosmo = ${displayAmount} OSMO`)

    // Amount conversion: display → base
    const baseAmount = await provider.toBaseAmount('1.5', 'uosmo', 'osmosis-1')
    console.log(`1.5 OSMO = ${baseAmount} uosmo`)

    // Format with symbol
    const formatted = await provider.formatAmount(coin('uosmo', '1500000'), 'osmosis-1')
    console.log(`Formatted: ${formatted}`)
    console.log()
  }

  // Find assets by symbol across all chains
  const usdcAssets = await provider.findAssetBySymbol('USDC')
  console.log(`USDC found on ${usdcAssets.length} chain(s):`)
  for (const a of usdcAssets.slice(0, 5)) {
    const origin = a.originChainId ? ` (origin: ${a.originChainId})` : ' (native)'
    console.log(`  - ${a.chainId}: ${a.denom}${origin}`)
  }
  console.log()
}

// =============================================================================
// Example 2: Cross-Chain Transfer Path Discovery
// =============================================================================

async function transferPathExample(provider: ChainDataProvider) {
  console.log('=== Example 2: Cross-Chain Transfer Paths ===\n')

  // IBC channels for a chain
  const channels = provider.getIbcChannels('osmosis-1')
  console.log(`Osmosis IBC channels: ${channels.length}`)
  for (const ch of channels.slice(0, 5)) {
    console.log(`  → ${ch.chainId} via ${ch.channelId} (${ch.portId})`)
  }
  if (channels.length > 5) {
    console.log(`  ... and ${channels.length - 5} more`)
  }
  console.log()

  // Find transfer path between two chains
  const path = provider.getTransferPath('osmosis-1', 'noble-1')
  if (path) {
    console.log(`Transfer path: ${path.sourceChainId} → ${path.destChainId}`)
    console.log(`  Channel: ${path.channel}`)
    console.log(`  Port: ${path.port}`)
  } else {
    console.log('No direct IBC path found between osmosis-1 and noble-1')
  }
  console.log()

  // OP Bridge (Initia L1 ↔ L2) — only available for Initia chains
  // provider.getOpBridge('minimove-1') would return bridge info for L2 chains
  console.log('OP Bridge: Only available for Initia L2 chains (via RegistryProvider)')
  console.log()
}

// =============================================================================
// Example 3: CompositeProvider (Multi-Ecosystem)
// =============================================================================

async function compositeProviderExample() {
  console.log('=== Example 3: CompositeProvider (Multi-Ecosystem) ===\n')

  // 1. Create individual providers
  const initiaProvider = await createRegistryProvider({ network: 'mainnet' })

  const cosmosProvider = new CosmosRegistryProvider({
    chainNames: ['osmosis', 'noble', 'cosmoshub'],
    testnet: false,
  })

  const customProvider = new CustomProvider()
  customProvider.addChain({
    chainId: 'my-local-1',
    chainName: 'My Local Chain',
    chainType: 'other',
    network: 'local',
    grpc: 'localhost:9090',
    nativeDenom: 'ulocal',
    assets: [
      {
        chainId: 'my-local-1',
        denom: 'ulocal',
        symbol: 'LOCAL',
        name: 'Local Token',
        display: 'local',
        denomUnits: [
          { denom: 'ulocal', exponent: 0 },
          { denom: 'local', exponent: 6 },
        ],
        decimals: 6,
      },
    ],
  })

  // 2. Combine: first provider wins for duplicate chainIds
  const composite = new CompositeProvider([
    initiaProvider, // Initia ecosystem (highest priority)
    cosmosProvider, // Cosmos ecosystem
    customProvider, // Custom/local chains (lowest priority)
  ])

  console.log(`Total chains: ${composite.listChains().length}`)
  console.log(`Providers: ${composite.providerCount}`)
  console.log()

  // 3. Access chains from any ecosystem
  const osmosis = composite.getChainInfo('osmosis-1')
  console.log(`Osmosis: ${osmosis?.chainId} (${osmosis?.chainType})`)

  const local = composite.getChainInfo('my-local-1')
  console.log(`Local: ${local?.chainId} (${local?.chainType})`)
  console.log()

  // 4. Resolve chain name → chain ID
  const id = composite.resolveChainId('Osmosis')
  console.log(`resolveChainId('Osmosis') = ${id}`)

  const name = composite.getChainName('osmosis-1')
  console.log(`getChainName('osmosis-1') = ${name}`)
  console.log()

  // 5. Cross-provider asset search
  const allAssets = await composite.listAssets()
  console.log(`Total assets across all providers: ${allAssets.length}`)

  const localAssets = await composite.getAssets('my-local-1')
  console.log(`Local chain assets: ${localAssets.length}`)

  // 6. Amount conversion works for any provider's chain
  const formatted = await composite.formatAmount(coin('ulocal', '2500000'), 'my-local-1')
  console.log(`Custom chain format: ${formatted}`)
  console.log()

  return composite
}

// =============================================================================
// Example 4: Handling originChainId
// =============================================================================

async function originChainExample(provider: ChainDataProvider) {
  console.log('=== Example 4: Tracing Asset Origin ===\n')

  // Find an IBC asset (originChainId will be set)
  const allAssets = await provider.listAssets({ chainId: 'osmosis-1' })
  const ibcAsset = allAssets.find(a => a.originChainId)

  if (ibcAsset) {
    console.log(`Asset: ${ibcAsset.symbol} on ${ibcAsset.chainId}`)
    console.log(`  Denom: ${ibcAsset.denom}`)
    console.log(`  Origin chain: ${ibcAsset.originChainId}`)
    console.log(`  Origin denom: ${ibcAsset.originDenom}`)

    // Resolve origin chain name
    if (ibcAsset.originChainId) {
      const originName = provider.getChainName(ibcAsset.originChainId)
      console.log(`  Origin chain name: ${originName ?? 'unknown'}`)
    }
  } else {
    console.log('No IBC assets found (try with more chains)')
  }

  // Native assets have undefined originChainId
  const nativeAsset = allAssets.find(a => !a.originChainId)
  if (nativeAsset) {
    console.log(`\nNative asset: ${nativeAsset.symbol} on ${nativeAsset.chainId}`)
    console.log(`  originChainId: ${nativeAsset.originChainId ?? 'undefined (native)'}`)
  }
  console.log()
}

// =============================================================================
// Main
// =============================================================================

async function main() {
  console.log('Provider Assets & IBC Data Example')
  console.log('===================================\n')

  // Use CosmosRegistryProvider for examples 1, 2, 4 (no network calls needed)
  const provider = new CosmosRegistryProvider({
    chainNames: ['osmosis', 'noble', 'cosmoshub'],
    testnet: false,
  })

  await assetLookupExample(provider)
  await transferPathExample(provider)
  await compositeProviderExample()
  await originChainExample(provider)

  console.log('Done!')
}

main().catch(console.error)
