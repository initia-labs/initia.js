/**
 * Move Contract Type Definitions
 *
 * Type definitions for Move module ABI and contract interactions.
 * Based on the Move VM ABI structure from initia.move.v1.Module.
 */

import type { Client } from '@connectrpc/connect'
import type { Query as MoveQuery } from '@buf/initia-labs_initia.bufbuild_es/initia/move/v1/query_pb'
import type {
  MsgExecuteJSON,
  MsgExecuteJSONSchema,
  MsgExecuteSchema,
  MsgScriptJSON,
  MsgPublish,
} from '@buf/initia-labs_initia.bufbuild_es/initia/move/v1/tx_pb'
import type { UpgradePolicy } from '@buf/initia-labs_initia.bufbuild_es/initia/move/v1/types_pb'
import type { Message } from '../../msgs/types'
import type { TokenInfo } from '../types'

// =============================================================================
// Move ABI Types (parsed from Module.abi JSON string)
// =============================================================================

/**
 * Move function visibility
 */
export type MoveFunctionVisibility = 'public' | 'private' | 'friend'

/**
 * Generic type parameter definition
 */
export interface MoveGenericTypeParam {
  /** Constraints on the type parameter (e.g., ['copy', 'drop', 'store']) */
  constraints: string[]
  /** Whether this type parameter is phantom (unused in struct fields) */
  is_phantom?: boolean
}

/**
 * Move struct field definition
 */
export interface MoveFieldAbi {
  /** Field name */
  name: string
  /** Field type (e.g., 'u64', 'address', 'vector<u8>') */
  type: string
}

/**
 * Move struct definition
 */
export interface MoveStructAbi {
  /** Struct name */
  name: string
  /** Whether the struct is a resource (has key ability) */
  is_native: boolean
  /** Whether this struct is an event type */
  is_event?: boolean
  /** Abilities of the struct (e.g., ['copy', 'drop', 'store', 'key']) */
  abilities: string[]
  /** Generic type parameters */
  generic_type_params: MoveGenericTypeParam[]
  /** Struct fields */
  fields: MoveFieldAbi[]
}

/**
 * Move function definition
 */
export interface MoveFunctionAbi {
  /** Function name */
  name: string
  /** Function visibility */
  visibility: MoveFunctionVisibility
  /** Whether this is an entry function (can be called in transactions) */
  is_entry: boolean
  /** Whether this is a view function (read-only, no state changes) */
  is_view: boolean
  /** Generic type parameters */
  generic_type_params: MoveGenericTypeParam[]
  /** Parameter types (e.g., ['&signer', 'address', 'u64']) */
  params: string[]
  /** Return types */
  return: string[]
}

/**
 * Move module ABI (parsed from Module.abi JSON string)
 */
export interface MoveModuleAbi {
  /** Module address (e.g., '0x1') */
  address: string
  /** Module name (e.g., 'coin') */
  name: string
  /** Friend modules that can access private functions */
  friends: string[]
  /** Exposed (public/entry/view) functions */
  exposed_functions: MoveFunctionAbi[]
  /** Struct definitions */
  structs: MoveStructAbi[]
}

// =============================================================================
// Move Contract Configuration
// =============================================================================

/**
 * Move contract configuration
 */
export interface MoveContractConfig {
  /** Module address (e.g., '0x1' or bech32) */
  moduleAddress: string
  /** Module name (e.g., 'coin') */
  moduleName: string
  /** Parsed ABI (optional, fetched automatically if not provided) */
  abi?: MoveModuleAbi
}

// =============================================================================
// Move Function Call Types
// =============================================================================

/**
 * Options for Move function calls
 */
export interface MoveCallOptions {
  /** Type arguments (e.g., ['0x1::native_uinit::Coin']) */
  typeArgs?: string[]
  /** Function arguments (encoded as BCS or JSON depending on call type) */
  args?: unknown[]
}

/**
 * Execute function proxy type (for entry functions)
 * Returns a Message that can be passed to signAndBroadcast
 */
export type MoveExecuteProxy = {
  [functionName: string]: (
    sender: string,
    options?: MoveCallOptions
  ) => Message<typeof MsgExecuteJSONSchema> | Message<typeof MsgExecuteSchema>
}

/**
 * View function proxy type (for view functions)
 * Returns the decoded result
 */
export type MoveViewProxy = {
  [functionName: string]: (options?: MoveCallOptions) => Promise<unknown>
}

// =============================================================================
// Move Contract Interface
// =============================================================================

/**
 * Move contract instance providing type-safe function calls
 */
export interface MoveContract {
  /** Module address */
  readonly moduleAddress: string
  /** Module name */
  readonly moduleName: string
  /** Parsed module ABI */
  readonly abi: MoveModuleAbi

