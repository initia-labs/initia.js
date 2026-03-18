// test/unit/signer/bridges/ethers.spec.ts
import { describe, it, expect } from 'vitest'
import { createEthersSigner } from '../../../../src/signer/bridges/ethers'
import type { EthersSignerLike } from '../../../../src/signer/bridges/ethers'
import {
  isDirectSigner,
  isAminoSigner,
  isOfflineSigner,
  isEIP191Signer,
  isEvmAddressable,
} from '../../../../src/signer'
import { RawKey } from '../../../../src/key'
import { makeSignBytes } from '../../../../src/tx/sign'
import { keccak256 } from '../../../../src/util/hash'
import { secp256k1 } from '@noble/curves/secp256k1.js'
import { bytesToHex, hexToBytes } from '@noble/hashes/utils.js'
import { base64 } from '@scure/base'

const PRIVATE_KEY_HEX = `0x${'01'.repeat(32)}`

/**
 * Create a mock that matches the EthersSignerLike interface,
 * simulating ethers v6 Wallet behavior.
 */
function createMockEthersSigner(pkHex: string): EthersSignerLike {
  const pkBytes = hexToBytes(pkHex.replace(/^0x/, ''))
  const pubKeyCompressed = secp256k1.getPublicKey(pkBytes, true)

  return {
    async signMessage(message: Uint8Array): Promise<string> {
      // Simulate ethers signMessage: EIP-191 prefix + keccak256 + sign
      const prefix = `\x19Ethereum Signed Message:\n${message.length}`
      const prefixBytes = new TextEncoder().encode(prefix)
      const combined = new Uint8Array(prefixBytes.length + message.length)
      combined.set(prefixBytes, 0)
      combined.set(message, prefixBytes.length)
      const hash = keccak256(combined)

      // noble-curves v2: sign() returns Uint8Array (64 bytes compact r||s)
      // Use format:'recovered' for 65 bytes: recovery(1) || r(32) || s(32)
      const sig = secp256k1.sign(hash, pkBytes, { prehash: false, lowS: true, format: 'recovered' })
      const r = bytesToHex(sig.slice(1, 33))
      const s = bytesToHex(sig.slice(33, 65))
      const v = sig[0] === 0 ? '1b' : '1c'
      return `0x${r}${s}${v}`
    },

    signingKey: {
      compressedPublicKey: `0x${bytesToHex(pubKeyCompressed)}`,
      sign(digest: Uint8Array): { r: string; s: string; v: number } {
        // noble-curves v2: sign() returns Uint8Array (64 bytes compact r||s)
        const sig = secp256k1.sign(digest, pkBytes, { prehash: false, lowS: true })
        return {
          r: `0x${bytesToHex(sig.slice(0, 32))}`,
          s: `0x${bytesToHex(sig.slice(32, 64))}`,
          v: 27, // deterministic for test keys
        }
      },
    },
  }
}

describe('createEthersSigner', () => {
  it('should return an OfflineSigner (Direct + Amino)', () => {
    const mock = createMockEthersSigner(PRIVATE_KEY_HEX)
    const signer = createEthersSigner(mock)

    expect(isDirectSigner(signer)).toBe(true)
    expect(isAminoSigner(signer)).toBe(true)
    expect(isOfflineSigner(signer)).toBe(true)
    expect(signer.algorithm).toBe('eth_secp256k1')
  })

  it('should implement EIP191Signer', () => {
    const mock = createMockEthersSigner(PRIVATE_KEY_HEX)
    const signer = createEthersSigner(mock)

    expect(isEIP191Signer(signer)).toBe(true)
    expect(typeof signer.signPersonal).toBe('function')
  })

  it('should implement EvmAddressable', () => {
    const mock = createMockEthersSigner(PRIVATE_KEY_HEX)
    const signer = createEthersSigner(mock)

    expect(isEvmAddressable(signer)).toBe(true)
    expect(signer.evmAddress).toMatch(/^0x[0-9a-f]{40}$/)
  })

  it('getPublicKey() should return compressed 33-byte pubkey', async () => {
    const mock = createMockEthersSigner(PRIVATE_KEY_HEX)
    const signer = createEthersSigner(mock)
    const pubKey = await signer.getPublicKey()

    expect(pubKey).toBeInstanceOf(Uint8Array)
    expect(pubKey.length).toBe(33)
  })

  it('getAddress() should return bech32 address', async () => {
    const mock = createMockEthersSigner(PRIVATE_KEY_HEX)
    const signer = createEthersSigner(mock)
    const address = await signer.getAddress()

    expect(address).toMatch(/^init1/)
  })

  it('getAddress() with custom prefix', async () => {
    const mock = createMockEthersSigner(PRIVATE_KEY_HEX)
    const signer = createEthersSigner(mock, { bech32Prefix: 'osmo' })
    const address = await signer.getAddress('osmo')

    expect(address).toMatch(/^osmo1/)
  })

  it('signDirect() should match RawKey signature', async () => {
    const mock = createMockEthersSigner(PRIVATE_KEY_HEX)
    const signer = createEthersSigner(mock)
    const key = new RawKey(new Uint8Array(32).fill(1))

    const signDoc = {
      bodyBytes: new Uint8Array([10, 20, 30]),
      authInfoBytes: new Uint8Array([40, 50, 60]),
      chainId: 'test-chain',
      accountNumber: 7n,
    }

    const signerResponse = await signer.signDirect(await signer.getAddress(), signDoc)
    const keyResponse = await key.signDirect(key.address, signDoc)

    expect(signerResponse.signature.signature).toEqual(keyResponse.signature.signature)
  })

  it('signDirect() signature should be cryptographically verifiable', async () => {
    const mock = createMockEthersSigner(PRIVATE_KEY_HEX)
    const signer = createEthersSigner(mock)

    const signDoc = {
      bodyBytes: new Uint8Array([10, 20, 30]),
      authInfoBytes: new Uint8Array([40, 50, 60]),
      chainId: 'test-chain',
      accountNumber: 7n,
    }

    const response = await signer.signDirect(await signer.getAddress(), signDoc)
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

  it('signAmino() should produce verifiable signature', async () => {
    const mock = createMockEthersSigner(PRIVATE_KEY_HEX)
    const signer = createEthersSigner(mock)
    const aminoDoc = {
      chain_id: 'test-chain',
      account_number: '7',
      sequence: '0',
      fee: { amount: [{ denom: 'uinit', amount: '1000' }], gas: '200000' },
      msgs: [{ type: 'cosmos-sdk/MsgSend', value: { from: 'init1...', to: 'init1...', amount: [] } }],
      memo: '',
    }

    const response = await signer.signAmino(await signer.getAddress(), aminoDoc)

    expect(typeof response.signature.signature).toBe('string')
    expect(response.signature.pub_key.type).toBe('tendermint/PubKeyEthSecp256k1')

    // Decode and verify the signature
    const sigBytes = base64.decode(response.signature.signature)
    expect(sigBytes.length).toBe(64)

    const pubKey = await signer.getPublicKey()
    const pubKeyFromResponse = base64.decode(response.signature.pub_key.value)
    expect(pubKeyFromResponse).toEqual(pubKey)
  })

  it('signPersonal() should produce 64-byte signature', async () => {
    const mock = createMockEthersSigner(PRIVATE_KEY_HEX)
    const signer = createEthersSigner(mock)

    const data = new TextEncoder().encode('test message')
    const sig = await signer.signPersonal(data)

    expect(sig).toBeInstanceOf(Uint8Array)
    expect(sig.length).toBe(64)
  })

})
