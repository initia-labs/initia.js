/**
 * Token Module - VM-agnostic token abstraction.
 *
 * Provides a unified TokenContract interface that works across
 * EVM (ERC20), Wasm (CW20), and Move (Fungible Asset) chains.
 */

export type { TokenContract } from './types'
export {
  resolveTokenContract,
  type EvmEnabled,
  type WasmEnabled,
  type MoveEnabled,
} from './resolver'
export { createErc20Token } from './erc20'
export { createCw20Token } from './cw20'
export { createFungibleAssetToken } from './fungible-asset'
