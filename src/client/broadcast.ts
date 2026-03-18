/**
 * Broadcast module - Submit signed transactions to the network.
 */

import { BroadcastMode as BsrBroadcastMode } from '@buf/cosmos_cosmos-sdk.bufbuild_es/cosmos/tx/v1beta1/service_pb'
import { BroadcastError } from '../errors'
import type { SignedTx, TxOptions } from './types'
import type { TxResult, WaitForTxOptions } from './websocket'

/**
 * Broadcast mode for transaction submission.
 */
export type BroadcastMode = 'sync' | 'async' | 'block'

/**
 * Options for broadcasting a transaction.
 */
export interface BroadcastOptions {
  /** Broadcast mode (default: 'sync') */
  mode?: BroadcastMode
}

/**
 * Result of a successful broadcast.
 */
export interface BroadcastResult {
  /** Transaction hash */
  txHash: string
  /** Gas used by the transaction */
  gasUsed: bigint
  /** Raw log from the transaction (if available) */
  rawLog?: string
}

/**
 * Broadcast result with deferred wait capability.
 *
 * Extends BroadcastResult with a method to wait for transaction confirmation.
 * This allows getting the txHash immediately while optionally waiting later.
 *
 * @example
 * ```typescript
 * const result = await ctx.signAndBroadcast(msgs)
 * console.log('Broadcast done:', result.txHash)
 *
 * // Wait for confirmation when needed
 * const confirmed = await result.waitForConfirmation({ timeout: 30000 })
 * console.log('Confirmed at height:', confirmed.height)
 * ```
 */
export interface BroadcastResultWithWait extends BroadcastResult {
  /**
   * Wait for the transaction to be included in a block.
   *
   * Uses WebSocket if available, falls back to polling.
   *
   * @param options - Wait options (timeout, pollInterval)
   * @returns Transaction result with block height and events
   * @throws {TimeoutError} If not confirmed within timeout
   */
  waitForConfirmation(options?: WaitForTxOptions): Promise<TxResult>
}

/**
 * Options for signAndBroadcast with optional wait.
 * Extends TxOptions to include fee, gasLimit, memo, and signMode.
 */
export interface SignBroadcastOptions extends TxOptions {
  /**
   * Wait for transaction confirmation after broadcast.
   *
   * - `true`: Wait with default options (30s timeout)
   * - `WaitForTxOptions`: Wait with custom timeout/pollInterval
   * - `undefined`/`false`: Don't wait (default)
   *
   * When enabled, returns TxResult instead of BroadcastResultWithWait.
   */
  waitForConfirmation?: boolean | WaitForTxOptions

  /**
   * Gas price string for automatic fee estimation (e.g., '0.015uinit').
   *
   * When `fee` is not provided, `signAndBroadcast` will automatically
   * estimate gas using simulation and calculate the fee from this gas price.
   *
   * Defaults to '0.015uinit' if omitted and auto-estimation is triggered.
   */
  gasPrice?: string

  /**
   * Gas multiplier for automatic fee estimation (default: 1.4).
   *
   * Applied to the simulated gas to provide a safety margin.
   * Only used during auto-estimation (when `fee` is not provided).
   */
  gasMultiplier?: number
}

/**
 * Helper to create BroadcastResultWithWait from BroadcastResult.
 * @internal
 */
export function createBroadcastResultWithWait(
  result: BroadcastResult,
  waitFn: (txHash: string, options?: WaitForTxOptions) => Promise<TxResult>
): BroadcastResultWithWait {
  return {
    ...result,
    waitForConfirmation: (options?: WaitForTxOptions) => waitFn(result.txHash, options),
  }
}

/**
 * Minimal client interface for broadcasting transactions.
 * Compatible with any client that has a tx service.
 */
export interface TxClient {
  tx: {
    broadcastTx(request: { txBytes: Uint8Array; mode: BsrBroadcastMode }): Promise<{
      txResponse?: {
        txhash: string
        code: number
        rawLog: string
        gasUsed: bigint
      }
    }>
  }
}

/**
 * Map our BroadcastMode to BSR enum.
 */
function toBsrMode(mode: BroadcastMode): BsrBroadcastMode {
  switch (mode) {
    case 'sync':
      return BsrBroadcastMode.SYNC
    case 'async':
      return BsrBroadcastMode.ASYNC
    case 'block':
      return BsrBroadcastMode.BLOCK
  }
}

/**
 * Broadcast a signed transaction to the network.
 *
 * @param client - gRPC client with tx service
 * @param signedTx - Signed transaction bytes
 * @param options - Broadcast options (mode defaults to 'sync')
 * @returns Broadcast result with txHash and gasUsed
 * @throws {BroadcastError} If the transaction fails
 *
 * @example
 * ```typescript
 * const result = await broadcast(client, signedTx)
 * console.log('Tx hash:', result.txHash)
 * console.log('Gas used:', result.gasUsed)
 * ```
 */
export async function broadcast(
  client: TxClient,
  signedTx: SignedTx,
  options?: BroadcastOptions
): Promise<BroadcastResult> {
  const mode = options?.mode ?? 'sync'

  const response = await client.tx.broadcastTx({
    txBytes: signedTx.txBytes,
    mode: toBsrMode(mode),
  })

  const txResponse = response.txResponse
  if (!txResponse) {
    throw new BroadcastError('', 0, 'No response from broadcast')
  }

  if (txResponse.code !== 0) {
    throw new BroadcastError(txResponse.txhash, txResponse.code, txResponse.rawLog)
  }

  return {
    txHash: txResponse.txhash,
    gasUsed: txResponse.gasUsed,
    rawLog: txResponse.rawLog || undefined,
  }
}
