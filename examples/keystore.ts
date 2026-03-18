/**
 * Example: KeyStore — Multi-key management
 *
 * Demonstrates how to implement and use a custom KeyStore:
 *   1. Extend BaseKeyStore to create an in-memory key store
 *   2. Import keys from mnemonic or raw private key
 *   3. List and retrieve keys
 *   4. Get signers for transaction signing
 *   5. Use type guards for capability detection
 *
 * The KeyStore interface is designed for pluggable backends:
 *   - OS keyrings (macOS Keychain, Linux Secret Service)
 *   - Browser extensions (Keplr, Leap)
 *   - Hardware wallets (Ledger)
 *   - Cloud KMS (AWS KMS, HashiCorp Vault)
 */

import { MnemonicKey, RawKey } from 'initia.js'
import {
  BaseKeyStore,
  canAddKeys,
  canDeleteKeys,
  canImportMnemonic,
  type KeyInfo,
  type AddKeyOptions,
  type ImportMnemonicOptions,
} from 'initia.js/signer'
import type { Signer } from 'initia.js/signer'
import { TEST_MNEMONIC } from './constants'

// ---------------------------------------------------------------------------
// 1. Implement an in-memory KeyStore
// ---------------------------------------------------------------------------

class InMemoryKeyStore extends BaseKeyStore {
  private keys = new Map<string, { key: RawKey; info: KeyInfo }>()

  async has(keyId: string): Promise<boolean> {
    return this.keys.has(keyId)
  }

  async getSigner(keyId: string): Promise<Signer> {
    const entry = this.keys.get(keyId)
    if (!entry) throw new Error(`Key not found: ${keyId}`)
    return entry.key
  }

  async list(): Promise<KeyInfo[]> {
    return [...this.keys.values()].map(e => e.info)
  }

  async add(keyId: string, privateKey: Uint8Array, options?: AddKeyOptions): Promise<void> {
    if (this.keys.has(keyId)) throw new Error(`Key already exists: ${keyId}`)
    const key = new RawKey(privateKey)
    this.keys.set(keyId, {
      key,
      info: {
        id: keyId,
        name: options?.name,
        algorithm: key.algorithm,
        publicKey: Buffer.from(key.publicKey).toString('hex'),
        address: key.address,
        createdAt: new Date(),
        metadata: options?.metadata,
      },
    })
  }

  async importMnemonic(
    keyId: string,
    mnemonic: string,
    options?: ImportMnemonicOptions
  ): Promise<void> {
    if (this.keys.has(keyId)) throw new Error(`Key already exists: ${keyId}`)
    const mnemonicKey = new MnemonicKey({
      mnemonic,
      coinType: 60,
      bech32Prefix: options?.prefix ?? 'init',
    })
    // MnemonicKey extends Key which extends RawKey — use it directly
    this.keys.set(keyId, {
      key: mnemonicKey as unknown as RawKey,
      info: {
        id: keyId,
        name: options?.name,
        algorithm: mnemonicKey.algorithm,
        publicKey: Buffer.from(mnemonicKey.publicKey).toString('hex'),
        address: mnemonicKey.address,
        createdAt: new Date(),
        metadata: options?.metadata,
      },
    })
  }

  async delete(keyId: string): Promise<void> {
    if (!this.keys.has(keyId)) throw new Error(`Key not found: ${keyId}`)
    this.keys.delete(keyId)
  }
}

// ---------------------------------------------------------------------------
// 2. Use the KeyStore
// ---------------------------------------------------------------------------

async function main() {
  const store = new InMemoryKeyStore()

  // --- Capability detection via type guards ---
  console.log('Supports add:', canAddKeys(store))
  console.log('Supports delete:', canDeleteKeys(store))
  console.log('Supports importMnemonic:', canImportMnemonic(store))

  // --- Import from mnemonic ---
  if (canImportMnemonic(store)) {
    await store.importMnemonic('main-wallet', TEST_MNEMONIC, {
      name: 'Main Wallet',
      metadata: { source: 'mnemonic', createdBy: 'example' },
    })
  }

  // --- Import second key at different index ---
  if (canImportMnemonic(store)) {
    await store.importMnemonic('savings', TEST_MNEMONIC, {
      name: 'Savings',
    })
  }

  // --- List all keys ---
  const keys = await store.list()
  console.log(`\nStored keys (${keys.length}):`)
  for (const key of keys) {
    console.log(`  ${key.id}: ${key.name ?? '(unnamed)'} — ${key.address}`)
  }

  // --- Get signer and derive address ---
  const signer = await store.getSigner('main-wallet')
  const address = await signer.getAddress()
  console.log(`\nSigner address: ${address}`)
  console.log(`Algorithm: ${signer.algorithm}`)

  // --- Helper methods from BaseKeyStore ---
  console.log(`\nKey count: ${await store.count()}`)
  console.log(`Is empty: ${await store.isEmpty()}`)
  console.log(`Has 'main-wallet': ${await store.has('main-wallet')}`)
  console.log(`Has 'nonexistent': ${await store.has('nonexistent')}`)

  // --- Get single key info ---
  const info = await store.get('main-wallet')
  if (info) {
    console.log(`\nKey info for '${info.id}':`)
    console.log(`  Name: ${info.name}`)
    console.log(`  Algorithm: ${info.algorithm}`)
    console.log(`  Address: ${info.address}`)
    console.log(`  Created: ${info.createdAt?.toISOString()}`)
    console.log(`  Metadata:`, info.metadata)
  }

  // --- Delete a key ---
  if (canDeleteKeys(store)) {
    await store.delete('savings')
    console.log(`\nAfter deleting 'savings': ${await store.count()} key(s) remaining`)
  }
}

main().catch(console.error)
