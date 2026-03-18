/**
 * Shared constants for initia.js SDK.
 *
 * This file contains magic numbers and default values used across
 * multiple modules to ensure consistency and easy maintenance.
 */

// =============================================================================
// Gas Defaults
// =============================================================================

/**
 * Default gas limit for transactions.
 * Used when no explicit gas limit is provided.
 */
export const DEFAULT_GAS_LIMIT = 200000n

// =============================================================================
// Timeout Defaults (in milliseconds)
// =============================================================================

/**
 * Default timeout for gRPC/HTTP requests.
 * Used by EVM RPC and other non-gRPC network operations.
 */
export const DEFAULT_REQUEST_TIMEOUT_MS = 30000

/**
 * Default timeout for gRPC transport requests.
 */
export const DEFAULT_GRPC_TIMEOUT_MS = 10000

/**
 * Default timeout for waitForTx operations.
 */
export const DEFAULT_TX_TIMEOUT_MS = 30000

/**
 * Default timeout for waitForEvent operations.
 * Longer than TX timeout since events may take more time.
 */
export const DEFAULT_EVENT_TIMEOUT_MS = 60000

/**
 * Default poll interval for polling-based waiting operations.
 */
export const DEFAULT_POLL_INTERVAL_MS = 1000

/**
 * Default timeout for registry provider requests.
 */
export const DEFAULT_REGISTRY_TIMEOUT_MS = 10000

// =============================================================================
// Cache Defaults
// =============================================================================

/**
 * Default cache TTL for address profiles and other cacheable data.
 */
export const DEFAULT_CACHE_TTL_MS = 60000

/**
 * Default cache size (number of entries) for LRU caches.
 */
export const DEFAULT_CACHE_SIZE = 500
