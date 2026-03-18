/**
 * Node.js entry point for initia.js
 *
 * Uses native gRPC over HTTP/2 for optimal performance.
 * All APIs are synchronous (no async transport creation needed).
 */

export * from './index'

// Node.js-only providers (uses node:fs, not available in browser builds)
export {
  LocalRegistryProvider,
  createLocalRegistryProvider,
  type LocalRegistryProviderOptions,
} from './provider/local-registry-provider'

import type { ChainInfo } from './provider/types'
import type { TransportOptions } from './client/transport-common'
import { createTransport } from './client/transport.node'
import type { Client } from './client/types'
import { resolveServices, resolveRegistry, resolveMsgs } from './chains/resolve'
import { resolveClient } from './client/resolve-client'
import { buildChainContextFactory } from './wallet/chain-context'
import { buildTypedFactory } from './wallet/typed-context'
import {
  resolveTokenContract,
  type EvmEnabled,
  type WasmEnabled,
  type MoveEnabled,
} from './token/resolver'

// Per-chain context configs (tree-shakeable — each imports only its own chain proto)
import { initiaContextConfig } from './contexts/initia'
import { minievmContextConfig } from './contexts/minievm'
import { minimoveContextConfig } from './contexts/minimove'
import { miniwasmContextConfig } from './contexts/miniwasm'
import { cosmosContextConfig } from './contexts/cosmos'

export { createTransport }

// =============================================================================
// Per-chain typed factories (tree-shakeable)
// =============================================================================

/**
 * Typed context factories — create ChainContext without generic params.
 *
 * Each factory imports only its own chain's services and msgs,
 * enabling tree-shaking of unused chain types.
 */
export const createInitiaContext = /* @__PURE__ */ buildTypedFactory(
  'initia',
  createTransport,
  initiaContextConfig[0],
  initiaContextConfig[1]
)
export const createMinievmContext = /* @__PURE__ */ buildTypedFactory(
  'minievm',
  createTransport,
  minievmContextConfig[0],
  minievmContextConfig[1]
)
export const createMiniwasmContext = /* @__PURE__ */ buildTypedFactory(
  'miniwasm',
  createTransport,
  miniwasmContextConfig[0],
  miniwasmContextConfig[1]
)
export const createMinimoveContext = /* @__PURE__ */ buildTypedFactory(
  'minimove',
  createTransport,
  minimoveContextConfig[0],
  minimoveContextConfig[1]
)
export const createCosmosContext = /* @__PURE__ */ buildTypedFactory(
  'other',
  createTransport,
  cosmosContextConfig[0],
  cosmosContextConfig[1]
)

// =============================================================================
// Runtime-resolved APIs (import all chains via resolve.ts — tree-shaken if unused)
// =============================================================================

/**
 * Create a ChainContext from chain info (Node.js).
 *
 * Note: This imports all chain configs at runtime for dynamic resolution.
 * If your chain type is known at build time, prefer the typed factories
 * (createInitiaContext, createMinievmContext, etc.) for smaller bundles.
 */
export const createChainContext = /* @__PURE__ */ buildChainContextFactory(
  createTransport,
  resolveServices,
  resolveMsgs,
  {
    tokenResolver: (client, chainType, token, sender) =>
      resolveTokenContract(
        client as EvmEnabled & WasmEnabled & MoveEnabled,
        chainType as 'minievm',
        token,
        sender
      ),
    getTypeRegistry: resolveRegistry,
  }
)

/**
 * Create a gRPC client from chain info (Node.js).
 *
 * Note: Imports all chain configs. Prefer per-chain subpath imports for smaller bundles.
 */
export function createClient(chainInfo: ChainInfo, options?: TransportOptions): Client {
  const transport = createTransport(chainInfo, options)
  return resolveClient(chainInfo, transport)
}
