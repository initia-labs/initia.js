/**
 * Token Contract - VM-agnostic token abstraction types.
 *
 * Provides a unified interface for token operations across
 * EVM (ERC20), Wasm (CW20), and Move (Fungible Asset) VMs.
 */

import type { Numeric } from '../types'
import type { Message } from '../msgs/types'
import type { TokenInfo } from '../contracts/types'

export type { TokenInfo }

/**
 * VM-agnostic token contract interface.
 *
 * Provides common token operations that work across all VM types.
 * Use `getTokenContract()` from ChainContext to obtain an instance.
 *
 * @example
 * ```typescript
 * const token = ctx.getTokenContract('0x1234...')
 * const balance = await token.balanceOf(owner)
 * const msg = token.createTransferMsg(sender, recipient, 1000000n)
 * ```
 */
export interface TokenContract {
  /** Get token metadata (name, symbol, decimals) */
  getInfo(): Promise<TokenInfo>

  /** Get balance of owner address */
  balanceOf(owner: string): Promise<bigint>

  /** Create a transfer message for signing */
  createTransferMsg(sender: string, to: string, amount: Numeric): Message

  /**
   * Get allowance granted to spender.
   * Only available for ERC20 and CW20 tokens.
   * Returns undefined for Move fungible assets (no allowance concept).
   */
  allowance?(owner: string, spender: string): Promise<bigint>

  /**
   * Create an approve message for signing.
   * - ERC20: sets exact allowance
   * - CW20: uses increase_allowance (assumes zero prior allowance)
   * - Move: not available
   */
  createApproveMsg?(sender: string, spender: string, amount: Numeric): Message
}
