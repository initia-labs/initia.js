// test/unit/signer/bridges/viem.spec.ts
import { describe, it, expect } from 'vitest'
import { RawKey } from '../../../../src/key'
import { keyToViemAccount, createViemSigner } from '../../../../src/signer/bridges/viem'
import {
  isDirectSigner,
  isAminoSigner,
  isOfflineSigner,
  isEIP191Signer,
  isEvmAddressable,
} from '../../../../src/signer'
import { makeSignBytes } from '../../../../src/tx/sign'
import { keccak256 } from '../../../../src/util/hash'
import { isAddress, verifyMessage } from 'viem'
import { privateKeyToAccount } from 'viem/accounts'
import { secp256k1 } from '@noble/curves/secp256k1.js'
import { base64 } from '@scure/base'

const TEST_PRIVATE_KEY = new Uint8Array(32).fill(1)
const PK_HEX: `0x${string}` = `0x${'01'.repeat(32)}`

describe('keyToViemAccount', () => {
  it('should return a valid LocalAccount shape', () => {
    const key = new RawKey(TEST_PRIVATE_KEY)
    const account = keyToViemAccount(key)

    expect(account.type).toBe('local')
    expect(account.source).toBe('custom')
    expect(isAddress(account.address)).toBe(true)
    expect(account.address.toLowerCase()).toBe(key.evmAddress.toLowerCase())
    expect(typeof account.signMessage).toBe('function')
    expect(typeof account.signTransaction).toBe('function')
    expect(typeof account.signTypedData).toBe('function')
  })

  it('should have correct publicKey as hex', () => {
    const key = new RawKey(TEST_PRIVATE_KEY)
    const account = keyToViemAccount(key)

    // viem uses 0x-prefixed hex for publicKey
    expect(account.publicKey).toMatch(/^0x[0-9a-f]{66}$/) // compressed 33 bytes = 66 hex chars
  })

  it('signMessage should produce a 65-byte recoverable signature', async () => {
    const key = new RawKey(TEST_PRIVATE_KEY)
    const account = keyToViemAccount(key)

    const sig = await account.signMessage({ message: 'hello' })

    // 65 bytes = 130 hex chars + 0x prefix
    expect(sig).toMatch(/^0x[0-9a-f]{130}$/)
  })

  it('signMessage result should be verifiable by viem', async () => {
    const key = new RawKey(TEST_PRIVATE_KEY)
    const account = keyToViemAccount(key)
    const message = 'test message for verification'

    const sig = await account.signMessage({ message })
    const valid = await verifyMessage({ address: account.address, message, signature: sig })

    expect(valid).toBe(true)
  })

  it('should throw if key is destroyed', () => {
    const key = new RawKey(new Uint8Array(32).fill(2))
    key.destroy()

    expect(() => keyToViemAccount(key)).toThrow()
  })
})

