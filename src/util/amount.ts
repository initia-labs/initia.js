import { formatUnits } from './units'

/**
 * Format a base amount for human-readable display.
 *
 * Built on top of formatUnits with additional display options:
 * maxDecimals, minDecimals, and trimTrailingZeros.
 *
 * Note: maxDecimals uses truncation (not rounding).
 * e.g., '1.23456' + maxDecimals: 4 → '1.2345' (not '1.2346')
 *
 * @example formatTokenAmount('1500000', 6) → '1.5'
 * @example formatTokenAmount('1000000', 6, { minDecimals: 2 }) → '1.00'
 * @example formatTokenAmount('1234567890123456789', 18, { maxDecimals: 4 }) → '1.2345'
 */
export function formatTokenAmount(
  amount: string | bigint,
  decimals: number,
  options: {
    maxDecimals?: number
    minDecimals?: number
    trimTrailingZeros?: boolean
  } = {}
): string {
  const { maxDecimals = decimals, minDecimals = 0, trimTrailingZeros = true } = options

  const value = typeof amount === 'string' ? BigInt(amount) : amount

  // formatUnits handles negatives and full precision
  const result = formatUnits(value, decimals)

  // Apply maxDecimals / minDecimals / trimming
  const dotIdx = result.indexOf('.')
  if (dotIdx === -1) {
    // Integer result (formatUnits already stripped trailing zeros)
    const targetDecimals = !trimTrailingZeros ? Math.min(maxDecimals, decimals) : minDecimals
    return targetDecimals > 0 ? result + '.' + '0'.repeat(targetDecimals) : result
  }

  let fractionStr = result.slice(dotIdx + 1)
  const intPart = result.slice(0, dotIdx)

  // Restore trailing zeros stripped by formatUnits (when trimTrailingZeros is false)
  if (!trimTrailingZeros && fractionStr.length < decimals) {
    fractionStr = fractionStr.padEnd(decimals, '0')
  }

  // Limit max decimals (truncation, not rounding)
  if (fractionStr.length > maxDecimals) {
    fractionStr = fractionStr.slice(0, maxDecimals)
  }

  // Trim trailing zeros
  if (trimTrailingZeros) {
    fractionStr = fractionStr.replace(/0+$/, '')
  }

  // Pad to min decimals
  if (fractionStr.length < minDecimals) {
    fractionStr = fractionStr.padEnd(minDecimals, '0')
  }

  return fractionStr ? `${intPart}.${fractionStr}` : intPart
}
