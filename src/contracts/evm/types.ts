/**
 * EVM Contract Type Definitions
 *
 * Type-safe contract interaction types using abitype for ABI inference.
 */

import type { Abi } from 'abitype'
import type {
  ContractConstructorArgs,
  ContractFunctionName,
  ContractFunctionArgs,
  ContractFunctionReturnType,
} from 'viem'
import type { MsgCallSchema } from '@buf/initia-labs_minievm.bufbuild_es/minievm/evm/v1/tx_pb'
import type { Message } from '../../msgs/types'
import type { TokenInfo } from '../types'

// =============================================================================
// Configuration Types
// =============================================================================

/**
 * EVM contract configuration.
 */
export interface EvmContractConfig<TAbi extends Abi = Abi> {
  /** Contract address (0x-prefixed hex or bech32) */
  address: string
  /** Contract ABI */
  abi: TAbi
}

// =============================================================================
// Write Options
// =============================================================================

/**
 * Options for write and estimateGas function calls.
 */
export interface WriteOptions {
  /** Native token value to send with the call (for payable functions). In smallest unit. */
  value?: string | bigint
}

// =============================================================================
// Function Type Helpers
// =============================================================================

/** View/pure function names from ABI */
type ViewFunctionName<TAbi extends Abi> = ContractFunctionName<TAbi, 'view' | 'pure'>

/** Non-payable/payable function names from ABI */
type WriteFunctionName<TAbi extends Abi> = ContractFunctionName<TAbi, 'nonpayable' | 'payable'>

// =============================================================================
// Proxy Types
// =============================================================================

/**
 * Read functions proxy type.
 *
 * Maps view/pure function names to callable async functions.
 * Return types are inferred from the ABI.
 *
 * @example
 * ```typescript
 * const balance = await contract.read.balanceOf(address)  // bigint
 * const symbol = await contract.read.symbol()             // string
 * ```
 */
export type ReadFunctions<TAbi extends Abi> = {
  [K in ViewFunctionName<TAbi>]: (
    ...args: ContractFunctionArgs<TAbi, 'view' | 'pure', K> extends readonly unknown[]
      ? ContractFunctionArgs<TAbi, 'view' | 'pure', K>
      : never
  ) => Promise<ContractFunctionReturnType<TAbi, 'view' | 'pure', K>>
}

/**
 * Write functions proxy type.
 *
 * Maps state-changing function names to functions that return MsgCall messages.
 * These messages can be signed and broadcast via signAndBroadcast().
 *
 * @example
 * ```typescript
 * // Standard call
 * const msg = contract.write.transfer(sender, to, amount)
 *
 * // Payable call with value
 * const msg = contract.write.deposit(sender, { value: '1000000' })
 * await ctx.signAndBroadcast([msg])
 * ```
 */
export type WriteFunctions<TAbi extends Abi> = {
  [K in WriteFunctionName<TAbi>]: (
    sender: string,
    ...args: ContractFunctionArgs<TAbi, 'nonpayable' | 'payable', K> extends readonly unknown[]
      ?
          | [...ContractFunctionArgs<TAbi, 'nonpayable' | 'payable', K>]
          | [...ContractFunctionArgs<TAbi, 'nonpayable' | 'payable', K>, WriteOptions]
      : never
  ) => Message<typeof MsgCallSchema>
}

/**
 * Gas estimation proxy type.
 *
 * Maps state-changing function names to async gas estimation functions.
 *
 * @example
 * ```typescript
 * const gas = await contract.estimateGas.transfer(sender, to, amount)
 * const gas = await contract.estimateGas.deposit(sender, { value: '1000000' })
 * ```
 */
export type EstimateGasFunctions<TAbi extends Abi> = {
  [K in WriteFunctionName<TAbi>]: (
    sender: string,
    ...args: ContractFunctionArgs<TAbi, 'nonpayable' | 'payable', K> extends readonly unknown[]
      ?
          | [...ContractFunctionArgs<TAbi, 'nonpayable' | 'payable', K>]
          | [...ContractFunctionArgs<TAbi, 'nonpayable' | 'payable', K>, WriteOptions]
      : never
  ) => Promise<bigint>
}

// =============================================================================
// Contract Instance Type
// =============================================================================

/**
 * EVM contract instance.
 *
 * Provides type-safe access to contract functions via proxies:
 * - `read`: View/pure functions (gRPC Query.Call)
 * - `write`: State-changing functions (returns MsgCall)
 * - `estimateGas`: Gas estimation for write functions
 *
 * @example
 * ```typescript
 * import { createEvmContract } from 'initia.js'
 *
 * const erc20 = createEvmContract(ctx, address, abi)
 *
 * // Read
 * const balance = await erc20.read.balanceOf(owner)
 *
 * // Write (sender as first arg, consistent with Move/Wasm)
 * const msg = erc20.write.transfer(sender, to, amount)
 * await ctx.signAndBroadcast([msg])
 *
 * // Gas estimation
 * const gas = await erc20.estimateGas.transfer(sender, to, amount)
 * ```
 */
export interface EvmContract<TAbi extends Abi = Abi> {
  /** Contract address */
  readonly address: string

  /** Contract ABI */
  readonly abi: TAbi

  /** Read-only functions (view/pure) - calls via gRPC Query.Call */
  readonly read: ReadFunctions<TAbi>

  /** State-changing functions - creates MsgCall messages */
  readonly write: WriteFunctions<TAbi>

  /** Gas estimation for write functions */
  readonly estimateGas: EstimateGasFunctions<TAbi>

