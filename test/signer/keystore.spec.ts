import { describe, it, expect } from 'vitest'
import {
  type KeyStore,
  type KeyInfo,
  type Signer,
  canAddKeys,
  canDeleteKeys,
  canImportMnemonic,
  BaseKeyStore,
} from '../../src/signer'

describe('KeyStore', () => {
  // Mock Signer for testing
  const createMockSigner = (): Signer => ({
    algorithm: 'eth_secp256k1', // Initia default
    getPublicKey: async () => new Uint8Array(33).fill(1),
    getAddress: async (prefix = 'init') => `${prefix}1mockaddress`,
  })

  // Mock KeyStore implementations for testing
  const createReadOnlyStore = (): KeyStore => {
    const keys: KeyInfo[] = [
      {
        id: 'key1',
        name: 'Test Key 1',
        algorithm: 'secp256k1',
        publicKey: '0x1234',
        address: 'init1abc',
      },
    ]

    return {
      has: async keyId => keys.some(k => k.id === keyId),
      getSigner: async keyId => {
        if (!keys.some(k => k.id === keyId)) {
          throw new Error(`Key not found: ${keyId}`)
        }
        return createMockSigner()
      },
      list: async () => keys,
    }
  }

  const createFullStore = (): KeyStore => {
    const keys: Map<string, KeyInfo> = new Map([
      [
        'key1',
        {
          id: 'key1',
          name: 'Test Key 1',
          algorithm: 'secp256k1',
          publicKey: '0x1234',
          address: 'init1abc',
        },
      ],
    ])

    return {
      has: async keyId => keys.has(keyId),
      getSigner: async keyId => {
        if (!keys.has(keyId)) {
          throw new Error(`Key not found: ${keyId}`)
        }
        return createMockSigner()
      },
      list: async () => Array.from(keys.values()),
      add: async (keyId, _privateKey, options) => {
        if (keys.has(keyId)) {
          throw new Error(`Key already exists: ${keyId}`)
        }
        keys.set(keyId, {
          id: keyId,
          name: options?.name,
          algorithm: 'secp256k1',
          publicKey: '0xnew',
          address: 'init1new',
          metadata: options?.metadata,
        })
      },
      delete: async keyId => {
        if (!keys.has(keyId)) {
          throw new Error(`Key not found: ${keyId}`)
        }
        keys.delete(keyId)
      },
      importMnemonic: async (keyId, _mnemonic, options) => {
        if (keys.has(keyId)) {
          throw new Error(`Key already exists: ${keyId}`)
        }
        keys.set(keyId, {
          id: keyId,
          name: options?.name,
          algorithm: 'secp256k1',
          publicKey: '0xmnemonic',
          address: 'init1mnemonic',
          metadata: options?.metadata,
        })
      },
    }
  }

  describe('Type Guards', () => {
    it('canAddKeys should return true for stores with add method', () => {
      const fullStore = createFullStore()
      const readOnlyStore = createReadOnlyStore()

      expect(canAddKeys(fullStore)).toBe(true)
      expect(canAddKeys(readOnlyStore)).toBe(false)
    })

    it('canDeleteKeys should return true for stores with delete method', () => {
      const fullStore = createFullStore()
      const readOnlyStore = createReadOnlyStore()

      expect(canDeleteKeys(fullStore)).toBe(true)
      expect(canDeleteKeys(readOnlyStore)).toBe(false)
    })

    it('canImportMnemonic should return true for stores with importMnemonic method', () => {
      const fullStore = createFullStore()
      const readOnlyStore = createReadOnlyStore()

      expect(canImportMnemonic(fullStore)).toBe(true)
      expect(canImportMnemonic(readOnlyStore)).toBe(false)
    })
  })

  describe('KeyStore interface', () => {
    it('has() should return true for existing keys', async () => {
      const store = createReadOnlyStore()

      expect(await store.has('key1')).toBe(true)
      expect(await store.has('nonexistent')).toBe(false)
    })

    it('getSigner() should return a Signer for existing keys', async () => {
      const store = createReadOnlyStore()

      const signer = await store.getSigner('key1')
      expect(signer).toBeDefined()
      expect(typeof signer.getPublicKey).toBe('function')
      expect(typeof signer.getAddress).toBe('function')
    })

    it('getSigner() should throw for nonexistent keys', async () => {
      const store = createReadOnlyStore()

      await expect(store.getSigner('nonexistent')).rejects.toThrow('Key not found')
    })

    it('list() should return all keys', async () => {
      const store = createReadOnlyStore()

      const keys = await store.list()
      expect(keys).toHaveLength(1)
      expect(keys[0].id).toBe('key1')
      expect(keys[0].name).toBe('Test Key 1')
    })
  })

  describe('KeyStore optional methods', () => {
    it('add() should add a new key', async () => {
      const store = createFullStore()

      await store.add!('key2', new Uint8Array(32), { name: 'New Key' })

      expect(await store.has('key2')).toBe(true)
      const keys = await store.list()
      expect(keys).toHaveLength(2)
    })

    it('add() should throw if key already exists', async () => {
      const store = createFullStore()

      await expect(store.add!('key1', new Uint8Array(32))).rejects.toThrow('already exists')
    })

    it('delete() should remove a key', async () => {
      const store = createFullStore()

      expect(await store.has('key1')).toBe(true)
      await store.delete!('key1')
      expect(await store.has('key1')).toBe(false)
    })

    it('delete() should throw if key does not exist', async () => {
      const store = createFullStore()

      await expect(store.delete!('nonexistent')).rejects.toThrow('not found')
    })

    it('importMnemonic() should import a key from mnemonic', async () => {
      const store = createFullStore()
      const mnemonic =
        'abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon about'

      await store.importMnemonic!('mnemonic-key', mnemonic, { name: 'Mnemonic Wallet' })

      expect(await store.has('mnemonic-key')).toBe(true)
      const keys = await store.list()
      const imported = keys.find(k => k.id === 'mnemonic-key')
      expect(imported?.name).toBe('Mnemonic Wallet')
    })
  })

  describe('BaseKeyStore', () => {
    class TestKeyStore extends BaseKeyStore {
      private keys: KeyInfo[] = [
        { id: 'key1', algorithm: 'secp256k1', publicKey: '0x1', address: 'init1a' },
        { id: 'key2', algorithm: 'secp256k1', publicKey: '0x2', address: 'init1b' },
      ]

      async has(keyId: string): Promise<boolean> {
        return this.keys.some(k => k.id === keyId)
      }

      async getSigner(keyId: string): Promise<Signer> {
        if (!this.keys.some(k => k.id === keyId)) {
          throw new Error(`Key not found: ${keyId}`)
        }
        return createMockSigner()
      }

      async list(): Promise<KeyInfo[]> {
        return this.keys
      }
    }

    it('get() should return key info by ID', async () => {
      const store = new TestKeyStore()

      const key = await store.get('key1')
      expect(key).toBeDefined()
      expect(key?.id).toBe('key1')

      const notFound = await store.get('nonexistent')
      expect(notFound).toBeUndefined()
    })

    it('listIds() should return all key IDs', async () => {
      const store = new TestKeyStore()

      const ids = await store.listIds()
      expect(ids).toEqual(['key1', 'key2'])
    })

    it('isEmpty() should check if store is empty', async () => {
      const store = new TestKeyStore()
      expect(await store.isEmpty()).toBe(false)
    })

    it('count() should return number of keys', async () => {
      const store = new TestKeyStore()
      expect(await store.count()).toBe(2)
    })
  })

  describe('KeyInfo structure', () => {
    it('should have correct structure', () => {
      const keyInfo: KeyInfo = {
        id: 'test-key',
        name: 'Test Key',
        algorithm: 'secp256k1',
        publicKey: '0x0123456789abcdef',
        address: 'init1testaddress',
        createdAt: new Date(),
        metadata: { source: 'test' },
      }

      expect(keyInfo.id).toBe('test-key')
      expect(keyInfo.name).toBe('Test Key')
      expect(keyInfo.algorithm).toBe('secp256k1')
      expect(keyInfo.publicKey).toBe('0x0123456789abcdef')
      expect(keyInfo.address).toBe('init1testaddress')
      expect(keyInfo.createdAt).toBeInstanceOf(Date)
      expect(keyInfo.metadata).toEqual({ source: 'test' })
    })

    it('optional fields should be optional', () => {
      const keyInfo: KeyInfo = {
        id: 'minimal-key',
        algorithm: 'secp256k1',
        publicKey: '0x123',
        address: 'init1min',
      }

      expect(keyInfo.name).toBeUndefined()
      expect(keyInfo.createdAt).toBeUndefined()
      expect(keyInfo.metadata).toBeUndefined()
    })
  })
})
