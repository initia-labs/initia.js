/**
 * Transaction and event waiting utilities using WebSocket or polling.
 */

import type { Numeric } from '../../types'
import type { ChainInfo } from '../../provider/types'
import { TimeoutError } from '../../errors'
import type { Subscription, WsTxResult } from './types'
import { createSession, type WebSocketSession } from './session'
import {
  DEFAULT_TX_TIMEOUT_MS,
  DEFAULT_EVENT_TIMEOUT_MS,
  DEFAULT_POLL_INTERVAL_MS,
} from '../../constants'

// ============================================================================
// Transaction Waiting Types
// ============================================================================

/**
 * Options for waitForTx.
 */
export interface WaitForTxOptions {
  /** Timeout in milliseconds (default: 30000) */
  timeout?: number
  /** Poll interval in milliseconds for polling fallback (default: 1000) */
  pollInterval?: number
  /**
   * Chain info for WebSocket-based waiting.
   * If provided and chain has wss endpoint, uses WebSocket for efficiency.
   * Falls back to polling if WebSocket unavailable or connection fails.
   */
  chainInfo?: ChainInfo
}

/**
 * Transaction result returned by waitForTx.
 */
export interface TxResult {
  /** Block height where tx was included */
  height: bigint
  /** Transaction hash */
  txHash: string
  /** Response code (0 = success) */
  code: number
  /** Raw log output */
  rawLog: string
  /** Gas used by the transaction */
  gasUsed: bigint
  /** Gas wanted by the transaction */
  gasWanted: bigint
  /** Parsed events from the transaction */
  events: TxEvent[]
}

/**
 * Event from a transaction.
 */
export interface TxEvent {
  /** Event type (e.g., 'transfer', 'message') */
  type: string
  /** Event attributes */
  attributes: Array<{ key: string; value: string }>
}

/**
 * Minimal client interface for querying transactions.
 */
export interface TxQueryClient {
  tx: {
    getTx(request: { hash: string }): Promise<{
      txResponse?: {
        height: bigint
        txhash: string
        code: number
        rawLog: string
        gasUsed: bigint
        gasWanted: bigint
        events: Array<{
          type: string
          attributes: Array<{ key: string; value: string }>
        }>
      }
    }>
  }
}

// ============================================================================
// Event Waiting Types
// ============================================================================

/**
 * Options for waitForEvent.
 */
export interface WaitForEventOptions {
  /** Timeout in milliseconds (default: 60000) */
  timeout?: number
  /** Poll interval in milliseconds for fallback mode (default: 1000) */
  pollInterval?: number
  /**
   * Chain info for WebSocket-based waiting.
   * If provided and chain has wss endpoint, uses WebSocket for real-time events.
   * Falls back to polling if WebSocket unavailable or connection fails.
   */
  chainInfo?: ChainInfo
  /**
   * Start searching from this block height (inclusive).
   * Uses CometBFT query syntax: `tx.height >= fromHeight`
   */
  fromHeight?: Numeric
  /**
   * Maximum number of matching transactions to return.
   * @default 100
   */
  maxResults?: number
}

/**
 * Event filter criteria.
 *
 * Matches transactions containing events with the specified type and attributes.
 *
 * @example
 * ```typescript
 * // Match any transfer event
 * { type: 'transfer' }
 *
 * // Match transfer to specific recipient
 * { type: 'transfer', attributes: { recipient: 'init1...' } }
 *
 * // Match message action
 * { type: 'message', attributes: { action: '/cosmos.bank.v1beta1.MsgSend' } }
 * ```
 */
export interface EventFilter {
  /** Event type (e.g., 'transfer', 'message') */
  type: string
  /** Attribute key-value pairs to match */
  attributes?: Record<string, string>
}

/**
 * Minimal client interface for searching transactions by events.
 */
export interface TxSearchClient extends TxQueryClient {
  tx: TxQueryClient['tx'] & {
    getTxsEvent(request: {
      query: string
      page?: bigint
      limit?: bigint
      orderBy?: number
    }): Promise<{
      txs: unknown[]
      txResponses: Array<{
        height: bigint
        txhash: string
        code: number
        rawLog: string
        gasUsed: bigint
        gasWanted: bigint
        events: Array<{
          type: string
          attributes: Array<{ key: string; value: string }>
        }>
      }>
      total: bigint
    }>
  }
}

