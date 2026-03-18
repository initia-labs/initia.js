/**
 * Coin module - Immutable coin representation for blockchain amounts.
 *
 * Internal storage uses BSR proto schemas (CoinSchema / DecCoinSchema)
 * from `@buf/cosmos_cosmos-sdk.bufbuild_es/cosmos/base/v1beta1/coin_pb`.
 */

import { create, toJson } from '@bufbuild/protobuf'
import {
  CoinSchema,
  DecCoinSchema,
  type Coin as ProtoCoin,
  type DecCoin as ProtoDecCoin,
} from '@buf/cosmos_cosmos-sdk.bufbuild_es/cosmos/base/v1beta1/coin_pb'
import { ValidationError, ParseError } from '../errors'

/**
 * Object with denom and amount fields (compatible with protobuf Coin).
 */
export interface CoinLike {
  readonly denom: string
  readonly amount: string | bigint | number
}

/**
 * Immutable coin class for representing blockchain token amounts.
 *
 * Uses BigInt internally for precise arithmetic operations.
 * All operations return new Coin instances (immutable).
 *
 * @example
 * ```typescript
 * const fee = new Coin('uinit', 1000)
 * const doubled = fee.mul(2)
 * console.log(doubled.amount) // '2000'
 * ```
 */
export class Coin {
  private readonly _proto: ProtoCoin

  constructor(denom: string, amount: string | bigint | number) {
    if (typeof amount === 'string' && !/^-?\d+$/.test(amount)) {
      throw new ValidationError('amount', `Invalid numeric string: '${amount}'`)
    }
    // isSafeInteger rejects NaN, Infinity, floats, and integers > 2^53 that lose precision in String()
    if (typeof amount === 'number' && !Number.isSafeInteger(amount)) {
      throw new ValidationError('amount', `Amount must be a safe integer, got: ${amount}`)
    }
    this._proto = create(CoinSchema, { denom, amount: String(amount) })
  }

  /**
   * Get denom.
   */
  get denom(): string {
    return this._proto.denom
  }

  /**
   * Get amount as string (protobuf compatible).
   */
  get amount(): string {
    return this._proto.amount
  }

  /**
   * Get amount as BigInt (for arithmetic operations).
   */
  get amountBigInt(): bigint {
    return BigInt(this._proto.amount)
  }

  /**
   * Add another coin of the same denom.
   * @throws Error if denoms don't match
   */
  add(other: Coin): Coin {
    this.assertSameDenom(other)
    return new Coin(this.denom, this.amountBigInt + other.amountBigInt)
  }

  /**
   * Subtract another coin of the same denom.
   * @throws Error if denoms don't match
   */
  sub(other: Coin): Coin {
    this.assertSameDenom(other)
    return new Coin(this.denom, this.amountBigInt - other.amountBigInt)
  }

  /**
   * Multiply by a scalar value.
   */
  mul(n: bigint | number): Coin {
    return new Coin(this.denom, this.amountBigInt * BigInt(n))
  }

  /**
   * Check equality with another coin.
   * @throws Error if denoms don't match
   */
  eq(other: Coin): boolean {
    this.assertSameDenom(other)
    return this.amountBigInt === other.amountBigInt
  }

  /**
   * Check if greater than another coin.
   * @throws Error if denoms don't match
   */
  gt(other: Coin): boolean {
    this.assertSameDenom(other)
    return this.amountBigInt > other.amountBigInt
  }

  /**
   * Check if greater than or equal to another coin.
   * @throws Error if denoms don't match
   */
  gte(other: Coin): boolean {
    this.assertSameDenom(other)
    return this.amountBigInt >= other.amountBigInt
  }

  /**
   * Check if less than another coin.
   * @throws Error if denoms don't match
   */
  lt(other: Coin): boolean {
    this.assertSameDenom(other)
    return this.amountBigInt < other.amountBigInt
  }

  /**
   * Check if less than or equal to another coin.
   * @throws Error if denoms don't match
   */
  lte(other: Coin): boolean {
    this.assertSameDenom(other)
    return this.amountBigInt <= other.amountBigInt
  }

