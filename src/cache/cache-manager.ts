// src/cache/cache-manager.ts
//
// In-memory LRU cache for immutable/quasi-immutable gRPC results.
// Evicts on restart — no persistence layer needed.
//
// Cache target selection criteria (bounded & immutable only):
//
//   Cached (immutable after deploy, bounded by usage):
//     - Move Module ABI        (chainId, addr, module)  → ~500KB for 100 modules
//     - Denom ↔ EVM Contract   (chainId, denom/addr)    → ~10KB
//     - Height-scoped queries  (any method + height)    → immutable snapshot
//
//   NOT cached (mutable or unbounded):
//     - Account sequence, balances  → change every block
//     - TX history, IBC history     → unbounded growth (indexer territory)
//     - Chain registry / endpoints  → must be fresh (stale = connection failure)
//
//   Future candidates (if demand arises):
//     - Asset metadata     (chainId, denom) → symbol, decimals, logo  (~100KB)
//     - EVM Contract ABI   (chainId, addr)  → verified ABI            (~300KB)
//     - Address Profile    (chainId, addr)  → name, avatar            (~30KB)
//
import { lru } from 'tiny-lru'

const DEFAULT_MAX_SIZE = 64
const MOVE_ABI_TTL = 60_000 // 1 minute

export function createCacheManager() {
  return {
    moveAbi: lru<unknown>(DEFAULT_MAX_SIZE),
    /** TTL-based cache for upgradeable Move module ABIs (COMPATIBLE upgrade policy) */
    moveAbiTtl: lru<unknown>(DEFAULT_MAX_SIZE, MOVE_ABI_TTL),
    denomToContract: lru<unknown>(DEFAULT_MAX_SIZE),
    contractToDenom: lru<unknown>(DEFAULT_MAX_SIZE),
    /** General-purpose cache for height-scoped (immutable snapshot) queries */
    heightCache: lru<unknown>(DEFAULT_MAX_SIZE),
  }
}

export type CacheManager = ReturnType<typeof createCacheManager>
