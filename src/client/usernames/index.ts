/**
 * Initia Usernames module.
 * Provides name↔address resolution with caching for .init domains.
 */

// Types
export type { UsernameRecord, UsernameMetadata, UsernameResolveOptions } from './types'
export { UsernameServiceError } from './types'

// Service
export type { UsernameService, UsernameServiceOptions } from './service'
export {
  createUsernameService,
  createUnsupportedUsernameService,
  getUsernamesApiUrl,
  isUsernameServiceSupported,
} from './service'

// Cache (exposed for custom cache injection)
export type { UsernameCache } from './cache'
export { createUsernameCache, CACHE_TTL } from './cache'

// Utils
export { normalizeName, getDisplayName, normalizeAddress, formatAddress } from './utils'
