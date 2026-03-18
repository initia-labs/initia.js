/**
 * Custom Rollup Example
 *
 * Demonstrates adding a custom proto module to a minievm rollup context.
 * Uses real BSR packages (cosmos-sdk bank) to show the modules callback pattern.
 *
 * Base modules (from createBaseConfig):
 *   auth, bank, tx, tendermint, ibc, ibcIca, authz, feegrant, group,
 *   crisis, upgrade, consensus, cosmosAuth, ibcHooks, interTx
 *
 * Minievm additions:
 *   evm, opchild, nftTransfer, ibcFee
 *
 * Usage:
 *   npx tsx examples/custom-rollup.ts
 *
 * For real custom modules, replace the bank service imports with your
 * rollup's BSR packages:
 *   npm install @buf/<owner>_<repo>.bufbuild_es
 */

import { createChainConfig, type ModuleInput, type ChainConfigBuilder } from 'initia.js/modules'

// Real DescService/GenService from installed BSR packages
import { Query as BankQuery } from '@buf/cosmos_cosmos-sdk.bufbuild_es/cosmos/bank/v1beta1/query_pb'
import { Msg as BankTxMsg } from '@buf/cosmos_cosmos-sdk.bufbuild_es/cosmos/bank/v1beta1/tx_pb'

// =============================================================================
// 1. Basic modules callback — adding a custom module
// =============================================================================

/**
 * The `modules` callback receives the base ChainConfigBuilder with all
 * default modules pre-populated. `addModule` on a new key accumulates
 * onto the builder. If a key already exists, the new definition overrides
 * the previous one (with a console warning).
 */
function demoModulesCallback() {
  console.log('=== 1. modules callback — addModule accumulation ===\n')

  // Simulate what happens inside createMinievmContext({ modules: ... })
  const baseConfig = createChainConfig().addModule('bank', { query: BankQuery, tx: BankTxMsg })

  // User's modules callback extends the base
  const extended = baseConfig.addModule('myDex', { query: BankQuery, tx: BankTxMsg }) // Using bank as placeholder

  const config = extended.build()

  console.log('Base modules:', Object.keys(config.services))
  console.log('  → bank:', 'bank' in config.services ? '✓' : '✗')
  console.log('  → myDex:', 'myDex' in config.services ? '✓' : '✗')
  console.log()

  // msgs also available
  console.log(
    'Message builders:',
    Object.keys(config.msgs).filter(k => k !== 'custom' && k !== 'decode')
  )
  console.log()
}

// =============================================================================
// 2. Module override — replacing a base module
// =============================================================================

function demoModuleOverride() {
  console.log('=== 2. Module override (network-specific branching) ===\n')

  const baseConfig = createChainConfig().addModule('gov', { query: BankQuery }) // Placeholder for GovV1Query

  // Simulate network-specific override at the call site
  const network = 'testnet'
  const govModule =
    network === 'testnet'
      ? { query: BankQuery } // Placeholder for GovV1Beta1Query
      : { query: BankQuery } // Placeholder for GovV1Query

  // Override warning fires when key already exists
  const overridden = baseConfig.addModule('gov', govModule)
  const config = overridden.build()

  console.log(`Network: ${network}`)
  console.log('gov module overridden:', 'gov' in config.services ? '✓' : '✗')
  console.log()
}

// =============================================================================
// 3. Reusable module function
// =============================================================================

function demoReusableModule() {
  console.log('=== 3. Reusable module function ===\n')

  // Define a reusable extension
  const withMyDex = <TDefault extends Record<string, ModuleInput>>(
    base: ChainConfigBuilder<TDefault>
  ) => base.addModule('myDex', { query: BankQuery, tx: BankTxMsg })

  // Apply to any base config
  const config = withMyDex(createChainConfig().addModule('bank', { query: BankQuery })).build()

  console.log('Services after withMyDex:', Object.keys(config.services))
  console.log()

  // Usage with typed factory (pseudocode):
  console.log('With typed factory:')
  console.log('  const ctx = createMinievmContext(chainInfo, {')
  console.log('    modules: (base) => withMyDex(base)  // inline wrapper for type inference')
  console.log('  })')
  console.log()
}

// =============================================================================
// 4. Multiple custom modules
// =============================================================================

function demoMultipleModules() {
  console.log('=== 4. Multiple custom modules (chaining) ===\n')

  const config = createChainConfig()
    .addModule('bank', { query: BankQuery, tx: BankTxMsg })
    .addModule('myDex', { query: BankQuery, tx: BankTxMsg })
    .addModule('oracle', { query: BankQuery }) // query-only module
    .addModule('staking', { tx: BankTxMsg }) // tx-only module
    .build()

  const queryModules = Object.keys(config.services)
  const txModules = Object.keys(config.msgs).filter(k => k !== 'custom' && k !== 'decode')

  console.log('Query services:', queryModules)
  console.log('Tx builders:', txModules)
  console.log()
  console.log('Note: oracle has query but no tx, staking has tx but no query')
  console.log('  oracle in services:', queryModules.includes('oracle') ? '✓' : '✗')
  console.log('  oracle in msgs:', txModules.includes('oracle') ? '✓ (unexpected)' : '✗ (correct)')
  console.log(
    '  staking in services:',
    queryModules.includes('staking') ? '✓ (unexpected)' : '✗ (correct)'
  )
  console.log('  staking in msgs:', txModules.includes('staking') ? '✓' : '✗')
  console.log()
}

// =============================================================================
// Main
// =============================================================================

async function main() {
  console.log('Custom Rollup Example')
  console.log('=====================\n')

  demoModulesCallback()
  demoModuleOverride()
  demoReusableModule()
  demoMultipleModules()

  console.log('Done! For live usage with a real rollup, replace BankQuery/BankTxMsg')
  console.log("with your rollup's BSR package services.")
}

main().catch(console.error)
