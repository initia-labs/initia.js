/**
 * Type definitions for the Initia Usernames service.
 *
 * Note: HasUsernames and UsernamesSupportedNetwork are defined in
 * src/client/types.ts to avoid circular references.
 */

/**
 * Cached username record with expiration info.
 */
export interface UsernameRecord {
  /** Normalized name without .init suffix (e.g., "pseudo") */
  name: string
  /** Hex address from API (e.g., "0x69ad...") */
  address: string
  /** Expiration timestamp in milliseconds (API returns seconds, converted) */
  expiresAt: number
}

/**
 * NFT metadata response (OpenSea standard).
 */
export interface UsernameMetadata {
  name: string
  description: string
  image: string
  image_data: string
  attributes: Array<{
    display_type?: string
    trait_type: string
    value: string | number
  }>
}

/**
 * Options for username resolve operations.
 */
export interface UsernameResolveOptions {
  /**
   * Skip cache and force fresh API call.
   * - Skips cache lookup
   * - Ignores pending (deduplicated) requests
   * - Result is still cached (unless cacheTtl is 0)
   * @default false
   */
  skipCache?: boolean

  /**
   * Cache TTL in ms for this request.
   * Priority: cacheTtl > service.defaultCacheTtl > 60000 (1min)
   * Set to 0 to skip caching the result.
   */
  cacheTtl?: number

  /**
   * Request timeout in ms.
   * @default 10000
   */
  timeout?: number

  /**
   * Address output format.
   * - 'hex': 0x format (default, raw API response)
   * - 'bech32': init1... format
   * @default 'hex'
   */
  format?: 'hex' | 'bech32'
}

/**
 * Error thrown for network issues, timeouts, and server errors.
 * NOT thrown for "not found" — those return undefined.
 */
export class UsernameServiceError extends Error {
  constructor(
    message: string,
    public readonly cause?: Error
  ) {
    super(message)
    this.name = 'UsernameServiceError'
  }
}
