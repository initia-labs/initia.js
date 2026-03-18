/**
 * Client wrapper that adds caching to gRPC methods.
 *
 * Two cache strategies:
 *
 * 1. **Immutable cache**: move.module(), evm.contractAddrByDenom(), evm.denom()
 *    - Specialized keys with address normalization
 *    - Always cached regardless of height (data never changes)
 *
 * 2. **Height cache**: any method when QueryOptions.height is specified
 *    - Generic keys: chainId:serviceName.methodName:requestHash:hHeight
 *    - Only activates when height is provided (immutable historical snapshot)
 *    - Without height, passes through to gRPC (mutable current state)
 *
 * Both include request deduplication (concurrent identical requests share one gRPC call).
 *
 * **Important**: Cached responses are shared references. All callers receiving
 * a cache hit get the same object. Do not mutate cached responses — treat them
 * as immutable, consistent with protobuf-es convention.
 *
 * ## Request Deduplication Flow
 *
 * ```
 * request(key)
 *     |
 *     v
 * +-------------+    hit     +----------------+
 * | Check Cache |----------->| Return Cached  |
 * +------+------+            +----------------+
 *        | miss
 *        v
 * +-----------------+  in-flight  +---------------------+
 * | Check Pending   |------------>| Wait & Return Same  |
 * | (deduplication) |             | Promise             |
 * +-------+---------+             +---------------------+
 *         | not pending
 *         v
 * +-----------------+
 * | Store Promise   |
 * | in Pending Map  |
 * +-------+---------+
 *         |
 *         v
 * +-----------------+
 * | Make gRPC Call  |
 * +-------+---------+
 *         |
 *         v
 * +---------------------+
 * | On Settle:          |
 * | - Success: Cache    |
 * |   result (.then)    |
 * | - Always: Clear     |
 * |   pending (.finally)|
 * +---------------------+
 * ```
 */

import type { Client as ServiceClient } from '@connectrpc/connect'
import type { Query as MoveQuery } from '@buf/initia-labs_initia.bufbuild_es/initia/move/v1/query_pb'
import type { Query as EvmQuery } from '@buf/initia-labs_minievm.bufbuild_es/minievm/evm/v1/query_pb'
import { createCacheManager, type CacheManager } from '../cache'
import {
  cacheKeys,
  pendingKeys,
  normalizeMoveAddress,
  normalizeEvmAddress,
  buildCacheKey,
  hashRequestJson,
} from '../cache/keys'
import type { QueryOptions } from './types'

// =============================================================================
// Types
// =============================================================================

type MoveServiceClient = ServiceClient<typeof MoveQuery>
type EvmServiceClient = ServiceClient<typeof EvmQuery>
type GrpcMethod = (request: unknown, options?: QueryOptions) => Promise<unknown>

/** Client with cache management */
export interface CachedClient {
  /**
   * Clear all cached data.
   * Useful when switching chains or after state-changing transactions.
   */
  clearCache(): void
}

// =============================================================================
// Height Cache Helper
// =============================================================================

/**
 * Wrap a method with height-based caching.
 *
 * Only caches when QueryOptions.height is provided (immutable historical snapshot).
 * Without height, passes through to the original method with no overhead.
 */
function withHeightCache(
  serviceName: string,
  methodName: string,
  original: GrpcMethod,
  cache: CacheManager,
  pending: Map<string, Promise<unknown>>,
  chainId: string
): (request: unknown, options?: QueryOptions) => Promise<unknown> {
  return async (request: unknown, options?: QueryOptions) => {
    const height = options?.height
    if (height === undefined) {
      return original(request, options)
    }

    const requestHash = hashRequestJson(request)
    const cacheKey = `${chainId}:${buildCacheKey(serviceName, methodName, requestHash, height)}`

    // 1. Check cache (unless skipCache)
    if (!options?.skipCache) {
      const cached = cache.heightCache.get(cacheKey)
      if (cached !== undefined) return cached
    }

    // 2. Check inflight (dedup)
    const pendingKey = `h:${cacheKey}`
    const inflight = pending.get(pendingKey)
    if (inflight) return inflight

    // 3. Fetch and cache
    const promise = original(request, options)
      .then(result => {
        cache.heightCache.set(cacheKey, result)
        return result
      })
      .finally(() => {
        pending.delete(pendingKey)
      })

    pending.set(pendingKey, promise)
    return promise
  }
}

