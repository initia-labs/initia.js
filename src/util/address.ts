/**
 * Bech32 address utilities for Initia blockchain.
 *
 * Provides type definitions and conversion utilities for all Initia address types:
 * - AccAddress: Account addresses (init1...)
 * - ValAddress: Validator operator addresses (initvaloper1...)
 * - ValConsAddress: Validator consensus addresses (initvalcons1...)
 * - AccPubKey: Account public keys (initpub1...)
 * - ValPubKey: Validator public keys (initvaloperpub1...)
 */

import { bech32 } from '@scure/base'
import { bytesToHex, hexToBytes } from '@noble/hashes/utils.js'
import { keccak_256 } from '@noble/hashes/sha3.js'

import type { ChainInfo } from '../provider/types'

/** Bech32 string type (contains '1' separator) */
type Bech32String = `${string}1${string}`

/** `init1...` prefixed account address */
export type AccAddress = string

/** `initvaloper1...` prefixed validator operator address */
export type ValAddress = string

/** `initvalcons1...` prefixed validator consensus address */
export type ValConsAddress = string

/** `initpub1...` prefixed account public key */
export type AccPubKey = string

/** `initvaloperpub1...` prefixed validator public key */
export type ValPubKey = string

/**
 * Options for converting hex address to bech32.
 */
export interface FromHexOptions {
  /** Direct prefix override (highest priority) */
  prefix?: string
  /** Extract prefix from ChainInfo (used if prefix not specified) */
  chainInfo?: Pick<ChainInfo, 'bech32Prefix' | 'chainType'>
}

// =============================================================================
// Bech32 Helpers (centralized type assertion)
// =============================================================================

/**
 * Decode a bech32 address with runtime validation.
 * Centralizes the Bech32String type assertion to a single location.
 *
 * @param address - Address string to decode
 * @returns Decoded prefix and words
 * @throws Error if not a valid bech32 string
 */
function decodeBech32(address: string): { prefix: string; words: number[] } {
  // Runtime validation: bech32 requires '1' separator
  if (!address.includes('1')) {
    throw new Error(`Invalid bech32 format: missing separator in "${address}"`)
  }
  return bech32.decode(address as Bech32String)
}

/**
 * Try to decode a bech32 address, returning null on failure.
 */
export function tryDecodeBech32(address: string): { prefix: string; words: number[] } | null {
  try {
    if (!address.includes('1')) return null
    return bech32.decode(address as Bech32String)
  } catch {
    return null
  }
}

function checkPrefixAndLength(prefix: string, data: string, length: number): boolean {
  const decoded = tryDecodeBech32(data)
  return decoded !== null && decoded.prefix === prefix && data.length === length
}

/**
 * Account address utilities.
 */
export const AccAddress = {
  /**
   * Validates if a string is a valid Initia account address.
   * Accepts both 20-byte (43 chars) and 32-byte Move addresses (63 chars).
   */
  validate(data: string): boolean {
    return checkPrefixAndLength('init', data, 43) || checkPrefixAndLength('init', data, 63)
  },

  /**
   * Converts a validator address to an account address.
   */
  fromValAddress(valAddr: ValAddress): AccAddress {
    const decoded = decodeBech32(valAddr)
    return bech32.encode('init', decoded.words)
  },

  /**
   * Converts an account address to a hex string (0x prefixed).
   */
  toHex(address: AccAddress): string {
    const decoded = decodeBech32(address)
    const bytes = bech32.fromWords(decoded.words)
    return '0x' + bytesToHex(new Uint8Array(bytes))
  },

  /**
   * Converts a hex address to a bech32 address.
   * Handles both 20-byte and 32-byte addresses.
   *
   * @param hexAddress - Hex address (with or without 0x prefix)
   * @param options - Optional prefix configuration
   * @returns Bech32 encoded address
   *
   * @example
   * ```typescript
   * // Default (init prefix)
   * AccAddress.fromHex('0x1234...')  // 'init1...'
   *
   * // Custom prefix
   * AccAddress.fromHex('0x1234...', { prefix: 'noble' })  // 'noble1...'
   *
   * // From ChainInfo
   * AccAddress.fromHex('0x1234...', { chainInfo })  // uses chainInfo.bech32Prefix
   * ```
   */
  fromHex(hexAddress: string, options?: FromHexOptions): string {
    // Determine prefix: options.prefix > chainInfo.bech32Prefix > 'init'
    const prefix = options?.prefix ?? options?.chainInfo?.bech32Prefix ?? 'init'

    const hex = hexAddress.replace(/^0x0*|^0+/, '')
    const paddedHex = hex.length <= 40 ? hex.padStart(40, '0') : hex.padStart(64, '0')
    const bytes = hexToBytes(paddedHex)
    return bech32.encode(prefix, bech32.toWords(bytes))
  },

  /**
   * Converts an account address to raw bytes.
   */
  toBytes(address: AccAddress): Uint8Array {
    const decoded = decodeBech32(address)
    return new Uint8Array(bech32.fromWords(decoded.words))
  },

  /**
   * Validates if a string is a valid bech32 address with optional prefix check.
   *
   * @param address - Address to validate
   * @param prefix - Expected prefix (defaults to 'init')
   * @returns true if valid bech32 address with matching prefix
   *
   * @example
   * ```typescript
   * AccAddress.isValidBech32('init1...')           // true
   * AccAddress.isValidBech32('noble1...', 'noble') // true
   * AccAddress.isValidBech32('noble1...', 'init')  // false (prefix mismatch)
   * ```
   */
  isValidBech32(address: string, prefix: string = 'init'): boolean {
    const decoded = tryDecodeBech32(address)
    return decoded !== null && decoded.prefix === prefix
  },
}

