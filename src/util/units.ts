/**
 * Pure BigInt implementations of formatUnits / parseUnits.
 *
 * Drop-in replacements for viem's formatUnits / parseUnits,
 * used in core modules to avoid importing viem.
 */

/**
 * Format a bigint value as a decimal string.
 *
 * Accepts only bigint — not number — to prevent silent precision loss.
 * JavaScript numbers lose precision above 2^53, which for 18-decimal
 * tokens (EVM standard) is only ~0.009 ETH.
 *
 * @param value - The raw integer value (bigint only)
 * @param decimals - Number of decimal places
 * @returns Decimal string with trailing zeros trimmed
 *
 * @example formatUnits(1500000n, 6) → '1.5'
 * @example formatUnits(500n, 6) → '0.0005'
 * @example formatUnits(1000000n, 6) → '1'
 */
export function formatUnits(value: bigint, decimals: number): string {
  if (decimals === 0) return value.toString()

  const negative = value < 0n
  const abs = negative ? -value : value
  const str = abs.toString()
  const sign = negative ? '-' : ''

  if (str.length <= decimals) {
    const fraction = str.padStart(decimals, '0').replace(/0+$/, '')
    return fraction ? `${sign}0.${fraction}` : `${sign}0`
  }

  const intPart = str.slice(0, str.length - decimals)
  const fracPart = str.slice(str.length - decimals).replace(/0+$/, '')
  return fracPart ? `${sign}${intPart}.${fracPart}` : `${sign}${intPart}`
}

/**
 * Parse a decimal string into a bigint.
 *
 * @param value - Decimal string (e.g., '1.5')
 * @param decimals - Number of decimal places
 * @returns BigInt representation
 *
 * @example parseUnits('1.5', 6) → 1500000n
 * @example parseUnits('0.0005', 6) → 500n
 */
export function parseUnits(value: string, decimals: number): bigint {
  if (decimals === 0) return BigInt(value)

  const negative = value.startsWith('-')
  const str = negative ? value.slice(1) : value

  const dotIndex = str.indexOf('.')
  const intPart = dotIndex === -1 ? str : str.slice(0, dotIndex)
  const fracPart = dotIndex === -1 ? '' : str.slice(dotIndex + 1)

  // Truncate excess decimals, pad if too short
  const paddedFrac = fracPart.slice(0, decimals).padEnd(decimals, '0')
  const result = BigInt(intPart + paddedFrac)
  return negative ? -result : result
}
