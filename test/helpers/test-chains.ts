/**
 * Test chain configurations using registry-provider.
 *
 * Provides real testnet chain info for integration-style tests.
 * Tests using these should be skipped when network is unavailable.
 */

import { createRegistryProvider } from '../../src/provider/registry-provider'
import type { ChainInfo } from '../../src/provider/types'

// Cache for provider and chain info
let cachedProvider: Awaited<ReturnType<typeof createRegistryProvider>> | null = null
let cachedInitiaTestnet: ChainInfo | null = null
let cachedEvmTestnet: ChainInfo | null = null
let initializationPromise: Promise<void> | null = null
let initializationError: Error | null = null

/**
 * Initialize the registry provider and fetch chain info.
 * This is called once and cached.
 */
async function initialize(): Promise<void> {
  if (cachedProvider) return
  if (initializationError) throw initializationError

  if (initializationPromise) {
    return initializationPromise
  }

  initializationPromise = (async () => {
    try {
      cachedProvider = await createRegistryProvider({ network: 'testnet' })

      // Get Initia testnet (has wss endpoint)
      cachedInitiaTestnet = cachedProvider.getChainInfo('initiation-2') ?? null

      // Get EVM testnet (has evmWss endpoint) - try evm-1 or similar
      // The actual chain ID may vary, so we search for a minievm chain
      const chains = cachedProvider.listChains()
      cachedEvmTestnet = chains.find(c => c.chainType === 'minievm' && c.evmWss) ?? null
    } catch (error) {
      initializationError = error as Error
      throw error
    }
  })()

  return initializationPromise
}

/**
 * Get Initia testnet chain info.
 * Returns null if not available.
 */
export async function getInitiaTestnet(): Promise<ChainInfo | null> {
  try {
    await initialize()
    return cachedInitiaTestnet
  } catch {
    return null
  }
}

/**
 * Get EVM (minievm) testnet chain info.
 * Returns null if not available.
 */
export async function getEvmTestnet(): Promise<ChainInfo | null> {
  try {
    await initialize()
    return cachedEvmTestnet
  } catch {
    return null
  }
}

/**
 * Check if Initia testnet with WebSocket is available.
 */
export async function hasInitiaTestnet(): Promise<boolean> {
  const chain = await getInitiaTestnet()
  return chain !== null && !!chain.wss
}

/**
 * Check if EVM testnet with WebSocket is available.
 */
export async function hasEvmTestnet(): Promise<boolean> {
  const chain = await getEvmTestnet()
  return chain !== null && !!chain.evmWss
}

/**
 * Helper to check WebSocket connectivity with timeout.
 */
export async function checkWebSocketConnectivity(url: string, timeoutMs = 5000): Promise<boolean> {
  return new Promise(resolve => {
    try {
      const ws = new WebSocket(url)
      const timeout = setTimeout(() => {
        ws.close()
        resolve(false)
      }, timeoutMs)

      ws.onopen = () => {
        clearTimeout(timeout)
        ws.close()
        resolve(true)
      }

      ws.onerror = () => {
        clearTimeout(timeout)
        resolve(false)
      }
    } catch {
      resolve(false)
    }
  })
}

/**
 * Skip condition for tests requiring Initia testnet.
 * Use with describe.skipIf() or it.skipIf()
 */
export async function shouldSkipInitiaTests(): Promise<boolean> {
  return !(await hasInitiaTestnet())
}

/**
 * Skip condition for tests requiring EVM testnet.
 */
export async function shouldSkipEvmTests(): Promise<boolean> {
  return !(await hasEvmTestnet())
}
