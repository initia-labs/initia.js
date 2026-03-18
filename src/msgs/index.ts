/**
 * Message builders module.
 *
 * Provides message class, builders, and chain-specific message types.
 */

// Re-export Message class (value) and core types
export {
  Message,
  msg,
  msgCustom,
  msgWithDefaults,
  isMessageOf,
  normalizeInit,
  normalizeMsg,
  defaultTimeout,
  type FriendlyInit,
  type FriendlyCustomInit,
  type WithDefaults,
} from './types'
export type {
  JsonMsg,
  MsgInput,
} from './types'

// Re-export chain message types (backward compat aliases derived from chain configs)
export type {
  BaseMsgs,
  InitiaMsgs,
  MinimoveMsgs,
  MiniwasmMsgs,
  MinievmMsgs,
  MsgsForChain,
} from './types'

// Re-export coin/bytes helpers
export { toProtoCoin, toProtoCoins, hexToBytes } from './types'

// Re-export decode
export { createDecode } from './decode'
