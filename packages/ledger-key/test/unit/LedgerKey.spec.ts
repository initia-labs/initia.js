import { describe, it, expect, vi } from 'vitest'
import { LedgerKey, Kind } from '../../src/LedgerKey.js'
import { LedgerError } from '../../src/error.js'
import type { LedgerApp } from '../../src/app.js'
import type { EthereumApp } from '../../src/app.js'
import { UnsignedTx } from 'initia.js'
import { MultisigPublicKey } from 'initia.js'

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/** Build a 33-byte mock compressed public key */
const mockPublicKey = (): Uint8Array => {
  const key = new Uint8Array(33)
  key[0] = 0x02 // compressed point prefix
  key.fill(0xab, 1)
  return key
}

/** Build a 64-byte mock signature (r || s) */
const mockSignature = (): Uint8Array => new Uint8Array(64).fill(0xcd)

/** Minimal mock of LedgerApp so we can control all calls */
function makeMockApp(kind: Kind): LedgerApp {
  const pubKey = mockPublicKey()
  const sig = mockSignature()
  return {
    transport: {} as never,
    getAppConfiguration: vi.fn().mockResolvedValue({ version: '9.9.9' }),
    getVersion: vi.fn().mockResolvedValue('9.9.9'),
    getMinimumRequiredVersion: vi
      .fn()
      .mockReturnValue(kind === Kind.Ethereum ? '1.17.0' : '2.37.3'),
    setLoadConfig: vi.fn(),
    getAddress: vi.fn().mockResolvedValue('0xdeadbeef'),
    getPublicKey: vi.fn().mockResolvedValue(pubKey),
    sign: vi.fn().mockResolvedValue(sig),
    signWithKeccak256: vi.fn().mockResolvedValue(sig),
    signText: vi.fn().mockResolvedValue(sig),
  } as unknown as LedgerApp
}

