/**
 * UsernameService — public API for the Initia Usernames system.
 * Provides name↔address resolution with LRU caching and request deduplication.
 */

import type { UsernameRecord, UsernameMetadata, UsernameResolveOptions } from './types'
import { UsernameServiceError } from './types'
import { normalizeName, getDisplayName, normalizeAddress, formatAddress } from './utils'
import { fetchUsernameRecord, fetchAddressToName, fetchNameToAddress } from './http'
import { createUsernameCache, CACHE_TTL, type UsernameCache } from './cache'

// =============================================================================
// Service Interface
// =============================================================================

/**
 * Read-only username resolution service for .init domains.
 *
 * This service provides name↔address lookup, metadata, and availability checks.
 * To **register** a new .init domain, use the Initia App:
 *   https://app.initia.xyz/usernames
 *
 * Or register programmatically via L1 Move module:
 * ```typescript
 * ctx.msgs.move.execute({
 *   sender: address,
 *   moduleName: 'usernames',
 *   moduleAddress: '0x1',
 *   functionName: 'register',
 *   args: [name],
 * })
 * ```
 */
export interface UsernameService {
  readonly network: 'mainnet' | 'testnet'
  readonly baseUrl: string

  resolve(nameOrAddress: string, options?: UsernameResolveOptions): Promise<string>
  getAddress(name: string, options?: UsernameResolveOptions): Promise<string | undefined>
  getName(address: string, options?: UsernameResolveOptions): Promise<string | undefined>
  getRecord(name: string, options?: UsernameResolveOptions): Promise<UsernameRecord | undefined>
  getMetadata(name: string, options?: UsernameResolveOptions): Promise<UsernameMetadata | undefined>
  getImageUrl(name: string): string
  isAvailable(name: string): Promise<boolean>
  getKnownNames(address: string): string[]
  invalidateCache(value: string): void
  clearCache(): void
}

export interface UsernameServiceOptions {
  network: 'mainnet' | 'testnet'
  cache?: UsernameCache
  defaultCacheTtl?: number
  timeout?: number
}

// =============================================================================
// Helpers
// =============================================================================

/**
 * Get usernames API base URL for the given network.
 */
export function getUsernamesApiUrl(network: string): string | undefined {
  switch (network) {
    case 'mainnet':
      return 'https://usernames-api.initia.xyz'
    case 'testnet':
      return 'https://usernames-api.testnet.initia.xyz'
    default:
      return undefined
  }
}

/**
 * Check if username service is supported for the given network.
 */
export function isUsernameServiceSupported(network: string): network is 'mainnet' | 'testnet' {
  return network === 'mainnet' || network === 'testnet'
}

// =============================================================================
// Factory
// =============================================================================

