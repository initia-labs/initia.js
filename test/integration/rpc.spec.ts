/**
 * Integration tests for CometBFT RPC and EVM RPC clients.
 *
 * These tests connect to actual Initia testnet endpoints.
 * They may fail if the network is unavailable.
 *
 * Skip with: SKIP_INTEGRATION_TESTS=true npm test
 */

import { describe, it, expect, beforeAll } from 'vitest'
import { createRpcClient, type RpcClient } from '../../src/client/rpc'
import { createEvmRpcClient, type EvmRpcClient } from '../../src/client/evm-rpc'
import { createRegistryProvider } from '../../src/provider/registry-provider'

const SKIP = process.env.SKIP_INTEGRATION_TESTS === 'true'

// =============================================================================
// CometBFT RPC
// =============================================================================

describe.skipIf(SKIP)('RpcClient (Integration)', () => {
  let rpc: RpcClient
  let latestHeight: string

  beforeAll(async () => {
    const provider = await createRegistryProvider({ network: 'testnet' })
    const initia = provider.listChains().find(c => c.chainType === 'initia')
    if (!initia?.rpc) throw new Error('No Initia L1 testnet RPC found')

    rpc = createRpcClient(initia.rpc)

    // Get latest height for subsequent queries
    const status = await rpc.status()
    latestHeight = status.sync_info.latest_block_height
  }, 30_000)

  // ---------------------------------------------------------------------------
  // Node
  // ---------------------------------------------------------------------------

  it('health', async () => {
    const healthy = await rpc.health()
    expect(healthy).toBe(true)
  }, 15_000)

  it('status', async () => {
    const result = await rpc.status()
    expect(result.node_info.network).toBeTruthy()
    expect(BigInt(result.sync_info.latest_block_height)).toBeGreaterThan(0n)
  }, 15_000)

  it('netInfo', async () => {
    const result = await rpc.netInfo()
    expect(result.listening).toBe(true)
    expect(Array.isArray(result.listeners)).toBe(true)
  }, 15_000)

  it('genesis', async () => {
    const result = await rpc.genesis()
    expect(result.genesis.chain_id).toBeTruthy()
    expect(result.genesis.genesis_time).toBeTruthy()
  }, 30_000)

  it('genesisChunked', async () => {
    const result = await rpc.genesisChunked(0)
    expect(result.chunk).toBe('0')
    expect(Number(result.total)).toBeGreaterThanOrEqual(1)
    expect(result.data).toBeTruthy()
  }, 30_000)

  // ---------------------------------------------------------------------------
  // Block & Header
  // ---------------------------------------------------------------------------

  it('block with height', async () => {
    const height = Number(latestHeight) - 5
    const result = await rpc.block(height)
    expect(result.block.header.height).toBe(String(height))
    expect(result.block_id.hash).toBeTruthy()
  }, 15_000)

  it('block without height (latest)', async () => {
    const result = await rpc.block()
    expect(BigInt(result.block.header.height)).toBeGreaterThan(0n)
  }, 15_000)

  it('blockByHash', async () => {
    const latest = await rpc.block()
    const hash = latest.block_id.hash
    const result = await rpc.blockByHash(hash)
    expect(result.block.header.height).toBe(latest.block.header.height)
  }, 15_000)

  it('header with height', async () => {
    const height = Number(latestHeight) - 5
    const result = await rpc.header(height)
    expect(result.header.height).toBe(String(height))
  }, 15_000)

  it('header without height (latest)', async () => {
    const result = await rpc.header()
    expect(BigInt(result.header.height)).toBeGreaterThan(0n)
  }, 15_000)

  it('headerByHash', async () => {
    const latest = await rpc.block()
    const hash = latest.block_id.hash
    const result = await rpc.headerByHash(hash)
    expect(result.header.height).toBe(latest.block.header.height)
  }, 15_000)

  it('blockResults', async () => {
    const height = Number(latestHeight) - 5
    const result = await rpc.blockResults(height)
    expect(result.height).toBe(String(height))
    expect(result.app_hash).toBeTruthy()
  }, 15_000)

  it('blockchain', async () => {
    const max = Number(latestHeight) - 1
    const min = max - 5
    const result = await rpc.blockchain(min, max)
    expect(BigInt(result.last_height)).toBeGreaterThanOrEqual(BigInt(max))
    expect(result.block_metas.length).toBeGreaterThan(0)
    expect(result.block_metas.length).toBeLessThanOrEqual(20)
  }, 15_000)

  it('blockSearch', async () => {
    const height = Number(latestHeight) - 5
    const result = await rpc.blockSearch(`block.height=${height}`)
    expect(result.total_count).toBeTruthy()
  }, 15_000)

  // ---------------------------------------------------------------------------
  // Transaction
  // ---------------------------------------------------------------------------

  it('txSearch', async () => {
    const height = Number(latestHeight) - 5
    const result = await rpc.txSearch(`tx.height=${height}`, { page: 1, perPage: 5 })
    expect(Array.isArray(result.txs)).toBe(true)
    expect(result.total_count).toBeDefined()
  }, 15_000)

  it('tx (if txSearch returns results)', async () => {
    const height = Number(latestHeight) - 5
    const search = await rpc.txSearch(`tx.height=${height}`, { page: 1, perPage: 1 })
    if (search.txs.length > 0) {
      const hash = search.txs[0].hash
      const result = await rpc.tx(hash)
      expect(result.hash).toBe(hash)
      expect(typeof result.index).toBe('number')
    }
  }, 15_000)

  it('unconfirmedTxs', async () => {
    const result = await rpc.unconfirmedTxs(1)
    expect(result.n_txs).toBeDefined()
    expect(result.total).toBeDefined()
  }, 15_000)

  it('numUnconfirmedTxs', async () => {
    const result = await rpc.numUnconfirmedTxs()
    expect(result.n_txs).toBeDefined()
    expect(result.total).toBeDefined()
    expect(result.total_bytes).toBeDefined()
  }, 15_000)

  // ---------------------------------------------------------------------------
  // Consensus
  // ---------------------------------------------------------------------------

  it('validators', async () => {
    const result = await rpc.validators()
    expect(BigInt(result.block_height)).toBeGreaterThan(0n)
    expect(result.validators.length).toBeGreaterThan(0)
    expect(result.validators[0].address).toBeTruthy()
    expect(result.validators[0].voting_power).toBeTruthy()
  }, 15_000)

  it('validators with pagination', async () => {
    const result = await rpc.validators(undefined, { page: 1, perPage: 5 })
    expect(result.validators.length).toBeLessThanOrEqual(5)
  }, 15_000)

  it('commit', async () => {
    const height = Number(latestHeight) - 5
    const result = await rpc.commit(height)
    expect(result.canonical).toBe(true)
    expect(result.signed_header.header.height).toBe(String(height))
  }, 15_000)

  it('consensusParams', async () => {
    const result = await rpc.consensusParams()
    expect(BigInt(result.block_height)).toBeGreaterThan(0n)
    expect(result.consensus_params).toBeDefined()
  }, 15_000)

  it('consensusState', async () => {
    const result = await rpc.consensusState()
    expect(result.round_state['height/round/step']).toBeTruthy()
  }, 15_000)

  it('dumpConsensusState', async () => {
    const result = await rpc.dumpConsensusState()
    expect(result.round_state.height).toBeTruthy()
    expect(typeof result.round_state.round).toBe('number')
    expect(Array.isArray(result.peers)).toBe(true)
  }, 15_000)

  // ---------------------------------------------------------------------------
  // ABCI
  // ---------------------------------------------------------------------------

  it('abciInfo', async () => {
    const result = await rpc.abciInfo()
    expect(result.response).toBeDefined()
  }, 15_000)

  it('abciQuery', async () => {
    const result = await rpc.abciQuery('/store/bank/key')
    expect(result.response).toBeDefined()
    expect(typeof result.response.code).toBe('number')
  }, 15_000)
})

