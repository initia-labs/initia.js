/**
 * Coins module - Immutable, Map-backed multi-denom coin collection.
 */

import { Coin, DecCoin, type CoinLike } from './coin'

/** Structural type accepted by the DecCoins constructor input array. */
interface DecCoinLike {
  readonly denom: string
  readonly amount: string
}

/**
 * Immutable collection of coins, keyed by denom.
 *
 * Duplicate denoms are merged (summed) on construction and on every arithmetic
 * operation.  All mutating operations return new `Coins` instances.
 *
 * @example
 * ```typescript
 * const wallet = new Coins({ uinit: 1000, uusdc: 500 })
 * const fee    = new Coins([new Coin('uinit', 200)])
 * const after  = wallet.sub(fee)
 * console.log(after.toString()) // '800uinit,500uusdc'
 * ```
 */
export class Coins implements Iterable<Coin> {
  private readonly _map: Map<string, Coin>

  constructor(input?: CoinLike[] | Coins | Record<string, string | bigint | number>) {
    this._map = new Map()
    if (!input) return
    if (input instanceof Coins) {
      for (const c of input) this._merge(c)
    } else if (Array.isArray(input)) {
      for (const c of input) this._merge(new Coin(c.denom, c.amount))
    } else {
      for (const [denom, amount] of Object.entries(input)) this._merge(new Coin(denom, amount))
    }
  }

  private _merge(c: Coin): void {
    const existing = this._map.get(c.denom)
    this._map.set(c.denom, existing ? existing.add(c) : c)
  }

  // ---------------------------------------------------------------------------
  // Lookup
  // ---------------------------------------------------------------------------

  /** Return the Coin for the given denom, or undefined. */
  get(denom: string): Coin | undefined {
    return this._map.get(denom)
  }

  /** True if the collection contains the given denom. */
  has(denom: string): boolean {
    return this._map.has(denom)
  }

  /** Sorted list of all denoms in this collection. */
  denoms(): string[] {
    return [...this._map.keys()].sort()
  }

  /** True when the collection has no coins. */
  isEmpty(): boolean {
    return this._map.size === 0
  }

  // ---------------------------------------------------------------------------
  // Iteration
  // ---------------------------------------------------------------------------

  [Symbol.iterator](): Iterator<Coin> {
    return this.toArray()[Symbol.iterator]()
  }

  /** Return all coins sorted by denom. */
  toArray(): Coin[] {
    return [...this._map.values()].sort((a, b) => a.denom.localeCompare(b.denom))
  }

  // ---------------------------------------------------------------------------
  // Arithmetic
  // ---------------------------------------------------------------------------

  /**
   * Add a single Coin or another Coins collection.
   * Coins with the same denom are summed; new denoms are inserted.
   */
  add(other: Coin | Coins): Coins {
    const items = other instanceof Coin ? [other] : other.toArray()
    return new Coins([...this.toArray(), ...items])
  }

  /**
   * Subtract coins. Allows negative amounts for intermediate calculations.
   */
  sub(other: Coin | Coins): Coins {
    const items = other instanceof Coin ? [other] : other.toArray()
    const negated = items.map(c => new Coin(c.denom, -c.amountBigInt))
    return new Coins([...this.toArray(), ...negated])
  }

  /**
   * Subtract coins, throwing if any resulting amount is negative.
   * Use this when the result must be valid for on-chain submission.
   */
  safeSub(other: Coin | Coins): Coins {
    const result = this.sub(other)
    for (const c of result) {
      if (c.amountBigInt < 0n) {
        throw new Error(`Insufficient balance for ${c.denom}: would result in ${c.amount}`)
      }
    }
    return result
  }

  /**
   * Multiply all coins by a scalar value.
   */
  mul(n: bigint | number): Coins {
    return new Coins(this.toArray().map(c => c.mul(n)))
  }

  // ---------------------------------------------------------------------------
  // Functional
  // ---------------------------------------------------------------------------

  /** Map over sorted coins and return an array of results. */
  map<T>(fn: (c: Coin) => T): T[] {
    return this.toArray().map(fn)
  }

  /** Return a new Coins containing only coins matching the predicate. */
  filter(fn: (c: Coin) => boolean): Coins {
    return new Coins(this.toArray().filter(fn))
  }

  /** Return the first coin satisfying the predicate, or undefined. */
  find(fn: (c: Coin) => boolean): Coin | undefined {
    return this.toArray().find(fn)
  }

  // ---------------------------------------------------------------------------
  // Serialization
  // ---------------------------------------------------------------------------

  /** Return proto messages array, sorted by denom. */
  toProto() {
    return this.toArray().map(c => c.toProto())
  }

  /** Return plain `{ denom, amount }` array (for JSON.stringify). */
  toJSON(): { denom: string; amount: string }[] {
    return this.toArray().map(c => c.toJSON())
  }

  /** Return Amino-compatible `{ denom, amount }` array. */
  toAmino(): { denom: string; amount: string }[] {
    return this.toArray().map(c => c.toAmino())
  }

  /**
   * Format as a comma-separated coin string, sorted by denom.
   *
   * @example
   * ```typescript
   * new Coins({ uinit: 1000, uusdc: 500 }).toString()
   * // '1000uinit,500uusdc'
   * ```
   */
  toString(): string {
    return this.toArray()
      .map(c => `${c.amount}${c.denom}`)
      .join(',')
  }

  /**
   * Convert each Coin to a DecCoin (18 fractional decimal places) and return
   * a DecCoins collection.
   */
  toDecCoins(): DecCoins {
    return new DecCoins(this.toArray().map(c => c.toDecCoin()))
  }
}

