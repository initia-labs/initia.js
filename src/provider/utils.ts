import { formatUnits, parseUnits } from '../util/units'

/**
 * Convert amount between denom units (viem-based, no precision loss).
 *
 * @param amount - Amount string. Decimal input allowed when exponentDiff > 0.
 *   When exponentDiff < 0, must be integer string (BigInt conversion).
 * @param exponentDiff - fromUnit.exponent - toUnit.exponent
 * @returns Converted amount string
 *
 * @example convertDenomAmount('1.5', 6)      → '1500000'  (INIT → uinit)
 * @example convertDenomAmount('1500000', -6)  → '1.5'      (uinit → INIT)
 * @example convertDenomAmount('500', -6)      → '0.0005'   (precision preserved)
 *
 * @internal Not exported from public API
 */
export function convertDenomAmount(amount: string, exponentDiff: number): string {
  if (exponentDiff === 0) return amount

  if (exponentDiff > 0) {
    // Larger unit → smaller unit (e.g., INIT → uinit): parseUnits
    return parseUnits(amount, exponentDiff).toString()
  } else {
    // Smaller unit → larger unit (e.g., uinit → INIT): formatUnits
    return formatUnits(BigInt(amount), -exponentDiff)
  }
}
