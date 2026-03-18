/**
 * Move BCS (Binary Canonical Serialization) Utilities
 *
 * Provides BCS encoding/decoding for Move function arguments and results.
 * Based on @mysten/bcs with Initia-specific type extensions.
 */

import { bcs as mystenBcs, type BcsType, type BcsTypeOptions } from '@mysten/bcs'
import { AccAddress } from '../../util/address'

// =============================================================================
// Initia-Specific BCS Types
// =============================================================================

/**
 * Creates a BCS type for Move addresses (32 bytes).
 * Accepts hex strings (0x...) or bech32 addresses (init1...).
 */
const initiaAddress = (options?: BcsTypeOptions<Uint8Array, Iterable<number>>) =>
  mystenBcs.bytes(32, options).transform({
    input: (val: string) => {
      // Convert bech32 to hex if needed (any prefix: init1, noble1, cosmos1, ...)
      if (!val.startsWith('0x')) {
        try {
          val = AccAddress.toHex(val)
        } catch {
          // Not bech32 — assume bare hex, validated below
        }
      }

      // Remove 0x prefix and pad to 64 hex chars (32 bytes)
      if (val.startsWith('0x')) {
        val = val.slice(2)
      }
      val = val.padStart(64, '0')

      if (!/^[0-9a-fA-F]+$/.test(val)) {
        throw new Error(`Invalid Move address: ${val}`)
      }

      // Convert hex to bytes
      const bytes = new Uint8Array(32)
      for (let i = 0; i < 32; i++) {
        bytes[i] = parseInt(val.slice(i * 2, i * 2 + 2), 16)
      }
      return bytes
    },
    output: val => {
      const hex = Array.from<number>(val)
        .map(b => b.toString(16).padStart(2, '0'))
        .join('')
      return '0x' + hex
    },
  })

/**
 * Creates a BCS type for fixed_point32 (u64 with 32-bit fractional).
 */
const fixedPoint32 = (options?: BcsTypeOptions<string, string | number | bigint>) =>
  mystenBcs.u64(options).transform({
    input: (val: number | string) => {
      const n = BigInt(Math.floor(Number(val) * 4294967296))
      return n.toString()
    },
    output: val => {
      return (Number(val) / 4294967296).toString()
    },
  })

/**
 * Creates a BCS type for fixed_point64 (u128 with 64-bit fractional).
 */
const fixedPoint64 = (options?: BcsTypeOptions<string, string | number | bigint>) =>
  mystenBcs.u128(options).transform({
    input: (val: number | string) => {
      // Use BigInt for precision
      const wholePart = BigInt(Math.floor(Number(val)))
      const fracPart = BigInt(Math.floor((Number(val) - Math.floor(Number(val))) * 1e18))
      const multiplier = BigInt('18446744073709551616') // 2^64
      return (wholePart * multiplier + (fracPart * multiplier) / BigInt(1e18)).toString()
    },
    output: val => {
      const n = BigInt(val)
      const multiplier = BigInt('18446744073709551616')
      const whole = n / multiplier
      const frac = Number(n % multiplier) / Number(multiplier)
      return (Number(whole) + frac).toString()
    },
  })

/**
 * Creates a BCS type for decimal128 (u128 with 18 decimal places).
 */
const decimal128 = (options?: BcsTypeOptions<string, string | number | bigint>) =>
  mystenBcs.u128(options).transform({
    input: (val: number | string) => {
      const multiplier = BigInt('1000000000000000000') // 10^18
      const parts = String(val).split('.')
      const wholePart = BigInt(parts[0] || '0')
      let fracPart = BigInt(0)
      if (parts[1]) {
        const fracStr = parts[1].padEnd(18, '0').slice(0, 18)
        fracPart = BigInt(fracStr)
      }
      return (wholePart * multiplier + fracPart).toString()
    },
    output: val => {
      const multiplier = BigInt('1000000000000000000')
      const n = BigInt(val)
      const whole = n / multiplier
      const frac = n % multiplier
      if (frac === BigInt(0)) {
        return whole.toString()
      }
      const fracStr = frac.toString().padStart(18, '0').replace(/0+$/, '')
      return `${whole}.${fracStr}`
    },
  })

/**
 * Creates a BCS type for decimal256 (u256 with 18 decimal places).
 */
