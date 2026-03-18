/**
 * EVM Contract Factory and Helpers
 *
 * Provides type-safe contract interactions via gRPC or JSON-RPC.
 */

import type { Abi } from 'abitype'
import type { Client } from '@connectrpc/connect'
import { create } from '@bufbuild/protobuf'
import { encodeFunctionData, decodeFunctionResult, decodeErrorResult, encodeDeployData } from 'viem'

import type { Query as EvmQuery } from '@buf/initia-labs_minievm.bufbuild_es/minievm/evm/v1/query_pb'
import {
  MsgCallSchema,
  type MsgCall,
} from '@buf/initia-labs_minievm.bufbuild_es/minievm/evm/v1/tx_pb'

import { Message } from '../../msgs/types'
import type { HasEvmService } from '../../client/types'
import type { EvmRpcClient } from '../../client/evm-rpc'
import type { TokenInfo } from '../types'
import { parseUnits, formatUnits } from '../utils'
import { ContractError } from '../errors'
import { AccAddress, isValidEvmAddress, tryDecodeBech32 } from '../../util/address'
import { sendEvmTx } from '../../tx/evm'
import type {
  EvmContract,
  EvmContractJsonRpc,
  EvmContractJsonRpcOptions,
  ReadFunctions,
  WriteFunctions,
  JsonRpcWriteFunctions,
  WriteOptions,
  EstimateGasFunctions,
  JsonRpcEstimateGasFunctions,
  DeployEvmContractOptions,
} from './types'

// =============================================================================
// Types
// =============================================================================

/**
 * EVM gRPC query client type.
 */
export type EvmQueryClient = Client<typeof EvmQuery>

// Zero address in bech32 format for gRPC query sender
const ZERO_ADDRESS_BECH32 = 'init1qqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqa4qvvl'
// Zero address in hex for JSON-RPC from field
const ZERO_ADDRESS_HEX: `0x${string}` = '0x0000000000000000000000000000000000000000'

// =============================================================================
// Address Validation
// =============================================================================

/**
 * Validates that an address is in a valid format (EVM hex or bech32).
 * @throws Error if address format is invalid
 */
function validateContractAddress(address: string): void {
  // Check EVM format (0x...)
  if (address.startsWith('0x')) {
    if (!isValidEvmAddress(address)) {
      throw new Error(
        `Invalid EVM address format: ${address}. ` + `Expected 0x followed by 40 hex characters.`
      )
    }
    return
  }

  // Check bech32 format
  if (!tryDecodeBech32(address)) {
    throw new Error(
      `Invalid contract address: ${address}. ` + `Expected EVM hex (0x...) or bech32 format.`
    )
  }
}

// =============================================================================
// Bech32 → Hex Address Conversion
// =============================================================================

/** ABI parameter with optional components (for tuple types) */
interface AbiParam {
  type: string
  name?: string
  components?: readonly AbiParam[]
}

/**
 * Converts a bech32 string to hex if it's not already hex.
 * Returns the value unchanged if conversion fails or unnecessary.
 */
function maybeToHex(val: unknown): unknown {
  if (typeof val === 'string' && !val.startsWith('0x')) {
    try {
      return AccAddress.toHex(val)
    } catch {
      // Not a valid bech32, pass through
    }
  }
  return val
}

/**
 * Recursively converts bech32 addresses to hex based on ABI parameter type.
 * Handles address, address[], tuple (with components), and tuple[].
 */
function convertEvmArg(arg: unknown, param: AbiParam): unknown {
  const { type } = param

  if (type === 'address') {
    return maybeToHex(arg)
  }

  if (type === 'address[]' && Array.isArray(arg)) {
    return arg.map(el => maybeToHex(el))
  }

  if (type === 'tuple' && param.components && arg && typeof arg === 'object') {
    const obj = { ...(arg as Record<string, unknown>) }
    for (const comp of param.components) {
      if (comp.name && comp.name in obj) {
        obj[comp.name] = convertEvmArg(obj[comp.name], comp)
      }
    }
    return obj
  }

  if (type === 'tuple[]' && param.components && Array.isArray(arg)) {
    const tupleParam: AbiParam = { ...param, type: 'tuple' }
    return arg.map(el => convertEvmArg(el, tupleParam))
  }

  return arg
}

/**
 * Converts bech32 addresses in function args to hex, guided by ABI types.
 */