/**
 * Immutable collection of decimal coins, keyed by denom.
 *
 * Duplicate denoms are merged (summed) on construction and on every arithmetic
 * operation.  All mutating operations return new `DecCoins` instances.
 *
 * @example
 * ```typescript
 * const fees = new DecCoins({ uinit: '1.5', uusdc: '0.5' })
 * const extra = new DecCoins([new DecCoin('uinit', '0.5')])
 * const total = fees.add(extra)
 * console.log(total.toString()) // '2.000000000000000000uinit,0.5uusdc'
 * ```
 */
export class DecCoins implements Iterable<DecCoin> {
  private readonly _map: Map<string, DecCoin>

  constructor(input?: DecCoinLike[] | DecCoins | Record<string, string>) {
    this._map = new Map()
    if (!input) return
    if (input instanceof DecCoins) {
      for (const c of input) this._merge(c)
    } else if (Array.isArray(input)) {
      for (const c of input) this._merge(new DecCoin(c.denom, c.amount))
    } else {
      for (const [denom, amount] of Object.entries(input)) this._merge(new DecCoin(denom, amount))
    }
  }

  private _merge(c: DecCoin): void {
    const existing = this._map.get(c.denom)
    this._map.set(c.denom, existing ? existing.add(c) : c)
  }

  // ---------------------------------------------------------------------------
  // Lookup
  // ---------------------------------------------------------------------------

  /** Return the DecCoin for the given denom, or undefined. */
  get(denom: string): DecCoin | undefined {
    return this._map.get(denom)
  }

  /** True if the collection contains the given denom. */
  has(denom: string): boolean {
    return this._map.has(denom)
  }

  /** Sorted list of all denoms in this collection. */
  denoms(): string[] {
    return [...this._map.keys()].sort()
  }

  /** True when the collection has no coins. */
  isEmpty(): boolean {
    return this._map.size === 0
  }

  // ---------------------------------------------------------------------------
  // Iteration
  // ---------------------------------------------------------------------------

  [Symbol.iterator](): Iterator<DecCoin> {
    return this.toArray()[Symbol.iterator]()
  }

  /** Return all coins sorted by denom. */
  toArray(): DecCoin[] {
    return [...this._map.values()].sort((a, b) => a.denom.localeCompare(b.denom))
  }

  // ---------------------------------------------------------------------------
  // Arithmetic
  // ---------------------------------------------------------------------------

  /**
   * Add a single DecCoin or another DecCoins collection.
   * Coins with the same denom are summed; new denoms are inserted.
   */
  add(other: DecCoin | DecCoins): DecCoins {
    const items = other instanceof DecCoin ? [other] : other.toArray()
    return new DecCoins([...this.toArray(), ...items])
  }

  /**
   * Subtract coins. Allows negative amounts for intermediate calculations.
   */
  sub(other: DecCoin | DecCoins): DecCoins {
    const items = other instanceof DecCoin ? [other] : other.toArray()
    const negated = items.map(c => c.mul(-1))
    return new DecCoins([...this.toArray(), ...negated])
  }

  /**
   * Subtract coins, throwing if any resulting amount is negative.
   * Use this when the result must be valid for on-chain submission.
   */
  safeSub(other: DecCoin | DecCoins): DecCoins {
    const result = this.sub(other)
    for (const c of result) {
      if (c.amount.startsWith('-')) {
        throw new Error(`Insufficient balance for ${c.denom}: would result in ${c.amount}`)
      }
    }
    return result
  }

  /**
   * Multiply all coins by a scalar value.
   */
  mul(n: bigint | number): DecCoins {
    return new DecCoins(this.toArray().map(c => c.mul(n)))
  }

  // ---------------------------------------------------------------------------
  // Functional
  // ---------------------------------------------------------------------------

  /** Map over sorted coins and return an array of results. */
  map<T>(fn: (c: DecCoin) => T): T[] {
    return this.toArray().map(fn)
  }

  /** Return a new DecCoins containing only coins matching the predicate. */
  filter(fn: (c: DecCoin) => boolean): DecCoins {
    return new DecCoins(this.toArray().filter(fn))
  }

  /** Return the first coin satisfying the predicate, or undefined. */
  find(fn: (c: DecCoin) => boolean): DecCoin | undefined {
    return this.toArray().find(fn)
  }

  // ---------------------------------------------------------------------------
  // Serialization
  // ---------------------------------------------------------------------------

  /** Return proto messages array, sorted by denom. */
  toProto() {
    return this.toArray().map(c => c.toProto())
  }

  /** Return plain `{ denom, amount }` array (for JSON.stringify). */
  toJSON(): { denom: string; amount: string }[] {
    return this.toArray().map(c => c.toJSON())
  }

  /** Return Amino-compatible `{ denom, amount }` array. */
  toAmino(): { denom: string; amount: string }[] {
    return this.toArray().map(c => c.toAmino())
  }

  /**
   * Format as a comma-separated coin string, sorted by denom.
   *
   * @example
   * ```typescript
   * new DecCoins({ uinit: '1.5', uusdc: '0.5' }).toString()
   * // '1.5uinit,0.5uusdc'
   * ```
   */
  toString(): string {
    return this.toArray()
      .map(c => `${c.amount}${c.denom}`)
      .join(',')
  }

  // ---------------------------------------------------------------------------
  // Conversion to integer Coins
  // ---------------------------------------------------------------------------

  /**
   * Convert each DecCoin to an integer Coin by truncating toward zero.
   * Collects results into a new `Coins` collection.
   */
  toIntCoins(): Coins {
    return new Coins(this.toArray().map(c => c.toIntCoin()))
  }

  /**
   * Convert each DecCoin to an integer Coin by ceiling away from zero.
   * Collects results into a new `Coins` collection.
   */
  toIntCeilCoins(): Coins {
    return new Coins(this.toArray().map(c => c.toIntCeilCoin()))
  }
}