describe('createViemSigner', () => {
  it('should return an OfflineSigner (Direct + Amino)', () => {
    const account = privateKeyToAccount(PK_HEX)
    const signer = createViemSigner(account)

    expect(isDirectSigner(signer)).toBe(true)
    expect(isAminoSigner(signer)).toBe(true)
    expect(isOfflineSigner(signer)).toBe(true)
    expect(signer.algorithm).toBe('eth_secp256k1')
  })

  it('should implement EIP191Signer', () => {
    const account = privateKeyToAccount(PK_HEX)
    const signer = createViemSigner(account)

    expect(isEIP191Signer(signer)).toBe(true)
    expect(typeof signer.signPersonal).toBe('function')
  })

  it('should implement EvmAddressable', () => {
    const account = privateKeyToAccount(PK_HEX)
    const signer = createViemSigner(account)

    expect(isEvmAddressable(signer)).toBe(true)
    expect(signer.evmAddress).toBe(account.address)
  })

  it('getPublicKey() should return compressed 33-byte pubkey', async () => {
    const account = privateKeyToAccount(PK_HEX)
    const signer = createViemSigner(account)
    const pubKey = await signer.getPublicKey()

    expect(pubKey).toBeInstanceOf(Uint8Array)
    expect(pubKey.length).toBe(33)
  })

  it('getAddress() should return bech32 address with default prefix', async () => {
    const account = privateKeyToAccount(PK_HEX)
    const signer = createViemSigner(account)
    const address = await signer.getAddress()

    expect(address).toMatch(/^init1/)
  })

  it('getAddress() with custom prefix', async () => {
    const account = privateKeyToAccount(PK_HEX)
    const signer = createViemSigner(account, { bech32Prefix: 'osmo' })
    const address = await signer.getAddress('osmo')

    expect(address).toMatch(/^osmo1/)
  })

  it('signDirect() should produce verifiable signature', async () => {
    const account = privateKeyToAccount(PK_HEX)
    const signer = createViemSigner(account)
    const signDoc = {
      bodyBytes: new Uint8Array([10, 20, 30]),
      authInfoBytes: new Uint8Array([40, 50, 60]),
      chainId: 'initiation-2',
      accountNumber: 42n,
    }

    const response = await signer.signDirect(await signer.getAddress(), signDoc)

    // Verify 64-byte signature
    expect(response.signature.signature.length).toBe(64)
    const signBytes = makeSignBytes(
      signDoc.bodyBytes,
      signDoc.authInfoBytes,
      signDoc.chainId,
      signDoc.accountNumber
    )
    const msgHash = keccak256(signBytes)
    const pubKey = await signer.getPublicKey()
    expect(
      secp256k1.verify(response.signature.signature, msgHash, pubKey, { prehash: false })
    ).toBe(true)
  })

  it('signDirect() should produce identical signatures to RawKey for same private key', async () => {
    const key = new RawKey(new Uint8Array(32).fill(1))
    const account = privateKeyToAccount(PK_HEX)
    const signer = createViemSigner(account)
    const signDoc = {
      bodyBytes: new Uint8Array([1, 2, 3]),
      authInfoBytes: new Uint8Array([4, 5, 6]),
      chainId: 'test-chain',
      accountNumber: 1n,
    }

    const keyResponse = await key.signDirect(key.address, signDoc)
    const signerResponse = await signer.signDirect(await signer.getAddress(), signDoc)

    expect(signerResponse.signature.signature).toEqual(keyResponse.signature.signature)
    expect(await signer.getPublicKey()).toEqual(key.publicKey)
  })

  it('signAmino() should produce verifiable signature', async () => {
    const account = privateKeyToAccount(PK_HEX)
    const signer = createViemSigner(account)
    const aminoDoc = {
      chain_id: 'initiation-2',
      account_number: '42',
      sequence: '0',
      fee: { amount: [{ denom: 'uinit', amount: '1000' }], gas: '200000' },
      msgs: [{ type: 'cosmos-sdk/MsgSend', value: { from: 'init1...', to: 'init1...', amount: [] } }],
      memo: '',
    }

    const response = await signer.signAmino(await signer.getAddress(), aminoDoc)

    // Amino response uses base64-encoded strings
    expect(typeof response.signature.signature).toBe('string')
    expect(response.signature.pub_key.type).toBe('tendermint/PubKeyEthSecp256k1')

    // Decode and verify
    const sigBytes = base64.decode(response.signature.signature)
    expect(sigBytes.length).toBe(64)

    const pubKey = await signer.getPublicKey()
    const pubKeyFromResponse = base64.decode(response.signature.pub_key.value)
    expect(pubKeyFromResponse).toEqual(pubKey)
  })

  it('signPersonal() should produce 64-byte signature', async () => {
    const account = privateKeyToAccount(PK_HEX)
    const signer = createViemSigner(account)

    const data = new TextEncoder().encode('test message')
    const sig = await signer.signPersonal(data)

    expect(sig).toBeInstanceOf(Uint8Array)
    expect(sig.length).toBe(64)
  })

  it('should throw for LocalAccount without sign method', () => {
    // Create a minimal LocalAccount without sign
    const mockAccount = {
      address: '0x0000000000000000000000000000000000000001' as `0x${string}`,
      publicKey: `0x${'01'.repeat(33)}` as `0x${string}`,
      type: 'local' as const,
      source: 'custom' as const,
      signMessage: async () => '0x' as `0x${string}`,
      signTransaction: async () => '0x' as `0x${string}`,
      signTypedData: async () => '0x' as `0x${string}`,
      // sign is intentionally omitted
    }

    expect(() => createViemSigner(mockAccount as any)).toThrow(
      'viem LocalAccount must have a sign({ hash }) method'
    )
  })
})
