/**
 * CosmWasm Contract Factory and Helpers
 *
 * Provides CosmWasm contract interactions via gRPC.
 * Supports execute, query, store, instantiate, migrate, and admin operations.
 */

import type { Numeric } from '../../types'
import type { Client } from '@connectrpc/connect'
import { create } from '@bufbuild/protobuf'
import type { Query as WasmQuery } from '@buf/cosmwasm_wasmd.bufbuild_es/cosmwasm/wasm/v1/query_pb'
import {
  MsgStoreCodeSchema,
  MsgInstantiateContractSchema,
  MsgInstantiateContract2Schema,
  MsgExecuteContractSchema,
  MsgMigrateContractSchema,
  MsgUpdateAdminSchema,
  MsgClearAdminSchema,
  type MsgStoreCode,
  type MsgInstantiateContract,
  type MsgInstantiateContract2,
  type MsgExecuteContract,
  type MsgMigrateContract,
  type MsgUpdateAdmin,
  type MsgClearAdmin,
} from '@buf/cosmwasm_wasmd.bufbuild_es/cosmwasm/wasm/v1/tx_pb'

import { Message } from '../../msgs/types'
import { toProtoCoins } from '../../msgs/types'
import type { HasWasmService } from '../../client/types'
import type { Coin } from '../../core/coin'
import type { TokenInfo, NftInfo, OwnerOfResponse, NftApproval } from '../types'
import { parseUnits, formatUnits } from '../utils'
import { ContractError } from '../errors'
import { encodeMsg, decodeResponse } from '../../util/json'
import { tryDecodeBech32 } from '../../util/address'

import type {
  WasmContract,
  WasmContractSchema,
  JsonSchema,
  WasmExecuteProxy,
  WasmQueryProxy,
  ExecuteMsg,
  QueryMsg,
  StoreCodeOptions,
  InstantiateContractOptions,
  InstantiateContract2Options,
  MigrateContractOptions,
  UpdateAdminOptions,
  ClearAdminOptions,
  ReadonlyWasmContractSchema,
  TypedWasmContract,
} from './types'

// =============================================================================
// Types
// =============================================================================

/**
 * Wasm gRPC query client type.
 */
export type WasmQueryClient = Client<typeof WasmQuery>

/**
 * Options for creating a Wasm contract instance.
 */
export interface CreateWasmContractOptions {
  /** Optional JSON schema for validation */
  schema?: WasmContractSchema
}

// =============================================================================
// Utility Functions
// =============================================================================

// =============================================================================
// Address Validation
// =============================================================================

/**
 * Validates that a contract address is in valid bech32 format.
 * @throws Error if address format is invalid
 */
function validateContractAddress(address: string): void {
  if (!tryDecodeBech32(address)) {
    throw new Error(`Invalid contract address: ${address}. ` + `Expected bech32 format.`)
  }
}

// =============================================================================
// Contract Factory
// =============================================================================

/**
 * Creates a typed CosmWasm contract from a static schema.
 * Returns synchronously with variant-name autocomplete on execute/query.
 *
 * @param context - ChainContext with client (must have wasm service)
 * @param contractAddress - Contract address (bech32)
 * @param schema - Static schema (use `wasmAbi()` or `as const satisfies ReadonlyWasmContractSchema`)
 * @returns Typed wasm contract with IDE autocomplete for variant names
 *
 * @example
 * ```typescript
 * const schema = wasmAbi({
 *   execute: { oneOf: [{ required: ['transfer'], properties: { transfer: {} } }] },
 *   query: { oneOf: [{ required: ['balance'], properties: { balance: {} } }] },
 * })
 *
 * const cw20 = createWasmContract(ctx, 'cosmos1...', schema)
 * cw20.execute.transfer(sender, { recipient: '...', amount: '1000' })  // autocomplete!
 * ```
 */
export function createWasmContract<const T extends ReadonlyWasmContractSchema>(
  context: HasWasmService,
  contractAddress: string,
  schema: T
): TypedWasmContract<T>

