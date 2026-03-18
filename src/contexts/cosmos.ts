/**
 * Generic Cosmos chain context config (chainType 'other').
 * Uses createBaseConfig() — only shared cosmos modules (bank, auth, ibc, etc.).
 * No chain-specific proto.
 */
import { createBaseConfig } from '../chains/common'
import type { TypedFactoryOptions } from '../wallet/typed-context'

// createBaseConfig() returns a ChainConfigBuilder — treat it like the chain-specific builders.
// @__PURE__ annotation tells bundlers this call is droppable if cosmosContextConfig is unused.
const cosmosChain = /* @__PURE__ */ createBaseConfig()

export const cosmosContextConfig = [
  cosmosChain,
  {} satisfies TypedFactoryOptions,
] as const
