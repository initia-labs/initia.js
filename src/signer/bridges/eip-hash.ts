/**
 * EIP-191 and EIP-712 hashing utilities.
 *
 * Implemented using the SDK's own keccak256 from @noble/hashes,
 * avoiding viem runtime imports for zero additional bundle cost.
 */

import { bytesToHex, hexToBytes } from '@noble/hashes/utils.js'
import { keccak256 } from '../../util/hash'

// =============================================================================
// EIP-191: Personal message hashing
// =============================================================================

type SignableMessage = string | { raw: Uint8Array }

/**
 * Hash a message according to EIP-191 personal sign.
 * Equivalent to viem's `hashMessage()`.
 *
 * Formula: keccak256("\x19Ethereum Signed Message:\n" + len + msg)
 */
export function hashEIP191Message(message: SignableMessage): `0x${string}` {
  const msgBytes = typeof message === 'string' ? new TextEncoder().encode(message) : message.raw

  const prefix = `\x19Ethereum Signed Message:\n${msgBytes.length}`
  const prefixBytes = new TextEncoder().encode(prefix)

  const combined = new Uint8Array(prefixBytes.length + msgBytes.length)
  combined.set(prefixBytes, 0)
  combined.set(msgBytes, prefixBytes.length)

  return `0x${bytesToHex(keccak256(combined))}`
}

// =============================================================================
// EIP-712: Typed structured data hashing
// =============================================================================

interface TypedDataField {
  name: string
  type: string
}

interface TypedDataDomain {
  name?: string
  version?: string
  chainId?: number | bigint
  verifyingContract?: string
  salt?: string
}

interface TypedDataInput {
  domain: TypedDataDomain
  types: Record<string, TypedDataField[]>
  primaryType: string
  message: Record<string, unknown>
}

/**
 * Hash typed structured data according to EIP-712.
 * Equivalent to viem's `hashTypedData()`.
 *
 * Formula: keccak256("\x19\x01" + domainSeparator + hashStruct(primaryType, message))
 */
export function hashEIP712TypedData(data: TypedDataInput): `0x${string}` {
  const { domain, types, primaryType, message } = data

  const allTypes: Record<string, TypedDataField[]> = {
    EIP712Domain: buildDomainType(domain),
    ...types,
  }

  const domainSeparator = hashStruct('EIP712Domain', domain as Record<string, unknown>, allTypes)
  const messageHash = hashStruct(primaryType, message, allTypes)

  const encoded = new Uint8Array(2 + 32 + 32)
  encoded[0] = 0x19
  encoded[1] = 0x01
  encoded.set(domainSeparator, 2)
  encoded.set(messageHash, 34)

  return `0x${bytesToHex(keccak256(encoded))}`
}

// =============================================================================
// Internal helpers
// =============================================================================

function buildDomainType(domain: TypedDataDomain): TypedDataField[] {
  const fields: TypedDataField[] = []
  if (domain.name !== undefined) fields.push({ name: 'name', type: 'string' })
  if (domain.version !== undefined) fields.push({ name: 'version', type: 'string' })
  if (domain.chainId !== undefined) fields.push({ name: 'chainId', type: 'uint256' })
  if (domain.verifyingContract !== undefined)
    fields.push({ name: 'verifyingContract', type: 'address' })
  if (domain.salt !== undefined) fields.push({ name: 'salt', type: 'bytes32' })
  return fields
}

function encodeType(primaryType: string, types: Record<string, TypedDataField[]>): string {
  const deps = findTypeDeps(primaryType, types, new Set())
  deps.delete(primaryType)
  const sorted = [primaryType, ...Array.from(deps).sort()]
  return sorted.map(t => `${t}(${types[t].map(f => `${f.type} ${f.name}`).join(',')})`).join('')
}

function findTypeDeps(
  type: string,
  types: Record<string, TypedDataField[]>,
  found: Set<string>
): Set<string> {
  if (found.has(type)) return found
  const fields = types[type]
  if (!fields) return found
  found.add(type)
  for (const field of fields) {
    const baseType = field.type.replace(/\[\d*\]$/, '')
    if (types[baseType]) findTypeDeps(baseType, types, found)
  }
  return found
}

function typeHash(primaryType: string, types: Record<string, TypedDataField[]>): Uint8Array {
  return keccak256(new TextEncoder().encode(encodeType(primaryType, types)))
}

function hashStruct(
  primaryType: string,
  data: Record<string, unknown>,
  types: Record<string, TypedDataField[]>
): Uint8Array {
  const encoded = encodeData(primaryType, data, types)
  return keccak256(encoded)
}

function encodeData(
  primaryType: string,
  data: Record<string, unknown>,
  types: Record<string, TypedDataField[]>
): Uint8Array {
  const fields = types[primaryType]
  const chunks: Uint8Array[] = [typeHash(primaryType, types)]

  for (const field of fields) {
    const value = data[field.name]
    chunks.push(encodeValue(field.type, value, types))
  }

  return concatBytes(chunks)
}

function encodeValue(
  type: string,
  value: unknown,
  types: Record<string, TypedDataField[]>
): Uint8Array {
  // Array type (e.g., "uint256[]")
  if (type.endsWith('[]')) {
    const innerType = type.slice(0, -2)
    const arr = value as unknown[]
    const encoded = arr.map(v => encodeValue(innerType, v, types))
    return keccak256(concatBytes(encoded))
  }

  // Struct type (custom type defined in types)
  if (types[type]) {
    return hashStruct(type, value as Record<string, unknown>, types)
  }

  // Atomic types
  return encodeAtomicValue(type, value)
}

function encodeAtomicValue(type: string, value: unknown): Uint8Array {
  const word = new Uint8Array(32)

  if (type === 'address') {
    const addr = (value as string).replace(/^0x/, '').toLowerCase()
    const bytes = hexToBytes(addr.padStart(40, '0'))
    word.set(bytes, 12)
    return word
  }

  if (type === 'bool') {
    word[31] = value ? 1 : 0
    return word
  }

  if (type === 'string') {
    return keccak256(new TextEncoder().encode(value as string))
  }

  if (type === 'bytes') {
    const hex = (value as string).replace(/^0x/, '')
    return keccak256(hexToBytes(hex))
  }

  // bytesN (bytes1..bytes32)
  if (type.startsWith('bytes')) {
    const hex = (value as string).replace(/^0x/, '')
    const bytes = hexToBytes(hex)
    word.set(bytes, 0) // left-aligned
    return word
  }

  // uintN
  if (type.startsWith('uint')) {
    const n = BigInt(value as bigint | number | string)
    const hex = n.toString(16).padStart(64, '0')
    return hexToBytes(hex)
  }

  // intN (two's complement)
  if (type.startsWith('int')) {
    let n = BigInt(value as bigint | number | string)
    if (n < 0n) n = (1n << 256n) + n
    const hex = n.toString(16).padStart(64, '0')
    return hexToBytes(hex)
  }

  throw new Error(`Unsupported EIP-712 type: ${type}`)
}

function concatBytes(arrays: Uint8Array[]): Uint8Array {
  const totalLen = arrays.reduce((sum, a) => sum + a.length, 0)
  const result = new Uint8Array(totalLen)
  let offset = 0
  for (const arr of arrays) {
    result.set(arr, offset)
    offset += arr.length
  }
  return result
}
