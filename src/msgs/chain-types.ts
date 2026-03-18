/**
 * Backward-compatible chain message types derived from ChainConfigBuilder.
 *
 * These are computed from the chain config builders rather than manually
 * maintained interface hierarchies. Kept in a separate file to avoid
 * circular dependencies: chain-config.ts → msgs/types.ts → chains/*.ts → chain-config.ts.
 */

import type { createBaseConfig } from '../chains/common'
import type { initiaChain } from '../chains/initia'
import type { minievmChain } from '../chains/minievm'
import type { minimoveChain } from '../chains/minimove'
import type { miniwasmChain } from '../chains/miniwasm'
import type { ChainType } from '../client/types'

/** Message builders for Initia L1. */
export type InitiaMsgs = ReturnType<typeof initiaChain.build>['msgs']

/** Message builders for Minievm rollup. */
export type MinievmMsgs = ReturnType<typeof minievmChain.build>['msgs']

/** Message builders for Minimove rollup. */
export type MinimoveMsgs = ReturnType<typeof minimoveChain.build>['msgs']

/** Message builders for Miniwasm rollup. */
export type MiniwasmMsgs = ReturnType<typeof miniwasmChain.build>['msgs']

/**
 * Base message builders for generic Cosmos SDK chains.
 * Includes common modules (bank, ibc, authz, feegrant, etc.) from createBaseConfig().
 */
export type BaseMsgs = ReturnType<ReturnType<typeof createBaseConfig>['build']>['msgs']

interface MsgsMap {
  initia: InitiaMsgs
  minievm: MinievmMsgs
  minimove: MinimoveMsgs
  miniwasm: MiniwasmMsgs
  other: BaseMsgs
}

/**
 * Map a chain type to its message builders type.
 */
export type MsgsForChain<T extends ChainType> = MsgsMap[T]
