/**
 * Move Resource Conversion Utilities
 *
 * Provides struct tag parsing, opaque type definitions, and types
 * for resource value conversion using module ABIs.
 */

import {
  parseMoveType,
  stringifyType,
  convertJsonValue,
  resolveGenericTypes,
  type ParsedMoveType,
} from './bcs'
import { getModuleAbi, findStruct } from './abi-fetcher'
import type { HasMoveService } from '../../client/types'
import type { MoveFieldAbi, MoveModuleAbi } from './types'

// =============================================================================
// Struct Tag Parsing
// =============================================================================

/**
 * Parsed struct tag representation.
 */
export interface ParsedStructTag {
  /** Module address (e.g., '0x1') */
  readonly address: string
  /** Module name (e.g., 'coin') */
  readonly module: string
  /** Struct name (e.g., 'CoinInfo') */
  readonly name: string
  /** Type arguments */
  readonly typeArgs: readonly ParsedMoveType[]
}

/**
 * Parses a struct tag string into its components.
 *
 * @param tag - Struct tag string (e.g., '0x1::coin::CoinInfo<0x1::native_uinit::Coin>')
 * @returns Parsed struct tag with address, module, name, and type arguments
 * @throws Error if the tag does not follow the `address::module::name` format
 *
 * @example
 * ```typescript
 * parseStructTag('0x1::coin::Coin')
 * // { address: '0x1', module: 'coin', name: 'Coin', typeArgs: [] }
 *
 * parseStructTag('0x1::coin::CoinInfo<0x1::native_uinit::Coin>')
 * // { address: '0x1', module: 'coin', name: 'CoinInfo', typeArgs: [...] }
 * ```
 */
export function parseStructTag(tag: string): ParsedStructTag {
  const parsed = parseMoveType(tag)
  const parts = parsed.base.split('::')
  if (parts.length !== 3) {
    throw new Error(`Invalid struct tag: ${tag}. Expected format: address::module::name`)
  }
  return {
    address: parts[0],
    module: parts[1],
    name: parts[2],
    typeArgs: parsed.typeArgs,
  }
}

// =============================================================================
// Opaque Types
// =============================================================================

/**
 * Default set of opaque types that should not be recursively resolved.
 * These types serialize as opaque objects and do not need ABI resolution.
 *
 * Entries must be base type strings without type arguments:
 * - Correct: `'0x1::table::Table'`
 * - Wrong: `'0x1::table::Table<address, u64>'` (will not match)
 */
export const DEFAULT_OPAQUE_TYPES: ReadonlySet<string> = new Set([
  '0x1::table::Table',
  '0x1::object::ExtendRef',
])

// =============================================================================
// Types
// =============================================================================

/**
 * Resolver for fetching struct field ABIs from the chain.
 */
export interface AbiResolver {
  resolveStruct(
    address: string,
    moduleName: string,
    structName: string
  ): Promise<MoveFieldAbi[] | undefined>
}

// =============================================================================
// Resource Value Conversion
// =============================================================================

/**
 * Recursively converts a Move resource JSON value to typed JavaScript values
 * using ABI resolution to determine struct field types.
 *
 * Conversion rules:
 * - **Primitives** (u64/u128/u256 strings, bool, etc.): delegates to `convertJsonValue` (sync)
 * - **vector\<T\>**: recursively converts each element
 * - **Option\<T\>**: unwraps `{ vec: [...] }` envelope, returns `null` for empty
 * - **Opaque types** (e.g., Table): returned as-is, no ABI fetch
 * - **Custom structs**: fetches field ABI via resolver, recursively converts each field
 *
 * @param value - The JSON-parsed resource value
 * @param parsed - Parsed Move type (use `parseMoveType()` to create)
 * @param resolver - ABI resolver for fetching struct field definitions
 * @param opaqueTypes - Set of type bases to skip ABI resolution for
 * @returns Typed JavaScript value with u64/u128/u256 as bigint, Options unwrapped, etc.
 *
 * @example
 * ```typescript
 * const resolver = createAbiResolver(ctx)
 * const typed = await convertResourceValue(
 *   { value: "12345" },
 *   parseMoveType('0x1::coin::CoinStore'),
 *   resolver,
 *   DEFAULT_OPAQUE_TYPES
 * )
 * // typed: { value: 12345n }
 * ```
 */
