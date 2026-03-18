/**
 * CosmWasm Contract Module
 *
 * Provides utilities for interacting with CosmWasm contracts.
 */

export { wasmAbi } from '../abi-helpers'

// Types
export type {
  JsonSchema,
  WasmContractSchema,
  ReadonlyWasmVariant,
  ReadonlyWasmMsgSchema,
  ReadonlyWasmContractSchema,
  WasmContractConfig,
  ExecuteMsg,
  QueryMsg,
  InstantiateMsg,
  MigrateMsg,
  WasmExecuteProxy,
  WasmQueryProxy,
  ExtractVariantNames,
  WasmExecuteProxyTyped,
  WasmQueryProxyTyped,
  TypedWasmContract,
  WasmContract,
  StoreCodeOptions,
  InstantiateContractOptions,
  InstantiateContract2Options,
  MigrateContractOptions,
  UpdateAdminOptions,
  ClearAdminOptions,
  WasmClient,
} from './types'

// Re-export BSR types
export type {
  MsgStoreCode,
  MsgInstantiateContract,
  MsgExecuteContract,
  MsgMigrateContract,
  MsgUpdateAdmin,
  MsgClearAdmin,
  AccessConfig,
  ContractInfo,
} from './types'

// Contract factory and helpers
export {
  createWasmContract,
  createStoreCodeMsg,
  createInstantiateMsg,
  createInstantiate2Msg,
  createWasmExecuteMsg,
  createMigrateMsg,
  createUpdateAdminMsg,
  createClearAdminMsg,
  queryContract,
  getContractInfo,
  getRawContractState,
  getCodeInfo,
  getContractsByCode,
  getContractHistory,
  type CreateWasmContractOptions,
  type WasmQueryClient,
} from './contract'

// Schema utilities
export {
  getSchemaVariants,
  getVariantSchema,
  validateMessageStructure,
  validateExecuteMsg,
  validateQueryMsg,
  getSchemaInfo,
  getResponseSchema,
  inferTypeFromSchema,
} from './schema'
