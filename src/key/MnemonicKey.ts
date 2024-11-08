import ecc from '@bitcoinerlab/secp256k1'
import { BIP32Factory } from 'bip32'
import { generateMnemonic, mnemonicToSeedSync } from 'bip39'
import { RawKey } from './RawKey'

const bip32 = BIP32Factory(ecc)
export const INIT_COIN_TYPE = 118

interface MnemonicKeyOptions {
  /**
   * Space-separated list of words for the mnemonic key.
   */
  mnemonic?: string

  /**
   * BIP44 account number.
   */
  account?: number

  /**
   * BIP44 index number
   */
  index?: number

  /**
   * Coin type. Default is INIT, 118.
   */
  coinType?: number

  /**
   * Whether to use eth pubkey
   */
  eth?: boolean
}

const DEFAULT_OPTIONS = {
  account: 0,
  index: 0,
  coinType: INIT_COIN_TYPE,
  eth: false,
}

/**
 * Implements a BIP39 mnemonic wallet with standard key derivation from a word list. Note
 * that this implementation exposes the private key in memory, so it is not advised to use
 * for applications requiring high security.
 */
export class MnemonicKey extends RawKey {
  /**
   * Space-separated mnemonic phrase.
   */
  public mnemonic: string

  /**
   * Creates a new signing key from a mnemonic phrase. If no mnemonic is provided, one
   * will be automatically generated.
   *
   * ### Providing a mnemonic
   *
   * ```ts
   * import { MnemonicKey } from 'initia.js'
   *
   * const mk = new MnemonicKey({ mnemonic: '...' })
   * console.log(mk.accAddress)
   * ```
   *
   * ### Generating a random mnemonic
   *
   * ```ts
   * const mk2 = new MnemonicKey()
   * console.log(mk2.mnemonic)
   * ```
   * @param options
   */
  constructor(options: MnemonicKeyOptions = {}) {
    const { account, index, coinType, eth } = {
      ...DEFAULT_OPTIONS,
      ...options,
    }
    let { mnemonic } = options
    if (mnemonic === undefined) {
      mnemonic = generateMnemonic(256)
    }
    const seed: Buffer = mnemonicToSeedSync(mnemonic)
    const masterKey = bip32.fromSeed(seed)
    const hdPathInitia = `m/44'/${coinType}'/${account}'/0/${index}`
    const initiaHD = masterKey.derivePath(hdPathInitia)
    const privateKey = initiaHD.privateKey

    if (!privateKey) {
      throw new Error('Failed to derive key pair')
    }

    super(Buffer.from(privateKey), eth)
    this.mnemonic = mnemonic
  }
}
