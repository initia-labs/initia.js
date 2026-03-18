/**
 * LRU cache for the Initia Usernames service.
 * Uses tiny-lru for LRU eviction with manual per-entry expiration tracking.
 */

import { lru, type LRU } from 'tiny-lru'
import type { UsernameRecord, UsernameMetadata } from './types'
import { normalizeName, normalizeAddress } from './utils'

// =============================================================================
// Cache Entry Types
// =============================================================================

/** byName cache entry: actual data storage with expiration */
interface ByNameInternal {
  record: UsernameRecord
  metadata?: UsernameMetadata
  expiresAt: number
}

/** byAddress cache entry: primary + references to byName entries */
interface ByAddressInternal {
  /** Primary username, null if not yet queried via getName */
  primary: string | null
  /** Names discovered through byName queries (references only) */
  knownNames: Set<string>
  expiresAt: number
}

/** Public byName entry (returned to callers) */
export interface ByNameEntry {
  record: UsernameRecord
  metadata?: UsernameMetadata
}

/** Public byAddress entry */
export interface ByAddressEntry {
  primary: string | null
  knownNames: Set<string>
}

// =============================================================================
// Cache Interface
// =============================================================================

export interface UsernameCache {
  getByName(name: string): ByNameEntry | undefined
  getPrimaryByAddress(address: string): string | null | undefined
  getKnownNames(address: string): string[]
  setByName(record: UsernameRecord, metadata?: UsernameMetadata, ttl?: number): void
  setPrimaryByAddress(address: string, primary: string | null, ttl?: number): void
  invalidateByName(name: string): void
  invalidateByAddress(address: string): void
  clear(): void
}

// =============================================================================
// TTL
// =============================================================================

export const CACHE_TTL = {
  /** Default TTL for both byName and byAddress (60s) */
  DEFAULT: 60_000,
} as const

/**
 * Calculate effective TTL considering username expiration.
 * Returns the earlier of: defaultTtl or time until expiration.
 * Returns 0 if already expired (caller should not cache).
 */
export function calculateEffectiveTtl(defaultTtl: number, expiresAt: number | undefined): number {
  if (!expiresAt) return defaultTtl

  const timeUntilExpiry = expiresAt - Date.now()

  // Already expired
  if (timeUntilExpiry <= 0) return 0

  return Math.min(defaultTtl, timeUntilExpiry)
}

// =============================================================================
// Factory
// =============================================================================

export function createUsernameCache(options?: { maxSize?: number }): UsernameCache {
  const maxSize = options?.maxSize ?? 256
  const byName: LRU<ByNameInternal> = lru(maxSize)
  const byAddress: LRU<ByAddressInternal> = lru(maxSize)

  function isExpired(expiresAt: number): boolean {
    return Date.now() >= expiresAt
  }

  return {
    getByName(name: string): ByNameEntry | undefined {
      const key = normalizeName(name)
      const entry = byName.get(key)
      if (!entry) return undefined
      if (isExpired(entry.expiresAt)) {
        byName.delete(key)
        return undefined
      }
      return { record: entry.record, metadata: entry.metadata }
    },

    getPrimaryByAddress(address: string): string | null | undefined {
      const key = normalizeAddress(address)
      const entry = byAddress.get(key)
      if (!entry) return undefined
      if (isExpired(entry.expiresAt)) {
        byAddress.delete(key)
        return undefined
      }
      return entry.primary
    },

    getKnownNames(address: string): string[] {
      const key = normalizeAddress(address)
      const entry = byAddress.get(key)
      if (!entry) return []
      if (isExpired(entry.expiresAt)) {
        byAddress.delete(key)
        return []
      }

      const valid: string[] = []
      for (const name of entry.knownNames) {
        const byNameEntry = byName.get(name)
        // Validate: byName exists, not expired, and address matches
        if (
          byNameEntry &&
          !isExpired(byNameEntry.expiresAt) &&
          normalizeAddress(byNameEntry.record.address) === key
        ) {
          valid.push(name)
        } else {
          // Lazy cleanup: remove stale reference
          entry.knownNames.delete(name)
        }
      }
      return valid
    },

    setByName(record: UsernameRecord, metadata?: UsernameMetadata, ttl?: number): void {
      const nameKey = normalizeName(record.name)
      const addrKey = normalizeAddress(record.address)

      const baseTtl = ttl ?? CACHE_TTL.DEFAULT
      const effectiveTtl = calculateEffectiveTtl(baseTtl, record.expiresAt)

      // Already expired — don't cache
      if (effectiveTtl <= 0) return

      const expiresAt = Date.now() + effectiveTtl
      byName.set(nameKey, { record, metadata, expiresAt })

      // Add reference in byAddress.knownNames
      let addrEntry = byAddress.get(addrKey)
      if (!addrEntry) {
        addrEntry = { primary: null, knownNames: new Set(), expiresAt }
        addrEntry.knownNames.add(nameKey)
        byAddress.set(addrKey, addrEntry)
      } else {
        // Existing entry: only add to knownNames (don't reset TTL)
        addrEntry.knownNames.add(nameKey)
      }
    },

    setPrimaryByAddress(address: string, primary: string | null, ttl?: number): void {
      const key = normalizeAddress(address)
      const effectiveTtl = ttl ?? CACHE_TTL.DEFAULT
      const expiresAt = Date.now() + effectiveTtl
      let entry = byAddress.get(key)
      if (!entry) {
        entry = { primary: null, knownNames: new Set(), expiresAt }
      }
      entry.primary = primary
      entry.expiresAt = expiresAt
      byAddress.set(key, entry)
    },

    invalidateByName(name: string): void {
      const key = normalizeName(name)
      const entry = byName.get(key)
      if (entry) {
        const addrKey = normalizeAddress(entry.record.address)
        const addrEntry = byAddress.get(addrKey)
        if (addrEntry) {
          addrEntry.knownNames.delete(key)
        }
        byName.delete(key)
      }
    },

    invalidateByAddress(address: string): void {
      const key = normalizeAddress(address)
      const entry = byAddress.get(key)
      if (entry) {
        for (const name of entry.knownNames) {
          byName.delete(name)
        }
        byAddress.delete(key)
      }
    },

    clear(): void {
      byName.clear()
      byAddress.clear()
    },
  }
}
