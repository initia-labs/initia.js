/**
 * Bridge WebSocket monitor — real-time deposit/withdrawal tracking.
 */

import type { ChainInfoProvider } from '../provider/types'
import type { Subscription, WsTxResult } from '../client/websocket'
import { createSession, type WebSocketSession } from '../client/websocket/session'
import type { InitiaClient } from '../client/types'
import type { TransportFactory } from '../client/transport-common'
import { initiaChain } from '../chains/initia'
import { createGrpcClient } from '../client/grpc-client'
import { wrapClientWithCache } from '../client/cached-client'
import { TimeoutError, WebSocketNotAvailableError } from '../errors'
import { durationToMs } from './utils'
import type {
  DepositEvent,
  WithdrawalEvent,
  WatchDepositOptions,
  WatchWithdrawalOptions,
  BridgeWatchHandle,
} from './types'

// =============================================================================
// Helpers
// =============================================================================

/**
 * Extract events of a specific type from a WebSocket TxResult.
 * Returns an array of attribute maps for each matching event.
 */
export function parseTxEvents(tx: WsTxResult, eventType: string): Record<string, string>[] {
  const results: Record<string, string>[] = []
  const events = tx.result?.events ?? []

  for (const event of events) {
    if (event.type !== eventType) continue

    const attrs: Record<string, string> = {}
    for (const attr of event.attributes ?? []) {
      if (attr.key && attr.value !== undefined) {
        attrs[attr.key] = attr.value
      }
    }
    results.push(attrs)
  }

  return results
}

function buildDepositFilter(
  eventType: string,
  opts: WatchDepositOptions,
  bridgeId?: bigint
): string | undefined {
  const conditions: string[] = []

  if (eventType === 'initiate_token_deposit') {
    if (bridgeId !== undefined) conditions.push(`initiate_token_deposit.bridge_id='${bridgeId}'`)
    if (opts.l1Sequence !== undefined)
      conditions.push(`initiate_token_deposit.l1_sequence='${opts.l1Sequence}'`)
    if (opts.sender) conditions.push(`initiate_token_deposit.from='${opts.sender}'`)
    if (opts.recipient) conditions.push(`initiate_token_deposit.to='${opts.recipient}'`)
  } else if (eventType === 'finalize_token_deposit') {
    if (opts.l1Sequence !== undefined)
      conditions.push(`finalize_token_deposit.l1_sequence='${opts.l1Sequence}'`)
    if (opts.sender) conditions.push(`finalize_token_deposit.sender='${opts.sender}'`)
    if (opts.recipient) conditions.push(`finalize_token_deposit.recipient='${opts.recipient}'`)
  }

  return conditions.length > 0 ? conditions.join(' AND ') : undefined
}

function buildWithdrawalFilter(
  eventType: string,
  opts: WatchWithdrawalOptions,
  bridgeId?: bigint
): string | undefined {
  const conditions: string[] = []

  if (eventType === 'initiate_token_withdrawal') {
    if (opts.l2Sequence !== undefined)
      conditions.push(`initiate_token_withdrawal.l2_sequence='${opts.l2Sequence}'`)
    if (opts.sender) conditions.push(`initiate_token_withdrawal.from='${opts.sender}'`)
  } else if (eventType === 'propose_output') {
    if (bridgeId !== undefined) conditions.push(`propose_output.bridge_id='${bridgeId}'`)
  } else if (eventType === 'finalize_token_withdrawal') {
    if (bridgeId !== undefined) conditions.push(`finalize_token_withdrawal.bridge_id='${bridgeId}'`)
    if (opts.l2Sequence !== undefined)
      conditions.push(`finalize_token_withdrawal.l2_sequence='${opts.l2Sequence}'`)
  }

  return conditions.length > 0 ? conditions.join(' AND ') : undefined
}

// =============================================================================
// watchDeposit
// =============================================================================

/**
 * Watch deposit events in real-time via WebSocket.
 *
 * Subscribes to L1 initiate_token_deposit and L2 finalize_token_deposit events.
 * Call `handle.unsubscribe()` to stop watching and close connections.
 */
