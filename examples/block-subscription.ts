/**
 * Example: Block and Event Subscriptions
 *
 * This example demonstrates how to:
 * 1. Subscribe to new blocks using WebSocket
 * 2. Subscribe to EVM logs (events)
 * 3. Wait for specific transactions
 * 4. Wait for specific events
 * 5. Handle connection events
 *
 * Note: WebSocket features require chain endpoints that support WebSocket.
 * Use createChainContext() with createRegistryProvider() to get
 * full chain info including WebSocket endpoints.
 */

import { createChainContext } from 'initia.js'
import { waitForTx } from 'initia.js/client'
import { createRegistryProvider, type ChainInfo } from 'initia.js/provider'
import {
  createSession,
  subscribe,
  waitForEvent,
  hasWebSocketEndpoint,
  type BlockEventSpec,
  type BlockHeaderEventSpec,
  type EvmLogsEventSpec,
  type ConnectionEvent,
  type TxSearchClient,
} from 'initia.js/events'
import { CONTRACT, RECIPIENT } from './constants'

// =============================================================================
// Block Subscription (WebSocket)
// =============================================================================

async function blockSubscriptionExample() {
  console.log('=== Block Subscription ===\n')

  // Get full chain info including WebSocket endpoints
  const provider = await createRegistryProvider({ network: 'testnet' })
  const chainInfo = provider.getChainInfo('initiation-2')
  if (!chainInfo) {
    throw new Error('Chain not found')
  }

  // Check if WebSocket is available
  if (!hasWebSocketEndpoint(chainInfo)) {
    console.log('WebSocket endpoint not available for this chain')
    console.log('Falling back to polling approach...')
    return
  }

  // Create WebSocket session
  const session = createSession(chainInfo, {
    onConnectionEvent: (event: ConnectionEvent) => {
      console.log(`Connection ${event.type} at ${new Date(event.timestamp).toISOString()}`)
      if (event.error) {
        console.log('  Error:', event.error)
      }
    },
    autoReconnect: true,
    retryDelay: 5000,
    maxRetries: 3,
  })

  console.log('WebSocket session created')

  // Subscribe to new blocks
  const blockSpec: BlockEventSpec = { event: 'block' }

  const blockSubscription = await session.subscribe(blockSpec, block => {
    console.log(`New block: ${block.header?.height} at ${block.header?.time}`)
  })

  console.log('Subscribed to new blocks')

  // Subscribe to block headers (lighter)
  const headerSpec: BlockHeaderEventSpec = { event: 'blockHeader' }

  const headerSubscription = await session.subscribe(headerSpec, header => {
    console.log(`Block header: ${header.height}`)
  })

  // Keep running for a while then cleanup
  await new Promise(resolve => setTimeout(resolve, 30000))

  // Cleanup
  blockSubscription.unsubscribe()
  headerSubscription.unsubscribe()
  session.close()

  console.log('Subscriptions closed')
}

// =============================================================================
// EVM Event Subscription (for Minievm chains)
// =============================================================================

async function evmLogsSubscriptionExample() {
  console.log('\n=== EVM Logs Subscription ===\n')

  // For minievm chains with EVM WebSocket support
  const provider = await createRegistryProvider({ network: 'testnet' })
  const chainInfo = provider.getChainInfo('evm-1') as ChainInfo & {
    evmWss?: string
  }

  if (!chainInfo) {
    throw new Error('Chain not found')
  }

  if (!chainInfo.evmWss) {
    console.log('EVM WebSocket endpoint not available')
    return
  }

  const session = createSession(chainInfo)

  // Subscribe to ERC20 Transfer events
  const transferEventSignature =
    '0xddf252ad1be2c89b69c2b068fc378daa952ba7f163c4a11628f55a4df523b3ef'
  const contractAddress = CONTRACT.evm

  const logsSpec: EvmLogsEventSpec = {
    event: 'evmLogs',
    filter: {
      address: contractAddress,
      topics: [transferEventSignature], // Transfer(from, to, value)
    },
  }

  const logsSubscription = await session.subscribe(logsSpec, log => {
    console.log('EVM Log received:')
    console.log('  Address:', log.address)
    console.log('  Topics:', log.topics)
    console.log('  Data:', log.data)
    console.log('  Block:', log.blockNumber)
    console.log('  Tx Hash:', log.transactionHash)
  })

  console.log('Subscribed to EVM Transfer events')

  // Keep running...
  await new Promise(resolve => setTimeout(resolve, 60000))

  logsSubscription.unsubscribe()
  session.close()
}

// =============================================================================
// Standalone Subscribe (without session management)
// =============================================================================