export function convertEvmArgs(contractAbi: Abi, functionName: string, args: unknown[]): unknown[] {
  const fn = contractAbi.find(item => item.type === 'function' && item.name === functionName)
  if (!fn || fn.type !== 'function') return args

  return args.map((arg, i) => {
    const input = fn.inputs[i]
    if (!input) return arg
    return convertEvmArg(arg, input as AbiParam)
  })
}

// =============================================================================
// Contract Factory
// =============================================================================

/**
 * Creates a type-safe EVM contract instance.
 *
 * @param context - ChainContext with client (must have evm service)
 * @param address - Contract address (0x hex or bech32)
 * @param abi - Contract ABI
 * @param options - Transport options (omit or `{ transport: 'jsonrpc' }`)
 * @returns Type-safe contract instance
 *
 * @example
 * ```typescript
 * import { createEvmContract } from 'initia.js'
 *
 * // gRPC (default)
 * const erc20 = createEvmContract(ctx, address, erc20Abi)
 * const msg = erc20.write.transfer(sender, to, amount)
 * await ctx.signAndBroadcast([msg])
 *
 * // JSON-RPC
 * const erc20 = createEvmContract(ctx, address, erc20Abi, { transport: 'jsonrpc' })
 * const txHash = await erc20.write.transfer(to, amount)
 * ```
 */
export function createEvmContract<const TAbi extends Abi>(
  context: HasEvmService & { evmTransport: 'jsonrpc' },
  address: string,
  abi: TAbi
): EvmContractJsonRpc<TAbi>
export function createEvmContract<const TAbi extends Abi>(
  context: HasEvmService,
  address: string,
  abi: TAbi,
  options: EvmContractJsonRpcOptions
): EvmContractJsonRpc<TAbi>
export function createEvmContract<const TAbi extends Abi>(
  context: HasEvmService,
  address: string,
  abi: TAbi
): EvmContract<TAbi>
export function createEvmContract<const TAbi extends Abi>(
  context: HasEvmService,
  address: string,
  abi: TAbi,
  options?: EvmContractJsonRpcOptions
): EvmContract<TAbi> | EvmContractJsonRpc<TAbi> {
  validateContractAddress(address)

  // Per-contract options take priority, then check context-level preference
  const contextTransport = (context as unknown as Record<string, unknown>).evmTransport
  if (options?.transport === 'jsonrpc' || contextTransport === 'jsonrpc') {
    return createEvmContractJsonRpc(context, address, abi, options ?? { transport: 'jsonrpc' })
  }

  return createEvmContractGrpc(context, address, abi)
}

// =============================================================================
// Shared Helpers
// =============================================================================

/**
 * Extract WriteOptions from the end of args if present.
 * Compares args count against the ABI-declared input count to detect the trailing options object.
 */
function extractWriteOptions(
  abi: Abi,
  functionName: string,
  args: unknown[]
): { fnArgs: unknown[]; value: string } {
  const abiItem = abi.find(item => item.type === 'function' && item.name === functionName)
  const expectedArgCount = abiItem && abiItem.type === 'function' ? abiItem.inputs.length : 0

  if (args.length > expectedArgCount) {
    const lastArg = args[args.length - 1]
    if (lastArg && typeof lastArg === 'object' && 'value' in lastArg) {
      const opts = lastArg as WriteOptions
      return {
        fnArgs: args.slice(0, -1),
        value: opts.value !== undefined ? opts.value.toString() : '0',
      }
    }
  }

  return { fnArgs: args, value: '0' }
}

/**
 * Ensure a hex string has a 0x prefix.
 */
function ensureHexPrefix(hex: string): `0x${string}` {
  return hex.startsWith('0x') ? (hex as `0x${string}`) : `0x${hex}`
}

/**
 * Build shared token utility methods (parseUnits, formatUnits, getTokenInfo).
 */
