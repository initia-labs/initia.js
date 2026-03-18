/**
 * Move Module ABI Fetcher
 *
 * Provides utilities to fetch and parse Move module ABIs from the chain.
 * Uses gRPC to query module info and parse the JSON ABI string.
 *
 * ## Caching Behavior
 *
 * ABIs are cached based on the module's upgrade policy:
 *
 * - **IMMUTABLE modules**: Cached permanently (no staleness possible)
 * - **COMPATIBLE modules**: Cached with TTL (default 5 minutes)
 *
 * For upgradeable modules, the cache may become stale after upgrades.
 * Options to handle this:
 * - Use `useCache: false` to always fetch fresh data
 * - Call `clearAbiCache(moduleAddress)` after known upgrades
 * - Reduce `cacheTtl` for frequently upgraded modules
 */

import type { Client } from '@connectrpc/connect'
import type { Query as MoveQuery } from '@buf/initia-labs_initia.bufbuild_es/initia/move/v1/query_pb'
import { UpgradePolicy } from '@buf/initia-labs_initia.bufbuild_es/initia/move/v1/types_pb'
import type { HasMoveService } from '../../client/types'
import type {
  MoveModuleAbi,
  MoveFunctionAbi,
  MoveStructAbi,
  MoveFieldAbi,
  MoveGenericTypeParam,
  MoveFunctionVisibility,
} from './types'
import { ParseError, ContractError } from '../../errors'

// =============================================================================
// Types
// =============================================================================

/**
 * Move gRPC query client type.
 */
export type MoveQueryClient = Client<typeof MoveQuery>

/**
 * Cache key for module ABI.
 */
type CacheKey = `${string}::${string}`

/**
 * Cached ABI entry with metadata.
 */
interface CacheEntry {
  abi: MoveModuleAbi
  timestamp: number
  /** If true, cache never expires (IMMUTABLE modules) */
  permanent: boolean
}

// =============================================================================
// ABI Cache
// =============================================================================

/** In-memory ABI cache */
const abiCache = new Map<CacheKey, CacheEntry>()

/** Default cache TTL (5 minutes) */
const DEFAULT_CACHE_TTL = 5 * 60 * 1000

/**
 * Gets the cache key for a module.
 */
function getCacheKey(moduleAddress: string, moduleName: string): CacheKey {
  return `${moduleAddress.toLowerCase()}::${moduleName}`
}

/**
 * Gets a cached ABI if available and not expired.
 *
 * @param moduleAddress - Module address
 * @param moduleName - Module name
 * @param ttl - Cache TTL in milliseconds (ignored for IMMUTABLE modules)
 * @returns Cached ABI or undefined
 */
export function getCachedAbi(
  moduleAddress: string,
  moduleName: string,
  ttl: number = DEFAULT_CACHE_TTL
): MoveModuleAbi | undefined {
  const key = getCacheKey(moduleAddress, moduleName)
  const entry = abiCache.get(key)

  if (!entry) return undefined

  // Permanent cache (IMMUTABLE modules) never expires
  if (entry.permanent) {
    return entry.abi
  }

  // Check if cache is expired for upgradeable modules
  if (Date.now() - entry.timestamp > ttl) {
    abiCache.delete(key)
    return undefined
  }

  return entry.abi
}

/**
 * Caches a module ABI.
 *
 * @param moduleAddress - Module address
 * @param moduleName - Module name
 * @param abi - Module ABI to cache
 * @param permanent - If true, cache never expires (for IMMUTABLE modules)
 */
export function cacheModuleAbi(
  moduleAddress: string,
  moduleName: string,
  abi: MoveModuleAbi,
  permanent: boolean = false
): void {
  const key = getCacheKey(moduleAddress, moduleName)
  abiCache.set(key, {
    abi,
    timestamp: Date.now(),
    permanent,
  })
}

/**
 * Clears the ABI cache.
 * Optionally clear only entries for a specific address.
 *
 * @param moduleAddress - Optional address to clear cache for
 */
export function clearAbiCache(moduleAddress?: string): void {
  if (moduleAddress) {
    const prefix = moduleAddress.toLowerCase() + '::'
    for (const key of abiCache.keys()) {
      if (key.startsWith(prefix)) {
        abiCache.delete(key)
      }
    }
  } else {
    abiCache.clear()
  }
}

// =============================================================================
// ABI Parsing
// =============================================================================

/**
 * Raw ABI JSON structure from the chain.
 * This matches the JSON format in Module.abi string.
 */
