/**
 * Transaction decoding with VM-aware argument enrichment.
 *
 * Provides types and utilities for fetching on-chain transactions and
 * decoding their messages with VM-specific enrichment (Move BCS, EVM ABI, Wasm JSON).
 */

import type { Abi } from 'abitype'
import type { GetTxResponse } from '@buf/cosmos_cosmos-sdk.bufbuild_es/cosmos/tx/v1beta1/service_pb'
import type { Any } from '@bufbuild/protobuf/wkt'
import { ConnectError, Code } from '@connectrpc/connect'
import { InitiaError } from '../errors'
import type { Message } from '../msgs/types'
import type { ChainType } from '../client/types'
import type { MoveModuleAbi } from '../contracts/move/types'

// =============================================================================
// Decoded tx types
// =============================================================================

export interface DecodedTxMessage {
  /** Message typeUrl (e.g., '/cosmos.bank.v1beta1.MsgSend') */
  typeUrl: string
  /** Decoded protobuf message */
  message: Message
  /**
   * True if protobuf decode failed (best-effort mode only).
   * When true, `message` wraps the raw Any — typeUrl is still set from the Any.
   * Enrichment is skipped for decode-failed messages.
   */
  decodeError?: boolean
  /**
   * Enrichment error description (best-effort mode only).
   * Set when ABI fetch, BCS/ABI decode, or JSON parse fails during enrichment.
   * When set, `args`/`contractMsg` may be undefined even for VM messages.
   * Note: For Move messages, `functionName` is extracted before enrichment and remains valid.
   * For EVM messages, `functionName` may be undefined if ABI decode failed.
   */
  enrichError?: string
  /**
   * Function name for VM calls. undefined for non-VM messages.
   * - Move MsgExecute: function name (e.g., 'set_price')
   * - EVM MsgCall with ABI: decoded name (e.g., 'transfer')
   * - EVM MsgCall without ABI: 4-byte selector hex (e.g., '0xa9059cbb')
   * - Wasm: undefined (use contractMsg instead)
   */
  functionName?: string
  /**
   * Decoded arguments. undefined for non-VM messages or when ABI unavailable.
   * - Move MsgExecute: BCS-decoded args (via on-chain ABI)
   * - EVM MsgCall: ABI-decoded args (via registered or one-time ABI)
   * - Wasm: undefined (use contractMsg instead)
   *
   * **Move ABI version caveat**: On-chain ABI reflects the *current* module version.
   * If a module was upgraded after this tx was submitted, the ABI may not match the
   * args that were encoded against the old version — decode may silently produce
   * incorrect values or fail. Use `ctx.abis.set('addr::module', historicalAbi)` or
   * `options.abis` to provide the correct ABI for historical transactions.
   */
  args?: unknown[]
  /**
   * Named arguments mapped from ABI parameter names. undefined when:
   * - No ABI available (EVM without registered/one-time ABI)
   * - ABI has unnamed parameters
   * - Function takes no arguments (zero-input ABI functions)
   * - Non-EVM messages (Move ABI lacks param names; Wasm uses contractMsg)
   *
   * Currently populated for EVM MsgCall only.
   * @example { to: '0x1234...', amount: 100n }
   */
  namedArgs?: Record<string, unknown>
  /**
   * Parsed JSON msg body. undefined for non-Wasm messages.
   * Set for: MsgExecuteContract, MsgInstantiateContract,
   * MsgInstantiateContract2, MsgMigrateContract
   */
  contractMsg?: unknown
  /**
   * Reserved for future: recursively decoded inner messages.
   * For wrapper messages like MsgExec, MsgSubmitProposal, MsgExecuteMessages.
   * Currently undefined — inner Any[] messages are not auto-decoded (Decision #64).
   */
  innerMessages?: DecodedTxMessage[]
}

export interface DecodedTx {
  /** Original gRPC response (all Cosmos SDK fields accessible) */
  raw: GetTxResponse
  /** Decoded messages with VM-aware enrichment */
  messages: DecodedTxMessage[]

  // ---- Convenience fields (extracted from raw.txResponse) ----

  /** Transaction hash */
  txHash: string
  /** Result code. 0 = success, non-zero = failure */
  code: number
  /** Block height where tx was included */
  height: bigint
  /** Gas consumed */
  gasUsed: bigint
  /** Gas requested */
  gasWanted: bigint
  /** Raw log (error message on failure, empty on success) */
  rawLog: string
  /** Block timestamp when tx was included (ISO 8601, e.g. '2026-03-08T12:00:00Z') */
  timestamp: string
  /** Parsed events from the transaction */
  events: Array<{
    type: string
    attributes: Array<{ key: string; value: string }>
  }>
}

// =============================================================================
// Options
// =============================================================================

export interface GetTxOptions {
  /**
   * Arg decoding strategy.
   * - 'best-effort' (default): decode when ABI available, undefined otherwise
   * - 'strict': throw if ABI fetch or decode fails for VM messages
   * - 'none': protobuf decode only — skip all VM enrichment (no ABI fetch, no arg decode)
   */
  decodeArgs?: 'best-effort' | 'strict' | 'none'
  /**
   * One-time ABIs for this call. Merged with ctx.abis registry.
   * Keys are contract/module identifiers (case-insensitive).
   * Value type is `unknown` at base level — narrowed by GetTxOptionsFor<T>.
   */
  abis?: Record<string, unknown>
}

/** ChainType-aware GetTxOptions — abis value type matches AbiValueFor<T>. */
export type GetTxOptionsFor<T extends ChainType> = Omit<GetTxOptions, 'abis'> & {
  abis?: Record<string, AbiValueFor<T>>
}

// =============================================================================
// Enricher interface
// =============================================================================

