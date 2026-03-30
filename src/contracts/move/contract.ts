/**
 * Move Contract Factory and Helpers
 *
 * Provides Move module contract interactions via gRPC.
 * Supports entry functions, view functions, resources, and table queries.
 */

import { create } from '@bufbuild/protobuf'
import {
  MsgExecuteJSONSchema,
  MsgExecuteSchema,
  MsgPublishSchema,
  MsgScriptSchema,
  MsgScriptJSONSchema,
  type MsgExecuteJSON,
  type MsgPublish,
  type MsgScript,
  type MsgScriptJSON,
} from '@buf/initia-labs_initia.bufbuild_es/initia/move/v1/tx_pb'
import { UpgradePolicy } from '@buf/initia-labs_initia.bufbuild_es/initia/move/v1/types_pb'

import { Message } from '../../msgs/types'
import type { HasMoveService } from '../../client/types'
import type { TokenInfo } from '../types'
import { parseUnits, formatUnits } from '../utils'
import { ContractError } from '../errors'
import { tryDecodeBech32 } from '../../util/address'

import type {
  MoveContract,
  MoveModuleAbi,
  MoveCallOptions,
  MoveExecuteProxy,
  MoveViewProxy,
  PublishModuleOptions,
  ExecuteScriptOptions,
  BcsScriptOptions,
  ReadonlyMoveModuleAbi,
  TypedMoveContract,
  BuildMoveExecuteOptions,
  BuildMoveViewOptions,
} from './types'
import { getModuleAbi, findFunction, getNonSignerParams, type MoveQueryClient } from './abi-fetcher'
import {
  encodeMoveArgs,
  parseMoveType,
  convertJsonValue,
  resolveGenericTypes,
  type ParsedMoveType,
} from './bcs'
import { AccAddress } from '../../util/address'
import { jsonStringifyArg } from '../../util/json'
import {
  createAbiResolver,
  convertResourceValue,
  DEFAULT_OPAQUE_TYPES,
} from './resource-conversion'

// =============================================================================
// Types
// =============================================================================

/**
 * Options for creating a Move contract instance.
 */
export interface CreateMoveContractOptions {
  /** Pre-fetched ABI (skips gRPC fetch if provided) */
  abi?: MoveModuleAbi
  /** Use cached ABI (default: true) */
  useCache?: boolean
  /** Cache TTL in milliseconds (default: 5 minutes) */
  cacheTtl?: number
  /**
   * Additional opaque types to skip ABI resolution for (performance optimization).
   * Must be base type strings without type arguments (e.g., `'0x1::table::Table'`).
   */
  opaqueTypes?: string[]
}

// =============================================================================
// Input Validation
// =============================================================================

/** Valid Move identifier pattern: starts with letter or underscore, contains alphanumeric and underscore */
const MOVE_IDENTIFIER_REGEX = /^[a-zA-Z_][a-zA-Z0-9_]*$/

/**
 * Validates that an address is in a valid format (EVM hex or bech32).
 * @throws Error if address format is invalid
 */
function validateModuleAddress(address: string): void {
  // Check EVM format (0x...)
  if (address.startsWith('0x')) {
    // For Move, we allow shorter hex addresses like 0x1
    if (!/^0x[0-9a-fA-F]+$/.test(address)) {
      throw new Error(
        `Invalid module address format: ${address}. ` + `Expected 0x followed by hex characters.`
      )
    }
    return
  }

  // Check bech32 format
  if (!tryDecodeBech32(address)) {
    throw new Error(
      `Invalid module address: ${address}. ` + `Expected EVM hex (0x...) or bech32 format.`
    )
  }
}

/**
 * Validates that a module name is a valid Move identifier.
 * @throws Error if module name is invalid
 */
function validateModuleName(name: string): void {
  if (!name) {
    throw new Error('Module name cannot be empty')
  }
  if (!MOVE_IDENTIFIER_REGEX.test(name)) {
    throw new Error(
      `Invalid module name: ${name}. ` +
        `Must start with a letter or underscore and contain only alphanumeric characters and underscores.`
    )
  }
}

// =============================================================================
// Arg Conversion Helpers
// =============================================================================

/**
 * Checks if a Move param type is address-like (address or Object<T>).
 */