/**
 * Creates a CosmWasm contract instance for type-safe interactions.
 *
 * @param context - ChainContext with client (must have wasm service)
 * @param contractAddress - Contract address (bech32)
 * @param options - Contract options (schema)
 * @returns Wasm contract instance
 *
 * @example
 * ```typescript
 * import { createWasmContract } from 'initia.js'
 *
 * const cw20 = createWasmContract(ctx, 'cosmos1...')
 *
 * // Execute transfer
 * const msg = cw20.execute.transfer(sender, {
 *   recipient: 'cosmos1...',
 *   amount: '1000000'
 * })
 * await ctx.signAndBroadcast([msg])
 *
 * // Query balance
 * const balance = await cw20.query.balance({ address: 'cosmos1...' })
 * ```
 */
export function createWasmContract(
  context: HasWasmService,
  contractAddress: string,
  options?: CreateWasmContractOptions
): WasmContract

export function createWasmContract<T extends ReadonlyWasmContractSchema>(
  context: HasWasmService,
  contractAddress: string,
  schemaOrOptions?: T | CreateWasmContractOptions
): TypedWasmContract<T> | WasmContract {
  // Distinguish static schema (has oneOf/anyOf in execute/query) from options (has schema key)
  const isStaticSchema =
    schemaOrOptions != null &&
    !('schema' in schemaOrOptions) &&
    ('execute' in schemaOrOptions || 'query' in schemaOrOptions)

  const options: CreateWasmContractOptions = isStaticSchema
    ? { schema: schemaOrOptions as unknown as WasmContractSchema }
    : ((schemaOrOptions as CreateWasmContractOptions) ?? {})

  // Validate address format
  validateContractAddress(contractAddress)

  const wasmClient = context.client.wasm
  const { schema } = options
  // Cache for decimals (used by parseUnits/formatUnits)
  let cachedDecimals: number | undefined

  // Extract variant names from a JSON schema's oneOf/anyOf array.
  // Returns undefined if the schema structure doesn't support variant extraction.
  function getSchemaVariants(msgSchema?: JsonSchema): Set<string> | undefined {
    const variants = msgSchema?.oneOf ?? msgSchema?.anyOf
    if (!variants) return undefined

    const names = new Set<string>()
    for (const v of variants) {
      if (v.required && v.required.length === 1) {
        names.add(v.required[0])
      }
    }
    return names.size > 0 ? names : undefined
  }

  // Pre-compute variant sets from schema (if available)
  const executeVariants = getSchemaVariants(schema?.execute)
  const queryVariants = getSchemaVariants(schema?.query)

  // Validate variant name against schema if available
  function validateVariant(
    variant: string,
    variants: Set<string> | undefined,
    proxyName: string
  ): void {
    if (variants && !variants.has(variant)) {
      throw new ContractError(
        'wasm',
        0,
        `Unknown ${proxyName} variant: "${variant}". Available: ${[...variants].join(', ')}`
      )
    }
  }

  // Create execute proxy
  const execute = new Proxy({} as WasmExecuteProxy, {
    get(_, variant: string) {
      return (
        sender: string,
        args?: Record<string, unknown>,
        funds?: Coin[]
      ): Message<typeof MsgExecuteContractSchema> => {
        validateVariant(variant, executeVariants, 'execute')

        // Build message with variant as key
        const msg: ExecuteMsg = args !== undefined ? { [variant]: args } : { [variant]: {} }

        return new Message(MsgExecuteContractSchema, {
          sender,
          contract: contractAddress,
          msg: encodeMsg(msg),
          funds: toProtoCoins(funds),
        })
      }
    },
  })

  // Create query proxy
  const query = new Proxy({} as WasmQueryProxy, {
    get(_, variant: string) {
      return async (args?: Record<string, unknown>): Promise<unknown> => {
        validateVariant(variant, queryVariants, 'query')

        // Build query with variant as key
        const msg: QueryMsg = args !== undefined ? { [variant]: args } : { [variant]: {} }

        const response = await wasmClient.smartContractState({
          address: contractAddress,
          queryData: encodeMsg(msg),
        })

        return decodeResponse(response.data)
      }
    },
  })

  // Execute raw message
  function executeRaw(sender: string, msg: ExecuteMsg, funds?: Coin[]): MsgExecuteContract {
    return create(MsgExecuteContractSchema, {
      sender,
      contract: contractAddress,
      msg: encodeMsg(msg),
      funds: toProtoCoins(funds),
    })
  }

  // Query raw message
  async function queryRaw(msg: QueryMsg): Promise<unknown> {
    const response = await wasmClient.smartContractState({
      address: contractAddress,
      queryData: encodeMsg(msg),
    })
    return decodeResponse(response.data)
  }

  // Get contract info
  async function getContractInfo() {
    const response = await wasmClient.contractInfo({
      address: contractAddress,
    })

    if (!response.contractInfo) {
      throw new ContractError('wasm', 0, `Contract info not found: ${contractAddress}`)
    }

    return response.contractInfo
  }

  // Get raw state
  async function getRawState(key: string | Uint8Array): Promise<Uint8Array> {
    const keyBytes = typeof key === 'string' ? new TextEncoder().encode(key) : key

    const response = await wasmClient.rawContractState({
      address: contractAddress,
      queryData: keyBytes,
    })

    return response.data
  }

  // Get token info (CW20 convenience method)
  async function getTokenInfo(): Promise<TokenInfo> {
    const info = (await queryRaw({ token_info: {} })) as {
      name: string
      symbol: string
      decimals: number
      total_supply?: string
    }

    // Cache decimals
    cachedDecimals = info.decimals

    return {
      name: info.name,
      symbol: info.symbol,
      decimals: info.decimals,
      totalSupply: info.total_supply ? BigInt(info.total_supply) : undefined,
    }
  }

  // Get decimals (with caching)
  async function getDecimals(): Promise<number> {
    if (cachedDecimals !== undefined) {
      return cachedDecimals
    }
    const info = await getTokenInfo()
    return info.decimals
  }

  // Get NFT info (CW721 convenience method)
  async function getNftInfo(tokenId: string): Promise<NftInfo> {
    const info = (await queryRaw({ nft_info: { token_id: tokenId } })) as {
      token_uri?: string
      extension?: unknown
    }

    return {
      tokenUri: info.token_uri,
      extension: info.extension,
    }
  }

  // Get owner of NFT (CW721 convenience method)
  async function getOwnerOf(tokenId: string): Promise<OwnerOfResponse> {
    const result = (await queryRaw({ owner_of: { token_id: tokenId } })) as {
      owner: string
      approvals: Array<{
        spender: string
        expires?: {
          at_height?: number
          at_time?: string
          never?: Record<string, never>
        }
      }>
    }

    return {
      owner: result.owner,
      approvals: result.approvals.map(
        (a): NftApproval => ({
          spender: a.spender,
          expires: a.expires
            ? {
                atHeight: a.expires.at_height ? BigInt(a.expires.at_height) : undefined,
                atTime: a.expires.at_time ? BigInt(a.expires.at_time) : undefined,
                never: a.expires.never !== undefined ? true : undefined,
              }
            : undefined,
        })
      ),
    }
  }

  // Get tokens owned by address (CW721 convenience method)
  async function getTokens(owner: string, startAfter?: string, limit?: number): Promise<string[]> {
    const result = (await queryRaw({
      tokens: {
        owner,
        start_after: startAfter,
        limit: limit ?? 30,
      },
    })) as { tokens: string[] }

    return result.tokens
  }

  return {
    contractAddress,
    schema,
    execute,
    query,
    executeRaw,
    queryRaw,
    getContractInfo,
    getRawState,
    getTokenInfo,

    async parseUnits(value: string): Promise<bigint> {
      const decimals = await getDecimals()
      return parseUnits(value, decimals)
    },

    async formatUnits(value: bigint): Promise<string> {
      const decimals = await getDecimals()
      return formatUnits(value, decimals)
    },

    getNftInfo,
    getOwnerOf,
    getTokens,
  }
}