// =============================================================================
// Generic Service Wrapper (height cache only)
// =============================================================================

/**
 * Wrap all methods of a service with height-based caching.
 *
 * Used for services without specialized immutable caching (e.g., bank, auth, gov).
 */
function createHeightCachedService(
  serviceName: string,
  service: unknown,
  cache: CacheManager,
  pending: Map<string, Promise<unknown>>,
  chainId: string
): unknown {
  return new Proxy(service as Record<string, unknown>, {
    get(target, prop, receiver) {
      // eslint-disable-next-line @typescript-eslint/no-unsafe-return
      if (typeof prop !== 'string') return Reflect.get(target, prop, receiver)

      const original = target[prop]
      if (typeof original !== 'function') return original

      return withHeightCache(serviceName, prop, original as GrpcMethod, cache, pending, chainId)
    },
  })
}

// =============================================================================
// Move Service Wrapper
// =============================================================================

/**
 * Wrap move service with:
 * - Immutable cache for module() (Move ABI never changes after deploy)
 * - Height cache for all other methods
 */
function createCachedMoveService(
  moveService: MoveServiceClient,
  cache: CacheManager,
  pending: Map<string, Promise<unknown>>,
  chainId: string
): MoveServiceClient {
  const originalModule = moveService.module.bind(moveService)

  return new Proxy(moveService, {
    get(target, prop) {
      if (prop === 'module') {
        return async (request: { address: string; moduleName: string }, options?: QueryOptions) => {
          const normalizedAddr = normalizeMoveAddress(request.address)
          const key = cacheKeys.moveAbi(chainId, normalizedAddr, request.moduleName)
          const pKey = pendingKeys.moveAbi(chainId, normalizedAddr, request.moduleName)

          // 1. Check cache (unless skipCache)
          if (!options?.skipCache) {
            const cached = cache.moveAbi.get(key)
            if (cached !== undefined) {
              return cached
            }
          }

          // 2. Check inflight request (deduplication)
          const inflight = pending.get(pKey)
          if (inflight) {
            return inflight
          }

          // 3. Fetch with deduplication
          const promise = originalModule(request, options)
            .then(result => {
              // Cache the result object directly (no JSON serialization)
              cache.moveAbi.set(key, result)
              return result
            })
            .finally(() => {
              pending.delete(pKey)
            })

          pending.set(pKey, promise)
          return promise
        }
      }

      // Height cache for all other move methods
      const original: unknown = Reflect.get(target, prop)
      if (typeof prop === 'string' && typeof original === 'function') {
        return withHeightCache('move', prop, original as GrpcMethod, cache, pending, chainId)
      }

      return original as MoveServiceClient[keyof MoveServiceClient]
    },
  })
}

// =============================================================================
// EVM Service Wrapper
// =============================================================================

/**
 * Wrap evm service with:
 * - Immutable cache for contractAddrByDenom() and denom() (each caches own direction only)
 * - Height cache for all other methods
 */