function isAddressLikeType(moveType: string): boolean {
  return moveType === 'address' || moveType.startsWith('0x1::object::Object')
}

/**
 * Move unsigned integer types with max values for range validation in the JSON fallback path.
 * KNOWN_BCS_BASES covers all BCS-encodable types and gates BCS-vs-JSON path selection.
 */
const UINT_MAX = new Map<string, bigint>([
  ['u8', (1n << 8n) - 1n],
  ['u16', (1n << 16n) - 1n],
  ['u32', (1n << 32n) - 1n],
  ['u64', (1n << 64n) - 1n],
  ['u128', (1n << 128n) - 1n],
  ['u256', (1n << 256n) - 1n],
])

/**
 * Converts a single arg to a JSON string for the Move VM.
 *
 * - Address params: auto-converts bech32 to hex.
 * - Uint params (u8-u256): validates range, converts bigint/number to quoted string.
 *   Rejects non-numeric/non-string types for uint params.
 * - All other cases: delegates to jsonStringifyArg (bigint-safe fallback).
 */
function convertArgToJson(arg: unknown, paramType?: string): string {
  if (
    paramType &&
    isAddressLikeType(paramType) &&
    typeof arg === 'string' &&
    !arg.startsWith('0x')
  ) {
    try {
      return JSON.stringify(AccAddress.toHex(arg))
    } catch {
      // Not a valid bech32 address, pass as-is
    }
  }

  const uintMax = paramType ? UINT_MAX.get(paramType) : undefined
  if (uintMax !== undefined) {
    if (typeof arg === 'bigint') {
      if (arg < 0n || arg > uintMax) {
        throw new Error(`Value ${arg} out of range for Move type ${paramType} (0..${uintMax}).`)
      }
      return JSON.stringify(arg.toString())
    }
    if (typeof arg === 'number') {
      if (!Number.isSafeInteger(arg) || arg < 0) {
        throw new Error(
          `Unsafe number ${arg} for Move type ${paramType}. ` +
            `Expected a non-negative safe integer, or use BigInt.`
        )
      }
      const value = BigInt(arg)
      if (value > uintMax) {
        throw new Error(`Value ${arg} out of range for Move type ${paramType} (0..${uintMax}).`)
      }
      return JSON.stringify(String(arg))
    }
    if (typeof arg !== 'string') {
      throw new Error(
        `Invalid argument type ${typeof arg} for Move type ${paramType}. ` +
          `Expected bigint, number, or string.`
      )
    }
  }

  return jsonStringifyArg(arg)
}

/**
 * Checks if any param type contains unresolved generic references (T0, T1, ...).
 * Used to fall back to JSON path when BCS encoding is not possible.
 */
function hasUnresolvedGenerics(paramTypes: string[]): boolean {
  return paramTypes.some(p => /\bT\d+\b/.test(p))
}

const KNOWN_BCS_BASES = new Set([
  'bool',
  'u8',
  'u16',
  'u32',
  'u64',
  'u128',
  'u256',
  'address',
  'signer',
  'vector',
  'string',
  '0x1::string::String',
  '0x1::option::Option',
  '0x1::object::Object',
  '0x1::object::ObjectCore',
  '0x1::fixed_point32::FixedPoint32',
  '0x1::fixed_point64::FixedPoint64',
  '0x1::decimal128::Decimal128',
  '0x1::decimal256::Decimal256',
])

/**
 * Checks if all param types can be BCS-encoded by resolveBcsType().
 * Recursively checks type args (e.g., vector<UnknownType> → false).
 */
function allTypesResolvable(paramTypes: string[]): boolean {
  function isResolvable(parsed: ParsedMoveType): boolean {
    if (!KNOWN_BCS_BASES.has(parsed.base)) return false
    // Object<T>'s type param is phantom — does not affect BCS encoding
    if (parsed.base === '0x1::object::Object' || parsed.base === '0x1::object::ObjectCore') {
      return true
    }
    return parsed.typeArgs.every(isResolvable)
  }
  return paramTypes.every(p => isResolvable(parseMoveType(p)))
}

// =============================================================================
// View Response Conversion Helpers
// =============================================================================

/**
 * Converts a view function's JSON response to typed values.
 *
 * @param jsonParsed - Result of JSON.parse(response.data)
 * @param returnTypes - ABI return types (fn.return)
 * @returns Typed value (single) or typed array (multiple returns)
 */