export function watchDeposit(
  provider: ChainInfoProvider,
  options: WatchDepositOptions,
  callback: (event: DepositEvent) => void
): BridgeWatchHandle {
  const l2Info = provider.getChainInfo(options.l2ChainId)
  if (!l2Info) throw new Error(`Chain not found: ${options.l2ChainId}`)

  const l1Info = provider.listChains().find(c => c.chainType === 'initia')
  if (!l1Info) throw new Error('L1 (initia) chain not found in provider')

  if (!l1Info.wss) throw new WebSocketNotAvailableError(l1Info.chainId)
  if (!l2Info.wss) throw new WebSocketNotAvailableError(l2Info.chainId)

  const bridgeId = l2Info.opBridgeId
  const sessions: WebSocketSession[] = []
  const subs: Subscription[] = []
  let cleaned = false
  const cleanup = () => {
    if (cleaned) return
    cleaned = true
    for (const sub of subs) sub.unsubscribe()
    for (const session of sessions) session.close()
    subs.length = 0
    sessions.length = 0
  }

  // Default error handler terminates the watch to avoid partial-subscription degradation.
  const handleError: (error: unknown) => void =
    options.onError ??
    (err => {
      console.error(
        '[initia.js] watchDeposit failed — watcher terminated. Provide onError to handle:',
        err
      )
      cleanup()
    })

  // L1: initiate_token_deposit
  const l1Session = createSession(l1Info)
  sessions.push(l1Session)
  const l1Filter = buildDepositFilter('initiate_token_deposit', options, bridgeId)

  void l1Session
    .subscribe({ event: 'tx', filter: l1Filter }, tx => {
      const events = parseTxEvents(tx, 'initiate_token_deposit')
      for (const attrs of events) {
        if (options.l1Sequence !== undefined && attrs.l1_sequence !== String(options.l1Sequence))
          continue
        callback({
          status: 'initiated',
          l1Sequence: BigInt(attrs.l1_sequence ?? '0'),
          from: attrs.from ?? '',
          to: attrs.to ?? '',
          amount: attrs.amount ?? '0',
          bridgeId: BigInt(attrs.bridge_id ?? '0'),
        })
      }
    })
    .then(sub => {
      if (!cleaned) subs.push(sub)
      else sub.unsubscribe()
    })
    .catch(handleError)

  // L2: finalize_token_deposit
  const l2Session = createSession(l2Info)
  sessions.push(l2Session)
  const l2Filter = buildDepositFilter('finalize_token_deposit', options)

  void l2Session
    .subscribe({ event: 'tx', filter: l2Filter }, tx => {
      const events = parseTxEvents(tx, 'finalize_token_deposit')
      for (const attrs of events) {
        if (options.l1Sequence !== undefined && attrs.l1_sequence !== String(options.l1Sequence))
          continue
        callback({
          status: 'finalized',
          l1Sequence: BigInt(attrs.l1_sequence ?? '0'),
          recipient: attrs.recipient ?? '',
          amount: attrs.amount ?? '0',
          success: attrs.success === 'true',
          reason: attrs.reason || undefined,
        })
      }
    })
    .then(sub => {
      if (!cleaned) subs.push(sub)
      else sub.unsubscribe()
    })
    .catch(handleError)

  return { unsubscribe: cleanup }
}

// =============================================================================
// watchWithdrawal
// =============================================================================

/**
 * Watch withdrawal events in real-time via WebSocket.
 *
 * Subscribes to L2 initiate_token_withdrawal, L1 propose_output, and
 * L1 finalize_token_withdrawal events. Emits 'waiting' and 'claimable'
 * events based on the finalization period.
 *
 * Call `handle.unsubscribe()` to stop watching and close connections.
 */