  /**
   * Return a BSR proto Coin message (defensive clone).
   */
  toProto(): ProtoCoin {
    return create(CoinSchema, { denom: this._proto.denom, amount: this._proto.amount })
  }

  /**
   * Return a plain `{ denom, amount }` object via buf's canonical toJson.
   */
  toJSON(): { denom: string; amount: string } {
    return toJson(CoinSchema, this._proto) as { denom: string; amount: string }
  }

  /**
   * Return Amino-compatible `{ denom, amount }` object via buf's canonical toJson.
   */
  toAmino(): { denom: string; amount: string } {
    return toJson(CoinSchema, this._proto) as { denom: string; amount: string }
  }

  /**
   * Format coin for human-readable display.
   *
   * @param options - Formatting options
   * @param options.decimals - Number of decimal places (for display conversion)
   * @param options.symbol - Custom symbol to display (defaults to denom)
   * @returns Formatted string like '1.5 INIT'
   *
   * @example
   * ```typescript
   * const c = new Coin('uinit', '1500000')
   * c.format() // '1500000 uinit'
   * c.format({ decimals: 6 }) // '1.5 uinit'
   * c.format({ decimals: 6, symbol: 'INIT' }) // '1.5 INIT'
   * ```
   */
  format(options?: { decimals?: number; symbol?: string }): string {
    const symbol = options?.symbol ?? this.denom
    const decimals = options?.decimals

    if (decimals === undefined || decimals === 0) {
      return `${this.amount} ${symbol}`
    }

    const amountBig = this.amountBigInt
    const divisor = 10n ** BigInt(decimals)
    const integerPart = amountBig / divisor
    const fractionalPart = amountBig % divisor

    if (fractionalPart === 0n) {
      return `${integerPart} ${symbol}`
    }

    // Pad fractional part with leading zeros and trim trailing zeros
    const fractionalStr = fractionalPart.toString().padStart(decimals, '0').replace(/0+$/, '')

    return `${integerPart}.${fractionalStr} ${symbol}`
  }

  /**
   * Convert integer Coin to DecCoin with 18 fractional zero digits.
   *
   * @example
   * ```typescript
   * const c = new Coin('uinit', '42')
   * c.toDecCoin().amount // '42.000000000000000000'
   * ```
   */
  toDecCoin(): DecCoin {
    return new DecCoin(this.denom, this.amount + '.000000000000000000')
  }

  private assertSameDenom(other: Coin): void {
    if (this.denom !== other.denom) {
      throw new ValidationError('denom', `Mismatch: ${this.denom} vs ${other.denom}`)
    }
  }

  // ===========================================================================
  // Static Coin[] utilities
  // ===========================================================================

  /**
   * Find a single coin by denom from a coin array.
   *
   * @example
   * ```typescript
   * const uinit = Coin.find(balances, 'uinit')
   * ```
   */
  static find(coins: CoinLike[], denom: string): Coin | undefined {
    const found = coins.find(c => c.denom === denom)
    return found ? new Coin(found.denom, found.amount) : undefined
  }

  /**
   * Sum all amounts of a specific denom.
   *
   * @example
   * ```typescript
   * const total = Coin.sum(balances, 'uinit') // → bigint
   * ```
   */
  static sum(coins: CoinLike[], denom: string): bigint {
    let total = 0n
    for (const c of coins) {
      if (c.denom === denom) total += BigInt(c.amount)
    }
    return total
  }

  /**
   * Merge coins with the same denom, summing their amounts.
   *
   * @example
   * ```typescript
   * const merged = Coin.merge([coin('uinit', 100), coin('uinit', 200), coin('uusdc', 50)])
   * // → [Coin('uinit', 300), Coin('uusdc', 50)]
   * ```
   */
  static merge(coins: CoinLike[]): Coin[] {
    const map = new Map<string, bigint>()
    for (const c of coins) {
      map.set(c.denom, (map.get(c.denom) ?? 0n) + BigInt(c.amount))
    }
    return Array.from(map, ([denom, amount]) => new Coin(denom, amount))
  }