function convertViewResponse(jsonParsed: unknown, returnTypes: string[]): unknown {
  if (returnTypes.length === 0) return jsonParsed

  if (returnTypes.length === 1) {
    return convertJsonValue(jsonParsed, parseMoveType(returnTypes[0]))
  }

  if (Array.isArray(jsonParsed)) {
    return (jsonParsed as unknown[]).map((val, i) =>
      i < returnTypes.length ? convertJsonValue(val, parseMoveType(returnTypes[i])) : val
    )
  }

  return jsonParsed
}

// =============================================================================
// Contract Factory
// =============================================================================

/**
 * Internal sync helper — builds a MoveContract from a resolved ABI.
 * Shared by both the static ABI (sync) and runtime ABI (async) overloads.
 */
function buildContract(
  context: HasMoveService,
  moduleAddress: string,
  moduleName: string,
  abi: MoveModuleAbi,
  opaqueTypes?: string[]
): MoveContract {
  const moveClient = context.client.move

  // Cache for token decimals by coin type
  const decimalsCache = new Map<string, number>()

  // Resolver for struct ABI lookups (used by resource auto-conversion)
  const resolver = createAbiResolver(context)
  const mergedOpaqueTypes = new Set([...DEFAULT_OPAQUE_TYPES, ...(opaqueTypes ?? [])])

  // Create execute proxy for entry functions
  const execute = new Proxy({} as MoveExecuteProxy, {
    get(_, functionName: string) {
      return (
        sender: string,
        callOptions?: MoveCallOptions
      ): Message<typeof MsgExecuteJSONSchema> | Message<typeof MsgExecuteSchema> => {
        const fn = findFunction(abi, functionName)
        if (!fn) {
          throw new ContractError('move', 0, `Function not found: ${functionName}`)
        }
        if (!fn.is_entry) {
          throw new ContractError('move', 0, `Function is not an entry function: ${functionName}`)
        }

        const typeArgs = callOptions?.typeArgs ?? []
        const args = callOptions?.args ?? []

        const paramTypes = getNonSignerParams(fn)
        const resolvedParams = resolveGenericTypes(paramTypes, typeArgs)

        // BCS path: all generics resolved and all types known
        if (!hasUnresolvedGenerics(resolvedParams) && allTypesResolvable(resolvedParams)) {
          const bcsArgs = encodeMoveArgs(args, resolvedParams)
          return new Message(MsgExecuteSchema, {
            sender,
            moduleAddress,
            moduleName,
            functionName,
            typeArgs,
            args: bcsArgs,
          })
        }

        // JSON fallback: unresolved generics or unknown types
        const jsonArgs = args.map((arg, i) => convertArgToJson(arg, resolvedParams[i]))
        return new Message(MsgExecuteJSONSchema, {
          sender,
          moduleAddress,
          moduleName,
          functionName,
          typeArgs,
          args: jsonArgs,
        })
      }
    },
  })

  // Create view proxy for view functions
  const view = new Proxy({} as MoveViewProxy, {
    get(_, functionName: string) {
      return async (callOptions?: MoveCallOptions): Promise<unknown> => {
        const fn = findFunction(abi, functionName)
        if (!fn) {
          throw new ContractError('move', 0, `Function not found: ${functionName}`)
        }
        if (!fn.is_view) {
          throw new ContractError('move', 0, `Function is not a view function: ${functionName}`)
        }

        const typeArgs = callOptions?.typeArgs ?? []
        const args = callOptions?.args ?? []

        // Get non-signer param types from ABI for address conversion
        const paramTypes = getNonSignerParams(fn)
        const resolvedParams = resolveGenericTypes(paramTypes, typeArgs)
        const jsonArgs = args.map((arg, i) => convertArgToJson(arg, resolvedParams[i]))

        const response = await moveClient.viewJSON({
          address: moduleAddress,
          moduleName,
          functionName,
          typeArgs,
          args: jsonArgs,
        })

        // Parse JSON response and convert to typed values using ABI return info
        try {
          const parsed: unknown = JSON.parse(response.data)

          const resolvedReturns = resolveGenericTypes(fn.return, typeArgs)
          if (
            resolvedReturns.length > 0 &&
            !hasUnresolvedGenerics(resolvedReturns) &&
            allTypesResolvable(resolvedReturns)
          ) {
            return convertViewResponse(parsed, resolvedReturns)
          }

          return parsed
        } catch {
          return response.data
        }
      }
    },
  })

  // Query resource (auto-converts using ABI resolution)
  async function resource(address: string, structTag: string): Promise<unknown> {
    const response = await moveClient.resource({
      address,
      structTag,
    })

    if (!response.resource) {
      throw new ContractError('move', 0, `Resource not found: ${structTag}`)
    }

    let raw: unknown
    try {
      raw = JSON.parse(response.resource.moveResource)
    } catch {
      return response.resource.moveResource
    }
    return convertResourceValue(raw, parseMoveType(structTag), resolver, mergedOpaqueTypes)
  }

  // Query table entry
  async function tableEntry(
    tableHandle: string,
    key: unknown,
    keyType: string,
    valueType?: string
  ): Promise<unknown> {
    // Encode key to BCS bytes
    const keyBytes = encodeMoveArgs([key], [keyType])[0]

    const response = await moveClient.tableEntry({
      address: tableHandle,
      keyBytes,
    })

    if (!response.tableEntry) {
      throw new ContractError('move', 0, `Table entry not found`)
    }

    // Parse JSON value
    let raw: unknown
    try {
      raw = JSON.parse(response.tableEntry.value)
    } catch {
      return response.tableEntry.value
    }

    if (valueType) {
      return convertResourceValue(raw, parseMoveType(valueType), resolver, mergedOpaqueTypes)
    }
    return raw
  }

  // Get decimals for a coin type
  async function getDecimals(coinType: string): Promise<number> {
    const cached = decimalsCache.get(coinType)
    if (cached !== undefined) {
      return cached
    }

    // Query CoinInfo resource to get decimals
    // Format: 0x1::coin::CoinInfo<CoinType>
    const coinInfoTag = `0x1::coin::CoinInfo<${coinType}>`

    // Extract the module address from coin type (e.g., 0x1 from 0x1::native_uinit::Coin)
    const coinTypeMatch = coinType.match(/^(0x[0-9a-fA-F]+)::/)
    const coinModuleAddress = coinTypeMatch ? coinTypeMatch[1] : '0x1'

    const coinInfo = (await resource(coinModuleAddress, coinInfoTag)) as { decimals: number }
    const decimals = coinInfo.decimals
    decimalsCache.set(coinType, decimals)
    return decimals
  }

  // Parse human-readable amount to minimum units
  async function parseUnitsForCoin(value: string, coinType: string): Promise<bigint> {
    const decimals = await getDecimals(coinType)
    return parseUnits(value, decimals)
  }

  // Format minimum units to human-readable amount
  async function formatUnitsForCoin(value: bigint, coinType: string): Promise<string> {
    const decimals = await getDecimals(coinType)
    return formatUnits(value, decimals)
  }

  // Get token info for a coin type
  async function getTokenInfo(coinType: string): Promise<TokenInfo> {
    const coinInfoTag = `0x1::coin::CoinInfo<${coinType}>`

    // Extract the module address from coin type
    const coinTypeMatch = coinType.match(/^(0x[0-9a-fA-F]+)::/)
    const coinModuleAddress = coinTypeMatch ? coinTypeMatch[1] : '0x1'

    const coinInfo = (await resource(coinModuleAddress, coinInfoTag)) as {
      name: string
      symbol: string
      decimals: number
      supply?: { value: bigint }
    }

    // Cache decimals
    decimalsCache.set(coinType, coinInfo.decimals)

    return {
      name: coinInfo.name,
      symbol: coinInfo.symbol,
      decimals: coinInfo.decimals,
      totalSupply: coinInfo.supply?.value,
    }
  }

  return {
    moduleAddress,
    moduleName,
    abi,
    execute,
    view,
    resource,
    tableEntry,
    parseUnits: parseUnitsForCoin,
    formatUnits: formatUnitsForCoin,
    getTokenInfo,
  }
}