  /**
   * Execute entry functions (creates MsgExecute for broadcasting)
   * @example
   * const msg = contract.execute.transfer(sender, {
   *   typeArgs: ['0x1::native_uinit::Coin'],
   *   args: [recipient, 1000000n]
   * })
   */
  readonly execute: MoveExecuteProxy

  /**
   * Call view functions (read-only, returns decoded result)
   * @example
   * const balance = await contract.view.balance({
   *   typeArgs: ['0x1::native_uinit::Coin'],
   *   args: [address]
   * })
   */
  readonly view: MoveViewProxy

  /**
   * Query a resource at an address
   * @param address - Account address
   * @param structTag - Resource type (e.g., '0x1::coin::CoinStore<0x1::native_uinit::Coin>')
   * @returns Parsed resource data
   */
  resource(address: string, structTag: string): Promise<unknown>

  /**
   * Query a table entry
   * @param tableHandle - Table handle address
   * @param key - Key value (will be BCS encoded)
   * @param keyType - Key type for BCS encoding
   * @param valueType - Optional value type for auto-conversion. Omit for raw JSON-parsed data.
   * @returns Parsed value; auto-converted if valueType is provided
   */
  tableEntry(
    tableHandle: string,
    key: unknown,
    keyType: string,
    valueType?: string
  ): Promise<unknown>

  /**
   * Parse a human-readable amount to minimum units for a specific coin type
   * @param value - Human-readable amount (e.g., '1.5')
   * @param coinType - Coin type (e.g., '0x1::native_uinit::Coin')
   * @returns Amount in minimum units
   */
  parseUnits(value: string, coinType: string): Promise<bigint>

  /**
   * Format minimum units to human-readable amount for a specific coin type
   * @param value - Amount in minimum units
   * @param coinType - Coin type (e.g., '0x1::native_uinit::Coin')
   * @returns Human-readable amount
   */
  formatUnits(value: bigint, coinType: string): Promise<string>

  /**
   * Get token info for a coin type by querying CoinInfo resource
   * @param coinType - Coin type (e.g., '0x1::native_uinit::Coin')
   * @returns Token info (name, symbol, decimals)
   */
  getTokenInfo(coinType: string): Promise<TokenInfo>
}

// =============================================================================
// Module Publish Types
// =============================================================================

/**
 * Options for publishing a Move module
 */
export interface PublishModuleOptions {
  /** Sender address */
  sender: string
  /** Compiled module bytecode */
  codeBytes: Uint8Array[]
  /** Upgrade policy */
  upgradePolicy?: UpgradePolicy
}

/**
 * Options for executing a Move script with JSON-encoded arguments.
 * Use this with createScriptMsg() for the simpler JSON interface.
 */
export interface ExecuteScriptOptions {
  /** Sender address */
  sender: string
  /** Compiled script bytecode */
  codeBytes: Uint8Array
  /** Type arguments */
  typeArgs?: string[]
  /** Arguments (JSON-serializable values, will be stringified) */
  args?: unknown[]
}

/**
 * Options for executing a Move script with BCS-encoded arguments.
 * Use this with createBcsScriptMsg() for pre-encoded BCS arguments.
 */
export interface BcsScriptOptions {
  /** Sender address */
  sender: string
  /** Compiled script bytecode */
  codeBytes: Uint8Array
  /** Type arguments */
  typeArgs?: string[]
  /** Arguments (BCS encoded bytes) */
  args?: Uint8Array[]
}

// =============================================================================
// Move Client Type
// =============================================================================

/**
 * Move gRPC client type (for Query service)
 */
export type MoveClient = Client<typeof MoveQuery>

// =============================================================================
// Re-exports from BSR packages for convenience
// =============================================================================

/**
 * Re-exported message types for Move transactions.
 * MsgExecuteJSON and MsgScriptJSON use JSON-encoded arguments.
 * MsgPublish is used for publishing Move modules.
 */
export type { MsgExecuteJSON as MsgExecute, MsgScriptJSON as MsgScript, MsgPublish }
export type { TableEntry } from '@buf/initia-labs_initia.bufbuild_es/initia/move/v1/types_pb'
export { UpgradePolicy } from '@buf/initia-labs_initia.bufbuild_es/initia/move/v1/types_pb'

// =============================================================================
// Static ABI Type Inference (Phase 4)
// =============================================================================

/** Readonly function ABI for `moveAbi()` / `as const` inference */
export interface ReadonlyMoveFunctionAbi {
  readonly name: string
  readonly visibility: string
  readonly is_entry: boolean
  readonly is_view: boolean
  readonly generic_type_params: readonly {
    readonly constraints: readonly string[]
    readonly is_phantom?: boolean
  }[]
  readonly params: readonly string[]
  readonly return: readonly string[]
}

