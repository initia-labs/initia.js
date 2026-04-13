/**
 * Browser entry point for initia.js
 *
 * Uses gRPC-web transport compatible with all modern browsers.
 */

export * from './index'

import type { ChainInfo } from './provider/types'
import type { TransportOptions } from './client/transport-common'
import { createTransport } from './client/transport.browser'
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

export const createInitiaContext = /* @__PURE__ */ buildTypedFactory(
  'initia',
  createTransport,
  initiaContextConfig[0],
  initiaContextConfig[1]
)
export const createEvmContext = /* @__PURE__ */ buildTypedFactory(
  'minievm',
  createTransport,
  minievmContextConfig[0],
  minievmContextConfig[1]
)
export const createWasmContext = /* @__PURE__ */ buildTypedFactory(
  'miniwasm',
  createTransport,
  miniwasmContextConfig[0],
  miniwasmContextConfig[1]
)
export const createMoveContext = /* @__PURE__ */ buildTypedFactory(
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
 * Create a ChainContext from chain info (browser).
 *
 * Note: This imports all chain configs at runtime for dynamic resolution.
 * If your chain type is known at build time, prefer the typed factories
 * (createInitiaContext, createEvmContext, etc.) for smaller bundles.
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
 * Create a gRPC client from chain info (browser).
 *
 * Note: Imports all chain configs. Prefer per-chain subpath imports for smaller bundles.
 */
export function createClient(chainInfo: ChainInfo, options?: TransportOptions): Client {
  const transport = createTransport(chainInfo, options)
  return resolveClient(chainInfo, transport)
}