/** Build a LedgerKey instance with a pre-wired mock app, bypassing transport init */
async function buildLedgerKey(kind = Kind.Ethereum): Promise<{
  key: LedgerKey
  app: LedgerApp
}> {
  // We construct LedgerKey with a fake transport. The constructor creates
  // either EthereumApp or CosmosApp internally, but we immediately overwrite
  // the private `app` field via a test-only bypass.
  const fakeTransport = {
    close: vi.fn(),
    send: vi.fn(),
    decorateAppAPIMethods: vi.fn(),
    setScrambleKey: vi.fn(),
    on: vi.fn(),
    off: vi.fn(),
  } as unknown as import('@ledgerhq/hw-transport').default

  const key = new LedgerKey(fakeTransport, kind)
  const app = makeMockApp(kind)

  // Inject mock app and set publicKey
  ;(key as unknown as { app: LedgerApp }).app = app
  key.publicKey = mockPublicKey()

  return { key, app }
}

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe('LedgerKey', () => {
  describe('constructor', () => {
    it('throws LedgerError for unsupported application kind', () => {
      const fakeTransport = {} as import('@ledgerhq/hw-transport').default
      expect(() => new LedgerKey(fakeTransport, 'Unknown' as Kind)).toThrow(LedgerError)
    })

    it('sets isEth=true for Ethereum kind', async () => {
      const { key } = await buildLedgerKey(Kind.Ethereum)
      expect(key.isEth).toBe(true)
    })

    it('sets isEth=false for Cosmos kind', async () => {
      const { key } = await buildLedgerKey(Kind.Cosmos)
      expect(key.isEth).toBe(false)
    })

    it('sets bech32Prefix to init', async () => {
      const { key } = await buildLedgerKey(Kind.Ethereum)
      expect(key.bech32Prefix).toBe('init')
    })
  })

  describe('getPath', () => {
    it('returns Ethereum path format (no m/ prefix)', async () => {
      const { key } = await buildLedgerKey(Kind.Ethereum)
      expect(key.getPath()).toBe("44'/60'/0'/0/0")
    })

    it('returns Cosmos path format (with m/ prefix, defaults to coinType 118)', async () => {
      const { key } = await buildLedgerKey(Kind.Cosmos)
      expect(key.getPath()).toBe("m/44'/118'/0'/0/0")
    })

    it('uses correct account index in path', async () => {
      const fakeTransport = {
        close: vi.fn(),
        send: vi.fn(),
        decorateAppAPIMethods: vi.fn(),
        setScrambleKey: vi.fn(),
        on: vi.fn(),
        off: vi.fn(),
      } as unknown as import('@ledgerhq/hw-transport').default
      const key = new LedgerKey(fakeTransport, Kind.Ethereum, { index: 3 })
      expect(key.getPath()).toBe("44'/60'/0'/0/3")
    })
  })

  describe('getApplicationKind', () => {
    it('returns Kind.Ethereum for ethereum key', async () => {
      const { key } = await buildLedgerKey(Kind.Ethereum)
      expect(key.getApplicationKind()).toBe(Kind.Ethereum)
    })

    it('returns Kind.Cosmos for cosmos key', async () => {
      const { key } = await buildLedgerKey(Kind.Cosmos)
      expect(key.getApplicationKind()).toBe(Kind.Cosmos)
    })
  })

  describe('getApplication', () => {
    it('returns the injected app instance', async () => {
      const { key, app } = await buildLedgerKey(Kind.Ethereum)
      expect(key.getApplication()).toBe(app)
    })
  })

  describe('loadAccountDetails', () => {
    it('populates publicKey from app.getPublicKey', async () => {
      const { key, app } = await buildLedgerKey(Kind.Ethereum)
      const expected = mockPublicKey()
      vi.mocked(app.getPublicKey).mockResolvedValue(expected)

      await key.loadAccountDetails()

      expect(key.publicKey).toEqual(expected)
      expect(app.getPublicKey).toHaveBeenCalledWith(key.getPath(), false)
    })

    it('returns the LedgerKey instance for chaining', async () => {
      const { key } = await buildLedgerKey(Kind.Ethereum)
      const result = await key.loadAccountDetails()
      expect(result).toBe(key)
    })
  })

  describe('signRaw (protected via sign delegation)', () => {
    it('delegates to app.sign with the correct path', async () => {
      const { key, app } = await buildLedgerKey(Kind.Cosmos)
      // Access signRaw via casting since it's protected
      const raw = key as unknown as { signRaw(msg: Uint8Array): Promise<Uint8Array> }
      const msg = new Uint8Array(32).fill(0x01)

      const result = await raw.signRaw(msg)

      expect(app.sign).toHaveBeenCalledWith(key.getPath(), msg)
      expect(result).toEqual(mockSignature())
    })
  })

  describe('signWithKeccak256', () => {
    it('delegates to app.signWithKeccak256 with the correct path', async () => {
      const { key, app } = await buildLedgerKey(Kind.Ethereum)
      const msg = new Uint8Array(32).fill(0x02)

      const result = await key.signWithKeccak256(msg)

      expect(app.signWithKeccak256).toHaveBeenCalledWith(key.getPath(), msg)
      expect(result).toEqual(mockSignature())
    })
  })

  describe('signText', () => {
    it('delegates to app.signText with the correct path', async () => {
      const { key, app } = await buildLedgerKey(Kind.Ethereum)

      const result = await key.signText('hello ledger')

      expect(app.signText).toHaveBeenCalledWith(key.getPath(), 'hello ledger')
      expect(result).toEqual(mockSignature())
    })
  })

  describe('address derivation (inherited from Key)', () => {
    it('exposes a valid address string for Ethereum key', async () => {
      const { key } = await buildLedgerKey(Kind.Ethereum)
      expect(key.address).toMatch(/^init1/)
    })

    it('exposes a valid bech32 address for Cosmos key', async () => {
      const { key } = await buildLedgerKey(Kind.Cosmos)
      expect(key.address).toMatch(/^init1/)
    })

    it('exposes algorithm=eth_secp256k1 for Ethereum key', async () => {
      const { key } = await buildLedgerKey(Kind.Ethereum)
      expect(key.algorithm).toBe('eth_secp256k1')
    })

    it('exposes algorithm=secp256k1 for Cosmos key', async () => {
      const { key } = await buildLedgerKey(Kind.Cosmos)
      expect(key.algorithm).toBe('secp256k1')
    })
  })

  describe('setLoadConfig', () => {
    it('delegates to app.setLoadConfig', async () => {
      const { key, app } = await buildLedgerKey(Kind.Ethereum)
      const config = { nftExplorerBaseURL: null }
      key.setLoadConfig(config as never)
      expect(app.setLoadConfig).toHaveBeenCalledWith(config)
    })
  })

  describe('getTransport', () => {
    it('returns the transport from app', async () => {
      const { key, app } = await buildLedgerKey(Kind.Ethereum)
      expect(key.getTransport()).toBe(app.transport)
    })
  })

  describe('getAppConfiguration', () => {
    it('delegates to app.getAppConfiguration', async () => {
      const { key, app } = await buildLedgerKey(Kind.Ethereum)
      await key.getAppConfiguration()
      expect(app.getAppConfiguration).toHaveBeenCalled()
    })
  })

  describe('semver version check (via initialize)', () => {
    it('throws LedgerError when installed version is below minimum', async () => {
      const fakeTransport = {
        close: vi.fn(),
        send: vi.fn(),
        decorateAppAPIMethods: vi.fn(),
        setScrambleKey: vi.fn(),
        on: vi.fn(),
        off: vi.fn(),
      } as unknown as import('@ledgerhq/hw-transport').default

      const key = new LedgerKey(fakeTransport, Kind.Ethereum)
      const app = makeMockApp(Kind.Ethereum)
      vi.mocked(app.getVersion).mockResolvedValue('1.0.0') // below 1.17.0
      ;(key as unknown as { app: LedgerApp }).app = app

      // Access private initialize
      const init = (key as unknown as { initialize(): Promise<void> }).initialize
      await expect(init.call(key)).rejects.toThrow(LedgerError)
    })
  })

  describe('sign(tx) overload via Key base class', () => {
    it('returns a 64-byte signature for Ethereum key (eip191 mode)', async () => {
      const { key, app } = await buildLedgerKey(Kind.Ethereum)
      ;(app as any).signPersonal = vi.fn().mockResolvedValue(new Uint8Array(64).fill(0xcd))
      const tx = new UnsignedTx({
        msgs: [],
        signMode: 'eip191',
        chainId: 'test-1',
        accountNumber: 0n,
        sequence: 0n,
        fee: [],
        gasLimit: 200000n,
        memo: 'ledger-test',
      })
      const sig = await key.sign(tx)
      expect(sig).toBeInstanceOf(Uint8Array)
      expect(sig.length).toBe(64)
    })

    it('returns a 64-byte signature for Cosmos key (amino mode)', async () => {
      const { key } = await buildLedgerKey(Kind.Cosmos)
      const tx = new UnsignedTx({
        msgs: [],
        signMode: 'amino',
        chainId: 'test-1',
        accountNumber: 1n,
        sequence: 2n,
        fee: [{ denom: 'uinit', amount: '1000' }],
        gasLimit: 100000n,
        memo: 'cosmos-ledger',
      })
      const sig = await key.sign(tx)
      expect(sig).toBeInstanceOf(Uint8Array)
      expect(sig.length).toBe(64)
    })

    it('Ethereum key routes sign(tx) through signPersonal (eip191)', async () => {
      const { key, app } = await buildLedgerKey(Kind.Ethereum)
      ;(app as any).signPersonal = vi.fn().mockResolvedValue(new Uint8Array(64).fill(0xcd))
      const tx = new UnsignedTx({
        msgs: [],
        signMode: 'eip191',
        chainId: 'test-1',
        accountNumber: 0n,
        sequence: 0n,
        fee: [],
        gasLimit: 200000n,
        memo: '',
      })
      await key.sign(tx)
      expect((app as any).signPersonal).toHaveBeenCalledOnce()
      expect(app.signWithKeccak256).not.toHaveBeenCalled()
    })

    it('Cosmos key routes sign(tx) through signRaw (amino)', async () => {
      const { key, app } = await buildLedgerKey(Kind.Cosmos)
      const tx = new UnsignedTx({
        msgs: [],
        signMode: 'amino',
        chainId: 'test-1',
        accountNumber: 0n,
        sequence: 0n,
        fee: [],
        gasLimit: 200000n,
        memo: '',
      })
      await key.sign(tx)
      expect(app.sign).toHaveBeenCalledOnce()
      expect(app.signWithKeccak256).not.toHaveBeenCalled()
    })
  })

  describe('sign(tx, mpk) multisig overload via Key base class', () => {
    it('returns MultisigSignature with correct index when key is first member', async () => {
      const { key } = await buildLedgerKey(Kind.Ethereum)
      const dummyKey1 = new Uint8Array(33)
      dummyKey1[0] = 0x02
      dummyKey1.fill(0x01, 1)
      const dummyKey2 = new Uint8Array(33)
      dummyKey2[0] = 0x02
      dummyKey2.fill(0x02, 1)
      const mpk = new MultisigPublicKey(2, [key.publicKey, dummyKey1, dummyKey2])

      const tx = new UnsignedTx({
        msgs: [],
        signMode: 'direct',
        chainId: 'test-1',
        accountNumber: 0n,
        sequence: 0n,
        fee: [],
        gasLimit: 200000n,
        memo: 'multisig-ledger',
      })
      const result = await key.sign(tx, mpk)
      expect(result.index).toBe(0)
      expect(result.signature).toBeInstanceOf(Uint8Array)
      expect(result.signature.length).toBe(64)
    })

    it('returns MultisigSignature with correct index when key is not first member', async () => {
      const { key } = await buildLedgerKey(Kind.Cosmos)
      const dummyKey1 = new Uint8Array(33)
      dummyKey1[0] = 0x02
      dummyKey1.fill(0x01, 1)
      // Place the real key at index 1
      const mpk = new MultisigPublicKey(1, [dummyKey1, key.publicKey])

      const tx = new UnsignedTx({
        msgs: [],
        signMode: 'direct',
        chainId: 'test-1',
        accountNumber: 0n,
        sequence: 0n,
        fee: [],
        gasLimit: 200000n,
        memo: 'multisig-cosmos',
      })
      const result = await key.sign(tx, mpk)
      expect(result.index).toBe(1)
      expect(result.signature.length).toBe(64)
    })

    it('throws ValidationError when key is not in the multisig group', async () => {
      const { key } = await buildLedgerKey(Kind.Ethereum)
      const dummyKey1 = new Uint8Array(33)
      dummyKey1[0] = 0x02
      dummyKey1.fill(0x01, 1)
      const dummyKey2 = new Uint8Array(33)
      dummyKey2[0] = 0x02
      dummyKey2.fill(0x02, 1)
      // mpk does NOT include key.publicKey
      const mpk = new MultisigPublicKey(1, [dummyKey1, dummyKey2])

      const tx = new UnsignedTx({
        msgs: [],
        signMode: 'direct',
        chainId: 'test-1',
        accountNumber: 0n,
        sequence: 0n,
        fee: [],
        gasLimit: 200000n,
        memo: '',
      })
      await expect(key.sign(tx, mpk)).rejects.toThrow()
    })
  })

  describe('showAddressAndPubKey', () => {
    it('delegates to app.getAddress with display=true', async () => {
      const { key, app } = await buildLedgerKey(Kind.Ethereum)
      await key.showAddressAndPubKey()
      expect(app.getAddress).toHaveBeenCalledWith(key.getPath(), true)
    })

    it('works for Cosmos kind as well', async () => {
      const { key, app } = await buildLedgerKey(Kind.Cosmos)
      await key.showAddressAndPubKey()
      expect(app.getAddress).toHaveBeenCalledWith(key.getPath(), true)
    })
  })

  describe('DER signature parsing (via CosmosApp.sign mock)', () => {
    it('app.sign result is always 64 bytes regardless of input size', async () => {
      const { key, app } = await buildLedgerKey(Kind.Cosmos)
      // The mock returns a 64-byte signature regardless; verify the contract holds
      const msg = new Uint8Array(32).fill(0xaa)
      const sig = await (key as unknown as { signRaw(m: Uint8Array): Promise<Uint8Array> }).signRaw(
        msg
      )
      expect(sig).toBeInstanceOf(Uint8Array)
      expect(sig.length).toBe(64)
      expect(app.sign).toHaveBeenCalledWith(key.getPath(), msg)
    })

    it('CosmosApp.sign with a real DER-encoded signature yields 64-byte compact output', async () => {
      // Import CosmosApp for direct unit testing of DER parsing logic
      const { CosmosApp } = await import('../../src/app.js')

      // Build a fake transport that returns a real DER signature
      const r = new Uint8Array(32).fill(0x11)
      const s = new Uint8Array(32).fill(0x22)
      // DER format: 30 <bodyLen> 02 20 <r> 02 20 <s>
      const bodyLen = 2 + 32 + 2 + 32 // 68
      const derSig = new Uint8Array([0x30, bodyLen, 0x02, 32, ...r, 0x02, 32, ...s])

      const mockInnerApp = {
        sign: vi.fn().mockResolvedValue({ signature: derSig }),
        getVersion: vi.fn().mockResolvedValue({ major: 2, minor: 37, patch: 3 }),
        appInfo: vi.fn().mockResolvedValue({}),
        getAddressAndPubKey: vi.fn(),
        showAddressAndPubKey: vi.fn(),
      }
      const fakeTransport = {
        decorateAppAPIMethods: vi.fn(),
        setScrambleKey: vi.fn(),
        close: vi.fn(),
        send: vi.fn(),
        on: vi.fn(),
        off: vi.fn(),
      } as unknown as import('@ledgerhq/hw-transport').default

      const cosmosApp = new CosmosApp(fakeTransport)
      // Inject the mock inner app
      ;(cosmosApp as unknown as { app: typeof mockInnerApp }).app = mockInnerApp

      const result = await cosmosApp.sign("m/44'/118'/0'/0/0", new Uint8Array(32))
      expect(result).toBeInstanceOf(Uint8Array)
      expect(result.length).toBe(64)

      // r occupies bytes 0..31, s occupies bytes 32..63
      expect(result.slice(0, 32)).toEqual(r)
      expect(result.slice(32, 64)).toEqual(s)
    })
  })

  describe('signPersonal override (#bug2)', () => {
    it('Ethereum app: delegates to app.signPersonal, bypassing Key.signPersonal prefix', async () => {
      const { key, app } = await buildLedgerKey(Kind.Ethereum)
      // Add signPersonal mock to the app
      const ethApp = app as unknown as EthereumApp
      ethApp.signPersonal = vi.fn().mockResolvedValue(new Uint8Array(64).fill(0xcd))

      const data = new TextEncoder().encode('{"test":"amino"}')
      const sig = await key.signPersonal(data)

      expect(ethApp.signPersonal).toHaveBeenCalledWith(
        expect.any(String), // path
        data // raw bytes, no EIP-191 prefix
      )
      expect(sig.length).toBe(64)
      // Verify signWithKeccak256 was NOT called (no prefix cycle)
      expect(app.signWithKeccak256).not.toHaveBeenCalled()
    })

    it('Cosmos app: falls back to super.signPersonal (Key.signPersonal with prefix)', async () => {
      const { key, app } = await buildLedgerKey(Kind.Cosmos)

      const data = new TextEncoder().encode('{"test":"amino"}')
      const sig = await key.signPersonal(data)

      // super.signPersonal adds EIP-191 prefix → calls signWithKeccak256
      expect(app.signWithKeccak256).toHaveBeenCalled()
      expect(sig.length).toBe(64)
    })
  })

  describe('_signTx eip191 uses signPersonal path (#bug2)', () => {
    it('eip191 mode calls signPersonal instead of signWithKeccak256', async () => {
      const { key, app } = await buildLedgerKey(Kind.Ethereum)
      const ethApp = app as unknown as EthereumApp
      ethApp.signPersonal = vi.fn().mockResolvedValue(new Uint8Array(64).fill(0xcd))

      const tx = new UnsignedTx({
        msgs: [],
        signMode: 'eip191',
        chainId: 'initiation-2',
        accountNumber: 0n,
        sequence: 0n,
        fee: [],
        gasLimit: 200000n,
        memo: '',
        timeoutHeight: 0n,
      })

      await key.sign(tx)

      // signPersonal should have been called (not signWithKeccak256)
      expect(ethApp.signPersonal).toHaveBeenCalled()
      expect(app.signWithKeccak256).not.toHaveBeenCalled()
    })
  })

  describe('EthereumApp public key decompression branches', () => {
    it('handles 66-char hex (already compressed, 33 bytes)', async () => {
      const { EthereumApp } = await import('../../src/app.js')
      const compressedHex = '02' + 'ab'.repeat(32) // 66 hex chars
      const mockInnerApp = {
        getAddress: vi.fn().mockResolvedValue({ address: '0x1234', publicKey: compressedHex }),
        getAppConfiguration: vi.fn().mockResolvedValue({ version: '2.0.0' }),
        signPersonalMessage: vi.fn(),
        setLoadConfig: vi.fn(),
      }
      const fakeTransport = {
        decorateAppAPIMethods: vi.fn(),
        setScrambleKey: vi.fn(),
        close: vi.fn(),
        send: vi.fn(),
        on: vi.fn(),
        off: vi.fn(),
      } as unknown as import('@ledgerhq/hw-transport').default

      const ethApp = new EthereumApp(fakeTransport)
      ;(ethApp as unknown as { app: typeof mockInnerApp }).app = mockInnerApp

      const pubKey = await ethApp.getPublicKey("44'/60'/0'/0/0", false)
      expect(pubKey.length).toBe(33)
      expect(pubKey[0]).toBe(0x02)
    })

    it('handles 130-char hex (uncompressed with 04 prefix, 65 bytes) and compresses to 33 bytes', async () => {
      const { EthereumApp } = await import('../../src/app.js')
      // A valid secp256k1 point: use a known generator point
      // G = 04 79BE667E...FDBA33 (uncompressed), 130 hex chars
      const Gx = '79BE667EF9DCBBAC55A06295CE870B07029BFCDB2DCE28D959F2815B16F81798'
      const Gy = '483ADA7726A3C4655DA4FBFC0E1108A8FD17B448A68554199C47D08FFB10D4B8'
      const uncompressedHex = '04' + Gx + Gy

      const mockInnerApp = {
        getAddress: vi.fn().mockResolvedValue({
          address: '0x5678',
          publicKey: uncompressedHex.toLowerCase(),
        }),
        getAppConfiguration: vi.fn().mockResolvedValue({ version: '2.0.0' }),
        signPersonalMessage: vi.fn(),
        setLoadConfig: vi.fn(),
      }
      const fakeTransport = {
        decorateAppAPIMethods: vi.fn(),
        setScrambleKey: vi.fn(),
        close: vi.fn(),
        send: vi.fn(),
        on: vi.fn(),
        off: vi.fn(),
      } as unknown as import('@ledgerhq/hw-transport').default

      const ethApp = new EthereumApp(fakeTransport)
      ;(ethApp as unknown as { app: typeof mockInnerApp }).app = mockInnerApp

      const pubKey = await ethApp.getPublicKey("44'/60'/0'/0/0", false)
      expect(pubKey.length).toBe(33)
      // Generator point has an even Y, so prefix should be 0x02
      expect(pubKey[0]).toBe(0x02)
    })

    it('handles 128-char hex (uncompressed without 04 prefix, 64 bytes) and compresses to 33 bytes', async () => {
      const { EthereumApp } = await import('../../src/app.js')
      // Same generator point without the 04 prefix
      const Gx = '79BE667EF9DCBBAC55A06295CE870B07029BFCDB2DCE28D959F2815B16F81798'
      const Gy = '483ADA7726A3C4655DA4FBFC0E1108A8FD17B448A68554199C47D08FFB10D4B8'
      const noPrefix128 = (Gx + Gy).toLowerCase()

      const mockInnerApp = {
        getAddress: vi.fn().mockResolvedValue({ address: '0x9abc', publicKey: noPrefix128 }),
        getAppConfiguration: vi.fn().mockResolvedValue({ version: '2.0.0' }),
        signPersonalMessage: vi.fn(),
        setLoadConfig: vi.fn(),
      }
      const fakeTransport = {
        decorateAppAPIMethods: vi.fn(),
        setScrambleKey: vi.fn(),
        close: vi.fn(),
        send: vi.fn(),
        on: vi.fn(),
        off: vi.fn(),
      } as unknown as import('@ledgerhq/hw-transport').default

      const ethApp = new EthereumApp(fakeTransport)
      ;(ethApp as unknown as { app: typeof mockInnerApp }).app = mockInnerApp

      const pubKey = await ethApp.getPublicKey("44'/60'/0'/0/0", false)
      expect(pubKey.length).toBe(33)
      expect(pubKey[0]).toBe(0x02)
    })

    it('throws LedgerError for an invalid public key length', async () => {
      const { EthereumApp } = await import('../../src/app.js')
      const mockInnerApp = {
        getAddress: vi.fn().mockResolvedValue({ address: '0x', publicKey: 'deadbeef' }), // 8 chars — invalid
        getAppConfiguration: vi.fn(),
        signPersonalMessage: vi.fn(),
        setLoadConfig: vi.fn(),
      }
      const fakeTransport = {
        decorateAppAPIMethods: vi.fn(),
        setScrambleKey: vi.fn(),
        close: vi.fn(),
        send: vi.fn(),
        on: vi.fn(),
        off: vi.fn(),
      } as unknown as import('@ledgerhq/hw-transport').default

      const ethApp = new EthereumApp(fakeTransport)
      ;(ethApp as unknown as { app: typeof mockInnerApp }).app = mockInnerApp

      await expect(ethApp.getPublicKey("44'/60'/0'/0/0", false)).rejects.toThrow(LedgerError)
    })
  })
})