export async function convertResourceValue(
  value: unknown,
  parsed: ParsedMoveType,
  resolver: AbiResolver,
  opaqueTypes: ReadonlySet<string>
): Promise<unknown> {
  // Step 1: Primitive value -> sync, no ABI fetch
  if (typeof value !== 'object' || value === null) {
    return convertJsonValue(value, parsed)
  }

  // Step 2: Array -> vector handling
  if (parsed.base === 'vector' && Array.isArray(value) && parsed.typeArgs.length === 1) {
    return Promise.all(
      value.map(v => convertResourceValue(v, parsed.typeArgs[0], resolver, opaqueTypes))
    )
  }

  // Step 3: Option -> unwrap then recurse
  if (parsed.base === '0x1::option::Option') {
    if (value === null || value === undefined) return null
    if (typeof value === 'object' && value !== null && 'vec' in value) {
      const vec = (value as { vec: unknown[] }).vec
      if (vec.length === 0) return null
      if (vec.length > 1) {
        throw new Error(
          `Invalid Option value: vec contains ${vec.length} elements (expected 0 or 1)`
        )
      }
      if (parsed.typeArgs.length === 1) {
        return convertResourceValue(vec[0], parsed.typeArgs[0], resolver, opaqueTypes)
      }
    }
    // Non-vec Option value — attempt inner type conversion (consistent with convertJsonValue)
    if (parsed.typeArgs.length === 1) {
      return convertResourceValue(value, parsed.typeArgs[0], resolver, opaqueTypes)
    }
    return value
  }

  // Step 4: Opaque types -> skip ABI fetch
  if (opaqueTypes.has(parsed.base)) {
    return value
  }

  // Step 5: Custom struct -> ABI resolve + recursive field conversion
  const parts = parsed.base.split('::')
  if (parts.length !== 3) {
    throw new Error(`Unexpected object value for non-struct type '${parsed.base}'`)
  }

  const [address, module, name] = parts
  const fields = await resolver.resolveStruct(address, module, name)
  if (!fields) {
    throw new Error(`Struct '${name}' not found in ABI for module ${address}::${module}`)
  }

  // Resolve generic type params (T0, T1, ... -> concrete types)
  const resolvedTypeStrs = resolveGenericTypes(
    fields.map(f => f.type),
    parsed.typeArgs.map(stringifyType)
  )

  // Recursively convert each field
  const result = { ...(value as Record<string, unknown>) }
  await Promise.all(
    fields.map(async (field, i) => {
      if (field.name in result) {
        result[field.name] = await convertResourceValue(
          result[field.name],
          parseMoveType(resolvedTypeStrs[i]),
          resolver,
          opaqueTypes
        )
      }
    })
  )
  return result
}

// =============================================================================
// ABI Resolver Factory
// =============================================================================

/**
 * Creates an ABI resolver with in-flight request deduplication.
 *
 * Wraps `getModuleAbi()` + `findStruct()` to resolve struct fields from the chain.
 * Concurrent requests for the same module are deduplicated so only one gRPC call
 * is made. Errors from `getModuleAbi` propagate to the caller.
 *
 * @param context - Context with Move service access
 * @returns AbiResolver instance
 *
 * @example
 * ```typescript
 * const resolver = createAbiResolver(ctx)
 * const fields = await resolver.resolveStruct('0x1', 'coin', 'CoinInfo')
 * // fields: [{ name: 'value', type: 'u64' }] or undefined
 * ```
 */
export function createAbiResolver(context: HasMoveService): AbiResolver {
  const inflight = new Map<string, Promise<MoveModuleAbi>>()

  async function fetchAbi(address: string, moduleName: string): Promise<MoveModuleAbi> {
    const key = `${address.toLowerCase()}::${moduleName}`
    let promise = inflight.get(key)
    if (!promise) {
      promise = getModuleAbi(context, address, moduleName)
      inflight.set(key, promise)
      // Clean up inflight entry on settle. Errors propagate via `return promise` below,
      // not through this .then() chain — the rejection handler only removes the cache entry.
      promise.then(
        () => inflight.delete(key),
        () => inflight.delete(key)
      )
    }
    return promise
  }

  return {
    async resolveStruct(address, moduleName, structName) {
      const abi = await fetchAbi(address, moduleName)
      return findStruct(abi, structName)?.fields
    },
  }
}
