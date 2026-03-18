/**
 * WebSocket subscription utilities for real-time blockchain events.
 *
 * This module re-exports from the modular websocket/ directory.
 *
 * @example Session-based (recommended for multiple subscriptions)
 * ```typescript
 * const session = createSession(chainInfo)
 *
 * // Cosmos events
 * const sub1 = await session.subscribe({ event: 'block' }, onBlock)
 * const sub2 = await session.subscribe({ event: 'tx', filter: "..." }, onTx)
 *
 * // EVM events (minievm chains)
 * const sub3 = await session.subscribe({ event: 'evmLogs', filter: {...} }, onLog)
 *
 * // Cleanup
 * session.close()
 * ```
 *
 * @example Standalone (for single subscriptions)
 * ```typescript
 * const sub = await subscribe(chainInfo, { event: 'block' }, onBlock)
 * sub.unsubscribe()  // Closes the connection
 * ```
 *
 * @module
 */

// Re-export everything from the modular websocket directory
export * from './websocket/index'
