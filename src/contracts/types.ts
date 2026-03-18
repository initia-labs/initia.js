/**
 * Smart Contract Helpers - Common Types
 *
 * Shared type definitions for EVM, Move, and Wasm contract helpers.
 */

import type { Numeric } from '../types'

/**
 * Unified token metadata interface.
 * Used by EVM (ERC20), Move (CoinInfo), and Wasm (CW20 token_info).
 */
export interface TokenInfo {
  /** Token name (e.g., "USD Coin") */
  name: string
  /** Token symbol (e.g., "USDC") */
  symbol: string
  /** Decimal places (e.g., 6 for USDC, 18 for most ERC20) */
  decimals: number
  /** Total supply in smallest unit (optional, may not be available for all tokens) */
  totalSupply?: bigint
}

/**
 * NFT metadata interface.
 * Used by EVM (ERC721) and Wasm (CW721 nft_info).
 */
export interface NftInfo {
  /** Token URI pointing to metadata JSON */
  tokenUri?: string
  /** Extension data (contract-specific metadata) */
  extension?: unknown
}

/**
 * NFT ownership response.
 * Used by EVM (ERC721 ownerOf) and Wasm (CW721 owner_of).
 */
export interface OwnerOfResponse {
  /** Owner address */
  owner: string
  /** List of approved addresses for this token */
  approvals: NftApproval[]
}

/**
 * NFT approval information.
 */
export interface NftApproval {
  /** Approved spender address */
  spender: string
  /** Expiration timestamp or block height (optional) */
  expires?: NftExpiration
}

/**
 * NFT approval expiration.
 */
export interface NftExpiration {
  /** Expiration at specific block height */
  atHeight?: Numeric
  /** Expiration at specific timestamp (seconds) */
  atTime?: Numeric
  /** Never expires */
  never?: boolean
}
