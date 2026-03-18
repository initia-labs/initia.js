/**
 * Move Contract Module
 *
 * Provides utilities for interacting with Move modules on Initia.
 */

export { moveAbi } from '../abi-helpers'

// Types
export type {
  MoveModuleAbi,
  MoveFunctionAbi,
  MoveStructAbi,
  MoveFieldAbi,
  MoveGenericTypeParam,
  MoveFunctionVisibility,
  MoveContractConfig,
  MoveCallOptions,
  MoveExecuteProxy,
  MoveViewProxy,
  MoveContract,
  PublishModuleOptions,
  ExecuteScriptOptions,
  BcsScriptOptions,
  MoveClient,
  ReadonlyMoveModuleAbi,
  ReadonlyMoveFunctionAbi,
  TypedMoveContract,
  MoveTypeToTs,
  BuildMoveExecuteOptions,
  BuildMoveViewOptions,
} from './types'

// Re-export BSR types
export type { MsgExecute, MsgScript, MsgPublish } from './types'
export { UpgradePolicy } from './types'

// Contract factory and helpers
export {
  createMoveContract,
  createPublishMsg,
  createScriptMsg,
  createBcsScriptMsg,
  createExecuteMsg,
  callViewFunction,
  buildMoveExecute,
  buildMoveView,
  queryResource,
  queryTableEntry,
  type CreateMoveContractOptions,
  type MoveQueryClient,
} from './contract'

// ABI fetcher
export {
  getModuleAbi,
  getModulesAbi,
  parseModuleAbi,
  getCachedAbi,
  cacheModuleAbi,
  clearAbiCache,
  findFunction,
  findStruct,
  getEntryFunctions,
  getViewFunctions,
  requiresSigner,
  getNonSignerParams,
  type FetchAbiOptions,
} from './abi-fetcher'

// BCS utilities
export {
  bcs,
  parseMoveType,
  getBcsType,
  encodeMoveArg,
  encodeMoveArgs,
  decodeMoveResult,
  decodeMoveResults,
  hexToBytes,
  bytesToHex,
  type ParsedMoveType,
} from './bcs'