// =============================================================================
// EVM RPC
// =============================================================================

describe.skipIf(SKIP)('EvmRpcClient (Integration)', () => {
  let rpc: EvmRpcClient

  beforeAll(async () => {
    const provider = await createRegistryProvider({ network: 'testnet' })
    const minievm = provider.listChains().find(c => c.chainType === 'minievm')
    if (!minievm?.evmRpc) throw new Error('No minievm testnet EVM RPC found')

    rpc = createEvmRpcClient(minievm.evmRpc)
  }, 30_000)

  it('getTransactionByHash (non-existent)', async () => {
    const fakeHash = '0x0000000000000000000000000000000000000000000000000000000000000000'
    const result = await rpc.getTransactionByHash(fakeHash)
    expect(result).toBeNull()
  }, 15_000)

  it('getTransactionByHash (real tx from recent block)', async () => {
    // Find a recent block with transactions
    const blockNumber = await rpc.getBlockNumber()
    let txHash: string | undefined

    for (let i = 0; i < 20 && !txHash; i++) {
      const block = await rpc.getBlockByNumber(blockNumber - BigInt(i), false)
      if (block && block.transactions.length > 0) {
        txHash = block.transactions[0] as string
      }
    }

    if (txHash) {
      const result = await rpc.getTransactionByHash(txHash)
      expect(result).not.toBeNull()
      expect(result!.hash).toBe(txHash)
      expect(result!.from).toBeTruthy()
      expect(result!.gas).toBeTruthy()
    }
  }, 30_000)

  it('getStorageAt', async () => {
    // Query slot 0 of a known contract (or zero address)
    const result = await rpc.getStorageAt(
      '0x0000000000000000000000000000000000000000',
      '0x0'
    )
    expect(typeof result).toBe('string')
    expect(result.startsWith('0x')).toBe(true)
  }, 15_000)

  it('getStorageAt with specific block', async () => {
    const blockNumber = await rpc.getBlockNumber()
    const result = await rpc.getStorageAt(
      '0x0000000000000000000000000000000000000000',
      '0x0',
      Number(blockNumber)
    )
    expect(typeof result).toBe('string')
    expect(result.startsWith('0x')).toBe(true)
  }, 15_000)
})