/** Readonly module ABI for `moveAbi()` / `as const` inference */
export interface ReadonlyMoveModuleAbi {
  readonly address: string
  readonly name: string
  readonly friends: readonly string[]
  readonly exposed_functions: readonly ReadonlyMoveFunctionAbi[]
  readonly structs: readonly {
    readonly name: string
    readonly is_native: boolean
    readonly is_event?: boolean
    readonly abilities: readonly string[]
    readonly generic_type_params: readonly {
      readonly constraints: readonly string[]
      readonly is_phantom?: boolean
    }[]
    readonly fields: readonly { readonly name: string; readonly type: string }[]
  }[]
}

/** Map Move primitive type strings to TypeScript types */
export type MoveTypeToTs<T extends string> = T extends 'bool'
  ? boolean
  : T extends 'u8' | 'u16' | 'u32'
    ? number
    : T extends 'u64' | 'u128' | 'u256'
      ? bigint
      : T extends 'address'
        ? `0x${string}`
        : T extends '0x1::string::String'
          ? string
          : T extends `0x1::object::Object<${string}>`
            ? `0x${string}`
            : T extends `0x1::option::Option<${infer Inner}>`
              ? MoveTypeToTs<Inner> | null
              : T extends `vector<${infer Inner}>`
                ? MoveTypeToTs<Inner>[]
                : unknown

/** Convert an array of Move return types to TS types */
export type MoveReturnToTs<T extends readonly string[]> = T extends readonly []
  ? void
  : T extends readonly [infer R extends string]
    ? MoveTypeToTs<R>
    : { [K in keyof T]: T[K] extends string ? MoveTypeToTs<T[K]> : never }

/** Remove &signer from params array */
export type FilterSigner<T extends readonly string[]> = T extends readonly [
  '&signer',
  ...infer Rest extends string[],
]
  ? FilterSigner<Rest>
  : T

/** Convert filtered params to TS arg types */
type MoveParamsToTs<T extends readonly string[]> = {
  [K in keyof T]: T[K] extends string ? MoveTypeToTs<T[K]> : never
}

/** Call options with typed args (for view proxy) */
export interface TypedMoveCallOptions<TParams extends readonly string[]> {
  typeArgs?: string[]
  args: MoveParamsToTs<TParams>
}

/** View proxy with function names + typed args/returns for non-generic functions */
export type MoveViewProxyTyped<T extends ReadonlyMoveModuleAbi> = {
  [F in T['exposed_functions'][number] as F['is_view'] extends true
    ? F['name']
    : never]: F['generic_type_params'] extends readonly []
    ? (
        options: TypedMoveCallOptions<FilterSigner<F['params']>>
      ) => Promise<MoveReturnToTs<F['return']>>
    : (options: { typeArgs: string[]; args: unknown[] }) => Promise<unknown>
}

/** Execute proxy with function name autocomplete */
export type MoveExecuteProxyTyped<T extends ReadonlyMoveModuleAbi> = {
  [F in T['exposed_functions'][number] as F['is_entry'] extends true ? F['name'] : never]: (
    sender: string,
    options?: MoveCallOptions
  ) => Message<typeof MsgExecuteJSONSchema> | Message<typeof MsgExecuteSchema>
}

/** Contract with typed proxies from static ABI */
export type TypedMoveContract<T extends ReadonlyMoveModuleAbi> = Omit<
  MoveContract,
  'execute' | 'view' | 'abi'
> & {
  readonly abi: T
  readonly execute: MoveExecuteProxyTyped<T>
  readonly view: MoveViewProxyTyped<T>
}

// =============================================================================
// Mid-Level Standalone Function Options (Phase 5)
// =============================================================================

/** Options for buildMoveExecute */
export interface BuildMoveExecuteOptions {
  /** Full function identifier: '0x1::coin::transfer' */
  function: string
  /** Generic type arguments */
  typeArgs?: string[]
  /** Argument values */
  args?: unknown[]
  /** Move types for each param — enables BCS path + bech32 conversion */
  paramTypes?: string[]
}

/** Options for buildMoveView */
export interface BuildMoveViewOptions {
  /** Full function identifier: '0x1::coin::balance' */
  function: string
  /** Generic type arguments */
  typeArgs?: string[]
  /** Argument values */
  args?: unknown[]
  /** Move types for each param — enables bech32 conversion on args */
  paramTypes?: string[]
  /** Return types — enables typed response conversion (u64→bigint, etc.) */
  returns?: string[]
}