async function standaloneSubscribeExample() {
  console.log('\n=== Standalone Subscribe ===\n')

  const provider = await createRegistryProvider({ network: 'testnet' })
  const chainInfo = provider.getChainInfo('initiation-2')
  if (!chainInfo) {
    throw new Error('Chain not found')
  }

  if (!hasWebSocketEndpoint(chainInfo)) {
    console.log('WebSocket not available')
    return
  }

  // Simple one-off subscription
  const subscription = await subscribe(chainInfo, { event: 'block' }, block => {
    console.log('Block received:', block.header?.height)
  })

  // Auto-closes after 10 seconds
  setTimeout(() => {
    subscription.unsubscribe()
    console.log('Subscription closed')
  }, 10000)
}

// =============================================================================
// Wait for Transaction
// =============================================================================

async function waitForTxExample() {
  console.log('\n=== Wait for Transaction ===\n')

  const provider = await createRegistryProvider({ network: 'testnet' })
  const chainInfo = provider.getChainInfo('initiation-2')
  if (!chainInfo) {
    throw new Error('Chain not found')
  }

  const ctx = createChainContext(chainInfo)

  // Transaction hash to wait for
  const txHash = 'ABC123...' // Your transaction hash

  try {
    // Wait for the transaction to be included in a block
    const result = await waitForTx(ctx.client, txHash, {
      chainInfo, // Pass chainInfo for WebSocket support
      timeout: 60000, // 60 second timeout
      pollInterval: 2000, // Poll every 2 seconds if no WebSocket
    })

    console.log('Transaction found!')
    console.log('  Hash:', result.txHash)
    console.log('  Height:', result.height.toString())
    console.log('  Code:', result.code)

    if (result.code !== 0) {
      console.log('  Error:', result.rawLog)
    } else {
      console.log('  Success!')
      console.log('  Events:', result.events.length)
    }
  } catch (error) {
    if ((error as Error).name === 'TimeoutError') {
      console.log('Transaction not found within timeout')
    } else {
      console.log('Error:', error)
    }
  }
}

// =============================================================================
// Wait for Event
// =============================================================================

async function waitForEventExample() {
  console.log('\n=== Wait for Event ===\n')

  const provider = await createRegistryProvider({ network: 'testnet' })
  const chainInfo = provider.getChainInfo('initiation-2')
  if (!chainInfo) {
    throw new Error('Chain not found')
  }

  const ctx = createChainContext(chainInfo)

  // Wait for a specific event type
  try {
    const results = await waitForEvent(
      ctx.client as unknown as TxSearchClient,
      {
        type: 'transfer', // Event type
        attributes: {
          recipient: RECIPIENT.bech32, // Filter by recipient
        },
      },
      {
        chainInfo, // Pass chainInfo for WebSocket support
        timeout: 60000,
      }
    )

    console.log('Events found!')
    for (const result of results) {
      console.log('  Tx Hash:', result.txHash)
      console.log('  Height:', result.height.toString())
    }
  } catch (error) {
    console.log('Event not found:', error)
  }
}

// =============================================================================
// Connection Event Handling
// =============================================================================

async function connectionEventsExample() {
  console.log('\n=== Connection Events ===\n')

  const provider = await createRegistryProvider({ network: 'testnet' })
  const chainInfo = provider.getChainInfo('initiation-2')
  if (!chainInfo) {
    throw new Error('Chain not found')
  }

  if (!hasWebSocketEndpoint(chainInfo)) {
    console.log('WebSocket not available')
    return
  }

  const session = createSession(chainInfo, {
    onConnectionEvent: (event: ConnectionEvent) => {
      switch (event.type) {
        case 'connect':
          console.log('Connected at:', new Date(event.timestamp).toISOString())
          break
        case 'disconnect':
          console.log('Disconnected at:', new Date(event.timestamp).toISOString())
          if (event.error) {
            console.log('  Reason:', event.error)
          }
          break
        case 'reconnect':
          console.log('Reconnecting...', `(attempt ${event.attempt})`)
          break
        case 'error':
          console.log('Connection error:', event.error)
          break
      }
    },
    autoReconnect: true,
    retryDelay: 3000,
    maxRetries: 5,
  })

  // Subscribe to trigger connection
  const subscription = await session.subscribe({ event: 'block' }, () => {})

  // Simulate network issues by keeping the session open
  await new Promise(resolve => setTimeout(resolve, 60000))

  subscription.unsubscribe()
  session.close()
}

// Run examples — pass demo name as CLI argument:
//   npx tsx examples/block-subscription.ts block
//   npx tsx examples/block-subscription.ts wait-tx

async function main() {
  const demo = process.argv[2] || 'block'

  switch (demo) {
    case 'block':
      return blockSubscriptionExample()
    case 'evm-logs':
      return evmLogsSubscriptionExample()
    case 'standalone':
      return standaloneSubscribeExample()
    case 'wait-tx':
      return waitForTxExample()
    case 'wait-event':
      return waitForEventExample()
    case 'connection':
      return connectionEventsExample()
    default:
      console.log('Available demos: block, evm-logs, standalone, wait-tx, wait-event, connection')
  }
}

main().catch(console.error)
