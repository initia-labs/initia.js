/**
 * CosmWasm Contract Type Definitions
 *
 * Type definitions for CosmWasm smart contract interactions.
 * Supports JSON schema-based message validation and type inference.
 */

import type { Numeric } from '../../types'
import type { Client } from '@connectrpc/connect'
import type { Query as WasmQuery } from '@buf/cosmwasm_wasmd.bufbuild_es/cosmwasm/wasm/v1/query_pb'
import type {
  MsgStoreCode,
  MsgInstantiateContract,
  MsgExecuteContract,
  MsgMigrateContract,
  MsgUpdateAdmin,
  MsgClearAdmin,
} from '@buf/cosmwasm_wasmd.bufbuild_es/cosmwasm/wasm/v1/tx_pb'
import type { MsgExecuteContractSchema } from '@buf/cosmwasm_wasmd.bufbuild_es/cosmwasm/wasm/v1/tx_pb'
import type {
  AccessConfig,
  ContractInfo,
} from '@buf/cosmwasm_wasmd.bufbuild_es/cosmwasm/wasm/v1/types_pb'
import type { Message } from '../../msgs/types'
import type { Coin } from '../../core/coin'
import type { TokenInfo, NftInfo, OwnerOfResponse } from '../types'

// =============================================================================
// JSON Schema Types (for CosmWasm contract schemas)
// =============================================================================

/**
 * JSON Schema definition for CosmWasm messages.
 * Simplified subset of JSON Schema for typical CosmWasm contracts.
 */
export interface JsonSchema {
  $schema?: string
  title?: string
  description?: string
  type?: string | string[]
  oneOf?: JsonSchema[]
  anyOf?: JsonSchema[]
  allOf?: JsonSchema[]
  properties?: Record<string, JsonSchema>
  additionalProperties?: boolean | JsonSchema
  required?: string[]
  items?: JsonSchema | JsonSchema[]
  enum?: unknown[]
  const?: unknown
  $ref?: string
  definitions?: Record<string, JsonSchema>
}

/**
 * CosmWasm contract schema bundle.
 * Contains schemas for instantiate, execute, query, and migrate messages.
 */
export interface WasmContractSchema {
  /** Contract name (optional) */
  contract_name?: string
  /** Contract version (optional) */
  contract_version?: string
  /** Schema for InstantiateMsg */
  instantiate?: JsonSchema
  /** Schema for ExecuteMsg */
  execute?: JsonSchema
  /** Schema for QueryMsg */
  query?: JsonSchema
  /** Schema for MigrateMsg (optional) */
  migrate?: JsonSchema
  /** Schema for SudoMsg (optional) */
  sudo?: JsonSchema
  /** Response schemas by query variant name */
  responses?: Record<string, JsonSchema>
}

// =============================================================================
// Readonly Schema Types (for wasmAbi() / as const inference)
// =============================================================================

/**
 * Readonly variant in a oneOf/anyOf schema.
 * Each variant has a single required key that serves as the variant name.
 *
 * @example
 * ```typescript
 * { required: ['transfer'], properties: { transfer: { ... } } }
 * ```
 */
export interface ReadonlyWasmVariant {
  readonly required: readonly [string, ...string[]]
  readonly properties?: Readonly<Record<string, unknown>>
}

/**
 * Readonly message schema with oneOf or anyOf variants.
 * Used for `wasmAbi()` / `as const` inference of execute/query message schemas.
 */
export interface ReadonlyWasmMsgSchema {
  readonly oneOf?: readonly ReadonlyWasmVariant[]
  readonly anyOf?: readonly ReadonlyWasmVariant[]
}

/**
 * Readonly contract schema for `wasmAbi()` / `as const` inference.
 * Contains typed execute and query message schemas.
 *
 * @example
 * ```typescript
 * // Option A: using wasmAbi() helper (recommended)
 * const schema = wasmAbi({
 *   execute: {
 *     oneOf: [
 *       { required: ['transfer'], properties: { transfer: {} } },
 *       { required: ['burn'], properties: { burn: {} } },
 *     ]
 *   },
 *   query: {
 *     oneOf: [
 *       { required: ['balance'], properties: { balance: {} } },
 *       { required: ['token_info'], properties: { token_info: {} } },
 *     ]
 *   },
 * })
 *
 * // Option B: using as const satisfies (also supported)
 * const schema = { ... } as const satisfies ReadonlyWasmContractSchema
 * ```
 */
export interface ReadonlyWasmContractSchema {
  readonly execute?: ReadonlyWasmMsgSchema
  readonly query?: ReadonlyWasmMsgSchema
}

// =============================================================================
// Contract Configuration
// =============================================================================

/**
 * CosmWasm contract configuration.
 */
export interface WasmContractConfig {
  /** Contract address (bech32) */
  contractAddress: string
  /** Optional JSON schema for type validation */
  schema?: WasmContractSchema
}

// =============================================================================
// Message Types
// =============================================================================

/**
 * Execute message type (JSON object).
 * CosmWasm contracts use JSON messages for execution.
 */
