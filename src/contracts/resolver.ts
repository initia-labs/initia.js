/**
 * Contract Resolver - VM dispatch logic.
 *
 * Resolves contract creation to the appropriate VM-specific factory
 * based on chain type. Mirrors the token resolver pattern.
 */

import type { ChainType, HasEvmService, HasMoveService, HasWasmService } from '../client/types'
import { createMoveContract } from './move/contract'
import { createEvmContract } from './evm/contract'
import { createWasmContract } from './wasm/contract'
import type { MoveContract, ReadonlyMoveModuleAbi, TypedMoveContract } from './move/types'
import type { Abi } from 'abitype'
import type { EvmContract, EvmContractJsonRpc, EvmContractJsonRpcOptions } from './evm/types'
import type { WasmContract, ReadonlyWasmContractSchema, TypedWasmContract } from './wasm/types'
import type { CreateMoveContractOptions } from './move/contract'
import type { CreateWasmContractOptions } from './wasm/contract'

/**
 * Resolve contract creation to the appropriate VM-specific factory.
 *
 * Dispatch rules:
 * - initia/minimove → createMoveContract(context, abi) or createMoveContract(context, addr, mod, opts?)
 * - minievm → createEvmContract(context, address, abi, options?)
 * - miniwasm → createWasmContract(context, contractAddress, schema) [typed]
 *              or createWasmContract(context, contractAddress, options?) [untyped]
 */
export function resolveContract<const T extends ReadonlyMoveModuleAbi>(
  context: HasMoveService,
  chainType: 'initia' | 'minimove',
  abi: T
): TypedMoveContract<T>
export function resolveContract(
  context: HasMoveService,
  chainType: 'initia' | 'minimove',
  moduleAddress: string,
  moduleName: string,
  options?: CreateMoveContractOptions
): Promise<MoveContract>
export function resolveContract<const T extends Abi>(
  context: HasEvmService,
  chainType: 'minievm',
  address: string,
  abi: T,
  options?: EvmContractJsonRpcOptions
): EvmContract<T> | EvmContractJsonRpc<T>
export function resolveContract<const T extends ReadonlyWasmContractSchema>(
  context: HasWasmService,
  chainType: 'miniwasm',
  contractAddress: string,
  schema: T
): TypedWasmContract<T>
export function resolveContract(
  context: HasWasmService,
  chainType: 'miniwasm',
  contractAddress: string,
  options?: CreateWasmContractOptions
): WasmContract
export function resolveContract(
  context: HasEvmService | HasWasmService | HasMoveService,
  chainType: ChainType,
  ...args: unknown[]
):
  | TypedMoveContract<any>
  | Promise<MoveContract>
  | EvmContract
  | EvmContractJsonRpc
  | TypedWasmContract<any>
  | WasmContract {
  switch (chainType) {
    case 'initia':
    case 'minimove': {
      const ctx = context as HasMoveService
      // Static ABI path (sync): first arg is an object
      if (typeof args[0] !== 'string') {
        return createMoveContract(ctx, args[0] as ReadonlyMoveModuleAbi)
      }
      // Runtime ABI path (async): first arg is address string
      const [moduleAddress, moduleName, options] = args as [
        string,
        string,
        CreateMoveContractOptions?,
      ]
      return createMoveContract(ctx, moduleAddress, moduleName, options)
    }

    case 'minievm': {
      const [address, abi, options] = args as [string, unknown, unknown]
      // eslint-disable-next-line @typescript-eslint/no-explicit-any, @typescript-eslint/no-unsafe-argument
      return createEvmContract(context as HasEvmService, address, abi as any, options as any)
    }

    case 'miniwasm': {
      const [contractAddress, schemaOrOptions] = args as [string, unknown]
      return createWasmContract(context as HasWasmService, contractAddress, schemaOrOptions as any)
    }

    default:
      throw new Error(
        `Contract creation not supported for chain type "${chainType}". ` +
          'Use a typed factory (createInitiaContext, createMinievmContext, etc.) for contract support.'
      )
  }
}
