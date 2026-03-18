/**
 * Key module tests.
 *
 * Tests MnemonicKey and RawKey with bech32Prefix support and Signer interface.
 */

import { describe, it, expect } from 'vitest'
import { MnemonicKey, RawKey, DEFAULT_BECH32_PREFIX } from '../../../src/key'
import { isDirectSigner, isAminoSigner, isOfflineSigner, type Signer } from '../../../src/signer'
import { makeSignBytes } from '../../../src/tx/sign'
import { sortObject } from '../../../src/tx/amino'
import { base64 } from '@scure/base'
import { secp256k1 } from '@noble/curves/secp256k1.js'
import { keccak256 } from '../../../src/util/hash'

// Test mnemonic (24 words)
const TEST_MNEMONIC =
  'abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon art'

describe('MnemonicKey', () => {
  describe('default bech32Prefix', () => {
    it('should use "init" prefix by default', () => {
      const key = new MnemonicKey({ mnemonic: TEST_MNEMONIC })

      expect(key.bech32Prefix).toBe('init')
      expect(key.address).toMatch(/^init1/)
      expect(key.valAddress).toMatch(/^initvaloper1/)
    })
  })

  describe('custom bech32Prefix', () => {
    it('should support "noble" prefix', () => {
      const key = new MnemonicKey({
        mnemonic: TEST_MNEMONIC,
        bech32Prefix: 'noble',
      })

      expect(key.bech32Prefix).toBe('noble')
      expect(key.address).toMatch(/^noble1/)
      expect(key.valAddress).toMatch(/^noblevaloper1/)
    })

    it('should support "osmo" prefix', () => {
      const key = new MnemonicKey({
        mnemonic: TEST_MNEMONIC,
        bech32Prefix: 'osmo',
      })

      expect(key.bech32Prefix).toBe('osmo')
      expect(key.address).toMatch(/^osmo1/)
      expect(key.valAddress).toMatch(/^osmovaloper1/)
    })

    it('should support "cosmos" prefix', () => {
      const key = new MnemonicKey({
        mnemonic: TEST_MNEMONIC,
        bech32Prefix: 'cosmos',
      })

      expect(key.bech32Prefix).toBe('cosmos')
      expect(key.address).toMatch(/^cosmos1/)
      expect(key.valAddress).toMatch(/^cosmosvaloper1/)
    })

    it('should generate same raw address regardless of prefix', () => {
      const initKey = new MnemonicKey({ mnemonic: TEST_MNEMONIC })
      const nobleKey = new MnemonicKey({
        mnemonic: TEST_MNEMONIC,
        bech32Prefix: 'noble',
      })

      // Raw addresses should be identical (same private key)
      expect(initKey.rawAddress).toEqual(nobleKey.rawAddress)

      // But bech32 addresses should have different prefixes
      expect(initKey.address).not.toEqual(nobleKey.address)
      expect(initKey.address.slice(0, 4)).toBe('init')
      expect(nobleKey.address.slice(0, 5)).toBe('noble')
    })
  })
})

describe('RawKey', () => {
  // 32-byte private key for testing
  const testPrivateKey = new Uint8Array(32).fill(1)

  describe('destroy()', () => {
    it('should mark key as destroyed', () => {
      const key = new RawKey(new Uint8Array(32).fill(1))
      expect(key.isDestroyed).toBe(false)

      key.destroy()
      expect(key.isDestroyed).toBe(true)
    })

    it('should be idempotent', () => {
      const key = new RawKey(new Uint8Array(32).fill(1))

      key.destroy()
      key.destroy() // Should not throw
      expect(key.isDestroyed).toBe(true)
    })

    it('should throw KeyError on sign() after destroy', async () => {
      const key = new RawKey(new Uint8Array(32).fill(1))
      const message = new Uint8Array([1, 2, 3])

      key.destroy()

      await expect(key.sign(message)).rejects.toThrow('Key has been destroyed')
    })

    it('should throw KeyError on signWithKeccak256() after destroy', async () => {
      const key = new RawKey(new Uint8Array(32).fill(1))
      const message = new Uint8Array([1, 2, 3])

      key.destroy()

      await expect(key.signWithKeccak256(message)).rejects.toThrow('Key has been destroyed')
    })

    it('should still allow address access after destroy', () => {
      const key = new RawKey(new Uint8Array(32).fill(1))
      const addressBefore = key.address

      key.destroy()

      // Address should still be accessible (public key is not destroyed)
      expect(key.address).toBe(addressBefore)
      expect(key.publicKey).toBeDefined()
    })
  })

  describe('default bech32Prefix', () => {
    it('should use "init" prefix by default', () => {
      const key = new RawKey(testPrivateKey)

      expect(key.bech32Prefix).toBe('init')
      expect(key.address).toMatch(/^init1/)
    })
  })

  describe('custom bech32Prefix', () => {
    it('should support custom prefix via constructor', () => {
      const key = new RawKey(testPrivateKey, true, 'noble')

      expect(key.bech32Prefix).toBe('noble')
      expect(key.address).toMatch(/^noble1/)
    })

    it('should support custom prefix via fromHex', () => {
      const hexKey = '01'.repeat(32)
      const key = RawKey.fromHex(hexKey, true, 'osmo')

      expect(key.bech32Prefix).toBe('osmo')
      expect(key.address).toMatch(/^osmo1/)
    })
  })
})