// =============================================================================
// Message Creators
// =============================================================================

/**
 * Creates a MsgStoreCode for uploading wasm bytecode.
 *
 * @param options - Store code options
 * @returns MsgStoreCode message for signing
 *
 * @example
 * ```typescript
 * const msg = createStoreCodeMsg({
 *   sender: 'cosmos1...',
 *   wasmByteCode: compiledWasm,
 * })
 * await wallet.signAndBroadcast([msg])
 * ```
 */
export function createStoreCodeMsg(options: StoreCodeOptions): MsgStoreCode {
  return create(MsgStoreCodeSchema, {
    sender: options.sender,
    wasmByteCode: options.wasmByteCode,
    instantiatePermission: options.instantiatePermission,
  })
}

/**
 * Creates a MsgInstantiateContract for instantiating a contract.
 *
 * @param options - Instantiate options
 * @returns MsgInstantiateContract message for signing
 *
 * @example
 * ```typescript
 * const msg = createInstantiateMsg({
 *   sender: 'cosmos1...',
 *   codeId: 1,
 *   msg: { name: 'My Token', symbol: 'MTK', decimals: 6 },
 *   label: 'my-token-v1',
 *   admin: 'cosmos1...',
 * })
 * await wallet.signAndBroadcast([msg])
 * ```
 */
