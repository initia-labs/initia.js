/**
 * Backward-compatible chain client types derived from ChainConfigBuilder.
 *
 * Mirrors the pattern in `msgs/chain-types.ts` — computed from chain config
 * builders via `ReturnType` + `ServiceClients`, not manually maintained.
 * Kept in a separate file to avoid circular dependencies.
 *
 * All imports are `import type` — zero runtime cost, no tree-shaking impact.
 */

/* eslint-disable @typescript-eslint/no-empty-object-type -- intentional: interface extends preserves name on IDE hover */

import type { ServiceClients } from './grpc-client'
import type { initiaChain } from '../chains/initia'
import type { minievmChain } from '../chains/minievm'
import type { minimoveChain } from '../chains/minimove'
import type { miniwasmChain } from '../chains/miniwasm'
import type { createBaseConfig } from '../chains/common'

/** Query client for Initia L1 (base + move, mstaking, distribution, gov, ophost). */
export interface InitiaClient extends ServiceClients<
  ReturnType<typeof initiaChain.build>['services']
> {}

/** Query client for Minievm rollup (base + evm, opchild). */
export interface MinievmClient extends ServiceClients<
  ReturnType<typeof minievmChain.build>['services']
> {}

/** Query client for Minimove rollup (base + move, opchild). */
export interface MinimoveClient extends ServiceClients<
  ReturnType<typeof minimoveChain.build>['services']
> {}

/** Query client for Miniwasm rollup (base + wasm, opchild). */
export interface MiniwasmClient extends ServiceClients<
  ReturnType<typeof miniwasmChain.build>['services']
> {}

/** Query client for generic Cosmos SDK chains (all shared base modules from createBaseConfig). */
export interface BaseClient extends ServiceClients<
  ReturnType<ReturnType<typeof createBaseConfig>['build']>['services']
> {}
