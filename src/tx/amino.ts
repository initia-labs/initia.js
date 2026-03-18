/**
 * Amino conversion utilities for Initia SDK.
 *
 * Provides automatic conversion between protobuf messages and Amino format
 * using proto options (amino.name, amino.field_name, amino.encoding, amino.dont_omitempty).
 *
 * This implementation reads amino options at runtime via getOption() from @bufbuild/protobuf,
 * eliminating the need for hardcoded exception tables.
 */

import { base64 } from '@scure/base'
import { getOption } from '@bufbuild/protobuf'
import type { DescMessage, DescField, MessageShape } from '@bufbuild/protobuf'
import {
  name as aminoName,
  field_name as aminoFieldName,
  encoding as aminoEncoding,
  dont_omitempty as aminoDontOmitempty,
} from '@buf/cosmos_cosmos-sdk.bufbuild_es/amino/amino_pb'
import { NotImplementedError } from '../errors'

/**
 * Override map for amino type names where BSR proto schema diverges from chain registration.
 *
 * The BSR package may publish newer proto versions that rename amino types,
 * but the chain still uses the original names in its amino codec registration.
 * These overrides ensure v2 produces amino types matching the actual chain.
 */
const AMINO_TYPE_OVERRIDES: Record<string, string> = {
  // BSR proto uses 'MsgAddEmergencyProposalSubmitters' but chain registers 'gov/MsgAddEmergencySubmitters'
  'initia.gov.v1.MsgAddEmergencyProposalSubmitters': 'gov/MsgAddEmergencySubmitters',
  'initia.gov.v1.MsgRemoveEmergencyProposalSubmitters': 'gov/MsgRemoveEmergencySubmitters',
}

// Re-export AminoMsg from canonical definition in signer/types
export type { AminoMsg } from '../signer/types'
import type { AminoMsg } from '../signer/types'

/**
 * Convert camelCase to snake_case.
 */
export function camelToSnake(str: string): string {
  return str
    .replace(/([A-Z])/g, '_$1')
    .toLowerCase()
    .replace(/^_/, '')
}

/**
 * Get the Amino type name for a message schema.
 * Returns undefined if the message doesn't support Amino.
 *
 * @param schema - Message schema (e.g., MsgSendSchema)
 * @returns Amino type name or undefined
 */
export function getAminoType(schema: DescMessage): string | undefined {
  return AMINO_TYPE_OVERRIDES[schema.typeName] ?? getOption(schema, aminoName)
}

/**
 * Get the Amino field name for a proto field.
 * Falls back to snake_case conversion if no custom name is defined.
 *
 * @param field - Field descriptor
 * @returns Amino field name
 */
export function getAminoFieldName(field: DescField): string {
  // getOption() returns "" (not undefined) for unset string options in protobuf-es,
  // so use || to also fall back on empty string.
  return getOption(field, aminoFieldName) || camelToSnake(field.name)
}

/**
 * Check if a field should include empty values in Amino output.
 *
 * @param field - Field descriptor
 * @returns true if empty values should be included
 */
export function shouldIncludeEmpty(field: DescField): boolean {
  return getOption(field, aminoDontOmitempty) ?? false
}

/**
 * Get the Amino encoding type for a proto field.
 * Common encodings: 'legacy_coins', 'inline'
 *
 * @param field - Field descriptor
 * @returns Encoding type or undefined if default encoding
 */
export function getAminoEncoding(field: DescField): string | undefined {
  // getOption() returns "" for unset string options; normalize to undefined.
  return getOption(field, aminoEncoding) || undefined
}

/**
 * Convert a value to Amino format.
 *
 * @param value - Value to convert
 * @param includeEmpty - Whether to include empty values
 * @param encoding - Optional amino encoding type (e.g., 'legacy_coins')
 * @returns Amino-formatted value
 */
export function valueToAmino(value: unknown, includeEmpty = false, encoding?: string): unknown {
  if (value === null || value === undefined) {
    return undefined
  }

  // Handle special encodings
  if (encoding === 'inline_json' && value instanceof Uint8Array) {
    // inline_json: bytes containing JSON are inlined as a parsed JSON object,
    // matching Go's RawContractMessage.MarshalJSON() = json.RawMessage inline.
    if (value.length === 0) return undefined
    return JSON.parse(new TextDecoder().decode(value))
  }

  if (encoding === 'legacy_coins' && Array.isArray(value)) {
    // legacy_coins: empty array becomes null, non-empty becomes coin array
    if (value.length === 0) {
      return null
    }
    return value.map(v => valueToAmino(v, includeEmpty))
  }

  // Empty array handling
  if (Array.isArray(value)) {
    if (value.length === 0) {
      return includeEmpty ? [] : undefined
    }
    return value.map(v => valueToAmino(v, includeEmpty))
  }

  // BigInt to string
  if (typeof value === 'bigint') {
    return value.toString()
  }

  // Number to string (for amounts, gas, etc.)
  if (typeof value === 'number') {
    return value.toString()
  }

  // Date to ISO string
  if (value instanceof Date) {
    return value.toISOString()
  }

  // Uint8Array to base64
  if (value instanceof Uint8Array) {
    return uint8ArrayToBase64(value)
  }

  // Nested object (recursive conversion)
  if (typeof value === 'object') {
    return objectToAmino(value as Record<string, unknown>, includeEmpty)
  }

  // String and other primitives pass through
  return value
}