/**
 * Creates a Move contract instance with a static ABI for compile-time type inference.
 * Returns synchronously since no ABI fetch is needed.
 *
 * @param context - ChainContext with client (must have move service)
 * @param abi - Static ABI object (use `moveAbi()` or `as const satisfies ReadonlyMoveModuleAbi`)
 * @returns Typed Move contract instance with autocomplete and type inference
 *
 * @example
 * ```typescript
 * const COIN_ABI = moveAbi({
 *   address: '0x1', name: 'coin', friends: [],
 *   exposed_functions: [
 *     { name: 'decimals', visibility: 'public', is_entry: false, is_view: true,
 *       generic_type_params: [], params: ['0x1::object::Object<0x1::fungible_asset::Metadata>'],
 *       return: ['u8'] },
 *   ],
 *   structs: [],
 * })
 * const coin = createMoveContract(ctx, COIN_ABI)
 * const dec = await coin.view.decimals({ args: ['0xabc'] }) // dec: number
 * ```
 */
export function createMoveContract<const T extends ReadonlyMoveModuleAbi>(
  context: HasMoveService,
  abi: T
): TypedMoveContract<T>

/**
 * Creates a Move contract instance by fetching ABI from chain.
 *
 * @param context - ChainContext with client (must have move service)
 * @param moduleAddress - Module address (hex or bech32)
 * @param moduleName - Module name
 * @param options - Contract options (ABI, caching)
 * @returns Move contract instance
 *
 * @example
 * ```typescript
 * const coin = await createMoveContract(ctx, '0x1', 'coin')
 * const msg = coin.execute.transfer(sender, {
 *   typeArgs: ['0x1::native_uinit::Coin'],
 *   args: [recipient, '1000000']
 * })
 * ```
 */
