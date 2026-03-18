/**
 * EVM Contract Helpers
 *
 * Type-safe EVM contract interactions via gRPC or JSON-RPC.
 */

export { evmAbi } from '../abi-helpers'

// Contract factory and utilities
export { createEvmContract, createDeployEvmContractMsg, decodeRevertReason } from './contract'

// ABI utilities (re-exported from viem + bech32-aware helpers)
export {
  encodeFunctionData,
  decodeFunctionResult,
  encodeFunctionResult,
  encodeEventTopics,
  decodeEventLog,
  parseEventLogs,
  encodeErrorResult,
  decodeErrorResult,
  encodeAbiParameters,
  decodeAbiParameters,
  encodeEvmCall,
  encodeEvmParameters,
} from './abi'

// Event decoding utilities
export {
  decodeEvmLog,
  decodeEvmLogs,
  filterEvmLogsByEvent,
  getEventSignature,
  type DecodedEvmLog,
  type DecodeEvmLogsOptions,
} from './events'

// Types
export type {
  EvmContractConfig,
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
  DeployEvmContractResult,
} from './types'

// ABI types (re-exported from abitype)
export type { Abi, AbiFunction, AbiEvent, AbiError, AbiParameter } from './abi'