// ============================================================================
// Internal Helpers
// ============================================================================

/** Internal: Format raw tx response to TxResult */
function formatTxResult(tx: {
  height: bigint
  txhash: string
  code: number
  rawLog: string
  gasUsed: bigint
  gasWanted: bigint
  events: Array<{
    type: string
    attributes: Array<{ key: string; value: string }>
  }>
}): TxResult {
  return {
    height: tx.height,
    txHash: tx.txhash,
    code: tx.code,
    rawLog: tx.rawLog,
    gasUsed: tx.gasUsed,
    gasWanted: tx.gasWanted,
    events: tx.events.map(e => ({
      type: e.type,
      attributes: e.attributes.map(a => ({
        key: a.key,
        value: a.value,
      })),
    })),
  }
}

/** Internal: Query transaction from client */
async function queryTx(client: TxQueryClient, txHash: string): Promise<TxResult | null> {
  try {
    const response = await client.tx.getTx({ hash: txHash })
    if (response.txResponse) {
      return formatTxResult(response.txResponse)
    }
  } catch {
    // Transaction not found
  }
  return null
}

// ============================================================================
// waitForTx
// ============================================================================

/**
 * Wait for a transaction to be included in a block.
 *
 * **Strategy selection:**
 * - If `chainInfo` is provided and has WebSocket endpoint → uses WebSocket
 * - Otherwise → uses polling
 *
 * **WebSocket mode** (recommended for fast chains):
 * - Subscribes to new blocks and queries tx on each block
 * - Uses "Subscribe First, Query After" pattern to avoid race conditions
 * - Falls back to polling if WebSocket connection fails
 *
 * **Polling mode**:
 * - Queries tx at regular intervals until found or timeout
 *
 * @param client - gRPC client with tx service
 * @param txHash - Transaction hash to wait for
 * @param options - Wait options (timeout, pollInterval, chainInfo)
 * @returns Transaction result when found
 * @throws {TimeoutError} If the transaction is not found within the timeout
 *
 * @example Polling mode (basic)
 * ```typescript
 * const txResult = await waitForTx(client, txHash)
 * ```
 *
 * @example WebSocket mode (recommended)
 * ```typescript
 * const txResult = await waitForTx(client, txHash, { chainInfo })
 * ```
 *
 * @example Via ChainContext (automatic WebSocket)
 * ```typescript
 * const result = await ctx.signAndBroadcast(msgs)
 * const txResult = await ctx.waitForTx(result.txHash)
 * ```
 */
export async function waitForTx(
  client: TxQueryClient,
  txHash: string,
  options: WaitForTxOptions = {}
): Promise<TxResult> {
  // Use WebSocket if chainInfo with wss endpoint is provided
  if (options.chainInfo?.wss) {
    try {
      return await waitForTxWebSocket(client, txHash, options.chainInfo, options)
    } catch (error) {
      // If WebSocket fails (not timeout), fallback to polling
      if (error instanceof TimeoutError) {
        throw error
      }
      // WebSocket connection failed, fallback to polling
    }
  }

  // Fallback to polling
  return waitForTxPolling(client, txHash, options)
}

/**
 * Internal: WebSocket-based waitForTx implementation.
 *
 * Uses "Subscribe First, Query After" pattern:
 * 1. Subscribe to block events first (guarantees future blocks)
 * 2. Query for existing tx after subscription established
 * 3. This avoids race condition where tx is included during subscription setup
 */