function buildTokenUtils<TAbi extends Abi>(read: ReadFunctions<TAbi>) {
  let cachedDecimals: number | undefined

  async function getDecimals(): Promise<number> {
    if (cachedDecimals !== undefined) {
      return cachedDecimals
    }
    const erc20 = read as unknown as { decimals(): Promise<number> }
    cachedDecimals = await erc20.decimals()
    return cachedDecimals
  }

  return {
    async parseUnits(value: string): Promise<bigint> {
      const decimals = await getDecimals()
      return parseUnits(value, decimals)
    },

    async formatUnits(value: bigint): Promise<string> {
      const decimals = await getDecimals()
      return formatUnits(value, decimals)
    },

    async getTokenInfo(): Promise<TokenInfo> {
      const erc20 = read as unknown as {
        name(): Promise<string>
        symbol(): Promise<string>
        decimals(): Promise<number>
        totalSupply(): Promise<bigint>
      }

      const [name, symbol, decimals, totalSupply] = await Promise.all([
        erc20.name(),
        erc20.symbol(),
        erc20.decimals(),
        erc20.totalSupply().catch((): bigint | undefined => undefined),
      ])

      cachedDecimals = decimals

      return { name, symbol, decimals, totalSupply }
    },
  }
}

/**
 * Convert contract address to 0x hex format for JSON-RPC.
 * If already 0x-prefixed, returns as-is. If bech32, converts to hex.
 */
function toHexAddress(address: string): `0x${string}` {
  if (address.startsWith('0x')) return address as `0x${string}`
  return AccAddress.toHex(address) as `0x${string}`
}

// =============================================================================
// gRPC Contract Factory (existing behavior)
// =============================================================================

function createEvmContractGrpc<TAbi extends Abi>(
  context: HasEvmService,
  address: string,
  abi: TAbi
): EvmContract<TAbi> {
  const evmClient = context.client.evm

  async function callContract(input: string): Promise<string> {
    const response = await evmClient.call({
      sender: ZERO_ADDRESS_BECH32,
      contractAddr: address,
      input,
      value: '0',
      accessList: [],
    })

    if (response.error) {
      throw new ContractError('evm', 0, response.error)
    }

    return response.response
  }

  const read = new Proxy({} as ReadFunctions<TAbi>, {
    get(_, functionName: string) {
      return async (...args: unknown[]) => {
        const input = encodeFunctionData({
          abi: abi as Abi,
          functionName,
          args: convertEvmArgs(abi as Abi, functionName, args),
        })

        const responseHex = await callContract(input)
        const data = ensureHexPrefix(responseHex)

        return decodeFunctionResult({
          abi: abi as Abi,
          functionName,
          data,
        })
      }
    },
  })

  const write = new Proxy({} as WriteFunctions<TAbi>, {
    get(_, functionName: string) {
      return (sender: string, ...args: unknown[]): Message<typeof MsgCallSchema> => {
        const { fnArgs, value } = extractWriteOptions(abi as Abi, functionName, args)

        const input = encodeFunctionData({
          abi: abi as Abi,
          functionName,
          args: convertEvmArgs(abi as Abi, functionName, fnArgs),
        })

        return new Message(MsgCallSchema, {
          sender,
          contractAddr: address,
          input,
          value,
          accessList: [],
        })
      }
    },
  })

  const estimateGas = new Proxy({} as EstimateGasFunctions<TAbi>, {
    get(_, functionName: string) {
      return async (sender: string, ...args: unknown[]): Promise<bigint> => {
        const { fnArgs, value } = extractWriteOptions(abi as Abi, functionName, args)

        const input = encodeFunctionData({
          abi: abi as Abi,
          functionName,
          args: convertEvmArgs(abi as Abi, functionName, fnArgs),
        })

        const response = await evmClient.call({
          sender,
          contractAddr: address,
          input,
          value,
          accessList: [],
        })

        if (response.error) {
          throw new ContractError('evm', 0, response.error)
        }

        return response.usedGas
      }
    },
  })

  return {
    address,
    abi,
    read,
    write,
    estimateGas,
    ...buildTokenUtils(read),
  }
}

// =============================================================================
// JSON-RPC Contract Factory
// =============================================================================

/**
 * Resolve EvmRpcClient from context at runtime.
 * ChainContext<'minievm'> provides `evmRpc` via getter.
 */
function resolveEvmRpc(context: HasEvmService): EvmRpcClient {
  const rpc = (context as unknown as Record<string, unknown>).evmRpc
  if (!rpc) {
    throw new Error(
      'JSON-RPC transport requires evmRpc on context.\n' +
        "Use a ChainContext<'minievm'> which provides evmRpc, or pass a context with evmRpc."
    )
  }
  return rpc as EvmRpcClient
}