export function watchWithdrawal(
  provider: ChainInfoProvider,
  options: WatchWithdrawalOptions,
  callback: (event: WithdrawalEvent) => void,
  createTransport: TransportFactory
): BridgeWatchHandle {
  const l2Info = provider.getChainInfo(options.l2ChainId)
  if (!l2Info) throw new Error(`Chain not found: ${options.l2ChainId}`)
  if (l2Info.opBridgeId == null) throw new Error(`Chain ${options.l2ChainId} has no opBridgeId`)

  const l1Info = provider.listChains().find(c => c.chainType === 'initia')
  if (!l1Info) throw new Error('L1 (initia) chain not found in provider')

  if (!l1Info.wss) throw new WebSocketNotAvailableError(l1Info.chainId)
  if (!l2Info.wss) throw new WebSocketNotAvailableError(l2Info.chainId)

  const bridgeId = l2Info.opBridgeId
  const sessions: WebSocketSession[] = []
  const subs: Subscription[] = []
  const timers: ReturnType<typeof setTimeout>[] = []
  let timeoutTimer: ReturnType<typeof setTimeout> | null = null
  let cleaned = false

  const cleanup = () => {
    if (cleaned) return
    cleaned = true
    for (const sub of subs) sub.unsubscribe()
    for (const session of sessions) session.close()
    for (const timer of timers) clearTimeout(timer)
    if (timeoutTimer) clearTimeout(timeoutTimer)
    subs.length = 0
    sessions.length = 0
    timers.length = 0
  }

  // Default error handler terminates the watch to avoid partial-subscription degradation.
  const handleError: (error: unknown) => void =
    options.onError ??
    (err => {
      console.error(
        '[initia.js] watchWithdrawal failed — watcher terminated. Provide onError to handle:',
        err
      )
      cleanup()
    })

  if (options.timeout) {
    timeoutTimer = setTimeout(() => {
      cleanup()
      handleError(new TimeoutError('watchWithdrawal', options.timeout!))
    }, options.timeout)
  }

  // Fetch finalization period — required for waiting/claimable events.
  // On failure the watch is terminated via cleanup() and handleError.
  // cleanup() is called explicitly before handleError (idempotent; safe if
  // handleError's default also calls cleanup).
  // Stored as a Promise so propose_output callbacks can await it (avoids race).
  const finalizationMsPromise = (async () => {
    const config = initiaChain.build()
    const transport = createTransport(l1Info)
    const raw = createGrpcClient(transport, config.services, undefined, undefined, config.registry)
    const client = wrapClientWithCache(raw, l1Info.chainId) as InitiaClient
    const ophost = client.ophost
    const resp = await ophost.bridge({ bridgeId })
    const fp = resp.bridgeConfig?.finalizationPeriod
    if (!fp) {
      throw new Error(
        'Bridge config missing finalizationPeriod — cannot determine claimable timing'
      )
    }
    return durationToMs(fp)
  })()

  // Top-level rejection handler: terminates watch and notifies caller.
  finalizationMsPromise.catch(err => {
    cleanup()
    handleError(err)
  })

  // L2: initiate_token_withdrawal
  const l2Session = createSession(l2Info)
  sessions.push(l2Session)
  const l2Filter = buildWithdrawalFilter('initiate_token_withdrawal', options)

  void l2Session
    .subscribe({ event: 'tx', filter: l2Filter }, tx => {
      const events = parseTxEvents(tx, 'initiate_token_withdrawal')
      for (const attrs of events) {
        if (options.l2Sequence !== undefined && attrs.l2_sequence !== String(options.l2Sequence))
          continue
        callback({
          status: 'initiated',
          l2Sequence: BigInt(attrs.l2_sequence ?? '0'),
          from: attrs.from ?? '',
          to: attrs.to ?? '',
          amount: attrs.amount ?? '0',
        })
      }
    })
    .then(sub => {
      if (!cleaned) subs.push(sub)
      else sub.unsubscribe()
    })
    .catch(handleError)

  // L1: propose_output + finalize_token_withdrawal
  const l1Session = createSession(l1Info)
  sessions.push(l1Session)

  const proposeFilter = buildWithdrawalFilter('propose_output', options, bridgeId)
  void l1Session
    .subscribe({ event: 'tx', filter: proposeFilter }, tx => {
      const events = parseTxEvents(tx, 'propose_output')
      for (const attrs of events) {
        if (attrs.bridge_id !== String(bridgeId)) continue

        const outputIndex = BigInt(attrs.output_index ?? '0')
        const l2BlockNumber = BigInt(attrs.l2_block_number ?? '0')

        callback({ status: 'proposed', outputIndex, l2BlockNumber })

        void finalizationMsPromise
          .then(ms => {
            if (cleaned) return
            const claimableAt = new Date(Date.now() + ms)
            callback({ status: 'waiting', claimableAt })

            const timer = setTimeout(() => {
              if (!cleaned) callback({ status: 'claimable' })
            }, ms)
            timers.push(timer)
          })
          .catch(err => {
            // If finalizationMsPromise rejected, the top-level .catch() already called
            // cleanup(), so `cleaned` is true and this becomes a no-op.
            // Errors from the .then() body (e.g., user callback throws) surface normally.
            if (!cleaned) handleError(err)
          })
      }
    })
    .then(sub => {
      if (!cleaned) subs.push(sub)
      else sub.unsubscribe()
    })
    .catch(handleError)

  const claimFilter = buildWithdrawalFilter('finalize_token_withdrawal', options, bridgeId)
  void l1Session
    .subscribe({ event: 'tx', filter: claimFilter }, tx => {
      const events = parseTxEvents(tx, 'finalize_token_withdrawal')
      for (const attrs of events) {
        if (options.l2Sequence !== undefined && attrs.l2_sequence !== String(options.l2Sequence))
          continue
        callback({
          status: 'claimed',
          l2Sequence: BigInt(attrs.l2_sequence ?? '0'),
          from: attrs.from ?? '',
          to: attrs.to ?? '',
          amount: attrs.amount ?? '0',
        })
      }
    })
    .then(sub => {
      if (!cleaned) subs.push(sub)
      else sub.unsubscribe()
    })
    .catch(handleError)

  return { unsubscribe: cleanup }
}