  /**
   * Subtract fee coins from a coin array (matching by denom).
   * Returns a new array; denoms not in fee are passed through unchanged.
   *
   * @throws ValidationError if subtraction would result in a negative amount
   *
   * @example
   * ```typescript
   * const remaining = Coin.subtract(balances, [coin('uinit', 10000)])
   * ```
   */
  static subtract(coins: CoinLike[], fee: CoinLike[]): Coin[] {
    const feeMap = new Map<string, bigint>()
    for (const f of fee) {
      feeMap.set(f.denom, (feeMap.get(f.denom) ?? 0n) + BigInt(f.amount))
    }

    return coins.map(c => {
      const feeAmount = feeMap.get(c.denom)
      if (feeAmount === undefined) return new Coin(c.denom, c.amount)
      const result = BigInt(c.amount) - feeAmount
      if (result < 0n) {
        throw new ValidationError(
          'amount',
          `Insufficient ${c.denom}: have ${c.amount}, need ${feeAmount}`
        )
      }
      return new Coin(c.denom, result)
    })
  }
}

/** Internal scale factor: 10^18 */
const DEC_SCALE = 10n ** 18n

/**
 * Parse a decimal string (e.g. '1.5' or '42') into a scaled BigInt (× 10^18).
 * Supports optional leading '-' sign.
 */
function parseDecToScaled(amount: string): bigint {
  const negative = amount.startsWith('-')
  const abs = negative ? amount.slice(1) : amount
  const dotIdx = abs.indexOf('.')
  let intPart: string
  let fracPart: string

  if (dotIdx === -1) {
    intPart = abs
    fracPart = ''
  } else {
    intPart = abs.slice(0, dotIdx)
    fracPart = abs.slice(dotIdx + 1)
  }

  // Pad or truncate fractional part to exactly 18 digits
  const fracPadded = fracPart.padEnd(18, '0').slice(0, 18)
  const scaled = BigInt(intPart || '0') * DEC_SCALE + BigInt(fracPadded)
  return negative ? -scaled : scaled
}

/**
 * Convert a scaled BigInt (× 10^18) back to an 18-digit decimal string.
 * Result is always exactly 18 fractional digits, e.g. '1.500000000000000000'.
 */
function scaledToDecStr(scaled: bigint): string {
  const negative = scaled < 0n
  const abs = negative ? -scaled : scaled
  const intPart = abs / DEC_SCALE
  const fracPart = abs % DEC_SCALE
  const fracStr = fracPart.toString().padStart(18, '0')
  return (negative ? '-' : '') + intPart.toString() + '.' + fracStr
}

/**
 * Immutable decimal coin class for representing blockchain token amounts with
 * fractional precision up to 18 decimal places.
 *
 * Internally uses scaled BigInt (× 10^18) for exact arithmetic.
 * All arithmetic operations return new DecCoin instances (immutable).
 * Arithmetic results are always normalized to exactly 18 fractional digits.
 *
 * @example
 * ```typescript
 * const fee = new DecCoin('uinit', '1.5')
 * const doubled = fee.mul(2)
 * console.log(doubled.amount) // '3.000000000000000000'
 * ```
 */
export class DecCoin {
  private readonly _proto: ProtoDecCoin
  private readonly _scaled: bigint

  constructor(denom: string, amount: string | bigint | number) {
    let amountStr: string
    switch (typeof amount) {
      case 'string': amountStr = amount; break
      case 'bigint': amountStr = amount.toString(); break
      case 'number':
        if (!Number.isSafeInteger(amount))
          throw new ValidationError('amount', `Amount must be a safe integer, got: ${amount}`)
        amountStr = amount.toString(); break
    }

    if (!/^-?\d+(\.\d+)?$/.test(amountStr)) {
      throw new ValidationError('amount', `Invalid decimal string: '${amountStr}'`)
    }
    const dotIdx = amountStr.indexOf('.')
    if (dotIdx !== -1 && amountStr.length - dotIdx - 1 > 18) {
      throw new ValidationError('amount', `Decimal precision exceeds 18 digits: '${amountStr}'`)
    }
    this._scaled = parseDecToScaled(amountStr)
    const normalizedAmount = scaledToDecStr(this._scaled)
    this._proto = create(DecCoinSchema, { denom, amount: normalizedAmount })
  }

