/**
 * Example: Common Utilities
 *
 * This example demonstrates common chain queries:
 * 1. Get latest block number (height)
 * 2. Get block by height
 * 3. Get node info
 * 4. Get syncing status
 * 5. Get latest validator set
 */

import { createInitiaContext } from 'initia.js'
import { type BaseClient } from 'initia.js/client'
import { timestampDate, type Timestamp } from '@bufbuild/protobuf/wkt'

// Helper to convert Uint8Array to hex string
function toHexString(bytes: Uint8Array): string {
  return Array.from(bytes)
    .map(b => b.toString(16).padStart(2, '0'))
    .join('')
}

// Helper to safely convert Timestamp to Date
function toDate(ts: Timestamp | undefined): Date | undefined {
  return ts ? timestampDate(ts) : undefined
}

// =============================================================================
// Block Queries
// =============================================================================

async function blockQueryExamples(client: BaseClient) {
  console.log('=== Block Queries ===\n')

  // 1. Get latest block (includes block number/height)
  console.log('\n--- Latest Block ---')
  const latestBlock = await client.tendermint.getLatestBlock({})

  const blockHeight = latestBlock.block?.header?.height
  const blockTime = latestBlock.block?.header?.time
  const blockHash = latestBlock.blockId?.hash

  console.log('Block height:', blockHeight?.toString())
  console.log('Block time:', toDate(blockTime)?.toISOString())
  console.log('Block hash:', blockHash ? toHexString(blockHash).toUpperCase() : 'N/A')
  console.log('Proposer:', latestBlock.block?.header?.proposerAddress)
  console.log('Tx count:', latestBlock.block?.data?.txs.length ?? 0)

  // 2. Get block by specific height
  console.log('\n--- Block By Height ---')
  const targetHeight = blockHeight ? blockHeight - 10n : 1n
  const historicalBlock = await client.tendermint.getBlockByHeight({
    height: targetHeight,
  })

  console.log('Requested height:', targetHeight.toString())
  console.log('Block height:', historicalBlock.block?.header?.height?.toString())
  console.log('Block time:', toDate(historicalBlock.block?.header?.time)?.toISOString())
  console.log('Tx count:', historicalBlock.block?.data?.txs.length ?? 0)
}

// =============================================================================
// Node Info
// =============================================================================

async function nodeInfoExamples(client: BaseClient) {
  console.log('\n=== Node Info ===\n')

  // Get node info
  const nodeInfo = await client.tendermint.getNodeInfo({})

  console.log('Node ID:', nodeInfo.defaultNodeInfo?.defaultNodeId)
  console.log('Network:', nodeInfo.defaultNodeInfo?.network)
  console.log('Version:', nodeInfo.defaultNodeInfo?.version)
  console.log('Moniker:', nodeInfo.defaultNodeInfo?.moniker)
  console.log('Channels:', nodeInfo.defaultNodeInfo?.channels)

  // Application version
  console.log('\n--- Application Version ---')
  console.log('App name:', nodeInfo.applicationVersion?.appName)
  console.log('App version:', nodeInfo.applicationVersion?.version)
  console.log('Git commit:', nodeInfo.applicationVersion?.gitCommit)
  console.log('Go version:', nodeInfo.applicationVersion?.goVersion)
  console.log('Cosmos SDK:', nodeInfo.applicationVersion?.cosmosSdkVersion)
}

// =============================================================================
// Syncing Status
// =============================================================================

async function syncingStatusExample(client: BaseClient) {
  console.log('\n=== Syncing Status ===\n')

  // Get syncing status
  const syncing = await client.tendermint.getSyncing({})

  console.log('Is syncing:', syncing.syncing)

  if (syncing.syncing) {
    console.log('Node is still catching up with the network')
  } else {
    console.log('Node is fully synced')
  }
}

// =============================================================================
// Validator Set
// =============================================================================

async function validatorSetExample(client: BaseClient) {
  console.log('\n=== Validator Set ===\n')

  // Get latest validator set
  const validatorSet = await client.tendermint.getLatestValidatorSet({})

  console.log('Block height:', validatorSet.blockHeight?.toString())
  console.log('Total validators:', validatorSet.validators.length)
  console.log('Total voting power:', validatorSet.pagination?.total?.toString())

  // Show first 5 validators
  console.log('\n--- Top Validators (by voting power) ---')
  const sortedValidators = [...validatorSet.validators].sort((a, b) =>
    Number(b.votingPower - a.votingPower)
  )

  for (const validator of sortedValidators.slice(0, 5)) {
    console.log(`  Address: ${validator.address}`)
    console.log(`    Voting power: ${validator.votingPower}`)
    console.log(`    Pub key type: ${validator.pubKey?.typeUrl}`)
    console.log()
  }

  // Get validator set at specific height
  console.log('--- Validator Set at Specific Height ---')
  const height = validatorSet.blockHeight ? validatorSet.blockHeight - 100n : 1n
  const historicalValidators = await client.tendermint.getValidatorSetByHeight({
    height,
  })

  console.log('Height:', height.toString())
  console.log('Validator count:', historicalValidators.validators.length)
}

// =============================================================================
// Utility Functions
// =============================================================================

/**
 * Helper function to get the current block number.
 * This is a common pattern used in many blockchain applications.
 */
async function getBlockNumber(client: BaseClient): Promise<bigint> {
  const response = await client.tendermint.getLatestBlock({})
  return response.block?.header?.height ?? 0n
}

/**
 * Helper function to get block details by height.
 */
async function getBlock(client: BaseClient, height: bigint) {
  const response = await client.tendermint.getBlockByHeight({ height })
  return {
    height: response.block?.header?.height,
    time: toDate(response.block?.header?.time),
    hash: response.blockId?.hash ? toHexString(response.blockId.hash) : undefined,
    txCount: response.block?.data?.txs.length ?? 0,
    proposer: response.block?.header?.proposerAddress,
  }
}

/**
 * Helper function to wait for a specific block height.
 * Useful for waiting for block confirmations.
 */
async function waitForBlock(
  client: BaseClient,
  targetHeight: bigint,
  pollingInterval = 1000
): Promise<void> {
  while (true) {
    const response = await client.tendermint.getLatestBlock({})
    const currentHeight = response.block?.header?.height ?? 0n

    if (currentHeight >= targetHeight) {
      console.log(`Reached block ${currentHeight}`)
      return
    }

    console.log(`Current: ${currentHeight}, waiting for: ${targetHeight}...`)
    await new Promise(resolve => setTimeout(resolve, pollingInterval))
  }
}

// =============================================================================
// Demo: Using Helper Functions
// =============================================================================

async function helperFunctionsDemo(client: BaseClient) {
  console.log('\n=== Helper Functions Demo ===\n')

  // Get current block number
  const blockNumber = await getBlockNumber(client)
  console.log('Current block number:', blockNumber.toString())

  // Get block details
  const block = await getBlock(client, blockNumber)
  console.log('Block details:', block)

  // waitForBlock: returns immediately since current height is already reached
  await waitForBlock(client, blockNumber)
}

// =============================================================================
// Run Examples
// =============================================================================

async function main() {
  try {
    const ctx = await createInitiaContext({ network: 'testnet' })

    console.log('Connected to:', ctx.chainId)

    // All sub-functions receive the client from ChainContext
    const client = ctx.client as BaseClient
    await blockQueryExamples(client)
    await nodeInfoExamples(client)
    await syncingStatusExample(client)
    await validatorSetExample(client)
    await helperFunctionsDemo(client)
  } catch (error) {
    console.error('Error:', error)
  }
}

main()