  /**
   * Parse human-readable amount to smallest unit.
   * Requires decimals() function in ABI.
   *
   * @param value - Human-readable amount (e.g., "1.5")
   * @returns Amount in smallest unit as bigint
   *
   * @example
   * ```typescript
   * const amount = await usdc.parseUnits("1.5")  // 1500000n (6 decimals)
   * ```
   */
  parseUnits(value: string): Promise<bigint>

  /**
   * Format smallest unit to human-readable amount.
   * Requires decimals() function in ABI.
   *
   * @param value - Amount in smallest unit
   * @returns Human-readable amount as string
   *
   * @example
   * ```typescript
   * const display = await usdc.formatUnits(1500000n)  // "1.5"
   * ```
   */
  formatUnits(value: bigint): Promise<string>

  /**
   * Get ERC20 token metadata.
   * Fetches name, symbol, decimals, totalSupply in parallel.
   *
   * @returns Token info object
   *
   * @example
   * ```typescript
   * const info = await usdc.getTokenInfo()
   * // { name: "USD Coin", symbol: "USDC", decimals: 6, totalSupply: 1000000000000n }
   * ```
   */
  getTokenInfo(): Promise<TokenInfo>
}

// =============================================================================
// Deployment Types
// =============================================================================

/**
 * Options for deploying an EVM contract.
 */
export interface DeployEvmContractOptions<TAbi extends Abi = Abi> {
  /** Contract ABI */
  abi: TAbi
  /** Contract bytecode (hex string, with or without 0x prefix) */
  bytecode: string
  /** Constructor arguments (type inferred from ABI constructor inputs) */
  args?: ContractConstructorArgs<TAbi>
  /** Value to send with deployment (in smallest unit) */
  value?: bigint
}

/**
 * Result of contract deployment.
 */
export interface DeployEvmContractResult {
  /** Transaction hash */
  txHash: string
  /** Deployed contract address (0x-prefixed) */
  contractAddress: string
}

// =============================================================================
// JSON-RPC Transport Types
// =============================================================================

/**
 * Options for creating an EVM contract with JSON-RPC transport.
 */
export interface EvmContractJsonRpcOptions {
  transport: 'jsonrpc'
  /** Private key for write and estimateGas operations (0x-prefixed hex).
   *  If omitted, extracted from context.signer at runtime. */
  privateKey?: `0x${string}`
}

/**
 * Write functions proxy for JSON-RPC transport.
 *
 * Unlike gRPC write, there is no `sender` first argument
 * (derived from privateKey) and the return type is `Promise<string>` (tx hash).
 *
 * @example
 * ```typescript
 * const txHash = await contract.write.transfer(to, amount)
 * const txHash = await contract.write.deposit({ value: '1000000' })
 * ```
 */
export type JsonRpcWriteFunctions<TAbi extends Abi> = {
  [K in WriteFunctionName<TAbi>]: (
    ...args: ContractFunctionArgs<TAbi, 'nonpayable' | 'payable', K> extends readonly unknown[]
      ?
          | [...ContractFunctionArgs<TAbi, 'nonpayable' | 'payable', K>]
          | [...ContractFunctionArgs<TAbi, 'nonpayable' | 'payable', K>, WriteOptions]
      : never
  ) => Promise<string>
}

/**
 * Gas estimation proxy for JSON-RPC transport.
 *
 * Unlike gRPC estimateGas, there is no `sender` first argument
 * (derived from privateKey, or zero address if not available).
 *
 * @example
 * ```typescript
 * const gas = await contract.estimateGas.transfer(to, amount)
 * ```
 */
export type JsonRpcEstimateGasFunctions<TAbi extends Abi> = {
  [K in WriteFunctionName<TAbi>]: (
    ...args: ContractFunctionArgs<TAbi, 'nonpayable' | 'payable', K> extends readonly unknown[]
      ?
          | [...ContractFunctionArgs<TAbi, 'nonpayable' | 'payable', K>]
          | [...ContractFunctionArgs<TAbi, 'nonpayable' | 'payable', K>, WriteOptions]
      : never
  ) => Promise<bigint>
}

/**
 * EVM contract instance using JSON-RPC transport.
 *
 * Differences from gRPC `EvmContract`:
 * - `write`: no `sender` arg, returns `Promise<string>` (tx hash)
 * - `estimateGas`: no `sender` arg
 * - `read`: identical API
 * - Revert errors include raw data in `ContractError.data`
 *
 * @example
 * ```typescript
 * const erc20 = createEvmContract(ctx, address, abi, { transport: 'jsonrpc' })
 *
 * // Read (same as gRPC)
 * const balance = await erc20.read.balanceOf(owner)
 *
 * // Write (no sender, returns tx hash)
 * const txHash = await erc20.write.transfer(to, amount)
 *
 * // Estimate gas (no sender)
 * const gas = await erc20.estimateGas.transfer(to, amount)
 * ```
 */
export interface EvmContractJsonRpc<TAbi extends Abi = Abi> {
  /** Contract address */
  readonly address: string

  /** Contract ABI */
  readonly abi: TAbi

  /** Read-only functions (view/pure) - calls via JSON-RPC eth_call */
  readonly read: ReadFunctions<TAbi>

  /** State-changing functions - sends EVM transaction via JSON-RPC, returns tx hash */
  readonly write: JsonRpcWriteFunctions<TAbi>

  /** Gas estimation for write functions via JSON-RPC eth_estimateGas */
  readonly estimateGas: JsonRpcEstimateGasFunctions<TAbi>

  /** Parse human-readable amount to smallest unit (same as gRPC) */
  parseUnits(value: string): Promise<bigint>

  /** Format smallest unit to human-readable amount (same as gRPC) */
  formatUnits(value: bigint): Promise<string>

  /** Get ERC20 token metadata (same as gRPC) */
  getTokenInfo(): Promise<TokenInfo>
}