describe('DEFAULT_BECH32_PREFIX', () => {
  it('should be "init"', () => {
    expect(DEFAULT_BECH32_PREFIX).toBe('init')
  })
})

describe('Signer Interface Implementation', () => {
  const TEST_MNEMONIC =
    'abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon art'
  const testPrivateKey = new Uint8Array(32).fill(1)

  describe('MnemonicKey as Signer', () => {
    it('should implement Signer interface', () => {
      const key = new MnemonicKey({ mnemonic: TEST_MNEMONIC })

      // Type assertion - key should be assignable to Signer
      const signer: Signer = key
      expect(signer).toBeDefined()

      // Check interface properties and methods exist
      expect(key.algorithm).toBe('eth_secp256k1') // Initia uses eth_secp256k1 by default
      expect(typeof key.getPublicKey).toBe('function')
      expect(typeof key.getAddress).toBe('function')
      expect(typeof key.sign).toBe('function')
    })

    it('should use secp256k1 algorithm when isEth=false', () => {
      const key = new MnemonicKey({ mnemonic: TEST_MNEMONIC, isEth: false })
      expect(key.algorithm).toBe('secp256k1')
    })

    it('getPublicKey() should return compressed public key', async () => {
      const key = new MnemonicKey({ mnemonic: TEST_MNEMONIC })

      const pubKey = await key.getPublicKey()
      expect(pubKey).toBeInstanceOf(Uint8Array)
      expect(pubKey.length).toBe(33) // compressed secp256k1
      expect(pubKey).toEqual(key.publicKey)
    })

    it('getAddress() should return bech32 address with default prefix', async () => {
      const key = new MnemonicKey({ mnemonic: TEST_MNEMONIC })

      const address = await key.getAddress()
      expect(address).toMatch(/^init1/)
      expect(address).toBe(key.address)
    })

    it('getAddress() should support custom prefix', async () => {
      const key = new MnemonicKey({ mnemonic: TEST_MNEMONIC })

      const address = await key.getAddress('osmo')
      expect(address).toMatch(/^osmo1/)
    })

    it('sign() should return valid signature', async () => {
      const key = new MnemonicKey({ mnemonic: TEST_MNEMONIC })
      const message = new Uint8Array([1, 2, 3, 4, 5])

      const signature = await key.sign(message)
      expect(signature).toBeInstanceOf(Uint8Array)
      expect(signature.length).toBe(64) // r || s format

      // Verify the signature
      expect(key.verify(message, signature)).toBe(true)
    })

    it('verifyWithKeccak256 should verify keccak256-signed messages', async () => {
      const key = new MnemonicKey({ mnemonic: TEST_MNEMONIC })
      const message = new Uint8Array([1, 2, 3, 4, 5])
      const signature = await key.signWithKeccak256(message)
      expect(key.verifyWithKeccak256(message, signature)).toBe(true)
    })

    it('verifyWithKeccak256 should reject invalid signatures', () => {
      const key = new MnemonicKey({ mnemonic: TEST_MNEMONIC })
      const message = new Uint8Array([1, 2, 3, 4, 5])
      const badSig = new Uint8Array(64).fill(0)
      expect(key.verifyWithKeccak256(message, badSig)).toBe(false)
    })

    it('should be OfflineSigner (DirectSigner + AminoSigner)', () => {
      const key = new MnemonicKey({ mnemonic: TEST_MNEMONIC })

      // Key implements OfflineSigner which extends both DirectSigner and AminoSigner
      expect(isDirectSigner(key)).toBe(true)
      expect(isAminoSigner(key)).toBe(true)
      expect(isOfflineSigner(key)).toBe(true)
    })
  })

  describe('MnemonicKey signDirect/signAmino/signPersonal', () => {
    it('signDirect() should produce verifiable DirectSignResponse', async () => {
      const key = new MnemonicKey({ mnemonic: TEST_MNEMONIC })
      const signDoc = {
        bodyBytes: new Uint8Array([10, 20, 30]),
        authInfoBytes: new Uint8Array([40, 50, 60]),
        chainId: 'initiation-2',
        accountNumber: 42n,
      }

      const response = await key.signDirect(key.address, signDoc)

      // signed should be the original signDoc
      expect(response.signed).toBe(signDoc)

      // signature should have pubKey and signature fields
      expect(response.signature.pubKey.typeUrl).toContain('secp256k1')
      expect(response.signature.signature).toBeInstanceOf(Uint8Array)
      expect(response.signature.signature.length).toBe(64)

      // Verify: reconstruct signBytes and verify the signature
      // signDirect uses keccak256 for ethsecp256k1 (isEth=true), so verify with keccak256
      const signBytes = makeSignBytes(
        signDoc.bodyBytes,
        signDoc.authInfoBytes,
        signDoc.chainId,
        signDoc.accountNumber
      )
      const msgHash = keccak256(signBytes)
      expect(
        secp256k1.verify(response.signature.signature, msgHash, key.publicKey, { prehash: false })
      ).toBe(true)
    })

    it('signAmino() should produce verifiable AminoSignResponse', async () => {
      const key = new MnemonicKey({ mnemonic: TEST_MNEMONIC })
      const signDoc = {
        chain_id: 'initiation-2',
        account_number: '42',
        sequence: '0',
        fee: { amount: [{ denom: 'uinit', amount: '1000' }], gas: '200000' },
        msgs: [{ type: 'cosmos-sdk/MsgSend', value: { from: 'a', to: 'b', amount: [] } }],
        memo: '',
      }

      const response = await key.signAmino(key.address, signDoc)

      // signed should be the original signDoc
      expect(response.signed).toBe(signDoc)

      // signature should be base64 encoded
      expect(typeof response.signature.signature).toBe('string')
      const sigBytes = base64.decode(response.signature.signature)
      expect(sigBytes.length).toBe(64)

      // pub_key should have type and base64 value
      expect(response.signature.pub_key.type).toBeTruthy()
      expect(typeof response.signature.pub_key.value).toBe('string')

      // Verify: signAmino uses keccak256 for ethsecp256k1 (isEth=true)
      const sorted = sortObject(signDoc)
      const signBytes = new TextEncoder().encode(JSON.stringify(sorted))
      const msgHash = keccak256(signBytes)
      expect(secp256k1.verify(sigBytes, msgHash, key.publicKey, { prehash: false })).toBe(true)
    })

    it('signPersonal() should produce EIP-191 verifiable signature', async () => {
      const key = new MnemonicKey({ mnemonic: TEST_MNEMONIC })
      const data = new Uint8Array([1, 2, 3, 4, 5])

      const signature = await key.signPersonal(data)
      expect(signature).toBeInstanceOf(Uint8Array)
      expect(signature.length).toBe(64)

      // Verify: reconstruct EIP-191 prefixed message and verify with keccak256
      const prefix = `\x19Ethereum Signed Message:\n${data.length}`
      const prefixBytes = new TextEncoder().encode(prefix)
      const prefixed = new Uint8Array(prefixBytes.length + data.length)
      prefixed.set(prefixBytes, 0)
      prefixed.set(data, prefixBytes.length)
      const msgHash = keccak256(prefixed)
      expect(secp256k1.verify(signature, msgHash, key.publicKey, { prehash: false })).toBe(true)
    })
  })

  describe('RawKey as Signer', () => {
    it('should implement Signer interface with eth_secp256k1 by default', () => {
      const key = new RawKey(testPrivateKey) // isEth=true by default

      const signer: Signer = key
      expect(signer).toBeDefined()

      expect(key.algorithm).toBe('eth_secp256k1')
      expect(typeof key.getPublicKey).toBe('function')
      expect(typeof key.getAddress).toBe('function')
      expect(typeof key.sign).toBe('function')
    })

    it('should use secp256k1 algorithm when isEth=false', () => {
      const key = new RawKey(testPrivateKey, false) // Cosmos style
      expect(key.algorithm).toBe('secp256k1')
    })

    it('getPublicKey() should return compressed public key', async () => {
      const key = new RawKey(testPrivateKey)

      const pubKey = await key.getPublicKey()
      expect(pubKey).toBeInstanceOf(Uint8Array)
      expect(pubKey.length).toBe(33)
    })

    it('getAddress() should support any prefix', async () => {
      const key = new RawKey(testPrivateKey)

      expect(await key.getAddress()).toMatch(/^init1/)
      expect(await key.getAddress('cosmos')).toMatch(/^cosmos1/)
      expect(await key.getAddress('noble')).toMatch(/^noble1/)
    })

    it('sign() should produce verifiable signatures', async () => {
      const key = new RawKey(testPrivateKey)
      const message = new Uint8Array([0xde, 0xad, 0xbe, 0xef])

      const signature = await key.sign(message)
      expect(key.verify(message, signature)).toBe(true)
    })

    it('should be OfflineSigner', () => {
      const key = new RawKey(testPrivateKey)

      expect(isDirectSigner(key)).toBe(true)
      expect(isAminoSigner(key)).toBe(true)
      expect(isOfflineSigner(key)).toBe(true)
    })

    it('signDirect() should produce verifiable response', async () => {
      const key = new RawKey(testPrivateKey)
      const signDoc = {
        bodyBytes: new Uint8Array([1, 2, 3]),
        authInfoBytes: new Uint8Array([4, 5, 6]),
        chainId: 'test-chain',
        accountNumber: 1n,
      }

      const response = await key.signDirect(key.address, signDoc)
      // signDirect uses keccak256 for ethsecp256k1 (isEth=true by default)
      const signBytes = makeSignBytes(
        signDoc.bodyBytes,
        signDoc.authInfoBytes,
        signDoc.chainId,
        signDoc.accountNumber
      )
      const msgHash = keccak256(signBytes)
      expect(
        secp256k1.verify(response.signature.signature, msgHash, key.publicKey, { prehash: false })
      ).toBe(true)
    })
  })
})