export function createMoveContract(
  context: HasMoveService,
  moduleAddress: string,
  moduleName: string,
  options?: CreateMoveContractOptions
): Promise<MoveContract>

export function createMoveContract<T extends ReadonlyMoveModuleAbi>(
  context: HasMoveService,
  abiOrAddress: T | string,
  moduleName?: string,
  options: CreateMoveContractOptions = {}
): TypedMoveContract<T> | Promise<MoveContract> {
  if (typeof abiOrAddress !== 'string') {
    // Static ABI path (sync)
    const abi = abiOrAddress
    validateModuleAddress(abi.address)
    validateModuleName(abi.name)
    return buildContract(
      context,
      abi.address,
      abi.name,
      abi as unknown as MoveModuleAbi
    ) as unknown as TypedMoveContract<T>
  }

  // Runtime ABI path (async)
  const moduleAddress = abiOrAddress
  validateModuleAddress(moduleAddress)
  validateModuleName(moduleName!)
  return (async () => {
    const fetchedAbi =
      options.abi ??
      (await getModuleAbi(context, moduleAddress, moduleName!, {
        useCache: options.useCache,
        cacheTtl: options.cacheTtl,
      }))
    return buildContract(context, moduleAddress, moduleName!, fetchedAbi, options.opaqueTypes)
  })()
}

// =============================================================================
// Message Creators
// =============================================================================

/**
 * Creates a MsgPublish for publishing Move modules.
 *
 * @param options - Publish options
 * @returns MsgPublish message for signing
 *
 * @example
 * ```typescript
 * const msg = createPublishMsg({
 *   sender: 'init1...',
 *   codeBytes: [compiledModule1, compiledModule2],
 *   upgradePolicy: UpgradePolicy.COMPATIBLE,
 * })
 * await ctx.signAndBroadcast([msg])
 * ```
 */
export function createPublishMsg(options: PublishModuleOptions): MsgPublish {
  return create(MsgPublishSchema, {
    sender: options.sender,
    codeBytes: options.codeBytes,
    upgradePolicy: options.upgradePolicy ?? UpgradePolicy.COMPATIBLE,
  })
}

/**
 * Creates a MsgScriptJSON for executing a Move script.
 *
 * @param options - Script execution options
 * @returns MsgScriptJSON message for signing
 *
 * @example
 * ```typescript
 * const msg = createScriptMsg({
 *   sender: 'init1...',
 *   codeBytes: compiledScript,
 *   typeArgs: ['0x1::native_uinit::Coin'],
 *   args: ['1000000'],
 * })
 * await ctx.signAndBroadcast([msg])
 * ```
 */