interface RawModuleAbi {
  address: string
  name: string
  friends: string[]
  exposed_functions: RawFunctionAbi[]
  structs: RawStructAbi[]
}

interface RawFunctionAbi {
  name: string
  visibility: string
  is_entry: boolean
  is_view: boolean
  generic_type_params: RawGenericTypeParam[]
  params: string[]
  return: string[]
}

interface RawStructAbi {
  name: string
  is_native: boolean
  abilities: string[]
  generic_type_params: RawGenericTypeParam[]
  fields: RawFieldAbi[]
}

interface RawFieldAbi {
  name: string
  type: string
}

interface RawGenericTypeParam {
  constraints: string[]
}

/**
 * Parses a raw ABI JSON string into a typed MoveModuleAbi.
 *
 * @param abiJson - JSON string from Module.abi
 * @returns Parsed module ABI
 * @throws Error if JSON parsing fails or ABI structure is invalid
 *
 * @example
 * ```typescript
 * const abi = parseModuleAbi('{"address":"0x1","name":"coin",...}')
 * ```
 */
export function parseModuleAbi(abiJson: string): MoveModuleAbi {
  let raw: RawModuleAbi

  try {
    raw = JSON.parse(abiJson) as RawModuleAbi
  } catch (error) {
    throw new ParseError(
      'MoveModuleABI',
      `Invalid JSON: ${error instanceof Error ? error.message : String(error)}`
    )
  }

  // Validate required fields
  if (!raw.address || !raw.name) {
    throw new ParseError('MoveModuleABI', 'Missing required field: address or name')
  }

  // Parse exposed functions
  const exposedFunctions: MoveFunctionAbi[] = (raw.exposed_functions || []).map(
    (fn): MoveFunctionAbi => ({
      name: fn.name,
      visibility: parseVisibility(fn.visibility),
      is_entry: fn.is_entry ?? false,
      is_view: fn.is_view ?? false,
      generic_type_params: (fn.generic_type_params || []).map(
        (param): MoveGenericTypeParam => ({
          constraints: param.constraints || [],
        })
      ),
      params: fn.params || [],
      return: fn.return || [],
    })
  )

  // Parse structs
  const structs: MoveStructAbi[] = (raw.structs || []).map(
    (s): MoveStructAbi => ({
      name: s.name,
      is_native: s.is_native ?? false,
      abilities: s.abilities || [],
      generic_type_params: (s.generic_type_params || []).map(
        (param): MoveGenericTypeParam => ({
          constraints: param.constraints || [],
        })
      ),
      fields: (s.fields || []).map(
        (f): MoveFieldAbi => ({
          name: f.name,
          type: f.type,
        })
      ),
    })
  )

  return {
    address: raw.address,
    name: raw.name,
    friends: raw.friends || [],
    exposed_functions: exposedFunctions,
    structs,
  }
}

/**
 * Parses visibility string to typed visibility.
 */
function parseVisibility(visibility: string): MoveFunctionVisibility {
  switch (visibility.toLowerCase()) {
    case 'public':
      return 'public'
    case 'private':
      return 'private'
    case 'friend':
      return 'friend'
    default:
      return 'private'
  }
}

// =============================================================================
// ABI Fetching
// =============================================================================

/**
 * Options for fetching module ABI.
 */
export interface FetchAbiOptions {
  /** Use cached ABI if available (default: true) */
  useCache?: boolean
  /** Cache TTL in milliseconds (default: 5 minutes) */
  cacheTtl?: number
}

/**
 * Fetches and parses a Move module ABI from the chain.
 *
 * **Caching behavior:**
 * - **IMMUTABLE modules**: Cached permanently (staleness impossible)
 * - **COMPATIBLE/upgradeable modules**: Cached with TTL (default 5 minutes)
 *
 * For upgradeable modules, the cache may become stale after upgrades.
 * Use `clearAbiCache(moduleAddress)` after known upgrades, or set
 * `useCache: false` to always fetch fresh data.
 *
 * @param context - ChainContext with client (must have move service)
 * @param moduleAddress - Module address (hex or bech32)
 * @param moduleName - Module name
 * @param options - Fetch options
 * @returns Parsed module ABI
 *
 * @example Basic usage
 * ```typescript
 * const abi = await getModuleAbi(ctx, '0x1', 'coin')
 * console.log(abi.exposed_functions)
 * ```
 *
 * @example Handle upgradeable module
 * ```typescript
 * // After module upgrade, clear cache
 * clearAbiCache('0x1')
 *
 * // Or bypass cache entirely
 * const abi = await getModuleAbi(ctx, '0x1', 'coin', { useCache: false })
 * ```
 */