async function waitForTxWebSocket(
  client: TxQueryClient,
  txHash: string,
  chainInfo: ChainInfo,
  options: WaitForTxOptions
): Promise<TxResult> {
  const timeout = options.timeout ?? DEFAULT_TX_TIMEOUT_MS

  return new Promise((resolve, reject) => {
    let resolved = false
    let session: WebSocketSession | null = null
    let sub: Subscription | null = null
    let timer: ReturnType<typeof setTimeout> | null = null

    const cleanup = () => {
      if (timer) {
        clearTimeout(timer)
        timer = null
      }
      if (sub) {
        sub.unsubscribe()
        sub = null
      }
      if (session) {
        session.close()
        session = null
      }
    }

    const complete = (result: TxResult) => {
      if (resolved) return
      resolved = true
      cleanup()
      resolve(result)
    }

    const fail = (error: Error) => {
      if (resolved) return
      resolved = true
      cleanup()
      reject(error)
    }

    // Set timeout
    timer = setTimeout(() => {
      fail(new TimeoutError(`waitForTx(${txHash})`, timeout))
    }, timeout)

    // Start async flow
    const execute = async () => {
      // Phase 1: Subscribe to blocks FIRST (guarantees we catch future blocks)
      session = createSession(chainInfo, { autoReconnect: false })

      sub = await session.subscribe({ event: 'block' }, () => {
        if (resolved) return
        // Query for tx on each new block
        void queryTx(client, txHash).then(result => {
          if (result && !resolved) {
            complete(result)
          }
        })
      })

      // Phase 2: After subscription established, check if tx already exists
      // This handles the race condition where tx was included before we subscribed
      if (resolved) return

      const existing = await queryTx(client, txHash)
      if (existing && !resolved) {
        complete(existing)
      }
    }

    execute().catch(fail)
  })
}

/**
 * Internal: Polling-based waitForTx implementation.
 */
async function waitForTxPolling(
  client: TxQueryClient,
  txHash: string,
  options: WaitForTxOptions
): Promise<TxResult> {
  const timeout = options.timeout ?? DEFAULT_TX_TIMEOUT_MS
  const pollInterval = options.pollInterval ?? DEFAULT_POLL_INTERVAL_MS
  const startTime = Date.now()

  while (true) {
    // Check timeout
    if (Date.now() - startTime > timeout) {
      throw new TimeoutError(`waitForTx(${txHash})`, timeout)
    }

    const result = await queryTx(client, txHash)
    if (result) {
      return result
    }

    // Wait before next poll
    await new Promise(r => setTimeout(r, pollInterval))
  }
}

// ============================================================================
// Event Query Utilities
// ============================================================================

/**
 * Build CometBFT query string from EventFilter.
 *
 * @param filter - Event filter criteria
 * @param fromHeight - Optional minimum block height
 * @returns CometBFT query string
 *
 * @example
 * ```typescript
 * buildEventQuery({ type: 'transfer', attributes: { recipient: 'init1...' } })
 * // => "transfer.recipient='init1...'"
 *
 * buildEventQuery({ type: 'transfer' }, 1000n)
 * // => "tx.height>=1000"
 * ```
 */
export function buildEventQuery(filter: EventFilter, fromHeight?: Numeric): string {
  const conditions: string[] = []

  // Add attribute conditions
  if (filter.attributes) {
    for (const [key, value] of Object.entries(filter.attributes)) {
      // CometBFT query format: event_type.attribute_key='value'
      conditions.push(`${filter.type}.${key}='${value}'`)
    }
  }

  // If no attributes, use a tx.height query to get all transactions
  // We'll filter by event type later
  if (conditions.length === 0) {
    conditions.push('tx.height>0')
  }

  // Add height filter
  if (fromHeight !== undefined) {
    conditions.push(`tx.height>=${fromHeight}`)
  }

  return conditions.join(' AND ')
}

/**
 * Check if a TxResult matches the given EventFilter.
 *
 * @param tx - Transaction result to check
 * @param filter - Event filter criteria
 * @returns true if the transaction contains a matching event
 */
export function matchesEventFilter(tx: TxResult, filter: EventFilter): boolean {
  for (const event of tx.events) {
    // Check event type
    if (event.type !== filter.type) {
      continue
    }

    // If no attributes required, type match is enough
    if (!filter.attributes || Object.keys(filter.attributes).length === 0) {
      return true
    }

    // Check all required attributes
    const attrMap = new Map(event.attributes.map(a => [a.key, a.value]))
    let allMatch = true

    for (const [key, value] of Object.entries(filter.attributes)) {
      if (attrMap.get(key) !== value) {
        allMatch = false
        break
      }
    }

    if (allMatch) {
      return true
    }
  }

  return false
}

