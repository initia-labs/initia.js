/**
 * KeyStore interface for managing multiple keys.
 *
 * This interface provides a unified API for different key storage backends:
 * - OS keyrings (macOS Keychain, Linux Secret Service, Windows Credential Manager)
 * - Browser extensions (Keplr, Leap)
 * - Hardware wallets (Ledger)
 * - Custom implementations (HSM, KMS)
 */

import type { Signer, SigningAlgorithm } from './types'
import type { HDPath } from '../key/hd-path'

/**
 * Key metadata information.
 */
export interface KeyInfo {
  /** Unique key identifier */
  id: string
  /** Human-readable display name */
  name?: string
  /** Signing algorithm */
  algorithm: SigningAlgorithm
  /** Public key in hex format */
  publicKey: string
  /** Default bech32 address */
  address: string
  /** Creation timestamp */
  createdAt?: Date
  /** Additional metadata */
  metadata?: Record<string, unknown>
}

/**
 * Options for adding a new key.
 */
export interface AddKeyOptions {
  /** Human-readable name for the key */
  name?: string
  /** Additional metadata to store with the key */
  metadata?: Record<string, unknown>
}

/**
 * Options for importing a mnemonic.
 */
export interface ImportMnemonicOptions extends AddKeyOptions {
  /** HD derivation path (default: HDPath.initia()) */
  hdPath?: HDPath | string
  /** Bech32 prefix for address (default: 'init') */
  prefix?: string
}

/**
 * KeyStore interface for managing multiple signing keys.
 *
 * Implementations can choose which optional methods to support based on
 * their capabilities. For example:
 * - Read-only stores (hardware wallets) may not support add/delete
 * - Browser wallets manage their own keys, so importMnemonic may not apply
 *
 * @example
 * ```typescript
 * // OS Keyring store
 * const store = new OsKeyringStore()
 *
 * // Import a mnemonic
 * await store.importMnemonic('my-wallet', mnemonic, {
 *   hdPath: HDPath.initia(),
 *   name: 'My Main Wallet'
 * })
 *
 * // Get signer for transactions
 * const signer = await store.getSigner('my-wallet')
 * const address = await signer.getAddress()
 *
 * // List all keys
 * const keys = await store.list()
 * console.log(keys.map(k => k.name))
 * ```
 */
export interface KeyStore {
  /**
   * Check if a key exists in the store.
   *
   * @param keyId - The key identifier
   * @returns True if the key exists
   */
  has(keyId: string): Promise<boolean>

  /**
   * Get a Signer instance for the specified key.
   *
   * @param keyId - The key identifier
   * @returns A Signer instance for the key
   * @throws Error if the key does not exist
   */
  getSigner(keyId: string): Promise<Signer>

  /**
   * List all keys in the store.
   *
   * @returns Array of key metadata
   */
  list(): Promise<KeyInfo[]>

  /**
   * Delete a key from the store.
   *
   * This method is optional - some stores (like hardware wallets)
   * may not support key deletion.
   *
   * @param keyId - The key identifier
   * @throws Error if the key does not exist or deletion is not supported
   */
  delete?(keyId: string): Promise<void>

  /**
   * Add a new key from a raw private key.
   *
   * This method is optional - some stores may not support
   * direct private key import.
   *
   * @param keyId - Unique identifier for the key
   * @param privateKey - The raw private key bytes
   * @param options - Additional options (name, metadata)
   * @throws Error if the key ID already exists or addition is not supported
   */
  add?(keyId: string, privateKey: Uint8Array, options?: AddKeyOptions): Promise<void>

  /**
   * Import a key from a BIP-39 mnemonic phrase.
   *
   * This method is optional - some stores may not support
   * mnemonic import.
   *
   * Note: The mnemonic itself is NOT stored. Only the derived
   * private key is stored in the keystore.
   *
   * @param keyId - Unique identifier for the key
   * @param mnemonic - BIP-39 mnemonic phrase (12 or 24 words)
   * @param options - Import options (hdPath, prefix, name, metadata)
   * @throws Error if the key ID already exists or import is not supported
   */
  importMnemonic?(keyId: string, mnemonic: string, options?: ImportMnemonicOptions): Promise<void>

  /**
   * Rename an existing key.
   *
   * This method is optional.
   *
   * @param keyId - The key identifier
   * @param name - The new name for the key
   */
  rename?(keyId: string, name: string): Promise<void>

  /**
   * Export the public key for a key.
   *
   * This is always safe to export as it does not reveal the private key.
   *
   * @param keyId - The key identifier
   * @returns The public key in hex format
   */
  exportPublicKey?(keyId: string): Promise<string>
}

/**
 * Type guard to check if a KeyStore supports key addition.
 */
export function canAddKeys(store: KeyStore): store is KeyStore & Required<Pick<KeyStore, 'add'>> {
  return typeof store.add === 'function'
}

/**
 * Type guard to check if a KeyStore supports key deletion.
 */
export function canDeleteKeys(
  store: KeyStore
): store is KeyStore & Required<Pick<KeyStore, 'delete'>> {
  return typeof store.delete === 'function'
}

/**
 * Type guard to check if a KeyStore supports mnemonic import.
 */
export function canImportMnemonic(
  store: KeyStore
): store is KeyStore & Required<Pick<KeyStore, 'importMnemonic'>> {
  return typeof store.importMnemonic === 'function'
}

/**
 * Abstract base class for KeyStore implementations.
 *
 * Provides common functionality and a template for implementing
 * custom key stores.
 */
export abstract class BaseKeyStore implements KeyStore {
  abstract has(keyId: string): Promise<boolean>
  abstract getSigner(keyId: string): Promise<Signer>
  abstract list(): Promise<KeyInfo[]>

  /**
   * Get a key's info by ID.
   *
   * @param keyId - The key identifier
   * @returns Key info or undefined if not found
   */
  async get(keyId: string): Promise<KeyInfo | undefined> {
    const keys = await this.list()
    return keys.find(k => k.id === keyId)
  }

  /**
   * Get all key IDs in the store.
   *
   * @returns Array of key IDs
   */
  async listIds(): Promise<string[]> {
    const keys = await this.list()
    return keys.map(k => k.id)
  }

  /**
   * Check if the store is empty.
   *
   * @returns True if no keys are stored
   */
  async isEmpty(): Promise<boolean> {
    const keys = await this.list()
    return keys.length === 0
  }

  /**
   * Get the count of keys in the store.
   *
   * @returns Number of keys
   */
  async count(): Promise<number> {
    const keys = await this.list()
    return keys.length
  }
}