export function createInstantiateMsg(options: InstantiateContractOptions): MsgInstantiateContract {
  return create(MsgInstantiateContractSchema, {
    sender: options.sender,
    admin: options.admin ?? '',
    codeId: BigInt(options.codeId),
    label: options.label,
    msg: encodeMsg(options.msg),
    funds: toProtoCoins(options.funds),
  })
}

/**
 * Creates a MsgInstantiateContract2 for instantiating with predictable address.
 *
 * @param options - Instantiate2 options
 * @returns MsgInstantiateContract2 message for signing
 *
 * @example
 * ```typescript
 * const msg = createInstantiate2Msg({
 *   sender: 'cosmos1...',
 *   codeId: 1,
 *   msg: { name: 'My Token' },
 *   label: 'my-token-v1',
 *   salt: new TextEncoder().encode('my-salt'),
 * })
 * ```
 */
export function createInstantiate2Msg(
  options: InstantiateContract2Options
): MsgInstantiateContract2 {
  return create(MsgInstantiateContract2Schema, {
    sender: options.sender,
    admin: options.admin ?? '',
    codeId: BigInt(options.codeId),
    label: options.label,
    msg: encodeMsg(options.msg),
    funds: toProtoCoins(options.funds),
    salt: options.salt,
    fixMsg: options.fixMsg ?? false,
  })
}

/**
 * Creates a MsgExecuteContract directly.
 *
 * @param sender - Sender address
 * @param contract - Contract address
 * @param msg - Execute message
 * @param funds - Optional funds
 * @returns MsgExecuteContract message for signing
 *
 * @example
 * ```typescript
 * const msg = createWasmExecuteMsg(
 *   'cosmos1...',
 *   'cosmos1contract...',
 *   { transfer: { recipient: 'cosmos1...', amount: '1000000' } }
 * )
 * ```
 */
export function createWasmExecuteMsg(
  sender: string,
  contract: string,
  msg: ExecuteMsg,
  funds?: Coin[]
): MsgExecuteContract {
  return create(MsgExecuteContractSchema, {
    sender,
    contract,
    msg: encodeMsg(msg),
    funds: toProtoCoins(funds),
  })
}

/**
 * Creates a MsgMigrateContract for migrating to new code.
 *
 * @param options - Migrate options
 * @returns MsgMigrateContract message for signing
 *
 * @example
 * ```typescript
 * const msg = createMigrateMsg({
 *   sender: 'cosmos1...',
 *   contract: 'cosmos1contract...',
 *   codeId: 2,
 *   msg: {},
 * })
 * ```
 */
export function createMigrateMsg(options: MigrateContractOptions): MsgMigrateContract {
  return create(MsgMigrateContractSchema, {
    sender: options.sender,
    contract: options.contract,
    codeId: BigInt(options.codeId),
    msg: encodeMsg(options.msg),
  })
}

/**
 * Creates a MsgUpdateAdmin for changing contract admin.
 *
 * @param options - Update admin options
 * @returns MsgUpdateAdmin message for signing
 *
 * @example
 * ```typescript
 * const msg = createUpdateAdminMsg({
 *   sender: 'cosmos1admin...',
 *   contract: 'cosmos1contract...',
 *   newAdmin: 'cosmos1newadmin...',
 * })
 * ```
 */
export function createUpdateAdminMsg(options: UpdateAdminOptions): MsgUpdateAdmin {
  return create(MsgUpdateAdminSchema, {
    sender: options.sender,
    contract: options.contract,
    newAdmin: options.newAdmin,
  })
}

/**
 * Creates a MsgClearAdmin for removing contract admin.
 *
 * @param options - Clear admin options
 * @returns MsgClearAdmin message for signing
 *
 * @example
 * ```typescript
 * const msg = createClearAdminMsg({
 *   sender: 'cosmos1admin...',
 *   contract: 'cosmos1contract...',
 * })
 * ```
 */