/**
 * Convert an object to Amino format with snake_case keys.
 *
 * @param obj - Object to convert
 * @param includeEmpty - Whether to include empty values
 * @returns Amino-formatted object
 */
export function objectToAmino(
  obj: Record<string, unknown>,
  includeEmpty = false
): Record<string, unknown> {
  const result: Record<string, unknown> = {}

  for (const [key, value] of Object.entries(obj)) {
    // Skip internal protobuf fields
    if (key.startsWith('$') || key.startsWith('_')) {
      continue
    }

    const aminoKey = camelToSnake(key)
    const aminoValue = valueToAmino(value, includeEmpty)

    // Omit undefined values unless includeEmpty is true
    if (aminoValue !== undefined) {
      result[aminoKey] = aminoValue
    }
  }

  return result
}

/**
 * Convert a protobuf message to Amino format.
 *
 * @param schema - Message schema
 * @param msg - Message instance
 * @returns Amino message with type wrapper
 * @throws Error if message doesn't support Amino (no amino.name option)
 */
export function toAmino<T extends DescMessage>(schema: T, msg: MessageShape<T>): AminoMsg {
  const aminoType = getAminoType(schema)
  if (!aminoType) {
    throw new NotImplementedError(`Amino conversion for ${schema.typeName}`)
  }

  const value: Record<string, unknown> = {}

  for (const field of schema.fields) {
    const protoKey = field.localName
    const protoValue = (msg as Record<string, unknown>)[protoKey]

    const aminoKey = getAminoFieldName(field)
    const includeEmpty = shouldIncludeEmpty(field)
    const encoding = getAminoEncoding(field)
    const aminoValue = valueToAmino(protoValue, includeEmpty, encoding)

    if (aminoValue !== undefined) {
      value[aminoKey] = aminoValue
    }
  }

  return { type: aminoType, value }
}

/**
 * Convert Amino format back to protobuf-compatible object.
 *
 * @param amino - Amino message
 * @returns Plain object suitable for creating protobuf message
 */
export function fromAmino(amino: AminoMsg): Record<string, unknown> {
  return snakeToCamelObject(amino.value)
}

/**
 * Convert snake_case to camelCase.
 */
export function snakeToCamel(str: string): string {
  return str.replace(/_([a-z])/g, (_: string, letter: string) => letter.toUpperCase())
}

/**
 * Convert an Amino object (snake_case keys) to camelCase keys.
 */
export function snakeToCamelObject(obj: Record<string, unknown>): Record<string, unknown> {
  const result: Record<string, unknown> = {}

  for (const [key, value] of Object.entries(obj)) {
    const camelKey = snakeToCamel(key)

    if (Array.isArray(value)) {
      result[camelKey] = value.map(v =>
        typeof v === 'object' && v !== null
          ? snakeToCamelObject(v as Record<string, unknown>)
          : aminoValueToProto(v)
      )
    } else if (typeof value === 'object' && value !== null) {
      result[camelKey] = snakeToCamelObject(value as Record<string, unknown>)
    } else {
      result[camelKey] = aminoValueToProto(value)
    }
  }

  return result
}

/**
 * Convert Amino value back to proto-compatible value.
 */
function aminoValueToProto(value: unknown): unknown {
  if (value === null) {
    return []
  }

  // Base64 string detection for bytes fields
  // Note: This is a heuristic. In practice, we need field type info.
  if (typeof value === 'string' && isBase64(value) && value.length > 0) {
    // Keep as string - let the caller decode if needed
    return value
  }

  return value
}

/**
 * Check if a string is valid base64.
 */
function isBase64(str: string): boolean {
  if (str.length === 0 || str.length % 4 !== 0) {
    return false
  }
  return /^[A-Za-z0-9+/]*={0,2}$/.test(str)
}

/**
 * Convert Uint8Array to base64 string.
 */
function uint8ArrayToBase64(bytes: Uint8Array): string {
  return base64.encode(bytes)
}

/**
 * Convert base64 string to Uint8Array.
 */
export function base64ToUint8Array(base64String: string): Uint8Array {
  // Pad if missing — some APIs return base64 without trailing '='
  const padded = base64String.padEnd(
    base64String.length + ((4 - (base64String.length % 4)) % 4),
    '='
  )
  return base64.decode(padded)
}

/**
 * Sort object keys alphabetically for canonical JSON.
 * Required for Amino sign docs.
 */
export function sortObject<T>(obj: T): T {
  if (obj === null || typeof obj !== 'object') return obj
  if (Array.isArray(obj)) return obj.map(sortObject) as T

  // If the object has toJSON (e.g., Coin, DecCoin with BSR proto internals),
  // use it to get the canonical representation before sorting.
  const plain =
    typeof (obj as Record<string, unknown>).toJSON === 'function'
      ? (obj as unknown as { toJSON(): unknown }).toJSON()
      : obj

  if (plain === null || typeof plain !== 'object' || Array.isArray(plain)) {
    return sortObject(plain) as T
  }

  const sorted = {} as Record<string, unknown>
  const keys = Object.keys(plain).sort()
  for (const key of keys) {
    sorted[key] = sortObject((plain as Record<string, unknown>)[key])
  }
  return sorted as T
}

/**
 * Create canonical JSON for Amino signing.
 * Keys are sorted alphabetically.
 */
export function canonicalJSON(obj: unknown): string {
  return JSON.stringify(sortObject(obj))
}
