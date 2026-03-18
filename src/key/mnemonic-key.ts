/**
 * MnemonicKey - Key implementation using BIP-39 mnemonic phrases.
 *
 * Derives keys from 24-word mnemonic phrases using BIP-32/BIP-44 HD derivation.
 * Default derivation path: m/44'/60'/0'/0/0 (Ethereum/Initia)
 */

import { generateMnemonic, mnemonicToSeedSync, validateMnemonic } from '@scure/bip39'
import { HDKey } from '@scure/bip32'
import { wordlist } from '@scure/bip39/wordlists/english.js'
import { RawKey } from './raw-key'
import { DEFAULT_BECH32_PREFIX } from './key'
import { KeyError } from '../errors'

/** Ethereum coin type used for Initia (BIP-44) */
export const INIT_COIN_TYPE = 60

/**
 * Options for creating a MnemonicKey.
 */
export interface MnemonicKeyOptions {
  /** BIP-39 mnemonic phrase (24 words). Required for constructor. */
  mnemonic: string
  /** BIP-44 coin type (default: 60 for Ethereum/Initia) */
  coinType?: number
  /** BIP-44 account index (default: 0) */
  account?: number
  /** BIP-44 address index (default: 0) */
  index?: number
  /** Use EVM-style address derivation (default: true) */
  isEth?: boolean
  /** Bech32 prefix for address encoding (default: 'init') */
  bech32Prefix?: string
}

/**
 * Options for generating a new MnemonicKey.
 */
export type MnemonicKeyGenerateOptions = Omit<MnemonicKeyOptions, 'mnemonic'>

const DEFAULT_OPTIONS = {
  coinType: INIT_COIN_TYPE,
  account: 0,
  index: 0,
  isEth: true,
  bech32Prefix: DEFAULT_BECH32_PREFIX,
}

/**
 * Key implementation using BIP-39 mnemonic phrases.
 *
 * ⚠️ SECURITY: Mnemonic phrases are NOT stored in the key instance.
 * Use `MnemonicKey.generate()` to create a new key and get the mnemonic for backup.
 *
 * @example
 * ```typescript
 * // Generate new key with mnemonic backup
 * const { key, mnemonic } = MnemonicKey.generate()
 * console.log(mnemonic) // Display to user for backup, then discard
 *
 * // From existing mnemonic
 * const key = new MnemonicKey({ mnemonic: 'word1 word2 ...' })
 *
 * // Custom derivation path
 * const key = new MnemonicKey({
 *   mnemonic: '...',
 *   account: 1,
 *   index: 5,
 * })
 * ```
 */
export class MnemonicKey extends RawKey {
  /**
   * Create a MnemonicKey from an existing mnemonic.
   *
   * For generating a new key with mnemonic backup, use `MnemonicKey.generate()`.
   *
   * @param options - Mnemonic key options (mnemonic is required)
   */
  constructor(options: MnemonicKeyOptions) {
    const { mnemonic, coinType, account, index, isEth, bech32Prefix } = {
      ...DEFAULT_OPTIONS,
      ...options,
    }

    if (!validateMnemonic(mnemonic, wordlist)) {
      throw new KeyError('import', 'Invalid mnemonic phrase')
    }

    const seed = mnemonicToSeedSync(mnemonic)
    const hdKey = HDKey.fromMasterSeed(seed)
    const path = `m/44'/${coinType}'/${account}'/0/${index}`
    const derived = hdKey.derive(path)

    if (!derived.privateKey) {
      throw new KeyError('derive', 'Failed to derive private key from mnemonic')
    }

    super(derived.privateKey, isEth, bech32Prefix)
    // NOTE: mnemonic is intentionally NOT stored for security
  }

  /**
   * Generate a new mnemonic key with backup phrase.
   *
   * ⚠️ SECURITY WARNING:
   * - The returned mnemonic provides FULL wallet recovery capability
   * - Display to user for backup, then IMMEDIATELY discard from memory
   * - NEVER log, store in database, or transmit the mnemonic
   * - The mnemonic is NOT stored in the key instance
   *
   * @param options - Key generation options (derivation path, prefix, etc.)
   * @returns Object containing the key and mnemonic for one-time backup
   *
   * @example
   * ```typescript
   * const { key, mnemonic } = MnemonicKey.generate()
   *
   * // Show mnemonic to user for backup
   * displayBackupScreen(mnemonic)
   *
   * // After user confirms backup, clear the mnemonic
   * // The key can be used for signing without the mnemonic
   * ```
   */
  static generate(options: MnemonicKeyGenerateOptions = {}): {
    key: MnemonicKey
    mnemonic: string
  } {
    const mnemonic = generateMnemonic(wordlist, 256)
    const key = new MnemonicKey({ ...options, mnemonic })
    return { key, mnemonic }
  }
}