  /**
   * Get denom.
   */
  get denom(): string {
    return this._proto.denom
  }

  /**
   * Get amount as normalized 18-digit decimal string.
   */
  get amount(): string {
    return this._proto.amount
  }

  /**
   * Add another DecCoin of the same denom.
   * Result is normalized to 18 fractional digits.
   * @throws ValidationError if denoms don't match
   */
  add(other: DecCoin): DecCoin {
    this.assertSameDenom(other)
    return new DecCoin(this.denom, scaledToDecStr(this._scaled + other._scaled))
  }

  /**
   * Subtract another DecCoin of the same denom.
   * Result is normalized to 18 fractional digits.
   * @throws ValidationError if denoms don't match
   */
  sub(other: DecCoin): DecCoin {
    this.assertSameDenom(other)
    return new DecCoin(this.denom, scaledToDecStr(this._scaled - other._scaled))
  }

  /**
   * Multiply by a scalar value. Truncates to 18 decimal places.
   * Result is normalized to 18 fractional digits.
   */
  mul(n: bigint | number): DecCoin {
    if (typeof n === 'number' && !Number.isInteger(n)) {
      throw new ValidationError('n', `Multiplier must be an integer, got: ${n}`)
    }
    const result = this._scaled * BigInt(n)
    return new DecCoin(this.denom, scaledToDecStr(result))
  }

  /**
   * Check equality with another DecCoin.
   * @throws ValidationError if denoms don't match
   */
  eq(other: DecCoin): boolean {
    this.assertSameDenom(other)
    return this._scaled === other._scaled
  }

  /**
   * Check if greater than another DecCoin.
   * @throws ValidationError if denoms don't match
   */
  gt(other: DecCoin): boolean {
    this.assertSameDenom(other)
    return this._scaled > other._scaled
  }

  /**
   * Check if greater than or equal to another DecCoin.
   * @throws ValidationError if denoms don't match
   */
  gte(other: DecCoin): boolean {
    this.assertSameDenom(other)
    return this._scaled >= other._scaled
  }

  /**
   * Check if less than another DecCoin.
   * @throws ValidationError if denoms don't match
   */
  lt(other: DecCoin): boolean {
    this.assertSameDenom(other)
    return this._scaled < other._scaled
  }

  /**
   * Check if less than or equal to another DecCoin.
   * @throws ValidationError if denoms don't match
   */
  lte(other: DecCoin): boolean {
    this.assertSameDenom(other)
    return this._scaled <= other._scaled
  }

  /**
   * Convert to integer Coin by truncating toward zero.
   *
   * @example
   * ```typescript
   * new DecCoin('uinit', '1.9').toIntCoin().amount  // '1'
   * new DecCoin('uinit', '-1.9').toIntCoin().amount // '-1'
   * ```
   */
  toIntCoin(): Coin {
    const scaled = this._scaled
    // BigInt division truncates toward zero in JS
    const intAmount = scaled / DEC_SCALE
    return new Coin(this.denom, intAmount)
  }

  /**
   * Convert to integer Coin by ceiling away from zero.
   *
   * @example
   * ```typescript
   * new DecCoin('uinit', '1.1').toIntCeilCoin().amount  // '2'
   * new DecCoin('uinit', '-1.1').toIntCeilCoin().amount // '-2'
   * ```
   */
  toIntCeilCoin(): Coin {
    const scaled = this._scaled
    const intAmount = scaled / DEC_SCALE
    const remainder = scaled % DEC_SCALE
    if (remainder === 0n) {
      return new Coin(this.denom, intAmount)
    }
    // ceil away from zero: positive → +1, negative → -1
    const adjustment = scaled > 0n ? 1n : -1n
    return new Coin(this.denom, intAmount + adjustment)
  }

