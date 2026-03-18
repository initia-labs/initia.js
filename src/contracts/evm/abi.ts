/**
 * EVM ABI Encoding/Decoding Utilities
 *
 * Standalone utilities for ABI operations without creating contract instances.
 * Re-exports viem functions for consistent API.
 */

import { parseAbi, encodeFunctionData, encodeAbiParameters as viemEncodeAbiParameters } from 'viem'
import type { Abi } from 'abitype'
import { convertEvmArgs } from './contract'

// Function encoding/decoding
export { encodeFunctionData, decodeFunctionResult, encodeFunctionResult } from 'viem'

// Event encoding/decoding
// Note: parseEventLogs returns addresses in EIP-55 checksum format (mixed-case),
// not lowercase as returned by on-chain RPC. Use .toLowerCase() when comparing
// with raw on-chain addresses.
export { encodeEventTopics, decodeEventLog, parseEventLogs } from 'viem'

// Error encoding/decoding
export { encodeErrorResult, decodeErrorResult } from 'viem'

// ABI encoding/decoding (low-level)
export { encodeAbiParameters, decodeAbiParameters } from 'viem'

// Type re-exports for convenience
export type { Abi, AbiFunction, AbiEvent, AbiError, AbiParameter } from 'abitype'

/**
 * Encodes an EVM function call from a human-readable signature string.
 * Accepts bech32 addresses in args — automatically converts to hex for address params.
 *
 * @param signature - Human-readable function signature (e.g., "function transfer(address to, uint256 amount)")
 * @param args - Function arguments (bech32 addresses accepted for address params)
 * @returns ABI-encoded calldata with function selector
 *
 * @example
 * ```typescript
 * // With 'function' keyword
 * const calldata = encodeEvmCall(
 *   'function transfer(address to, uint256 amount)',
 *   ['init1qwer...', 100n]
 * )
 *
 * // Without 'function' keyword (also accepted)
 * const calldata = encodeEvmCall(
 *   'transfer(address,uint256)',
 *   ['init1qwer...', 100n]
 * )
 *
 * const msg = createExecuteMsg(sender, contractAddr, calldata)
 * ```
 */
export function encodeEvmCall(signature: string, args: unknown[]): `0x${string}` {
  const fragment = signature.startsWith('function ') ? signature : `function ${signature}`

  const abi = parseAbi([fragment]) as Abi
  const fn = abi[0]
  if (!fn || fn.type !== 'function') {
    throw new Error(`Invalid function signature: ${signature}`)
  }

  const convertedArgs = convertEvmArgs(abi, fn.name, args)

  return encodeFunctionData({
    abi,
    functionName: fn.name,
    args: convertedArgs,
  })
}

/**
 * Encodes ABI parameters from type strings with bech32 address auto-conversion.
 *
 * @param types - Parameter type strings (e.g., ["address", "uint256"])
 * @param values - Parameter values (bech32 addresses accepted for address params)
 * @returns ABI-encoded parameters (no function selector)
 *
 * @example
 * ```typescript
 * const encoded = encodeEvmParameters(
 *   ['address', 'uint256'],
 *   ['init1qwer...', 100n]
 * )
 * ```
 */
export function encodeEvmParameters(types: string[], values: unknown[]): `0x${string}` {
  // Build a synthetic ABI to leverage convertEvmArgs for address conversion
  const fragment = `function _encode(${types.join(',')})`
  const abi = parseAbi([fragment]) as Abi
  const convertedArgs = convertEvmArgs(abi, '_encode', values)

  const params = types.map(type => ({ type }))
  return viemEncodeAbiParameters(params, convertedArgs as readonly unknown[])
}