export function createScriptMsg(options: ExecuteScriptOptions): MsgScriptJSON {
  const jsonArgs = (options.args ?? []).map(arg => {
    if (arg instanceof Uint8Array) {
      return JSON.stringify(Array.from(arg))
    }
    return jsonStringifyArg(arg)
  })

  return create(MsgScriptJSONSchema, {
    sender: options.sender,
    codeBytes: options.codeBytes,
    typeArgs: options.typeArgs ?? [],
    args: jsonArgs,
  })
}

/**
 * Creates a MsgScript with BCS-encoded arguments.
 *
 * Use this when you have pre-encoded BCS arguments. For simpler JSON arguments,
 * use createScriptMsg() instead.
 *
 * @param options - Script execution options with BCS-encoded args
 * @returns MsgScript message for signing
 *
 * @example
 * ```typescript
 * const msg = createBcsScriptMsg({
 *   sender: 'init1...',
 *   codeBytes: compiledScript,
 *   typeArgs: ['0x1::native_uinit::Coin'],
 *   args: [bcsEncodedAmount], // Pre-encoded BCS bytes
 * })
 * await ctx.signAndBroadcast([msg])
 * ```
 */
export function createBcsScriptMsg(options: BcsScriptOptions): MsgScript {
  return create(MsgScriptSchema, {
    sender: options.sender,
    codeBytes: options.codeBytes,
    typeArgs: options.typeArgs ?? [],
    args: options.args ?? [],
  })
}

/**
 * Creates a MsgExecuteJSON directly without a contract instance.
 *
 * @param sender - Sender address
 * @param moduleAddress - Module address
 * @param moduleName - Module name
 * @param functionName - Function name
 * @param typeArgs - Type arguments
 * @param args - Function arguments (will be JSON stringified)
 * @returns MsgExecuteJSON message for signing
 *
 * @example
 * ```typescript
 * const msg = createExecuteMsg(
 *   sender,
 *   '0x1',
 *   'coin',
 *   'transfer',
 *   ['0x1::native_uinit::Coin'],
 *   [recipient, '1000000']
 * )
 * ```
 */
export function createExecuteMsg(
  sender: string,
  moduleAddress: string,
  moduleName: string,
  functionName: string,
  typeArgs: string[] = [],
  args: unknown[] = []
): MsgExecuteJSON {
  const jsonArgs = args.map(jsonStringifyArg)

  return create(MsgExecuteJSONSchema, {
    sender,
    moduleAddress,
    moduleName,
    functionName,
    typeArgs,
    args: jsonArgs,
  })
}

// =============================================================================
// View Function Caller
// =============================================================================

/**
 * Calls a view function directly without creating a contract instance.
 *
 * @param context - ChainContext with client (must have move service)
 * @param moduleAddress - Module address
 * @param moduleName - Module name
 * @param functionName - Function name
 * @param typeArgs - Type arguments
 * @param args - Function arguments (will be JSON stringified)
 * @returns View function result
 *
 * @example
 * ```typescript
 * const balance = await callViewFunction(
 *   ctx,
 *   '0x1',
 *   'coin',
 *   'balance',
 *   ['0x1::native_uinit::Coin'],
 *   [address]
 * )
 * ```
 */
export async function callViewFunction(
  context: HasMoveService,
  moduleAddress: string,
  moduleName: string,
  functionName: string,
  typeArgs: string[] = [],
  args: unknown[] = []
): Promise<unknown> {
  const moveClient = context.client.move
  const jsonArgs = args.map(jsonStringifyArg)

  const response = await moveClient.viewJSON({
    address: moduleAddress,
    moduleName,
    functionName,
    typeArgs,
    args: jsonArgs,
  })

  try {
    return JSON.parse(response.data)
  } catch {
    return response.data
  }
}

// =============================================================================
// Mid-Level Standalone Functions (Phase 5)
// =============================================================================

/**
 * Parse a full Move function identifier into components.
 * @example parseMoveFunction('0x1::coin::transfer')
 * // → { moduleAddress: '0x1', moduleName: 'coin', functionName: 'transfer' }
 */
function parseMoveFunction(fn: string): {
  moduleAddress: string
  moduleName: string
  functionName: string
} {
  const parts = fn.split('::')
  if (parts.length !== 3) {
    throw new ContractError(
      'move',
      0,
      `Invalid Move function identifier: "${fn}". Expected format: "address::module::function"`
    )
  }
  return {
    moduleAddress: parts[0],
    moduleName: parts[1],
    functionName: parts[2],
  }
}