/**
 * Resolve private key from options or context.signer at runtime.
 */
function resolvePrivateKey(
  context: HasEvmService,
  options: EvmContractJsonRpcOptions
): `0x${string}` {
  if (options.privateKey) return options.privateKey

  const signer = (context as unknown as Record<string, unknown>).signer
  if (signer && typeof signer === 'object' && 'getPrivateKeyHex' in signer) {
    return (signer as { getPrivateKeyHex(): `0x${string}` }).getPrivateKeyHex()
  }

  throw new Error(
    'Private key required for JSON-RPC write.\n' +
      'Provide privateKey in options or use a context with a Key signer.'
  )
}

function createEvmContractJsonRpc<TAbi extends Abi>(
  context: HasEvmService,
  address: string,
  abi: TAbi,
  options: EvmContractJsonRpcOptions
): EvmContractJsonRpc<TAbi> {
  const rpc = resolveEvmRpc(context)
  const hexAddress = toHexAddress(address)

  // Read proxy: eth_call via JSON-RPC
  const read = new Proxy({} as ReadFunctions<TAbi>, {
    get(_, functionName: string) {
      return async (...args: unknown[]) => {
        const input = encodeFunctionData({
          abi: abi as Abi,
          functionName,
          args: convertEvmArgs(abi as Abi, functionName, args),
        })

        const responseHex = await rpc.ethCall({ to: hexAddress, data: input })
        const data = ensureHexPrefix(responseHex)

        return decodeFunctionResult({
          abi: abi as Abi,
          functionName,
          data,
        })
      }
    },
  })

  // EstimateGas proxy: eth_estimateGas via JSON-RPC (no sender arg)
  const estimateGas = new Proxy({} as JsonRpcEstimateGasFunctions<TAbi>, {
    get(_, functionName: string) {
      return async (...args: unknown[]): Promise<bigint> => {
        const { fnArgs, value } = extractWriteOptions(abi as Abi, functionName, args)

        const input = encodeFunctionData({
          abi: abi as Abi,
          functionName,
          args: convertEvmArgs(abi as Abi, functionName, fnArgs),
        })

        // Use privateKey-derived address if available, otherwise zero address
        let from: `0x${string}` = ZERO_ADDRESS_HEX
        try {
          const pk = resolvePrivateKey(context, options)
          // Derive address from private key using the same approach as sendEvmTx
          const { secp256k1 } = await import('@noble/curves/secp256k1.js')
          const { hexToBytes, bytesToHex } = await import('@noble/hashes/utils.js')
          const { keccak256 } = await import('../../util/hash')
          const pubKey = secp256k1.getPublicKey(hexToBytes(pk.slice(2)), false)
          const hash = keccak256(pubKey.slice(1))
          from = `0x${bytesToHex(hash.slice(12))}`
        } catch {
          // No private key available, use zero address
        }

        return rpc.estimateGas({
          from,
          to: hexAddress,
          data: input,
          value: value !== '0' ? `0x${BigInt(value).toString(16)}` : undefined,
        })
      }
    },
  })

  // Write proxy: sendEvmTx via JSON-RPC (no sender arg, returns tx hash)
  const write = new Proxy({} as JsonRpcWriteFunctions<TAbi>, {
    get(_, functionName: string) {
      return async (...args: unknown[]): Promise<string> => {
        const { fnArgs, value } = extractWriteOptions(abi as Abi, functionName, args)
        const privateKey = resolvePrivateKey(context, options)

        const input = encodeFunctionData({
          abi: abi as Abi,
          functionName,
          args: convertEvmArgs(abi as Abi, functionName, fnArgs),
        })

        return sendEvmTx({
          rpc,
          privateKey,
          to: hexAddress,
          data: input,
          value: value !== '0' ? BigInt(value) : undefined,
        })
      }
    },
  })

  return {
    address,
    abi,
    read,
    write,
    estimateGas,
    ...buildTokenUtils(read),
  }
}

// =============================================================================
// Deployment Helper
// =============================================================================

/**
 * Deploys an EVM contract.
 *
 * Note: This creates a MsgCreate message. Use with signAndBroadcast().
 *
 * @param sender - Deployer address
 * @param options - Deployment options (abi, bytecode, args, value)
 * @returns MsgCreate message for signing
 *
 * @example
 * ```typescript
 * const deployMsg = createDeployEvmContractMsg(ctx.address, {
 *   abi: myContractAbi,
 *   bytecode: '0x6080...',
 *   args: [arg1, arg2],
 * })
 *
 * const result = await ctx.signAndBroadcast([deployMsg])
 * ```
 */
