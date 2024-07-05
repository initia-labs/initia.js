import { JSONSerializable } from '../util/json'
import { Denom } from './Denom'
import { num, checkDecimal } from './num'
import { Coin as Coin_pb } from '@initia/initia.proto/cosmos/base/v1beta1/coin'

/**
 * Captures `sdk.Coin` and `sdk.DecCoin` from Cosmos SDK. A composite value that combines
 * a denomination with an amount value. Coins are immutable once created, and operations
 * that return Coin will return a new Coin. See [[Coins]] for a collection of Coin objects.
 */
export class Coin extends JSONSerializable<Coin.Amino, Coin.Data, Coin.Proto> {
  public readonly amount: string
  public readonly isDecimal: boolean

  /**
   * Creates a new coin. Depending on the type of amount, it will be converted to an
   * integer coin or decimal coin.
   *
   * @param denom denomination
   * @param amount coin's amount
   */
  constructor(
    public readonly denom: Denom,
    amount: number | string
  ) {
    super()
    this.amount = num(amount).toString()
    this.isDecimal = checkDecimal(amount)
  }

  /**
   * Turns the Coin into an Integer coin.
   */
  public toIntCoin(): Coin {
    return new Coin(this.denom, num(this.amount).toFixed(0))
  }

  /**
   * Turns the Coin into an Integer coin with ceiling the amount.
   */
  public toIntCeilCoin(): Coin {
    return new Coin(this.denom, num(this.amount).toFixed(0, 2))
  }

  /**
   * Turns the Coin into a Decimal coin.
   */
  public toDecCoin(): Coin {
    return new Coin(
      this.denom,
      this.amount.includes('.') ? this.amount : num(this.amount).toFixed(1)
    )
  }

  /**
   * Outputs `<amount><denom>`.
   *
   * Eg: `Coin('uinit', 1500) -> 1500uinit`
   */
  public toString(): string {
    const amount =
      this.isDecimal && !this.amount.includes('.')
        ? num(this.amount).toFixed(1)
        : num(this.amount).toFixed()
    return `${amount}${this.denom}`
  }

  public static fromString(str: string): Coin {
    const m = str.match(/^(-?[0-9]+(\.[0-9]+)?)([0-9a-zA-Z/]+)$/)
    if (m === null) {
      throw new Error(`failed to parse to Coin: ${str}`)
    }
    const amount = m[1]
    const denom = m[3]
    return new Coin(denom, amount)
  }

  /**
   * Creates a new Coin adding to the current value.
   *
   * @param other
   */
  public add(other: number | string | Coin): Coin {
    let otherAmount
    let isDecimal = this.isDecimal
    if (other instanceof Coin) {
      if (other.denom !== this.denom) {
        throw new Coin.ArithmeticError(
          `cannot add two Coins of different denoms: ${this.denom} and ${other.denom}`
        )
      }
      otherAmount = other.amount
      isDecimal = isDecimal || other.isDecimal
    } else {
      otherAmount = other
      isDecimal = isDecimal || checkDecimal(other)
    }
    const res = num(this.amount).plus(otherAmount)

    return new Coin(
      this.denom,
      isDecimal && res.isInteger() ? res.toFixed(1) : res.toFixed()
    )
  }

  /**
   * Creates a new Coin subtracting from the current value.
   * @param other
   */
  public sub(other: number | string | Coin): Coin {
    let otherAmount
    let isDecimal = this.isDecimal
    if (other instanceof Coin) {
      if (other.denom !== this.denom) {
        throw new Coin.ArithmeticError(
          `cannot subtract two Coins of different denoms: ${this.denom} and ${other.denom}`
        )
      }
      otherAmount = other.amount
      isDecimal = isDecimal || other.isDecimal
    } else {
      otherAmount = other
      isDecimal = isDecimal || checkDecimal(other)
    }
    const res = num(this.amount).minus(otherAmount)

    return new Coin(
      this.denom,
      isDecimal && res.isInteger() ? res.toFixed(1) : res.toFixed()
    )
  }

  /**
   * Multiplies the current value with an amount.
   * @param other
   */
  public mul(other: number | string): Coin {
    const isDecimal = this.isDecimal || checkDecimal(other)
    const res = num(this.amount).multipliedBy(other)

    return new Coin(
      this.denom,
      isDecimal && res.isInteger() ? res.toFixed(1) : res.toFixed()
    )
  }

  /**
   * Divides the current value with an amount.
   * @param other
   */
  public div(other: number | string): Coin {
    const isDecimal = this.isDecimal || checkDecimal(other)
    const res = num(this.amount).dividedBy(other)

    return new Coin(
      this.denom,
      isDecimal && res.isInteger() ? res.toFixed(1) : res.toFixed()
    )
  }

  /**
   * Modulo the current value with an amount.
   * @param other
   */
  public mod(other: number | string): Coin {
    const isDecimal = this.isDecimal || checkDecimal(other)
    const res = num(this.amount).mod(other)

    return new Coin(
      this.denom,
      isDecimal && res.isInteger() ? res.toFixed(1) : res.toFixed()
    )
  }

  public static fromAmino(data: Coin.Amino): Coin {
    const { denom, amount } = data
    return new Coin(denom, amount)
  }

  public toAmino(): Coin.Amino {
    const { denom, amount } = this
    return {
      denom,
      amount: this.isDecimal ? num(amount).toFixed(18) : amount,
    }
  }

  public static fromData(data: Coin.Data): Coin {
    const { denom, amount } = data
    return new Coin(denom, amount)
  }

  public toData(): Coin.Data {
    const { denom, amount } = this
    return {
      denom,
      amount: this.isDecimal ? num(amount).toFixed(18) : amount,
    }
  }

  public static fromProto(proto: Coin.Proto): Coin {
    return new Coin(proto.denom, proto.amount)
  }

  public toProto(): Coin.Proto {
    return Coin_pb.fromPartial({
      denom: this.denom,
      amount: this.isDecimal ? num(this.amount).toFixed(18) : this.amount,
    })
  }
}

export namespace Coin {
  export interface Amino {
    denom: Denom
    amount: string
  }

  export interface Data {
    denom: Denom
    amount: string
  }

  export class ArithmeticError {
    constructor(public readonly message: string) {}
  }

  export type Proto = Coin_pb
}