export type ExecuteMsg = Record<string, unknown>

/**
 * Query message type (JSON object).
 */
export type QueryMsg = Record<string, unknown>

/**
 * Instantiate message type (JSON object).
 */
export type InstantiateMsg = Record<string, unknown>

/**
 * Migrate message type (JSON object).
 */
export type MigrateMsg = Record<string, unknown>

// =============================================================================
// Proxy Types
// =============================================================================

/**
 * Execute function proxy type.
 * Creates Message objects for broadcasting via signAndBroadcast.
 */
export type WasmExecuteProxy = {
  [variant: string]: (
    sender: string,
    args?: Record<string, unknown>,
    funds?: Coin[]
  ) => Message<typeof MsgExecuteContractSchema>
}

/**
 * Query function proxy type.
 * Calls smart contract queries and returns parsed results.
 */
export type WasmQueryProxy = {
  [variant: string]: (args?: Record<string, unknown>) => Promise<unknown>
}

// =============================================================================
// Static Schema Type Inference
// =============================================================================

/**
 * Extract variant names from a readonly oneOf/anyOf msg schema.
 * Reads the first element of each variant's `required` tuple.
 */
export type ExtractVariantNames<T extends ReadonlyWasmMsgSchema> =
  | (T['oneOf'] extends readonly ReadonlyWasmVariant[] ? T['oneOf'][number]['required'][0] : never)
  | (T['anyOf'] extends readonly ReadonlyWasmVariant[] ? T['anyOf'][number]['required'][0] : never)

/**
 * Execute proxy with variant name autocomplete from a static schema.
 * Each key is a variant name extracted from the execute schema's oneOf/anyOf.
 */
export type WasmExecuteProxyTyped<T extends ReadonlyWasmMsgSchema> = {
  [K in ExtractVariantNames<T>]: (
    sender: string,
    args?: Record<string, unknown>,
    funds?: Coin[]
  ) => Message<typeof MsgExecuteContractSchema>
}

/**
 * Query proxy with variant name autocomplete from a static schema.
 * Each key is a variant name extracted from the query schema's oneOf/anyOf.
 */
export type WasmQueryProxyTyped<T extends ReadonlyWasmMsgSchema> = {
  [K in ExtractVariantNames<T>]: (args?: Record<string, unknown>) => Promise<unknown>
}

/**
 * WasmContract with typed execute/query proxies from a static schema.
 * Provides IDE autocomplete for variant names when using `wasmAbi()` or `as const` schemas.
 *
 * @example
 * ```typescript
 * // Using wasmAbi() helper (recommended — no nested `as const` needed)
 * const schema = wasmAbi({
 *   execute: {
 *     oneOf: [
 *       { required: ['transfer'], properties: { transfer: {} } },
 *       { required: ['burn'], properties: { burn: {} } },
 *     ]
 *   },
 *   query: {
 *     oneOf: [
 *       { required: ['balance'], properties: { balance: {} } },
 *       { required: ['token_info'], properties: { token_info: {} } },
 *     ]
 *   },
 * })
 *
 * type MyContract = TypedWasmContract<typeof schema>
 * // MyContract.execute.transfer(...)  // autocomplete!
 * // MyContract.execute.burn(...)      // autocomplete!
 * // MyContract.query.balance(...)     // autocomplete!
 * ```
 */
export type TypedWasmContract<T extends ReadonlyWasmContractSchema> = Omit<
  WasmContract,
  'execute' | 'query' | 'schema'
> & {
  readonly schema: T
  readonly execute: T['execute'] extends ReadonlyWasmMsgSchema
    ? WasmExecuteProxyTyped<T['execute']>
    : WasmExecuteProxy
  readonly query: T['query'] extends ReadonlyWasmMsgSchema
    ? WasmQueryProxyTyped<T['query']>
    : WasmQueryProxy
}

// =============================================================================
// Contract Interface
// =============================================================================

/**
 * CosmWasm contract instance providing type-safe interactions.
 */
export interface WasmContract {
  /** Contract address */
  readonly contractAddress: string
  /** Contract schema (if provided) */
  readonly schema?: WasmContractSchema

  /**
   * Execute contract methods.
   * Creates MsgExecuteContract for broadcasting.
   *
   * @example
   * ```typescript
   * // CW20 transfer
   * const msg = contract.execute.transfer(sender, {
   *   recipient: 'cosmos1...',
   *   amount: '1000000'
   * })
   * await wallet.signAndBroadcast([msg])
   *
   * // With funds
   * const msg = contract.execute.buy_nft(sender, { token_id: '1' }, [
   *   { denom: 'uatom', amount: '1000000' }
   * ])
   * ```
   */
  readonly execute: WasmExecuteProxy

  /**
   * Query contract state.
   * Returns parsed JSON response.
   *
   * @example
   * ```typescript
   * // CW20 balance query
   * const balance = await contract.query.balance({ address: 'cosmos1...' })
   *
   * // Token info query
   * const info = await contract.query.token_info()
   * ```
   */
  readonly query: WasmQueryProxy

