/**
 * Example: EVM JSON-RPC Client
 *
 * Demonstrates standalone EVM JSON-RPC operations:
 * 1. Client creation via provider
 * 2. Chain info (chainId, blockNumber, gasPrice)
 * 3. Block data
 * 4. Account queries (balance, code, nonce)
 * 5. Log retrieval
 * 6. Transaction receipt
 */

import { createEvmRpcClient } from 'initia.js/evm'
import { createRegistryProvider } from 'initia.js/provider'
import { CONTRACT, SENDER } from './constants'

async function main() {
  // -------------------------------------------------------------------------
  // 1. Create client from provider-discovered endpoint
  // -------------------------------------------------------------------------
  const provider = await createRegistryProvider({ network: 'testnet' })
  const minievm = provider.listChains().find(c => c.chainType === 'minievm')
  if (!minievm?.evmRpc) throw new Error('No minievm chain with EVM RPC found')

  const rpc = createEvmRpcClient(minievm.evmRpc)
  console.log('Connected to:', minievm.evmRpc)

  // -------------------------------------------------------------------------
  // 2. Chain info
  // -------------------------------------------------------------------------
  console.log('\n=== Chain Info ===\n')

  const [chainId, blockNumber, gasPrice] = await Promise.all([
    rpc.getChainId(),
    rpc.getBlockNumber(),
    rpc.getGasPrice(),
  ])
  console.log('Chain ID:', chainId)
  console.log('Block number:', blockNumber)
  console.log('Gas price:', gasPrice, 'wei')

  // -------------------------------------------------------------------------
  // 3. Block data
  // -------------------------------------------------------------------------
  console.log('\n=== Latest Block ===\n')

  const block = await rpc.getBlockByNumber('latest', false)
  if (block) {
    console.log('Hash:', block.hash)
    console.log('Number:', block.number)
    console.log('Transactions:', block.transactions.length)
    console.log('Gas used:', block.gasUsed)
  }

  // -------------------------------------------------------------------------
  // 4. Account queries
  // -------------------------------------------------------------------------
  console.log('\n=== Account Queries ===\n')

  const address = SENDER.evm as `0x${string}`
  const [balance, nonce] = await Promise.all([
    rpc.getBalance(address),
    rpc.getTransactionCount(address),
  ])
  console.log('Address:', address)
  console.log('Balance:', balance, 'wei')
  console.log('Nonce:', nonce)

  // Check contract code
  const code = await rpc.getCode(CONTRACT.evmWrappedL2)
  console.log('Contract code length:', code.length, '(>', 2, '= has code)')

  // -------------------------------------------------------------------------
  // 5. Logs
  // -------------------------------------------------------------------------
  console.log('\n=== Recent Logs ===\n')

  const fromBlock = blockNumber - 10n
  const logs = await rpc.getLogs({
    fromBlock: Number(fromBlock),
    toBlock: 'latest',
  })
  console.log(`Logs in last 10 blocks: ${logs.length}`)

  if (logs.length > 0) {
    const log = logs[0]
    console.log('First log — address:', log.address, 'topics:', log.topics.length)
  }

  // -------------------------------------------------------------------------
  // 6. Transaction receipt (nullable)
  // -------------------------------------------------------------------------
  console.log('\n=== Transaction Receipt ===\n')

  const fakeHash = '0x' + '00'.repeat(32)
  const receipt = await rpc.getTransactionReceipt(fakeHash)
  console.log('Non-existent tx receipt:', receipt) // null
}

main().catch(console.error)