  /**
   * Return a BSR proto DecCoin message (defensive clone).
   */
  toProto(): ProtoDecCoin {
    return create(DecCoinSchema, { denom: this._proto.denom, amount: this._proto.amount })
  }

  /**
   * Return a plain `{ denom, amount }` object via buf's canonical toJson.
   */
  toJSON(): { denom: string; amount: string } {
    return toJson(DecCoinSchema, this._proto) as { denom: string; amount: string }
  }

  /**
   * Return Amino-compatible `{ denom, amount }` object via buf's canonical toJson.
   */
  toAmino(): { denom: string; amount: string } {
    return toJson(DecCoinSchema, this._proto) as { denom: string; amount: string }
  }

  private assertSameDenom(other: DecCoin): void {
    if (this.denom !== other.denom) {
      throw new ValidationError('denom', `Mismatch: ${this.denom} vs ${other.denom}`)
    }
  }
}

/**
 * Create a new Coin instance.
 *
 * @example
 * ```typescript
 * const fee = coin('uinit', 1000)
 * ```
 */
export function coin(denom: string, amount: string | bigint | number): Coin {
  return new Coin(denom, amount)
}

/**
 * Create multiple Coin instances from tuples.
 *
 * @example
 * ```typescript
 * const funds = coins([
 *   ['uinit', 1000],
 *   ['uusdc', 500],
 * ])
 * ```
 */
export function coins(items: [string, string | bigint | number][]): Coin[] {
  return items.map(([denom, amount]) => new Coin(denom, amount))
}

/**
 * Parse a coin string into a Coin instance.
 *
 * Supports formats like '1000000uinit', '100uusdc'.
 * The amount must be a positive integer (no decimals in string).
 *
 * @param str - Coin string to parse (e.g., '1000000uinit')
 * @returns Parsed Coin instance
 * @throws Error if string format is invalid
 *
 * @example
 * ```typescript
 * const c = parseCoin('1000000uinit')
 * console.log(c.denom) // 'uinit'
 * console.log(c.amount) // '1000000'
 * ```
 */
export function parseCoin(str: string): Coin {
  if (!str || str.trim() === '') {
    throw new ParseError('coin', 'Empty string')
  }

  // Match amount (digits) followed by denom (non-digits)
  const match = str.match(/^(\d+)([a-zA-Z][a-zA-Z0-9/]*)$/)
  if (!match) {
    throw new ParseError('coin', `Invalid format: ${str}`)
  }

  const [, amount, denom] = match
  return new Coin(denom, amount)
}

/**
 * Create a new DecCoin instance.
 *
 * @example
 * ```typescript
 * const gasPrice = decCoin('uinit', '0.015')
 * ```
 */
export function decCoin(denom: string, amount: string | bigint | number): DecCoin {
  return new DecCoin(denom, amount)
}

/**
 * Parse a decimal coin string into a DecCoin instance.
 *
 * Supports formats like '0.015uinit', '1000uusdc', '1.5uatom'.
 *
 * @param str - Decimal coin string to parse
 * @returns Parsed DecCoin instance
 * @throws ParseError if string format is invalid
 *
 * @example
 * ```typescript
 * const price = parseDecCoin('0.015uinit')
 * console.log(price.denom)  // 'uinit'
 * console.log(price.amount) // '0.015000000000000000'
 * ```
 */
export function parseDecCoin(str: string): DecCoin {
  if (!str || str.trim() === '') {
    throw new ParseError('decCoin', 'Empty string')
  }

  const match = str.match(/^(-?\d+(?:\.\d+)?)([a-zA-Z][a-zA-Z0-9/]*)$/)
  if (!match) {
    throw new ParseError('decCoin', `Invalid format: ${str}`)
  }

  const [, amount, denom] = match
  return new DecCoin(denom, amount)
}