const decimal256 = (options?: BcsTypeOptions<string, string | number | bigint>) =>
  mystenBcs.u256(options).transform({
    input: (val: number | string) => {
      const multiplier = BigInt('1000000000000000000')
      const parts = String(val).split('.')
      const wholePart = BigInt(parts[0] || '0')
      let fracPart = BigInt(0)
      if (parts[1]) {
        const fracStr = parts[1].padEnd(18, '0').slice(0, 18)
        fracPart = BigInt(fracStr)
      }
      return (wholePart * multiplier + fracPart).toString()
    },
    output: val => {
      const multiplier = BigInt('1000000000000000000')
      const n = BigInt(val)
      const whole = n / multiplier
      const frac = n % multiplier
      if (frac === BigInt(0)) {
        return whole.toString()
      }
      const fracStr = frac.toString().padStart(18, '0').replace(/0+$/, '')
      return `${whole}.${fracStr}`
    },
  })

// =============================================================================
// Combined BCS Object
// =============================================================================

/**
 * Extended BCS object with Initia-specific types.
 */
export const bcs: typeof mystenBcs & {
  address: typeof initiaAddress
  object: typeof initiaAddress
  fixed_point32: typeof fixedPoint32
  fixed_point64: typeof fixedPoint64
  decimal128: typeof decimal128
  decimal256: typeof decimal256
} = {
  ...mystenBcs,
  address: initiaAddress,
  object: initiaAddress,
  fixed_point32: fixedPoint32,
  fixed_point64: fixedPoint64,
  decimal128: decimal128,
  decimal256: decimal256,
}

// =============================================================================
// Move Type String Parsing
// =============================================================================

/**
 * Parsed Move type representation.
 */
export interface ParsedMoveType {
  /** Base type name (e.g., 'vector', 'u64', 'address') */
  base: string
  /** Type arguments for generic types */
  typeArgs: ParsedMoveType[]
}

/**
 * Parses a Move type string into a structured representation.
 *
 * @param typeStr - Move type string (e.g., 'vector<u8>', '0x1::coin::Coin<T>')
 * @returns Parsed type structure
 *
 * @example
 * ```typescript
 * parseMoveType('u64')                    // { base: 'u64', typeArgs: [] }
 * parseMoveType('vector<u8>')             // { base: 'vector', typeArgs: [{ base: 'u8', typeArgs: [] }] }
 * parseMoveType('0x1::option::Option<u64>') // { base: '0x1::option::Option', typeArgs: [...] }
 * ```
 */
export function parseMoveType(typeStr: string): ParsedMoveType {
  typeStr = typeStr.trim()

  // Find the first '<' that starts type arguments
  const genericStart = typeStr.indexOf('<')

  if (genericStart === -1) {
    // Simple type without generics
    return { base: typeStr, typeArgs: [] }
  }

  // Extract base type and type arguments
  const base = typeStr.slice(0, genericStart)
  const argsStr = typeStr.slice(genericStart + 1, typeStr.lastIndexOf('>'))

  // Parse type arguments (handle nested generics)
  const typeArgs: ParsedMoveType[] = []
  let depth = 0
  let current = ''

  for (const char of argsStr) {
    if (char === '<') {
      depth++
      current += char
    } else if (char === '>') {
      depth--
      current += char
    } else if (char === ',' && depth === 0) {
      if (current.trim()) {
        typeArgs.push(parseMoveType(current.trim()))
      }
      current = ''
    } else {
      current += char
    }
  }

  if (current.trim()) {
    typeArgs.push(parseMoveType(current.trim()))
  }

  return { base, typeArgs }
}

// =============================================================================
// BCS Type Resolution
// =============================================================================