// ============================================================================
// waitForEvent
// ============================================================================

/**
 * Wait for transactions containing events that match the filter criteria.
 *
 * **Strategy selection:**
 * - If `chainInfo` is provided and has WebSocket endpoint → uses WebSocket for real-time events
 * - Otherwise → uses polling via `getTxsEvent` gRPC
 *
 * **WebSocket mode** (recommended for waiting on future events):
 * - Subscribes to new transactions first
 * - Queries historical transactions from `fromHeight`
 * - Combines results in ascending height order
 *
 * **Polling mode**:
 * - Queries `getTxsEvent` at regular intervals
 * - Filters results by event type/attributes
 *
 * @param client - gRPC client with tx service (must support getTxsEvent)
 * @param filter - Event filter criteria
 * @param options - Wait options (timeout, pollInterval, chainInfo, fromHeight, maxResults)
 * @returns Array of TxResult matching the filter
 * @throws {TimeoutError} If no matching events found within timeout
 *
 * @example Wait for transfer events (polling)
 * ```typescript
 * const txs = await waitForEvent(client, {
 *   type: 'transfer',
 *   attributes: { recipient: 'init1...' }
 * })
 * ```
 *
 * @example Wait for events from specific height (WebSocket)
 * ```typescript
 * const txs = await waitForEvent(client, {
 *   type: 'transfer',
 *   attributes: { recipient: 'init1...' }
 * }, {
 *   chainInfo,
 *   fromHeight: 1000n,
 *   maxResults: 10
 * })
 * ```
 */
export async function waitForEvent(
  client: TxSearchClient,
  filter: EventFilter,
  options: WaitForEventOptions = {}
): Promise<TxResult[]> {
  // Use WebSocket if chainInfo with wss endpoint is provided
  if (options.chainInfo?.wss) {
    try {
      return await waitForEventWebSocket(client, filter, options.chainInfo, options)
    } catch (error) {
      // If WebSocket fails (not timeout), fallback to polling
      if (error instanceof TimeoutError) {
        throw error
      }
      // WebSocket connection failed, fallback to polling
    }
  }

  // Fallback to polling
  return waitForEventPolling(client, filter, options)
}

/**
 * Internal: WebSocket-based waitForEvent implementation.
 *
 * Uses "Subscribe First, Query After" pattern:
 * 1. Subscribe to tx events first (guarantees future transactions)
 * 2. Query historical transactions matching filter
 * 3. Combine and deduplicate results
 */