/**
 * Build a Move execute message using a combined function identifier.
 *
 * Without paramTypes: creates MsgExecuteJSON (chain handles type resolution).
 * With paramTypes: attempts BCS encoding (MsgExecute), falls back to JSON with bech32 conversion.
 *
 * @example
 * ```typescript
 * // Simple (JSON path)
 * const msg = buildMoveExecute(sender, {
 *   function: '0x1::coin::transfer',
 *   typeArgs: ['0x1::native_uinit::Coin'],
 *   args: ['0xrecipient', '1000000'],
 * })
 *
 * // With BCS + bech32
 * const msg = buildMoveExecute(sender, {
 *   function: '0x1::coin::transfer',
 *   typeArgs: ['0x1::native_uinit::Coin'],
 *   args: ['init1qwer...', 1000000n],
 *   paramTypes: ['address', 'u64'],
 * })
 * ```
 */
export function buildMoveExecute(
  sender: string,
  options: BuildMoveExecuteOptions
): Message<typeof MsgExecuteSchema> | Message<typeof MsgExecuteJSONSchema> {
  const { moduleAddress, moduleName, functionName } = parseMoveFunction(options.function)
  const typeArgs = options.typeArgs ?? []
  const args = options.args ?? []

  if (options.paramTypes) {
    const resolvedParams = resolveGenericTypes(options.paramTypes, typeArgs)

    // BCS path: all generics resolved and all types known
    if (!hasUnresolvedGenerics(resolvedParams) && allTypesResolvable(resolvedParams)) {
      const bcsArgs = encodeMoveArgs(args, resolvedParams)
      return new Message(MsgExecuteSchema, {
        sender,
        moduleAddress,
        moduleName,
        functionName,
        typeArgs,
        args: bcsArgs,
      })
    }

    // JSON fallback with bech32 conversion
    const jsonArgs = args.map((arg, i) => convertArgToJson(arg, resolvedParams[i]))
    return new Message(MsgExecuteJSONSchema, {
      sender,
      moduleAddress,
      moduleName,
      functionName,
      typeArgs,
      args: jsonArgs,
    })
  }

  // No paramTypes: plain JSON path (same as createExecuteMsg)
  const jsonArgs = args.map(jsonStringifyArg)
  return new Message(MsgExecuteJSONSchema, {
    sender,
    moduleAddress,
    moduleName,
    functionName,
    typeArgs,
    args: jsonArgs,
  })
}

/**
 * Call a Move view function using a combined function identifier.
 *
 * Without returns: returns raw JSON.parse result.
 * With returns: converts response to typed values (u64→bigint, etc.).
 * With paramTypes: applies bech32→hex conversion on args.
 *
 * @example
 * ```typescript
 * // Typed response
 * const balance = await buildMoveView(ctx, {
 *   function: '0x1::coin::balance',
 *   typeArgs: ['0x1::native_uinit::Coin'],
 *   args: ['0xaddress'],
 *   returns: ['u64'],
 * })
 * // balance: bigint
 *
 * // With bech32 args + typed response
 * const balance = await buildMoveView(ctx, {
 *   function: '0x1::coin::balance',
 *   typeArgs: ['0x1::native_uinit::Coin'],
 *   args: ['init1qwer...'],
 *   paramTypes: ['address'],
 *   returns: ['u64'],
 * })
 * ```
 */
export async function buildMoveView(
  context: HasMoveService,
  options: BuildMoveViewOptions
): Promise<unknown> {
  const { moduleAddress, moduleName, functionName } = parseMoveFunction(options.function)
  const typeArgs = options.typeArgs ?? []
  const args = options.args ?? []

  // Build JSON args
  let jsonArgs: string[]
  if (options.paramTypes) {
    const resolvedParams = resolveGenericTypes(options.paramTypes, typeArgs)
    jsonArgs = args.map((arg, i) => convertArgToJson(arg, resolvedParams[i]))
  } else {
    jsonArgs = args.map(jsonStringifyArg)
  }

  const response = await context.client.move.viewJSON({
    address: moduleAddress,
    moduleName,
    functionName,
    typeArgs,
    args: jsonArgs,
  })

  try {
    const parsed: unknown = JSON.parse(response.data)

    // Typed conversion if returns provided and all types resolvable
    if (options.returns && options.returns.length > 0) {
      const resolvedReturns = resolveGenericTypes(options.returns, typeArgs)
      if (!hasUnresolvedGenerics(resolvedReturns) && allTypesResolvable(resolvedReturns)) {
        return convertViewResponse(parsed, resolvedReturns)
      }
    }

    return parsed
  } catch {
    return response.data
  }
}

