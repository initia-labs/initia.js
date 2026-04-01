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
  WidenAddress,
  MoveTypeToTs,
  MoveTypeToTsWithStructs,
  MoveReturnToTs,
  BuildMoveExecuteOptions,
  BuildMoveViewOptions,
} from './types'

// Re-export BSR types
export type { MsgExecute, MsgScript, MsgPublish, TableEntry } from './types'
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
  findFunction,
  findStruct,
  getEntryFunctions,
  getViewFunctions,
  requiresSigner,
  getNonSignerParams,
  type FetchAbiOptions,
} from './abi-fetcher'

// Resource conversion
export {
  parseStructTag,
  createAbiResolver,
  convertResourceValue,
  DEFAULT_OPAQUE_TYPES,
  type ParsedStructTag,
  type AbiResolver,
} from './resource-conversion'

// BCS utilities
export {
  bcs,
  parseMoveType,
  stringifyType,
  getBcsType,
  encodeMoveArg,
  encodeMoveArgs,
  decodeMoveResult,
  decodeMoveResults,
  hexToBytes,
  bytesToHex,
  type ParsedMoveType,
} from './bcs'