export function createDeployEvmContractMsg<const TAbi extends Abi>(
  sender: string,
  options: DeployEvmContractOptions<TAbi>
): MsgCall {
  const { abi, bytecode, args, value } = options

  const hexBytecode: `0x${string}` = bytecode.startsWith('0x')
    ? (bytecode as `0x${string}`)
    : `0x${bytecode}`

  // Convert bech32 addresses in constructor args
  const constructor = (abi as Abi).find(item => item.type === 'constructor')
  let convertedArgs = args as unknown[] | undefined
  if (convertedArgs && constructor && constructor.type === 'constructor') {
    convertedArgs = convertedArgs.map((arg, i) => {
      const input = constructor.inputs[i]
      if (!input) return arg
      return convertEvmArg(arg, input as AbiParam)
    })
  }

  // encodeDeployData: bytecode + ABI-encoded constructor args
  const code = encodeDeployData({
    abi: abi as Abi,
    bytecode: hexBytecode,
    args: convertedArgs,
  } as Parameters<typeof encodeDeployData>[0])

  // Use MsgCreate for deployment (empty contract address)
  return create(MsgCallSchema, {
    sender,
    contractAddr: '', // Empty for create
    input: code.slice(2), // Strip 0x prefix
    value: value?.toString() ?? '0',
    accessList: [],
  })
}

// =============================================================================
// Error Decoding
// =============================================================================

/**
 * Decodes an EVM revert reason from error data.
 *
 * @param data - Hex encoded error data
 * @param abi - Optional contract ABI for custom error decoding
 * @returns Decoded error reason
 *
 * @example
 * ```typescript
 * try {
 *   await contract.read.transfer(to, amount)
 * } catch (e) {
 *   if (e instanceof ContractError && e.data) {
 *     const reason = decodeRevertReason(e.data, contract.abi)
 *     console.log('Revert reason:', reason)
 *   }
 * }
 * ```
 */
export function decodeRevertReason(data: string, abi?: Abi): string {
  const hexData = data.startsWith('0x') ? data : `0x${data}`

  try {
    // Try decoding as custom error if ABI provided
    if (abi) {
      const decoded = decodeErrorResult({
        abi,
        data: hexData as `0x${string}`,
      })
      return `${decoded.errorName}(${decoded.args?.join(', ') ?? ''})`
    }
  } catch {
    // Fall through to standard error decoding
  }

  // Standard Error(string) - selector 0x08c379a0
  if (hexData.startsWith('0x08c379a0')) {
    try {
      const errorAbi = [
        {
          type: 'error',
          name: 'Error',
          inputs: [{ type: 'string', name: 'message' }],
        },
      ] as const

      const decoded = decodeErrorResult({
        abi: errorAbi,
        data: hexData as `0x${string}`,
      })
      return String(decoded.args?.[0])
    } catch {
      // Fall through
    }
  }

  // Panic(uint256) - selector 0x4e487b71
  if (hexData.startsWith('0x4e487b71')) {
    try {
      const panicAbi = [
        {
          type: 'error',
          name: 'Panic',
          inputs: [{ type: 'uint256', name: 'code' }],
        },
      ] as const

      const decoded = decodeErrorResult({
        abi: panicAbi,
        data: hexData as `0x${string}`,
      })
      const panicCode = decoded.args?.[0]
      return `Panic(${panicCode}): ${getPanicReason(panicCode)}`
    } catch {
      // Fall through
    }
  }

  return `Unknown error: ${hexData}`
}

/**
 * Gets human-readable panic reason.
 */
function getPanicReason(code: bigint): string {
  const reasons: Record<string, string> = {
    '0': 'Generic compiler panic',
    '1': 'Assert failed',
    '17': 'Arithmetic overflow/underflow',
    '18': 'Division by zero',
    '33': 'Invalid enum value',
    '34': 'Invalid storage access',
    '49': 'Pop on empty array',
    '50': 'Array index out of bounds',
    '65': 'Out of memory',
    '81': 'Call to zero-initialized function',
  }
  return reasons[code.toString()] ?? 'Unknown panic code'
}