function createCachedEvmService(
  evmService: EvmServiceClient,
  cache: CacheManager,
  pending: Map<string, Promise<unknown>>,
  chainId: string
): EvmServiceClient {
  const originalContractAddrByDenom = evmService.contractAddrByDenom.bind(evmService)
  const originalDenom = evmService.denom.bind(evmService)

  return new Proxy(evmService, {
    get(target, prop) {
      if (prop === 'contractAddrByDenom') {
        return async (request: { denom: string }, options?: QueryOptions) => {
          const key = cacheKeys.denomToContract(chainId, request.denom)
          const pKey = pendingKeys.denomMapping(chainId, request.denom)

          // 1. Check cache — return full wrapped response
          if (!options?.skipCache) {
            const cached = cache.denomToContract.get(key)
            if (cached !== undefined) return cached
          }

          // 2. Check inflight
          const inflight = pending.get(pKey)
          if (inflight) return inflight

          // 3. Fetch with deduplication
          const promise = originalContractAddrByDenom(request, options)
            .then(result => {
              const normalizedAddr = normalizeEvmAddress(result.address)
              // Mutate before caching — runs inside .then() before the resolved value
              // is delivered to any caller. Spread would break the WrappedResponse Proxy.
              // eslint-disable-next-line @typescript-eslint/no-explicit-any, @typescript-eslint/no-unsafe-member-access
              ;(result as any).address = normalizedAddr
              // Cache own direction only (no bidirectional pre-population)
              cache.denomToContract.set(key, result)
              return result
            })
            .finally(() => {
              pending.delete(pKey)
            })

          pending.set(pKey, promise)
          return promise
        }
      }

      if (prop === 'denom') {
        return async (request: { contractAddr: string }, options?: QueryOptions) => {
          const normalizedAddr = normalizeEvmAddress(request.contractAddr)
          const key = cacheKeys.contractToDenom(chainId, normalizedAddr)
          const pKey = pendingKeys.denomMapping(chainId, normalizedAddr)

          // 1. Check cache — return full wrapped response
          if (!options?.skipCache) {
            const cached = cache.contractToDenom.get(key)
            if (cached !== undefined) return cached
          }

          // 2. Check inflight
          const inflight = pending.get(pKey)
          if (inflight) return inflight

          // 3. Fetch with deduplication
          const promise = originalDenom(request, options)
            .then(result => {
              // Cache own direction only (no bidirectional pre-population)
              cache.contractToDenom.set(key, result)
              return result
            })
            .finally(() => {
              pending.delete(pKey)
            })

          pending.set(pKey, promise)
          return promise
        }
      }

      // Height cache for all other evm methods
      const original: unknown = Reflect.get(target, prop)
      if (typeof prop === 'string' && typeof original === 'function') {
        return withHeightCache('evm', prop, original as GrpcMethod, cache, pending, chainId)
      }

      return original as EvmServiceClient[keyof EvmServiceClient]
    },
  })
}

// =============================================================================
// Cache Wrapper
// =============================================================================

/**
 * Wraps a client with caching for gRPC methods.
 *
 * - **Immutable methods** (move.module, evm.contractAddrByDenom, evm.denom):
 *   Specialized LRU cache with address normalization, always cached.
 *
 * - **All other methods with height**: General LRU cache keyed by
 *   `chainId:service.method:requestHash:hHeight`. Only activates when
 *   `QueryOptions.height` is provided (immutable historical snapshot).
 *
 * - **All other methods without height**: No caching (mutable current state).
 *
 * @param client - Raw gRPC client
 * @param chainId - Chain ID for cache key namespacing
 * @returns Client with caching enabled and clearCache() method
 */
export function wrapClientWithCache<T extends Record<string, unknown>>(
  client: T,
  chainId: string
): T & CachedClient {
  const cache = createCacheManager()
  const pending = new Map<string, Promise<unknown>>()
  const cachedServices = new Map<string, unknown>()

  /**
   * Clear all caches and pending requests.
   */
  function clearCache(): void {
    cache.moveAbi.clear()
    cache.denomToContract.clear()
    cache.contractToDenom.clear()
    cache.heightCache.clear()
    pending.clear()
    cachedServices.clear()
  }

  // Wrap client in a Proxy to intercept service access
  return new Proxy(client, {
    get(target, prop) {
      // Expose clearCache method
      if (prop === 'clearCache') {
        return clearCache
      }

      if (typeof prop !== 'string') return Reflect.get(target, prop)

      // Check if target has this service
      const service = Reflect.get(target, prop)
      if (service === undefined) return undefined

      // Lazily create and cache service wrappers
      if (!cachedServices.has(prop)) {
        if (prop === 'move') {
          cachedServices.set(
            prop,
            createCachedMoveService(service as MoveServiceClient, cache, pending, chainId)
          )
        } else if (prop === 'evm') {
          cachedServices.set(
            prop,
            createCachedEvmService(service as EvmServiceClient, cache, pending, chainId)
          )
        } else if (typeof service === 'object' && service !== null) {
          // Generic service: height cache only
          cachedServices.set(
            prop,
            createHeightCachedService(prop, service, cache, pending, chainId)
          )
        } else {
          return service
        }
      }

      return cachedServices.get(prop)
    },

    has(target, prop) {
      if (prop === 'clearCache') return true
      return Reflect.has(target, prop)
    },

    ownKeys(target) {
      return [...Reflect.ownKeys(target), 'clearCache']
    },

    getOwnPropertyDescriptor(target, prop) {
      if (prop === 'clearCache') {
        return {
          configurable: true,
          enumerable: true,
          value: clearCache,
          writable: false,
        }
      }
      return Reflect.getOwnPropertyDescriptor(target, prop)
    },
  }) as T & CachedClient
}