/**
 * Account public key utilities.
 */
export const AccPubKey = {
  /**
   * Validates if a string is a valid Initia account public key.
   */
  validate(data: string): boolean {
    return checkPrefixAndLength('initpub', data, 46)
  },

  /**
   * Converts an account address to an account public key format.
   */
  fromAccAddress(address: AccAddress): AccPubKey {
    const decoded = decodeBech32(address)
    return bech32.encode('initpub', decoded.words)
  },
}

/**
 * Validator operator address utilities.
 */
export const ValAddress = {
  /**
   * Validates if a string is a valid Initia validator address.
   */
  validate(data: string): boolean {
    return checkPrefixAndLength('initvaloper', data, 50)
  },

  /**
   * Converts an account address to a validator address.
   */
  fromAccAddress(accAddr: AccAddress): ValAddress {
    const decoded = decodeBech32(accAddr)
    return bech32.encode('initvaloper', decoded.words)
  },
}

/**
 * Validator public key utilities.
 */
export const ValPubKey = {
  /**
   * Validates if a string is a valid Initia validator public key.
   */
  validate(data: string): boolean {
    return checkPrefixAndLength('initvaloperpub', data, 53)
  },

  /**
   * Converts a validator address to a validator public key format.
   */
  fromValAddress(valAddress: ValAddress): ValPubKey {
    const decoded = decodeBech32(valAddress)
    return bech32.encode('initvaloperpub', decoded.words)
  },
}

/**
 * Validator consensus address utilities.
 */
export const ValConsAddress = {
  /**
   * Validates if a string is a valid Initia validator consensus address.
   */
  validate(data: string): boolean {
    return checkPrefixAndLength('initvalcons', data, 50)
  },
}

// =============================================================================
// EVM Address Utilities
// =============================================================================

/**
 * Validates if a string is a valid EVM address (0x-prefixed, 40 hex chars).
 *
 * @param address - Address to validate
 * @returns true if valid EVM address format
 *
 * @example
 * ```typescript
 * isValidEvmAddress('0x1234567890123456789012345678901234567890')  // true
 * isValidEvmAddress('0x123')  // false (too short)
 * isValidEvmAddress('init1...')  // false (not EVM format)
 * ```
 */
export function isValidEvmAddress(address: string): boolean {
  return /^0x[0-9a-fA-F]{40}$/.test(address)
}

/**
 * Converts an EVM address to EIP-55 checksum format.
 *
 * @param address - EVM address to convert
 * @returns Checksum-formatted address
 * @throws Error if address is invalid
 *
 * @example
 * ```typescript
 * toChecksumAddress('0x5aaeb6053f3e94c9b9a09f33669435e7ef1beaed')
 * // '0x5aAeb6053F3E94C9b9A09f33669435E7Ef1BeAed'
 * ```
 */
export function toChecksumAddress(address: string): string {
  const lower = address.toLowerCase()
  if (!/^0x[0-9a-f]{40}$/.test(lower)) {
    throw new Error(`Invalid EVM address: ${address}`)
  }
  const body = lower.slice(2)
  const hash = bytesToHex(keccak_256(new TextEncoder().encode(body)))
  let result = '0x'
  for (let i = 0; i < 40; i++) {
    result += parseInt(hash[i], 16) >= 8 ? body[i].toUpperCase() : body[i]
  }
  return result
}
