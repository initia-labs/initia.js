/**
 * Smart Contract Helpers - Utility Functions
 *
 * Token unit conversion utilities for working with decimal amounts.
 */

/**
 * Converts a human-readable amount to the smallest unit (bigint).
 *
 * @param value - Human-readable amount (e.g., "1.5")
 * @param decimals - Number of decimal places (e.g., 6 for USDC, 18 for ETH)
 * @returns Amount in smallest unit as bigint
 *
 * @example
 * ```typescript
 * parseUnits("1.5", 6)   // → 1500000n (USDC)
 * parseUnits("1.5", 18)  // → 1500000000000000000n (ETH)
 * parseUnits("0.1", 6)   // → 100000n
 * ```
 */
export { parseUnits } from 'viem'

/**
 * Converts the smallest unit (bigint) to a human-readable amount.
 *
 * @param value - Amount in smallest unit as bigint
 * @param decimals - Number of decimal places (e.g., 6 for USDC, 18 for ETH)
 * @returns Human-readable amount as string
 *
 * @example
 * ```typescript
 * formatUnits(1500000n, 6)   // → "1.5" (USDC)
 * formatUnits(1500000000000000000n, 18)  // → "1.5" (ETH)
 * formatUnits(100000n, 6)    // → "0.1"
 * ```
 */
export { formatUnits } from 'viem'