// =============================================================================
// Resource and Table Queries
// =============================================================================

/**
 * Queries a Move resource directly.
 *
 * By default, performs automatic type conversion (u64 strings to bigint, Option
 * unwrapping, etc.) via ABI resolution. Pass `{ convert: false }` to receive
 * raw JSON-parsed data instead.
 *
 * @param context - ChainContext with client (must have move service)
 * @param address - Account address
 * @param structTag - Resource struct tag (e.g., '0x1::coin::CoinStore<0x1::native_uinit::Coin>')
 * @param options - Optional conversion settings
 * @returns Parsed resource data
 *
 * @example
 * ```typescript
 * // Auto-converted (default)
 * const typed = await queryResource(ctx, '0x1', '0x1::coin::CoinInfo<...>')
 *
 * // Raw JSON without conversion
 * const raw = await queryResource(ctx, '0x1', '0x1::coin::CoinInfo<...>', { convert: false })
 * ```
 */
export async function queryResource(
  context: HasMoveService,
  address: string,
  structTag: string,
  options?: { convert?: boolean; opaqueTypes?: string[] }
): Promise<unknown> {
  const moveClient = context.client.move
  const response = await moveClient.resource({
    address,
    structTag,
  })

  if (!response.resource) {
    throw new ContractError('move', 0, `Resource not found: ${structTag}`)
  }

  let raw: unknown
  try {
    raw = JSON.parse(response.resource.moveResource)
  } catch {
    return response.resource.moveResource
  }

  if (options?.convert === false) {
    return raw
  }

  const resolver = createAbiResolver(context)
  const opaqueTypes = new Set([...DEFAULT_OPAQUE_TYPES, ...(options?.opaqueTypes ?? [])])
  return convertResourceValue(raw, parseMoveType(structTag), resolver, opaqueTypes)
}

/**
 * Queries a Move table entry directly.
 *
 * @param context - ChainContext with client (must have move service)
 * @param tableHandle - Table handle address
 * @param key - Key value
 * @param keyType - Key type for BCS encoding
 * @param valueType - Optional value type for auto-conversion (e.g., '0x1::stake::StakeInfo')
 * @param options - Optional settings; pass `opaqueTypes` to skip ABI resolution for specific type bases
 * @returns Parsed table entry value; auto-converted if valueType is provided
 *
 * @example
 * ```typescript
 * // Raw result (no conversion)
 * const entry = await queryTableEntry(ctx, tableHandle, key, 'address')
 *
 * // With auto-conversion
 * const typed = await queryTableEntry(ctx, tableHandle, key, 'address', '0x1::stake::StakeInfo')
 * ```
 */
export async function queryTableEntry(
  context: HasMoveService,
  tableHandle: string,
  key: unknown,
  keyType: string,
  valueType?: string,
  options?: { opaqueTypes?: string[] }
): Promise<unknown> {
  const moveClient = context.client.move
  const keyBytes = encodeMoveArgs([key], [keyType])[0]

  const response = await moveClient.tableEntry({
    address: tableHandle,
    keyBytes,
  })

  if (!response.tableEntry) {
    throw new ContractError('move', 0, `Table entry not found`)
  }

  let raw: unknown
  try {
    raw = JSON.parse(response.tableEntry.value)
  } catch {
    return response.tableEntry.value
  }

  if (valueType) {
    const resolver = createAbiResolver(context)
    const opaqueTypes = new Set([...DEFAULT_OPAQUE_TYPES, ...(options?.opaqueTypes ?? [])])
    return convertResourceValue(raw, parseMoveType(valueType), resolver, opaqueTypes)
  }
  return raw
}

// =============================================================================
// Re-exports
// =============================================================================

export { UpgradePolicy }
export type { MoveQueryClient }