export function createUsernameService(options: UsernameServiceOptions): UsernameService {
  const { network, timeout: serviceTimeout } = options
  const baseUrl = getUsernamesApiUrl(network)!
  const cache = options.cache ?? createUsernameCache()
  const defaultCacheTtl = options.defaultCacheTtl ?? CACHE_TTL.DEFAULT

  // Deduplication maps
  const pendingByName = new Map<
    string,
    Promise<{ record: UsernameRecord; metadata: UsernameMetadata } | undefined>
  >()
  const pendingByAddress = new Map<string, Promise<string | null>>()

  function getTimeout(opts?: UsernameResolveOptions): number | undefined {
    return opts?.timeout ?? serviceTimeout
  }

  function getTtl(opts?: UsernameResolveOptions): number {
    return opts?.cacheTtl ?? defaultCacheTtl
  }

  // ---------------------------------------------------------------------------
  // Core: getRecord (byName path)
  // ---------------------------------------------------------------------------
  async function getRecord(
    name: string,
    options?: UsernameResolveOptions
  ): Promise<UsernameRecord | undefined> {
    const key = normalizeName(name)

    if (!options?.skipCache) {
      const cached = cache.getByName(key)
      if (cached) return cached.record

      const pending = pendingByName.get(key)
      if (pending) {
        const result = await pending
        return result?.record
      }
    }

    const promise = fetchUsernameRecord(baseUrl, key, getTimeout(options))
      .then(result => {
        if (result) {
          const ttl = getTtl(options)
          if (ttl !== 0) {
            cache.setByName(result.record, result.metadata, ttl)
          }
        }
        return result
      })
      .finally(() => {
        if (pendingByName.get(key) === promise) {
          pendingByName.delete(key)
        }
      })

    pendingByName.set(key, promise)
    const result = await promise
    return result?.record
  }

  // ---------------------------------------------------------------------------
  // Core: getName (byAddress path)
  // ---------------------------------------------------------------------------
  async function getName(
    address: string,
    options?: UsernameResolveOptions
  ): Promise<string | undefined> {
    const key = normalizeAddress(address)

    if (!options?.skipCache) {
      const cached = cache.getPrimaryByAddress(key)
      if (cached) return getDisplayName(cached)

      const pending = pendingByAddress.get(key)
      if (pending) {
        const primary = await pending
        return primary ? getDisplayName(primary) : undefined
      }
    }

    const ttl = getTtl(options)
    const promise = fetchAddressToName(baseUrl, key, getTimeout(options))
      .then(primary => {
        if (primary !== null && ttl !== 0) {
          cache.setPrimaryByAddress(key, primary, ttl)
        }
        return primary
      })
      .finally(() => {
        if (pendingByAddress.get(key) === promise) {
          pendingByAddress.delete(key)
        }
      })

    pendingByAddress.set(key, promise)
    const primary = await promise
    return primary ? getDisplayName(primary) : undefined
  }

  // ---------------------------------------------------------------------------
  // Public API
  // ---------------------------------------------------------------------------
  return {
    network,
    baseUrl,

    async resolve(nameOrAddress: string, options?: UsernameResolveOptions): Promise<string> {
      const record = await getRecord(nameOrAddress, options)
      if (record) return formatAddress(record.address, options?.format)
      // Not a username — treat as address
      return nameOrAddress
    },

    async getAddress(name: string, options?: UsernameResolveOptions): Promise<string | undefined> {
      const record = await getRecord(name, options)
      if (!record) return undefined
      return formatAddress(record.address, options?.format)
    },

    getName,

    getRecord,

    async getMetadata(
      name: string,
      options?: UsernameResolveOptions
    ): Promise<UsernameMetadata | undefined> {
      const key = normalizeName(name)

      // Check cache first (metadata is stored alongside record)
      if (!options?.skipCache) {
        const cached = cache.getByName(key)
        if (cached?.metadata) return cached.metadata
      }

      // Fetch via getRecord (shares cache + deduplication)
      const record = await getRecord(name, options)
      if (!record) return undefined

      return cache.getByName(key)?.metadata
    },

    getImageUrl(name: string): string {
      const normalized = normalizeName(name)
      return `${baseUrl}/image/${normalized}`
    },

    async isAvailable(name: string): Promise<boolean> {
      const normalized = normalizeName(name)
      const address = await fetchNameToAddress(baseUrl, normalized, serviceTimeout)
      return address === null
    },

    getKnownNames(address: string): string[] {
      return cache.getKnownNames(address).map(getDisplayName)
    },

    invalidateCache(value: string): void {
      // Try both interpretations
      cache.invalidateByName(value)
      cache.invalidateByAddress(value)
    },

    clearCache(): void {
      cache.clear()
    },
  }
}

// =============================================================================
// Unsupported Chain Stub
// =============================================================================

const UNSUPPORTED_MSG = 'Username service is not supported on this chain/network'

/**
 * Create a stub UsernameService that throws on all operations.
 * Used for non-Initia chains or unsupported networks.
 */
export function createUnsupportedUsernameService(): UsernameService {
  const fail = (): never => {
    throw new UsernameServiceError(UNSUPPORTED_MSG)
  }

  return {
    network: 'mainnet', // placeholder, never used
    baseUrl: '',

    resolve: fail,
    getAddress: fail,
    getName: fail,
    getRecord: fail,
    getMetadata: fail,
    getImageUrl: fail,
    isAvailable: fail,
    getKnownNames: fail,
    invalidateCache: fail,
    clearCache: fail,
  }
}