async function waitForEventWebSocket(
  client: TxSearchClient,
  filter: EventFilter,
  chainInfo: ChainInfo,
  options: WaitForEventOptions
): Promise<TxResult[]> {
  const timeout = options.timeout ?? DEFAULT_EVENT_TIMEOUT_MS
  const maxResults = options.maxResults ?? 100

  return new Promise((resolve, reject) => {
    let resolved = false
    let session: WebSocketSession | null = null
    let sub: Subscription | null = null
    let timer: ReturnType<typeof setTimeout> | null = null
    const results: Map<string, TxResult> = new Map() // Dedupe by txHash

    const cleanup = () => {
      if (timer) {
        clearTimeout(timer)
        timer = null
      }
      if (sub) {
        sub.unsubscribe()
        sub = null
      }
      if (session) {
        session.close()
        session = null
      }
    }

    const complete = () => {
      if (resolved) return
      resolved = true
      cleanup()
      // Sort by height ascending and return as array
      const sorted = Array.from(results.values()).sort((a, b) =>
        a.height < b.height ? -1 : a.height > b.height ? 1 : 0
      )
      resolve(sorted.slice(0, maxResults))
    }

    const fail = (error: Error) => {
      if (resolved) return
      resolved = true
      cleanup()
      reject(error)
    }

    const addResult = (tx: TxResult) => {
      if (resolved) return
      if (!results.has(tx.txHash) && matchesEventFilter(tx, filter)) {
        results.set(tx.txHash, tx)
        // Check if we have enough results
        if (results.size >= maxResults) {
          complete()
        }
      }
    }

    // Set timeout
    timer = setTimeout(() => {
      // On timeout, return whatever we have (even if empty)
      if (results.size > 0) {
        complete()
      } else {
        fail(new TimeoutError(`waitForEvent(${filter.type})`, timeout))
      }
    }, timeout)

    // Start async flow
    const execute = async () => {
      // Phase 1: Subscribe to tx events FIRST (guarantees we catch future txs)
      session = createSession(chainInfo, { autoReconnect: false })

      sub = await session.subscribe<WsTxResult>({ event: 'tx' }, wsTx => {
        if (resolved) return
        if (wsTx.height && wsTx.result) {
          // Convert WsTxResult to TxResult format
          const tx: TxResult = {
            height: BigInt(wsTx.height),
            txHash: wsTx.tx ?? '',
            code: wsTx.result.code ?? 0,
            rawLog: wsTx.result.log ?? '',
            gasUsed: BigInt(wsTx.result.gas_used ?? '0'),
            gasWanted: BigInt(wsTx.result.gas_wanted ?? '0'),
            events: (wsTx.result.events ?? []).map(e => ({
              type: e.type ?? '',
              attributes: (e.attributes ?? []).map(a => ({
                key: a.key ?? '',
                value: a.value ?? '',
              })),
            })),
          }
          addResult(tx)
        }
      })

      // Phase 2: Query historical transactions matching filter
      if (resolved) return

      const query = buildEventQuery(filter, options.fromHeight)
      try {
        const response = await client.tx.getTxsEvent({
          query,
          limit: BigInt(maxResults),
          orderBy: 1, // ORDER_BY_ASC
        })

        for (const txResponse of response.txResponses) {
          if (resolved) break
          const tx = formatTxResult(txResponse)
          addResult(tx)
        }

        // If we got results from historical query and no more are expected, complete
        // (For real-time waiting, keep subscription active until timeout)
        if (results.size >= maxResults) {
          complete()
        }
      } catch {
        // Historical query failed, continue with WebSocket only
      }
    }

    execute().catch(fail)
  })
}

/**
 * Internal: Polling-based waitForEvent implementation.
 */
async function waitForEventPolling(
  client: TxSearchClient,
  filter: EventFilter,
  options: WaitForEventOptions
): Promise<TxResult[]> {
  const timeout = options.timeout ?? DEFAULT_EVENT_TIMEOUT_MS
  const pollInterval = options.pollInterval ?? DEFAULT_POLL_INTERVAL_MS
  const maxResults = options.maxResults ?? 100
  const startTime = Date.now()
  const results: Map<string, TxResult> = new Map()

  const query = buildEventQuery(filter, options.fromHeight)

  while (true) {
    // Check timeout
    if (Date.now() - startTime > timeout) {
      // Return whatever we have on timeout
      if (results.size > 0) {
        const sorted = Array.from(results.values()).sort((a, b) =>
          a.height < b.height ? -1 : a.height > b.height ? 1 : 0
        )
        return sorted.slice(0, maxResults)
      }
      throw new TimeoutError(`waitForEvent(${filter.type})`, timeout)
    }

    try {
      const response = await client.tx.getTxsEvent({
        query,
        limit: BigInt(maxResults),
        orderBy: 1, // ORDER_BY_ASC
      })

      for (const txResponse of response.txResponses) {
        const tx = formatTxResult(txResponse)
        if (!results.has(tx.txHash) && matchesEventFilter(tx, filter)) {
          results.set(tx.txHash, tx)
        }
      }

      // If we have enough results, return
      if (results.size >= maxResults) {
        const sorted = Array.from(results.values()).sort((a, b) =>
          a.height < b.height ? -1 : a.height > b.height ? 1 : 0
        )
        return sorted.slice(0, maxResults)
      }
    } catch {
      // Query failed, continue polling
    }

    // Wait before next poll
    await new Promise(r => setTimeout(r, pollInterval))
  }
}
