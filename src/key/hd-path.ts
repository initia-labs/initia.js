/**
 * SLIP-0044 Coin Type constants
 */
export const COIN_TYPE = {
  INITIA: 60, // EVM compatible
  ETHEREUM: 60, // Same as Initia
  COSMOS: 118, // Cosmos Hub, Celestia, Osmosis, and most Cosmos chains
} as const

export type CoinType = (typeof COIN_TYPE)[keyof typeof COIN_TYPE]

/**
 * BIP-44 HD Path helper class
 *
 * Use with @scure/bip32 HDKey.derive()
 *
 * @example
 * ```typescript
 * import { HDKey } from '@scure/bip32'
 *
 * const hdKey = HDKey.fromMasterSeed(seed)
 * const derived = hdKey.derive(HDPath.initia().toString())
 * ```
 */
export class HDPath {
  private constructor(
    private purpose_: number,
    private coinType_: number,
    private account_: number,
    private change_: number,
    private index_: number
  ) {}

  // ===== Preset Factories =====

  static initia(index = 0): HDPath {
    return new HDPath(44, COIN_TYPE.INITIA, 0, 0, index)
  }

  static cosmos(index = 0): HDPath {
    return new HDPath(44, COIN_TYPE.COSMOS, 0, 0, index)
  }

  static fromCoinType(coinType: number, index = 0, account = 0): HDPath {
    return new HDPath(44, coinType, account, 0, index)
  }

  // ===== Transformation Methods =====

  index(n: number): HDPath {
    return new HDPath(this.purpose_, this.coinType_, this.account_, this.change_, n)
  }

  account(n: number): HDPath {
    return new HDPath(this.purpose_, this.coinType_, n, this.change_, this.index_)
  }

  // ===== Output =====

  /** Path string for @scure/bip32 HDKey.derive() */
  toString(): string {
    return `m/${this.purpose_}'/${this.coinType_}'/${this.account_}'/${this.change_}/${this.index_}`
  }

  // ===== Accessors =====

  get coinType(): number {
    return this.coinType_
  }

  get addressIndex(): number {
    return this.index_
  }
}