  /**
   * Execute a raw message (without using the proxy).
   *
   * @param sender - Sender address
   * @param msg - Execute message object
   * @param funds - Optional funds to send
   * @returns MsgExecuteContract for broadcasting
   */
  executeRaw(sender: string, msg: ExecuteMsg, funds?: Coin[]): MsgExecuteContract

  /**
   * Query with a raw message (without using the proxy).
   *
   * @param msg - Query message object
   * @returns Parsed query response
   */
  queryRaw(msg: QueryMsg): Promise<unknown>

  /**
   * Get contract info from chain.
   *
   * @returns Contract information
   */
  getContractInfo(): Promise<ContractInfo>

  /**
   * Get raw contract state by key.
   *
   * @param key - State key (as bytes or string)
   * @returns Raw state value
   */
  getRawState(key: string | Uint8Array): Promise<Uint8Array>

  /**
   * Get token info for CW20 tokens.
   * Convenience method that queries token_info.
   *
   * @returns Token info
   */
  getTokenInfo(): Promise<TokenInfo>

  /**
   * Parse human-readable amount to smallest unit.
   * Uses CW20 token_info to determine decimals (cached after first call).
   *
   * @param value - Human-readable amount (e.g., "1.5")
   * @returns Amount in smallest unit as bigint
   *
   * @example
   * ```typescript
   * const amount = await cw20.parseUnits("1.5")  // 1500000n (6 decimals)
   * ```
   */
  parseUnits(value: string): Promise<bigint>

  /**
   * Format smallest unit to human-readable amount.
   * Uses CW20 token_info to determine decimals (cached after first call).
   *
   * @param value - Amount in smallest unit
   * @returns Human-readable amount as string
   *
   * @example
   * ```typescript
   * const display = await cw20.formatUnits(1500000n)  // "1.5"
   * ```
   */
  formatUnits(value: bigint): Promise<string>

  // =========================================================================
  // CW721 (NFT) Convenience Methods
  // =========================================================================

  /**
   * Get NFT info for CW721 tokens.
   * Convenience method that queries nft_info.
   *
   * @param tokenId - NFT token ID
   * @returns NFT metadata
   */
  getNftInfo(tokenId: string): Promise<NftInfo>

  /**
   * Get owner of NFT for CW721 tokens.
   * Convenience method that queries owner_of.
   *
   * @param tokenId - NFT token ID
   * @returns Owner address and approvals
   */
  getOwnerOf(tokenId: string): Promise<OwnerOfResponse>

  /**
   * Get list of NFT token IDs owned by an address.
   * Convenience method that queries tokens.
   *
   * @param owner - Owner address
   * @param startAfter - Optional token ID to start after (for pagination)
   * @param limit - Optional limit (default: 30)
   * @returns List of token IDs
   */
  getTokens(owner: string, startAfter?: string, limit?: number): Promise<string[]>
}

// =============================================================================
// Code Upload and Instantiation Types
// =============================================================================

/**
 * Options for storing (uploading) wasm code.
 */
export interface StoreCodeOptions {
  /** Sender address */
  sender: string
  /** Compiled wasm bytecode */
  wasmByteCode: Uint8Array
  /** Optional instantiate permission */
  instantiatePermission?: AccessConfig
}

/**
 * Options for instantiating a contract.
 */
export interface InstantiateContractOptions {
  /** Sender address */
  sender: string
  /** Code ID to instantiate */
  codeId: Numeric
  /** Instantiate message */
  msg: InstantiateMsg
  /** Human-readable label */
  label: string
  /** Optional admin address */
  admin?: string
  /** Optional funds to send */
  funds?: Coin[]
}

/**
 * Options for instantiating a contract with predictable address (InstantiateContract2).
 */
export interface InstantiateContract2Options extends InstantiateContractOptions {
  /** Salt for address derivation */
  salt: Uint8Array
  /** Whether to fix the message (include sender in address derivation) */
  fixMsg?: boolean
}

/**
 * Options for migrating a contract.
 */
export interface MigrateContractOptions {
  /** Sender address (must be admin) */
  sender: string
  /** Contract address to migrate */
  contract: string
  /** New code ID */
  codeId: Numeric
  /** Migration message */
  msg: MigrateMsg
}

/**
 * Options for updating contract admin.
 */
export interface UpdateAdminOptions {
  /** Sender address (must be current admin) */
  sender: string
  /** Contract address */
  contract: string
  /** New admin address */
  newAdmin: string
}

/**
 * Options for clearing contract admin.
 */
export interface ClearAdminOptions {
  /** Sender address (must be current admin) */
  sender: string
  /** Contract address */
  contract: string
}

// =============================================================================
// Client Type
// =============================================================================

/**
 * CosmWasm gRPC query client type.
 */
export type WasmClient = Client<typeof WasmQuery>

// =============================================================================
// Re-exports from BSR packages
// =============================================================================

export type {
  MsgStoreCode,
  MsgInstantiateContract,
  MsgExecuteContract,
  MsgMigrateContract,
  MsgUpdateAdmin,
  MsgClearAdmin,
}

export type { AccessConfig, ContractInfo }