/**
 * Gets a BCS type for a Move type string.
 *
 * @param moveType - Move type string
 * @returns BCS type for serialization/deserialization
 *
 * @example
 * ```typescript
 * const type = getBcsType('u64')
 * const bytes = type.serialize(1000n).toBytes()
 * ```
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function getBcsType(moveType: string): BcsType<any, any> {
  const parsed = parseMoveType(moveType)
  return resolveBcsType(parsed)
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function resolveBcsType(parsed: ParsedMoveType): BcsType<any, any> {
  const { base, typeArgs } = parsed

  // Primitive types
  switch (base) {
    case 'bool':
      return bcs.bool()
    case 'u8':
      return bcs.u8()
    case 'u16':
      return bcs.u16()
    case 'u32':
      return bcs.u32()
    case 'u64':
      return bcs.u64()
    case 'u128':
      return bcs.u128()
    case 'u256':
      return bcs.u256()
    case 'address':
      return bcs.address()
    case 'signer':
      // Signer is encoded as address
      return bcs.address()
    case 'vector':
      if (typeArgs.length !== 1) {
        throw new Error(`vector requires exactly 1 type argument, got ${typeArgs.length}`)
      }
      // Special case: vector<u8> is more efficient as byteVector
      if (typeArgs[0].base === 'u8' && typeArgs[0].typeArgs.length === 0) {
        return bcs.byteVector()
      }
      return bcs.vector(resolveBcsType(typeArgs[0]))
    case 'string':
    case '0x1::string::String':
      return bcs.string()
    case '0x1::option::Option':
      if (typeArgs.length !== 1) {
        throw new Error(`Option requires exactly 1 type argument, got ${typeArgs.length}`)
      }
      return bcs.option(resolveBcsType(typeArgs[0]))
    case '0x1::fixed_point32::FixedPoint32':
      return bcs.fixed_point32()
    case '0x1::fixed_point64::FixedPoint64':
      return bcs.fixed_point64()
    case '0x1::decimal128::Decimal128':
      return bcs.decimal128()
    case '0x1::decimal256::Decimal256':
      return bcs.decimal256()
    case '0x1::object::Object':
    case '0x1::object::ObjectCore':
      return bcs.address()
    default:
      // For struct types without specific handling, treat as opaque bytes
      // This is a fallback - specific struct types should be handled by the caller
      if (base.includes('::')) {
        // Unknown module type - return string for now
        // In practice, the caller should provide custom handling
        return bcs.string()
      }
      throw new Error(`Unsupported Move type: ${base}`)
  }
}

// =============================================================================
// Encoding/Decoding Functions
// =============================================================================

/**
 * Encodes a single Move argument to BCS bytes.
 *
 * @param value - Value to encode
 * @param moveType - Move type string
 * @returns BCS encoded bytes
 *
 * @example
 * ```typescript
 * encodeMoveArg(1000n, 'u64')           // Uint8Array
 * encodeMoveArg('init1...', 'address')  // Uint8Array
 * encodeMoveArg([1, 2, 3], 'vector<u8>') // Uint8Array
 * ```
 */
export function encodeMoveArg(value: unknown, moveType: string): Uint8Array {
  const bcsType = getBcsType(moveType)
  return bcsType.serialize(value).toBytes()
}

/**
 * Encodes multiple Move arguments to BCS bytes.
 *
 * @param values - Values to encode
 * @param moveTypes - Move type strings for each value
 * @returns Array of BCS encoded bytes
 *
 * @example
 * ```typescript
 * encodeMoveArgs(
 *   ['init1...', 1000n],
 *   ['address', 'u64']
 * )
 * ```
 */
export function encodeMoveArgs(values: unknown[], moveTypes: string[]): Uint8Array[] {
  if (values.length !== moveTypes.length) {
    throw new Error(`Argument count mismatch: ${values.length} values, ${moveTypes.length} types`)
  }
  return values.map((value, i) => encodeMoveArg(value, moveTypes[i]))
}

/**
 * Decodes BCS bytes to a Move value.
 *
 * @param bytes - BCS encoded bytes
 * @param moveType - Move type string
 * @returns Decoded value
 *
 * @example
 * ```typescript
 * decodeMoveResult(bytes, 'u64')      // bigint string
 * decodeMoveResult(bytes, 'address')  // hex string
 * decodeMoveResult(bytes, 'bool')     // boolean
 * ```
 */
export function decodeMoveResult(bytes: Uint8Array, moveType: string): unknown {
  const bcsType = getBcsType(moveType)
  return bcsType.parse(bytes)
}

/**
 * Decodes multiple BCS values from a concatenated byte array.
 * Note: This assumes the values are simply concatenated without length prefixes.
 * For proper multi-value decoding, use separate byte arrays.
 *
 * @param bytesArray - Array of BCS encoded bytes
 * @param moveTypes - Move type strings for each value
 * @returns Array of decoded values
 */
export function decodeMoveResults(bytesArray: Uint8Array[], moveTypes: string[]): unknown[] {
  if (bytesArray.length !== moveTypes.length) {
    throw new Error(
      `Result count mismatch: ${bytesArray.length} results, ${moveTypes.length} types`
    )
  }
  return bytesArray.map((bytes, i) => decodeMoveResult(bytes, moveTypes[i]))
}

// =============================================================================
// Utility Functions
// =============================================================================

export { hexToBytes } from '../../util/hex'

/**
 * Converts Uint8Array to a hex string.
 */
export function bytesToHex(bytes: Uint8Array): string {
  return (
    '0x' +
    Array.from(bytes)
      .map(b => b.toString(16).padStart(2, '0'))
      .join('')
  )
}
