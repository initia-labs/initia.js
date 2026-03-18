/**
 * EVM Event Decoding Utilities
 *
 * Provides helpers for decoding EVM event logs from transaction receipts
 * and getLogs() results.
 */

import type { Abi, AbiEvent } from 'abitype'
import {
  decodeEventLog,
  encodeEventTopics,
  type ContractEventName,
  type DecodeEventLogReturnType,
} from 'viem'
import type { EvmLog } from '../../client/evm-rpc'

// Re-export for convenience
export { decodeEventLog }

// =============================================================================
// Types
// =============================================================================

/**
 * Decoded EVM event with original log data.
 *
 * When `TAbi` is a narrow `as const` ABI, `eventName` and `args` are
 * inferred from the ABI event definitions. When `TEventName` is provided,
 * the type is narrowed to that specific event.
 */
export type DecodedEvmLog<
  TAbi extends Abi = Abi,
  TEventName extends ContractEventName<TAbi> | undefined = undefined,
> = {
  /** Original log data */
  log: EvmLog
  /** Block number (parsed to bigint) */
  blockNumber: bigint
  /** Transaction index */
  transactionIndex: number
  /** Log index */
  logIndex: number
} & DecodeEventLogReturnType<TAbi, TEventName>

/**
 * Options for decoding EVM logs.
 */
export interface DecodeEvmLogsOptions {
  /**
   * Whether to skip logs that fail to decode.
   * If false, throws an error on decode failure.
   * @default true
   */
  skipInvalid?: boolean
}

// =============================================================================
// Functions
// =============================================================================

/**
 * Decode a single EVM log using the provided ABI.
 *
 * @param abi - Contract ABI containing event definitions
 * @param log - EVM log to decode
 * @returns Decoded event data with ABI-inferred eventName and args
 * @throws If log cannot be decoded with the provided ABI
 *
 * @example
 * ```typescript
 * import { decodeEvmLog } from 'initia.js'
 *
 * const log = await rpcClient.getLogs({ address: contractAddress })
 * const decoded = decodeEvmLog(erc20Abi, log[0])
 * if (decoded.eventName === 'Transfer') {
 *   console.log(decoded.args.from, decoded.args.to, decoded.args.value)
 * }
 * ```
 */
export function decodeEvmLog<const TAbi extends Abi>(abi: TAbi, log: EvmLog): DecodedEvmLog<TAbi> {
  const topics = log.topics as [`0x${string}`, ...`0x${string}`[]]
  const data = log.data as `0x${string}`

  const decoded = decodeEventLog({
    abi,
    data,
    topics,
    strict: false,
  })

  return {
    log,
    eventName: decoded.eventName,
    args: decoded.args,
    blockNumber: BigInt(log.blockNumber),
    transactionIndex: parseInt(log.transactionIndex, 16),
    logIndex: parseInt(log.logIndex, 16),
  } as DecodedEvmLog<TAbi>
}

/**
 * Decode multiple EVM logs using the provided ABI.
 *
 * @param abi - Contract ABI containing event definitions
 * @param logs - Array of EVM logs to decode
 * @param options - Decode options
 * @returns Array of decoded events with ABI-inferred types
 *
 * @example
 * ```typescript
 * import { createEvmRpcClient, decodeEvmLogs } from 'initia.js'
 *
 * const rpc = createEvmRpcClient(evmRpcEndpoint)
 * const logs = await rpc.getLogs({
 *   address: contractAddress,
 *   fromBlock: 1000000,
 *   toBlock: 'latest',
 * })
 *
 * const decoded = decodeEvmLogs(erc20Abi, logs)
 * for (const event of decoded) {
 *   if (event.eventName === 'Transfer') {
 *     console.log(event.args.from, event.args.to, event.args.value)
 *   }
 * }
 * ```
 */
export function decodeEvmLogs<const TAbi extends Abi>(
  abi: TAbi,
  logs: EvmLog[],
  options: DecodeEvmLogsOptions = {}
): DecodedEvmLog<TAbi>[] {
  const { skipInvalid = true } = options
  const decoded: DecodedEvmLog<TAbi>[] = []

  for (const log of logs) {
    try {
      decoded.push(decodeEvmLog(abi, log))
    } catch (error) {
      if (!skipInvalid) {
        throw error
      }
      // Skip logs that can't be decoded (from other contracts or unknown events)
    }
  }

  return decoded
}

/**
 * Filter and decode logs by event name.
 *
 * @param abi - Contract ABI containing event definitions
 * @param logs - Array of EVM logs to filter and decode
 * @param eventName - Event name to filter by (narrowed to ABI event names)
 * @returns Array of decoded events narrowed to the specified event type
 *
 * @example
 * ```typescript
 * import { filterEvmLogsByEvent } from 'initia.js'
 *
 * const transfers = filterEvmLogsByEvent(erc20Abi, logs, 'Transfer')
 * for (const transfer of transfers) {
 *   // args is typed: { from: `0x${string}`, to: `0x${string}`, value: bigint }
 *   console.log(`Transfer from ${transfer.args.from} to ${transfer.args.to}: ${transfer.args.value}`)
 * }
 * ```
 */
export function filterEvmLogsByEvent<
  const TAbi extends Abi,
  TEventName extends ContractEventName<TAbi>,
>(abi: TAbi, logs: EvmLog[], eventName: TEventName): DecodedEvmLog<TAbi, TEventName>[] {
  const decoded = decodeEvmLogs(abi, logs, { skipInvalid: true })
  return decoded.filter(d => d.eventName === eventName) as DecodedEvmLog<TAbi, TEventName>[]
}

/**
 * Get event signature (topic0) for an event by name.
 *
 * @param abi - Contract ABI containing event definitions
 * @param eventName - Event name (narrowed to ABI event names)
 * @returns Event signature hash (topic0) or undefined if not found
 *
 * @example
 * ```typescript
 * import { getEventSignature } from 'initia.js'
 *
 * const topic = getEventSignature(erc20Abi, 'Transfer')
 * // 0xddf252ad1be2c89b69c2b068fc378daa952ba7f163c4a11628f55a4df523b3ef
 * ```
 */
export function getEventSignature<const TAbi extends Abi>(
  abi: TAbi,
  eventName: ContractEventName<TAbi>
): `0x${string}` | undefined {
  const event = abi.find(
    (item): item is AbiEvent => item.type === 'event' && item.name === eventName
  )

  if (!event) {
    return undefined
  }

  try {
    const topics = encodeEventTopics({
      abi: [event],
      eventName: event.name,
    })
    return topics[0]
  } catch {
    return undefined
  }
}
