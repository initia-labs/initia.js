import { describe, it, expect } from 'vitest'
import { createWalletConnectSigner } from '../../../../src/signer/bridges/walletconnect'
import type { WalletConnectClientLike } from '../../../../src/signer/bridges/walletconnect'
import {
  isDirectSigner,
  isAminoSigner,
  isOfflineSigner,
  isEIP191Signer,
  isEvmAddressable,
} from '../../../../src/signer'
import { RawKey } from '../../../../src/key'
import { base64 } from '@scure/base'
import { bytesToHex } from '@noble/hashes/utils.js'
import { keccak256 } from '../../../../src/util/hash'

/**
 * Create a mock WC client that simulates a wallet backed by a known key.
 * Handles cosmos_getAccounts, cosmos_signDirect, and cosmos_signAmino.
 */
function createMockWcClient(key: RawKey): WalletConnectClientLike {
  return {
    async request<T>(params: {
      topic: string
      chainId: string
      request: { method: string; params: unknown[] }
    }): Promise<T> {
      const { method } = params.request

      if (method === 'cosmos_getAccounts') {
        return [
          {
            address: key.address,
            algo: 'eth_secp256k1',
            pubkey: base64.encode(key.publicKey),
          },
        ] as T
      }

      if (method === 'cosmos_signDirect') {
        const [{ signerAddress, signDoc }] = params.request.params as [
          {
            signerAddress: string
            signDoc: {
              bodyBytes: string
              authInfoBytes: string
              chainId: string
              accountNumber: string
            }
          },
        ]
        // Simulate wallet signing by delegating to Key
        const directDoc = {
          bodyBytes: base64.decode(signDoc.bodyBytes),
          authInfoBytes: base64.decode(signDoc.authInfoBytes),
          chainId: signDoc.chainId,
          accountNumber: BigInt(signDoc.accountNumber),
        }
        const response = await key.signDirect(signerAddress, directDoc)
        return {
          signed: {
            bodyBytes: signDoc.bodyBytes,
            authInfoBytes: signDoc.authInfoBytes,
            chainId: signDoc.chainId,
            accountNumber: signDoc.accountNumber,
          },
          signature: {
            pub_key: {
              type: response.signature.pubKey.typeUrl,
              value: base64.encode(response.signature.pubKey.value),
            },
            signature: base64.encode(response.signature.signature),
          },
        } as T
      }

      if (method === 'cosmos_signAmino') {
        const [{ signerAddress, signDoc }] = params.request.params as [
          {
            signerAddress: string
            signDoc: Record<string, unknown>
          },
        ]
        const response = await key.signAmino(
          signerAddress,
          signDoc as unknown as Parameters<typeof key.signAmino>[1]
        )
        return {
          signed: response.signed,
          signature: response.signature,
        } as T
      }

      throw new Error(`Unknown method: ${method}`)
    },
  }
}

const TEST_KEY = new RawKey(new Uint8Array(32).fill(1))

