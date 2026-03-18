/**
 * Utility functions for the Initia Usernames service.
 */

import { AccAddress } from '../../util/address'

/**
 * Normalize username for internal use and API calls.
 * Removes .init suffix and converts to lowercase.
 *
 * @example
 * normalizeName('Pseudo.INIT') // 'pseudo'
 * normalizeName('pseudo')      // 'pseudo'
 */
export function normalizeName(name: string): string {
  return name.toLowerCase().replace(/\.init$/, '')
}

/**
 * Create display name with .init suffix.
 *
 * @example
 * getDisplayName('pseudo') // 'pseudo.init'
 */
export function getDisplayName(name: string): string {
  return `${name}.init`
}

/**
 * Normalize address to lowercase hex for use as cache key.
 * Accepts both bech32 (init1...) and hex (0x...) formats.
 *
 * @example
 * normalizeAddress('init1q6dd...')  // '0x69ad...'
 * normalizeAddress('0x69AD...')    // '0x69ad...'
 */
export function normalizeAddress(address: string): string {
  if (AccAddress.isValidBech32(address)) {
    return AccAddress.toHex(address).toLowerCase()
  }
  return address.toLowerCase()
}

/**
 * Format hex address for output.
 *
 * @example
 * formatAddress('0x69ad...', 'hex')    // '0x69ad...'
 * formatAddress('0x69ad...', 'bech32') // 'init1q6dd...'
 */
export function formatAddress(hex: string, format: 'hex' | 'bech32' = 'hex'): string {
  if (format === 'bech32') {
    return AccAddress.fromHex(hex)
  }
  return hex
}
