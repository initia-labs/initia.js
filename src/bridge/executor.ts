/**
 * Executor API client for OPInit withdrawal data.
 *
 * Fetches withdrawal information and Merkle proofs from the Executor REST API.
 * Each L2 chain has its own Executor instance (executor_uri in registry metadata).
 */

import type { Numeric } from '../types'
import { Coin } from '../core/coin'
import { bytesToHex } from '@noble/hashes/utils.js'
import { base64 } from '@scure/base'
import type { WithdrawalInfo } from './types'
import { fetchJson } from '../util/fetch'

/**
 * Raw Executor API response for a single withdrawal.
 */
interface ExecutorWithdrawal {
  sequence: number
  from: string
  to: string
  amount: { denom: string; amount: string }
  output_index: number
  bridge_id: number
  withdrawal_proofs: string[] // base64
  version: string // base64
  storage_root: string // base64
  last_block_hash: string // base64
  tx_hash: string
  tx_time: string
  tx_height: number
}

/**
 * Decode base64 string to hex string.
 */
function base64ToHex(b64: string): string {
  return bytesToHex(base64.decode(b64))
}

/**
 * Convert Executor API response to WithdrawalInfo.
 * Status is set to { status: 'pending' } as a placeholder — actual status
 * is determined by L1 queries in the status determination logic.
 */
function toWithdrawalInfo(raw: ExecutorWithdrawal): Omit<WithdrawalInfo, 'status'> {
  return {
    sequence: BigInt(raw.sequence),
    from: raw.from,
    to: raw.to,
    amount: new Coin(raw.amount.denom, raw.amount.amount),
    outputIndex: BigInt(raw.output_index),
    bridgeId: BigInt(raw.bridge_id),
    txHash: raw.tx_hash,
    withdrawalProofs: raw.withdrawal_proofs.map(base64ToHex),
    version: base64ToHex(raw.version),
    storageRoot: base64ToHex(raw.storage_root),
    lastBlockHash: base64ToHex(raw.last_block_hash),
  }
}

/**
 * Pagination options for withdrawal list queries.
 */
export interface FetchWithdrawalsOptions {
  limit?: number
  offset?: number
}

/**
 * Fetch paginated withdrawal list from Executor API.
 *
 * @param executorUri - Executor API base URL (e.g., 'https://executor.minimove-2.initia.xyz')
 * @param address - L2 sender address to query withdrawals for
 * @param options - Pagination options
 * @returns Array of WithdrawalInfo without status (status determined separately by L1 queries)
 */
export async function fetchWithdrawals(
  executorUri: string,
  address: string,
  options?: FetchWithdrawalsOptions
): Promise<Omit<WithdrawalInfo, 'status'>[]> {
  const params = new URLSearchParams()
  if (options?.limit != null) params.set('limit', String(options.limit))
  if (options?.offset != null) params.set('offset', String(options.offset))

  const query = params.toString()
  const url = `${executorUri}/withdrawals/${address}${query ? `?${query}` : ''}`

  const data = await fetchJson<{ withdrawals: ExecutorWithdrawal[] }>(url)
  return data.withdrawals.map(toWithdrawalInfo)
}

/**
 * Fetch a single withdrawal by sequence from Executor API.
 *
 * @param executorUri - Executor API base URL
 * @param sequence - Withdrawal sequence number
 * @returns WithdrawalInfo without status (status determined separately by L1 queries)
 */
export async function fetchWithdrawal(
  executorUri: string,
  sequence: Numeric
): Promise<Omit<WithdrawalInfo, 'status'>> {
  const url = `${executorUri}/withdrawal/${sequence.toString()}`

  const data = await fetchJson<ExecutorWithdrawal>(url)
  return toWithdrawalInfo(data)
}