/**
 * Enricher that adds VM-specific decoded data to a DecodedTxMessage.
 * Each VM (Move, EVM, Wasm) provides its own enricher implementation.
 * Enrichers capture their dependencies via closure at creation time.
 */
export interface MessageEnricher {
  /** Check if this enricher handles the given typeUrl */
  canEnrich(typeUrl: string): boolean
  /** Enrich the message with VM-specific data (functionName, args, contractMsg) */
  enrich(msg: DecodedTxMessage, options: GetTxOptions): Promise<void>
}

// =============================================================================
// ABI Registry
// =============================================================================

/**
 * ChainType-parameterized ABI registry (Decision #72).
 * - minievm: key = contract address, value = Abi (abitype)
 * - initia/minimove: key = 'addr::module', value = MoveModuleAbi
 * - miniwasm/other: no-op (set is ignored, get always returns undefined)
 *
 * Concurrency note: set() is guaranteed to take effect for subsequent getTx() calls.
 * ABIs set during an in-progress getTx() may or may not be used by that call.
 */
export interface AbiRegistry<V = unknown> {
  get(key: string): V | undefined
  set(key: string, abi: V): void
  has(key: string): boolean
}

// Type mapping: ChainType → ABI value type
type AbiValueFor<T extends ChainType> = T extends 'minievm'
  ? Abi
  : T extends 'initia' | 'minimove'
    ? MoveModuleAbi
    : never

/** Typed ABI registry for a specific chain type. */
export type AbiRegistryFor<T extends ChainType> = AbiRegistry<AbiValueFor<T>>

/** Create a Map-based ABI registry with lowercase key normalization. */
export function createAbiRegistry<V>(): AbiRegistry<V> {
  const map = new Map<string, V>()
  return {
    get: (key: string) => map.get(key.toLowerCase()),
    set: (key: string, abi: V) => map.set(key.toLowerCase(), abi),
    has: (key: string) => map.has(key.toLowerCase()),
  }
}

/** No-op registry for chain types without ABI (wasm, other). */
export function createNoopAbiRegistry<V = never>(): AbiRegistry<V> {
  return {
    get: () => undefined,
    set: () => {},
    has: () => false,
  }
}

// =============================================================================
// TxNotFoundError
// =============================================================================

/** Thrown when a transaction is not found on-chain. */
export class TxNotFoundError extends InitiaError {
  constructor(public readonly hash: string) {
    super(`Transaction not found: ${hash}`)
    this.name = 'TxNotFoundError'
  }
}

// =============================================================================
// getTx core
// =============================================================================

/** Minimal client interface for tx queries. */
interface TxQueryClient {
  tx: { getTx(req: { hash: string }): Promise<GetTxResponse> }
}

export async function getTx(
  client: TxQueryClient,
  decode: (packed: Any) => Message,
  hash: string,
  enrichers: MessageEnricher[],
  options?: GetTxOptions
): Promise<DecodedTx> {
  // Normalize abis keys to lowercase (Decision #68)
  let normalizedOptions = options
  if (options?.abis) {
    const normalized: Record<string, unknown> = {}
    for (const [key, abi] of Object.entries(options.abis)) {
      normalized[key.toLowerCase()] = abi
    }
    normalizedOptions = { ...options, abis: normalized }
  }

  let response: GetTxResponse
  try {
    response = await client.tx.getTx({ hash })
  } catch (err) {
    // Only wrap NOT_FOUND — network/auth/invalid-hash errors propagate as-is (Decision #69)
    if (err instanceof ConnectError && err.code === Code.NotFound) {
      throw new TxNotFoundError(hash)
    }
    throw err
  }

  if (!response.txResponse) {
    throw new InitiaError(`Malformed tx response: missing txResponse for hash ${hash}`)
  }
  const txResponse = response.txResponse
  if (!response.tx?.body) {
    throw new InitiaError(`Malformed tx response: missing tx body for hash ${hash}`)
  }
  const anyMessages: Any[] = response.tx.body.messages

  // Step 1: Decode each Any into DecodedTxMessage
  const messages: DecodedTxMessage[] = anyMessages.map(packed => {
    try {
      return { typeUrl: packed.typeUrl, message: decode(packed) }
    } catch (err) {
      if (normalizedOptions?.decodeArgs === 'strict') throw err
      // Best-effort: wrap raw Any, mark as decode failure (Decision #73)
      return { typeUrl: packed.typeUrl, message: packed as unknown as Message, decodeError: true }
    }
  })

  // Step 2: Enrich in parallel (skip entirely when decodeArgs: 'none') (Decision #84)
  if (normalizedOptions?.decodeArgs !== 'none') {
    await Promise.all(
      messages.map(async msg => {
        if (msg.decodeError) return // Skip enrichment for decode-failed messages
        for (const enricher of enrichers) {
          if (!enricher.canEnrich(msg.typeUrl)) continue
          try {
            await enricher.enrich(msg, normalizedOptions ?? {})
          } catch (err) {
            if (normalizedOptions?.decodeArgs === 'strict') throw err
            // Best-effort: leave functionName/args/contractMsg undefined, record error
            msg.enrichError = err instanceof Error ? err.message : String(err)
          }
          break // First matching enricher handles the message
        }
      })
    )
  }

  // Step 3: Assemble DecodedTx with convenience fields (Decision #78)
  return {
    raw: response,
    messages,
    txHash: txResponse.txhash,
    code: txResponse.code,
    height: txResponse.height,
    gasUsed: txResponse.gasUsed,
    gasWanted: txResponse.gasWanted,
    rawLog: txResponse.rawLog,
    timestamp: txResponse.timestamp,
    events: txResponse.events.map(e => ({
      type: e.type,
      attributes: e.attributes.map(a => ({ key: a.key, value: a.value })),
    })),
  }
}