describe('createWalletConnectSigner', () => {
  it('should create an OfflineSigner from WC session', async () => {
    const mockClient = createMockWcClient(TEST_KEY)
    const signer = await createWalletConnectSigner(mockClient, {
      topic: 'test-topic',
      chainId: 'initiation-2',
    })

    expect(isDirectSigner(signer)).toBe(true)
    expect(isAminoSigner(signer)).toBe(true)
    expect(isOfflineSigner(signer)).toBe(true)
    expect(signer.algorithm).toBe('eth_secp256k1')
  })

  it('getPublicKey should return the resolved public key', async () => {
    const mockClient = createMockWcClient(TEST_KEY)
    const signer = await createWalletConnectSigner(mockClient, {
      topic: 'test-topic',
      chainId: 'initiation-2',
    })

    const pubKey = await signer.getPublicKey()
    expect(pubKey).toEqual(TEST_KEY.publicKey)
  })

  it('getAddress should return bech32 address matching the key', async () => {
    const mockClient = createMockWcClient(TEST_KEY)
    const signer = await createWalletConnectSigner(mockClient, {
      topic: 'test-topic',
      chainId: 'initiation-2',
    })

    const address = await signer.getAddress()
    expect(address).toBe(TEST_KEY.address)
  })

  it('getAddress with custom prefix', async () => {
    const mockClient = createMockWcClient(TEST_KEY)
    const signer = await createWalletConnectSigner(mockClient, {
      topic: 'test-topic',
      chainId: 'initiation-2',
      bech32Prefix: 'osmo',
    })

    const address = await signer.getAddress('osmo')
    expect(address).toMatch(/^osmo1/)
  })

  it('should accept pre-provided public key (tier 1)', async () => {
    // Mock client that should never be called when publicKey is pre-provided
    const mockClient: WalletConnectClientLike = {
      async request<T>(): Promise<T> {
        throw new Error('Should not be called when publicKey is pre-provided')
      },
    }

    const signer = await createWalletConnectSigner(mockClient, {
      topic: 'test-topic',
      chainId: 'initiation-2',
      publicKey: TEST_KEY.publicKey,
    })

    expect(await signer.getPublicKey()).toEqual(TEST_KEY.publicKey)
    expect(await signer.getAddress()).toBe(TEST_KEY.address)
  })

  it('signDirect should delegate to cosmos_signDirect', async () => {
    const mockClient = createMockWcClient(TEST_KEY)
    const signer = await createWalletConnectSigner(mockClient, {
      topic: 'test-topic',
      chainId: 'initiation-2',
    })

    const signDoc = {
      bodyBytes: new Uint8Array([10, 20, 30]),
      authInfoBytes: new Uint8Array([40, 50, 60]),
      chainId: 'initiation-2',
      accountNumber: 42n,
    }

    const response = await signer.signDirect(TEST_KEY.address, signDoc)
    expect(response.signature.signature).toBeInstanceOf(Uint8Array)
    expect(response.signature.signature.length).toBe(64)
    expect(response.signed.chainId).toBe('initiation-2')
    expect(response.signed.accountNumber).toBe(42n)
  })

  it('signAmino should delegate to cosmos_signAmino', async () => {
    const mockClient = createMockWcClient(TEST_KEY)
    const signer = await createWalletConnectSigner(mockClient, {
      topic: 'test-topic',
      chainId: 'initiation-2',
    })

    const signDoc = {
      chain_id: 'initiation-2',
      account_number: '42',
      sequence: '0',
      fee: { amount: [{ denom: 'uinit', amount: '1000' }], gas: '200000' },
      msgs: [],
      memo: '',
    }

    const response = await signer.signAmino(TEST_KEY.address, signDoc)
    expect(response.signed).toBeDefined()
    expect(response.signature.signature).toBeDefined()
    expect(typeof response.signature.signature).toBe('string')
    expect(response.signature.pub_key.type).toBeDefined()
  })

  it('should NOT have signPersonal without eip155ChainId', async () => {
    const mockClient = createMockWcClient(TEST_KEY)
    const signer = await createWalletConnectSigner(mockClient, {
      topic: 'test-topic',
      chainId: 'initiation-2',
    })

    expect(isEIP191Signer(signer)).toBe(false)
  })

  it('should have signPersonal WITH eip155ChainId', async () => {
    const mockClient = createMockWcClient(TEST_KEY)
    const signer = await createWalletConnectSigner(mockClient, {
      topic: 'test-topic',
      chainId: 'initiation-2',
      eip155ChainId: 2124225178762456,
    })

    expect(isEIP191Signer(signer)).toBe(true)
    expect(typeof signer.signPersonal).toBe('function')
  })

  it('should throw when no public key source available', async () => {
    const mockClient: WalletConnectClientLike = {
      async request<T>(): Promise<T> {
        return [] as T // empty accounts
      },
    }

    await expect(
      createWalletConnectSigner(mockClient, {
        topic: 'test-topic',
        chainId: 'initiation-2',
      })
    ).rejects.toThrow('No accounts found')
  })

  it('should throw when cosmos_getAccounts returns accounts without pubkey', async () => {
    const mockClient: WalletConnectClientLike = {
      async request<T>(params: {
        topic: string
        chainId: string
        request: { method: string; params: unknown[] }
      }): Promise<T> {
        if (params.request.method === 'cosmos_getAccounts') {
          return [{ address: 'init1abc', algo: 'eth_secp256k1', pubkey: '' }] as T
        }
        return [] as T
      },
    }

    await expect(
      createWalletConnectSigner(mockClient, {
        topic: 'test-topic',
        chainId: 'initiation-2',
      })
    ).rejects.toThrow('No accounts found')
  })

  it('signDirect response should contain correct signed fields', async () => {
    const mockClient = createMockWcClient(TEST_KEY)
    const signer = await createWalletConnectSigner(mockClient, {
      topic: 'test-topic',
      chainId: 'initiation-2',
    })

    const signDoc = {
      bodyBytes: new Uint8Array([1, 2, 3, 4, 5]),
      authInfoBytes: new Uint8Array([6, 7, 8, 9, 10]),
      chainId: 'initiation-2',
      accountNumber: 100n,
    }

    const response = await signer.signDirect(TEST_KEY.address, signDoc)

    // The response should have the pubKey typeUrl set
    expect(response.signature.pubKey.typeUrl).toMatch(/^\//)
    expect(response.signature.pubKey.value).toBeInstanceOf(Uint8Array)
  })
})

// =============================================================================
// Tier 3: ecrecover via personal_sign
// =============================================================================

/**
 * Create a mock WC client that supports Tier 3 ecrecover flow:
 * - cosmos_getAccounts → returns account WITHOUT pubkey
 * - eth_accounts → returns EVM address
 * - personal_sign → signs with secp256k1 (EIP-191 compatible)
 * - cosmos_signDirect / cosmos_signAmino → delegates to Key
 */
function createEcrecoverMockClient(key: RawKey): WalletConnectClientLike {
  const evmAddress = key.evmAddress

  return {
    async request<T>(params: {
      topic: string
      chainId: string
      request: { method: string; params: unknown[] }
    }): Promise<T> {
      const { method } = params.request

      if (method === 'cosmos_getAccounts') {
        // Return account WITHOUT pubkey to trigger Tier 3
        return [{ address: key.address, algo: 'eth_secp256k1', pubkey: '' }] as T
      }

      if (method === 'eth_accounts') {
        return [evmAddress] as T
      }

      if (method === 'personal_sign') {
        const [messageHex] = params.request.params as [string]
        // Decode hex message and build EIP-191 prefixed message
        const msgBytes = hexToBytes(messageHex)
        const prefix = `\x19Ethereum Signed Message:\n${msgBytes.length}`
        const prefixBytes = new TextEncoder().encode(prefix)
        const full = new Uint8Array(prefixBytes.length + msgBytes.length)
        full.set(prefixBytes, 0)
        full.set(msgBytes, prefixBytes.length)

        // Use RawKey.signEvmHash to get {r, s, yParity} then encode as 65-byte hex
        const hash = keccak256(full)
        const { r, s, yParity } = await key.signEvmHash(hash)
        const rHex = bytesToHex(r)
        const sHex = bytesToHex(s)
        const vHex = (yParity + 27).toString(16).padStart(2, '0')
        return `0x${rHex}${sHex}${vHex}` as T
      }

      if (method === 'cosmos_signDirect') {
        const [{ signerAddress, signDoc }] = params.request.params as [
          {
            signerAddress: string
            signDoc: {
              bodyBytes: string
              authInfoBytes: string
              chainId: string
              accountNumber: string
            }
          },
        ]
        const directDoc = {
          bodyBytes: base64.decode(signDoc.bodyBytes),
          authInfoBytes: base64.decode(signDoc.authInfoBytes),
          chainId: signDoc.chainId,
          accountNumber: BigInt(signDoc.accountNumber),
        }
        const response = await key.signDirect(signerAddress, directDoc)
        return {
          signed: {
            bodyBytes: signDoc.bodyBytes,
            authInfoBytes: signDoc.authInfoBytes,
            chainId: signDoc.chainId,
            accountNumber: signDoc.accountNumber,
          },
          signature: {
            pub_key: {
              type: response.signature.pubKey.typeUrl,
              value: base64.encode(response.signature.pubKey.value),
            },
            signature: base64.encode(response.signature.signature),
          },
        } as T
      }

      if (method === 'cosmos_signAmino') {
        const [{ signerAddress, signDoc }] = params.request.params as [
          { signerAddress: string; signDoc: Record<string, unknown> },
        ]
        const response = await key.signAmino(
          signerAddress,
          signDoc as unknown as Parameters<typeof key.signAmino>[1]
        )
        return { signed: response.signed, signature: response.signature } as T
      }

      throw new Error(`Unknown method: ${method}`)
    },
  }
}

function hexToBytes(hex: string): Uint8Array {
  const h = hex.replace(/^0x/, '')
  const bytes = new Uint8Array(h.length / 2)
  for (let i = 0; i < bytes.length; i++) {
    bytes[i] = parseInt(h.substring(i * 2, i * 2 + 2), 16)
  }
  return bytes
}

describe('createWalletConnectSigner: Tier 3 ecrecover', () => {
  it('should recover public key via personal_sign when cosmos_getAccounts lacks pubkey', async () => {
    const mockClient = createEcrecoverMockClient(TEST_KEY)
    const signer = await createWalletConnectSigner(mockClient, {
      topic: 'test-topic',
      chainId: 'initiation-2',
      eip155ChainId: 2124225178762456,
    })

    const pubKey = await signer.getPublicKey()
    expect(pubKey).toEqual(TEST_KEY.publicKey)
  })

  it('should derive correct bech32 address after ecrecover', async () => {
    const mockClient = createEcrecoverMockClient(TEST_KEY)
    const signer = await createWalletConnectSigner(mockClient, {
      topic: 'test-topic',
      chainId: 'initiation-2',
      eip155ChainId: 2124225178762456,
    })

    expect(await signer.getAddress()).toBe(TEST_KEY.address)
  })

  it('should have EIP191Signer and EvmAddressable capabilities', async () => {
    const mockClient = createEcrecoverMockClient(TEST_KEY)
    const signer = await createWalletConnectSigner(mockClient, {
      topic: 'test-topic',
      chainId: 'initiation-2',
      eip155ChainId: 2124225178762456,
    })

    expect(isEIP191Signer(signer)).toBe(true)
    expect(isEvmAddressable(signer)).toBe(true)
    expect((signer as any).evmAddress).toBe(TEST_KEY.evmAddress)
  })

  it('should sign Cosmos transactions after ecrecover-based pubkey resolution', async () => {
    const mockClient = createEcrecoverMockClient(TEST_KEY)
    const signer = await createWalletConnectSigner(mockClient, {
      topic: 'test-topic',
      chainId: 'initiation-2',
      eip155ChainId: 2124225178762456,
    })

    const signDoc = {
      bodyBytes: new Uint8Array([10, 20, 30]),
      authInfoBytes: new Uint8Array([40, 50, 60]),
      chainId: 'initiation-2',
      accountNumber: 1n,
    }
    const response = await signer.signDirect(TEST_KEY.address, signDoc)
    expect(response.signature.signature).toBeInstanceOf(Uint8Array)
    expect(response.signature.signature.length).toBe(64)
  })

  it('should throw when eth_accounts returns empty and no pubkey', async () => {
    const mockClient: WalletConnectClientLike = {
      async request<T>(params: {
        topic: string
        chainId: string
        request: { method: string; params: unknown[] }
      }): Promise<T> {
        const { method } = params.request
        if (method === 'cosmos_getAccounts') {
          return [{ address: 'init1abc', algo: 'eth_secp256k1', pubkey: '' }] as T
        }
        if (method === 'eth_accounts') {
          return [] as T // no EVM accounts
        }
        throw new Error(`Unexpected method: ${method}`)
      },
    }

    await expect(
      createWalletConnectSigner(mockClient, {
        topic: 'test-topic',
        chainId: 'initiation-2',
        eip155ChainId: 2124225178762456,
      })
    ).rejects.toThrow('no EVM accounts available for ecrecover')
  })

  it('should throw when recovered address does not match', async () => {
    // Use a different key for signing than the address we claim
    const wrongKey = new RawKey(new Uint8Array(32).fill(2))
    const mockClient: WalletConnectClientLike = {
      async request<T>(params: {
        topic: string
        chainId: string
        request: { method: string; params: unknown[] }
      }): Promise<T> {
        const { method } = params.request
        if (method === 'cosmos_getAccounts') {
          return [{ address: 'init1abc', algo: 'eth_secp256k1', pubkey: '' }] as T
        }
        if (method === 'eth_accounts') {
          // Return TEST_KEY's address but sign with wrongKey
          return [TEST_KEY.evmAddress] as T
        }
        if (method === 'personal_sign') {
          const [messageHex] = params.request.params as [string]
          const msgBytes = hexToBytes(messageHex)
          const prefix = `\x19Ethereum Signed Message:\n${msgBytes.length}`
          const prefixBytes = new TextEncoder().encode(prefix)
          const full = new Uint8Array(prefixBytes.length + msgBytes.length)
          full.set(prefixBytes, 0)
          full.set(msgBytes, prefixBytes.length)
          const hash = keccak256(full)
          // Sign with WRONG key
          const { r, s, yParity } = await wrongKey.signEvmHash(hash)
          const rHex = bytesToHex(r)
          const sHex = bytesToHex(s)
          const vHex = (yParity + 27).toString(16).padStart(2, '0')
          return `0x${rHex}${sHex}${vHex}` as T
        }
        throw new Error(`Unexpected method: ${method}`)
      },
    }

    await expect(
      createWalletConnectSigner(mockClient, {
        topic: 'test-topic',
        chainId: 'initiation-2',
        eip155ChainId: 2124225178762456,
      })
    ).rejects.toThrow('does not match')
  })
})