export async function getModuleAbi(
  context: HasMoveService,
  moduleAddress: string,
  moduleName: string,
  options: FetchAbiOptions = {}
): Promise<MoveModuleAbi> {
  const moveClient = context.client.move
  const { useCache = true, cacheTtl = DEFAULT_CACHE_TTL } = options

  // Check cache first
  if (useCache) {
    const cached = getCachedAbi(moduleAddress, moduleName, cacheTtl)
    if (cached) {
      return cached
    }
  }

  // Fetch from chain
  const response = await moveClient.module({
    address: moduleAddress,
    moduleName: moduleName,
  })

  if (!response.module) {
    throw new ContractError('move', 0, `Module not found: ${moduleAddress}::${moduleName}`)
  }

  const abiJson = response.module.abi
  if (!abiJson) {
    throw new ContractError('move', 0, `Module ABI not available: ${moduleAddress}::${moduleName}`)
  }

  // Parse ABI
  const abi = parseModuleAbi(abiJson)

  // Cache the result - IMMUTABLE modules are cached permanently
  const isImmutable = response.module.upgradePolicy === UpgradePolicy.IMMUTABLE
  cacheModuleAbi(moduleAddress, moduleName, abi, isImmutable)

  return abi
}

/**
 * Fetches all modules from an address.
 *
 * @param context - ChainContext with client (must have move service)
 * @param address - Account address
 * @returns Array of module ABIs
 *
 * @example
 * ```typescript
 * const modules = await getModulesAbi(ctx, '0x1')
 * ```
 */
export async function getModulesAbi(
  context: HasMoveService,
  address: string
): Promise<MoveModuleAbi[]> {
  const moveClient = context.client.move
  const response = await moveClient.modules({
    address,
  })

  const abis: MoveModuleAbi[] = []

  for (const mod of response.modules) {
    if (mod.abi) {
      try {
        const abi = parseModuleAbi(mod.abi)
        const isImmutable = mod.upgradePolicy === UpgradePolicy.IMMUTABLE
        cacheModuleAbi(address, mod.moduleName, abi, isImmutable)
        abis.push(abi)
      } catch {
        // Skip modules with invalid ABI - silent failure for library usage
      }
    }
  }

  return abis
}

// =============================================================================
// ABI Utilities
// =============================================================================

/**
 * Finds a function in the module ABI by name.
 *
 * @param abi - Module ABI
 * @param functionName - Function name to find
 * @returns Function ABI or undefined
 */
export function findFunction(
  abi: MoveModuleAbi,
  functionName: string
): MoveFunctionAbi | undefined {
  return abi.exposed_functions.find(fn => fn.name === functionName)
}

/**
 * Finds a struct in the module ABI by name.
 *
 * @param abi - Module ABI
 * @param structName - Struct name to find
 * @returns Struct ABI or undefined
 */
export function findStruct(abi: MoveModuleAbi, structName: string): MoveStructAbi | undefined {
  return abi.structs.find(s => s.name === structName)
}

/**
 * Gets all entry functions from the module ABI.
 *
 * @param abi - Module ABI
 * @returns Array of entry function ABIs
 */
export function getEntryFunctions(abi: MoveModuleAbi): MoveFunctionAbi[] {
  return abi.exposed_functions.filter(fn => fn.is_entry)
}

/**
 * Gets all view functions from the module ABI.
 *
 * @param abi - Module ABI
 * @returns Array of view function ABIs
 */
export function getViewFunctions(abi: MoveModuleAbi): MoveFunctionAbi[] {
  return abi.exposed_functions.filter(fn => fn.is_view)
}

/**
 * Checks if a function requires a signer parameter.
 * Signer params are typically the first param with type '&signer' or 'signer'.
 *
 * @param fn - Function ABI
 * @returns True if function requires signer
 */
export function requiresSigner(fn: MoveFunctionAbi): boolean {
  if (fn.params.length === 0) return false
  const firstParam = fn.params[0]
  return firstParam === '&signer' || firstParam === 'signer'
}

/**
 * Gets the non-signer parameters of a function.
 *
 * @param fn - Function ABI
 * @returns Parameter types excluding signer
 */
export function getNonSignerParams(fn: MoveFunctionAbi): string[] {
  return fn.params.filter(p => p !== '&signer' && p !== 'signer')
}