// =============================================================================
// Promise wrappers
// =============================================================================

/**
 * Generic helper: watch for a specific event status and wrap in a Promise.
 * Resolves on matching event, rejects on error or timeout.
 */
function waitForEvent<
  TEvent extends { status: string },
  TOpts extends { onError?: (error: unknown) => void; timeout?: number },
>(
  watchFn: (
    provider: ChainInfoProvider,
    options: TOpts,
    callback: (event: TEvent) => void
  ) => BridgeWatchHandle,
  provider: ChainInfoProvider,
  options: TOpts,
  targetStatus: string,
  defaultTimeout: number,
  label: string
): Promise<TEvent> {
  return new Promise((resolve, reject) => {
    const timeout = options.timeout ?? defaultTimeout
    let settled = false

    const settle = () => {
      if (settled) return false
      settled = true
      handle.unsubscribe()
      if (timer) clearTimeout(timer)
      return true
    }

    const handle = watchFn(
      provider,
      {
        ...options,
        timeout: undefined, // Prevent watchWithdrawal's internal timeout from duplicating waitForEvent's
        onError: (err: unknown) => {
          options.onError?.(err)
          if (settle()) reject(err instanceof Error ? err : new Error(String(err)))
        },
      },
      event => {
        if (event.status === targetStatus && settle()) {
          resolve(event)
        }
      }
    )

    const timer = setTimeout(() => {
      if (settle()) reject(new TimeoutError(label, timeout))
    }, timeout)
  })
}

/**
 * Wait for a deposit to be finalized on L2.
 *
 * Returns a Promise that resolves when the finalize_token_deposit event
 * is observed on L2. Rejects on timeout (default: 5 minutes).
 */
export function waitForDeposit(
  provider: ChainInfoProvider,
  options: WatchDepositOptions & { timeout?: number }
): Promise<DepositEvent & { status: 'finalized' }> {
  return waitForEvent(
    watchDeposit,
    provider,
    options,
    'finalized',
    300_000,
    'waitForDeposit'
  ) as Promise<DepositEvent & { status: 'finalized' }>
}

/**
 * Wait for a withdrawal to become claimable on L1.
 *
 * Returns a Promise that resolves when the finalization period passes
 * after an output proposal. Rejects on timeout (default: 2 hours).
 */
export function waitForClaimable(
  provider: ChainInfoProvider,
  options: WatchWithdrawalOptions & { timeout?: number },
  createTransport: TransportFactory
): Promise<WithdrawalEvent & { status: 'claimable' }> {
  // Wrap watchWithdrawal to match waitForEvent's 3-param watchFn signature
  const watchFn = (
    p: ChainInfoProvider,
    opts: WatchWithdrawalOptions,
    cb: (event: WithdrawalEvent) => void
  ) => watchWithdrawal(p, opts, cb, createTransport)
  return waitForEvent(
    watchFn,
    provider,
    options,
    'claimable',
    7_200_000,
    'waitForClaimable'
  ) as Promise<WithdrawalEvent & { status: 'claimable' }>
}