export function createClearAdminMsg(options: ClearAdminOptions): MsgClearAdmin {
  return create(MsgClearAdminSchema, {
    sender: options.sender,
    contract: options.contract,
  })
}

// =============================================================================
// Query Functions
// =============================================================================

/**
 * Queries a smart contract directly.
 *
 * @param context - ChainContext with client (must have wasm service)
 * @param contractAddress - Contract address
 * @param queryMsg - Query message
 * @returns Query result
 *
 * @example
 * ```typescript
 * const balance = await queryContract(
 *   ctx,
 *   'cosmos1contract...',
 *   { balance: { address: 'cosmos1...' } }
 * )
 * ```
 */
export async function queryContract(
  context: HasWasmService,
  contractAddress: string,
  queryMsg: QueryMsg
): Promise<unknown> {
  const wasmClient = context.client.wasm
  const response = await wasmClient.smartContractState({
    address: contractAddress,
    queryData: encodeMsg(queryMsg),
  })

  return decodeResponse(response.data)
}

/**
 * Gets contract information.
 *
 * @param context - ChainContext with client (must have wasm service)
 * @param contractAddress - Contract address
 * @returns Contract info
 *
 * @example
 * ```typescript
 * const info = await getContractInfo(ctx, contractAddress)
 * ```
 */
export async function getContractInfo(context: HasWasmService, contractAddress: string) {
  const wasmClient = context.client.wasm
  const response = await wasmClient.contractInfo({
    address: contractAddress,
  })

  if (!response.contractInfo) {
    throw new ContractError('wasm', 0, `Contract info not found: ${contractAddress}`)
  }

  return response.contractInfo
}

/**
 * Gets raw contract state by key.
 *
 * @param context - ChainContext with client (must have wasm service)
 * @param contractAddress - Contract address
 * @param key - State key
 * @returns Raw state value
 *
 * @example
 * ```typescript
 * const state = await getRawContractState(ctx, contractAddress, 'config')
 * ```
 */
export async function getRawContractState(
  context: HasWasmService,
  contractAddress: string,
  key: string | Uint8Array
): Promise<Uint8Array> {
  const wasmClient = context.client.wasm
  const keyBytes = typeof key === 'string' ? new TextEncoder().encode(key) : key

  const response = await wasmClient.rawContractState({
    address: contractAddress,
    queryData: keyBytes,
  })

  return response.data
}

/**
 * Gets code information.
 *
 * @param context - ChainContext with client (must have wasm service)
 * @param codeId - Code ID
 * @returns Code info
 *
 * @example
 * ```typescript
 * const codeInfo = await getCodeInfo(ctx, 1n)
 * ```
 */
export async function getCodeInfo(context: HasWasmService, codeId: Numeric) {
  const wasmClient = context.client.wasm
  const response = await wasmClient.code({
    codeId: BigInt(codeId),
  })

  if (!response.codeInfo) {
    throw new ContractError('wasm', 0, `Code not found: ${codeId}`)
  }

  return {
    codeInfo: response.codeInfo,
    data: response.data,
  }
}

/**
 * Lists all contracts by code ID.
 *
 * @param context - ChainContext with client (must have wasm service)
 * @param codeId - Code ID
 * @returns List of contract addresses
 *
 * @example
 * ```typescript
 * const contracts = await getContractsByCode(ctx, 1n)
 * ```
 */
export async function getContractsByCode(
  context: HasWasmService,
  codeId: Numeric
): Promise<string[]> {
  const wasmClient = context.client.wasm
  const response = await wasmClient.contractsByCode({
    codeId: BigInt(codeId),
  })

  return response.contracts
}

/**
 * Gets contract code migration history.
 *
 * @param context - ChainContext with client (must have wasm service)
 * @param contractAddress - Contract address
 * @returns List of code history entries (migrations)
 *
 * @example
 * ```typescript
 * const history = await getContractHistory(ctx, 'cosmos1contract...')
 * for (const entry of history) {
 *   console.log(`Code ID: ${entry.codeId}, Operation: ${entry.operation}`)
 * }
 * ```
 */
export async function getContractHistory(context: HasWasmService, contractAddress: string) {
  const wasmClient = context.client.wasm
  const response = await wasmClient.contractHistory({
    address: contractAddress,
  })

  return response.entries
}
