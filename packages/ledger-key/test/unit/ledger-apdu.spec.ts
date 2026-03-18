/**
 * APDU-level integration tests for LedgerKey using @ledgerhq/hw-transport-mocker.
 *
 * These tests exercise the FULL stack: Transport -> LedgerApp -> LedgerKey
 * without mocking at the application layer. The transport replayer feeds
 * pre-computed APDU responses so we can verify that app.ts correctly builds
 * APDUs and parses device responses.
 *
 * APDU protocol reference:
 *   transport.send(CLA, INS, P1, P2, data) calls
 *   transport.exchange(Buffer.concat([CLA, INS, P1, P2, data.length, ...data]))
 *   Response: payload + 0x9000 (2-byte status suffix, big-endian)
 *
 * Ethereum app: CLA=0xe0
 *   INS 0x02 = getAddress, INS 0x06 = getAppConfiguration, INS 0x08 = signPersonalMessage
 *
 * Cosmos app: CLA=0x55
 *   INS 0x00 = getVersion, INS 0x02 = sign, INS 0x04 = getAddressAndPubKey
 */
import { describe, it, expect, afterEach } from 'vitest'
import { RecordStore, openTransportReplayer } from '@ledgerhq/hw-transport-mocker'
import { EthereumApp, CosmosApp, LedgerKey, Kind } from '../../src/index.js'

// ---------------------------------------------------------------------------
// Fixture constants
// ---------------------------------------------------------------------------

/** secp256k1 generator point G (uncompressed, 64 bytes without 04 prefix) */
const G_X = '79BE667EF9DCBBAC55A06295CE870B07029BFCDB2DCE28D959F2815B16F81798'
const G_Y = '483ADA7726A3C4655DA4FBFC0E1108A8FD17B448A68554199C47D08FFB10D4B8'
const G_COMPRESSED = '02' + G_X

const SW_OK = '9000'

// ---------------------------------------------------------------------------
// APDU builders — Ethereum app (CLA=0xe0)
// ---------------------------------------------------------------------------

/** ETH getAppConfiguration: e0 06 00 00 00 */
const ETH_GET_CONFIG_APDU = 'e006000000'
/**
 * Response: [flags(1), major(1), minor(1), patch(1)] + SW_OK
 * version "2.1.0" -> flags=0x01, major=2, minor=1, patch=0
 */
const ETH_GET_CONFIG_RESP = '01020100' + SW_OK

/**
 * ETH getAddress for path 44'/60'/0'/0/0
 * data: [pathCount=5, 8000002c, 8000003c, 80000000, 00000000, 00000000]
 * Full: e0 02 00 00 15 <data>
 */
const ETH_GET_ADDR_APDU = 'e002000015058000002c8000003c800000000000000000000000'

/**
 * Response: [pubKeyLen(1), pubKey(64), addrLen(1), addr(ascii), SW_OK]
 * Using generator point G without 04 prefix (128 hex = 64 bytes)
 */
function buildEthGetAddressResponse(): string {
  const pubKey = G_X + G_Y // 64 bytes
  const pubKeyLen = (pubKey.length / 2).toString(16).padStart(2, '0')
  const addr = '7E5F4552091A69125d5DfCb7b8C2659029395Bdf'
  const addrHex = Buffer.from(addr, 'ascii').toString('hex')
  const addrLen = addr.length.toString(16).padStart(2, '0')
  return pubKeyLen + pubKey + addrLen + addrHex + SW_OK
}

const ETH_GET_ADDR_RESP = buildEthGetAddressResponse()

/**
 * ETH signPersonalMessage for path 44'/60'/0'/0/0 with message "{}"
 * data: [pathCount=5, paths(20bytes), msgLen(4bytes)=0x00000002, msg=7b7d]
 * Full: e0 08 00 00 1b <data>
 */
const ETH_SIGN_MSG_APDU = 'e00800001b058000002c8000003c800000000000000000000000000000027b7d'

/**
 * Response: [v(1), r(32), s(32)] + SW_OK
 * v=27(0x1b), r=0x11...11, s=0x22...22
 */
const ETH_SIGN_MSG_RESP = '1b' + '11'.repeat(32) + '22'.repeat(32) + SW_OK

/**
 * ETH signPersonalMessage for path 44'/60'/0'/0/0 with message "hello ledger"
 * data: [pathCount=5, paths(20bytes), msgLen(4bytes)=0x0000000c, msg(12bytes)]
 */
const ETH_SIGN_TEXT_APDU =
  'e008000025058000002c8000003c8000000000000000000000000000000c68656c6c6f206c6564676572'
const ETH_SIGN_TEXT_RESP = ETH_SIGN_MSG_RESP // same signature shape

// ---------------------------------------------------------------------------
// APDU builders — Cosmos app (CLA=0x55)
// ---------------------------------------------------------------------------

/** COSMOS getVersion: 55 00 00 00 00 */
const COS_GET_VERSION_APDU = '5500000000'
/**
 * Response: [testMode(1), major(1), minor(1), patch(1), locked(1)] + SW_OK
 * version "2.37.3" -> testMode=0, major=2, minor=0x25, patch=3, locked=0
 */
const COS_GET_VERSION_RESP = '0002250300' + SW_OK

/**
 * COSMOS getAddressAndPubKey for path m/44'/118'/0'/0/0, hrp="init"
 * data: [hrpLen=4, hrp="init", paths(20bytes LE)]
 * Path elements (uint32 LE): 44+HARDENED=2c000080, 118+HARDENED=76000080,
 *   0+HARDENED=00000080, 0=00000000, 0=00000000
 * Full: 55 04 00 00 19 <data>
 */
const COS_GET_ADDR_APDU = '550400001904696e69742c00008076000080000000800000000000000000'
/**
 * Response: [compressed_pk(33bytes), bech32_address(ascii)] + SW_OK
 * Using compressed generator point G
 */
function buildCosmosGetAddressResponse(): string {
  const bech32Addr = 'init1qypqxpq9qcrsszgszyfpx8q0nz6z3e4swxhfsr'
  const bech32Hex = Buffer.from(bech32Addr, 'ascii').toString('hex')
  return G_COMPRESSED.toLowerCase() + bech32Hex + SW_OK
}
const COS_GET_ADDR_RESP = buildCosmosGetAddressResponse()

/**
 * COSMOS sign (JSON mode, txtype=0) for path m/44'/118'/0'/0/0, hrp="init"
 * Uses chunked protocol:
 *   Chunk 1 (INIT, P1=0x00): data = serializedPath(LE) + serializeHRP('init')
 *   Chunk 2 (LAST, P1=0x02): data = message bytes
 * Note: sign puts path FIRST, then HRP (opposite of getAddressAndPubKey)
 */
const COS_SIGN_INIT_APDU = '55020000192c0000807600008000000080000000000000000004696e6974'
const COS_SIGN_INIT_RESP = SW_OK // empty payload, just success

const COS_SIGN_LAST_APDU = '55020200027b7d' // message = "{}"
/**
 * Response: DER signature + SW_OK
 * DER: 30 44 02 20 <r(32bytes)> 02 20 <s(32bytes)>
 * r=0x33...33, s=0x44...44
 */
const COS_SIGN_LAST_RESP = '3044' + '0220' + '33'.repeat(32) + '0220' + '44'.repeat(32) + SW_OK

// ---------------------------------------------------------------------------
// Tests — EthereumApp (APDU-level)
// ---------------------------------------------------------------------------

describe('EthereumApp (APDU replayer)', () => {
  let transport: Awaited<ReturnType<typeof openTransportReplayer>>

  afterEach(() => transport?.close())

  it('getVersion parses the version from getAppConfiguration', async () => {
    const store = RecordStore.fromString(`
      => ${ETH_GET_CONFIG_APDU}
      <= ${ETH_GET_CONFIG_RESP}
    `)
    transport = await openTransportReplayer(store)
    const app = new EthereumApp(transport)

    const version = await app.getVersion()

    expect(version).toBe('2.1.0')
    store.ensureQueueEmpty()
  })

  it('getPublicKey returns compressed 33-byte key from uncompressed response', async () => {
    const store = RecordStore.fromString(`
      => ${ETH_GET_ADDR_APDU}
      <= ${ETH_GET_ADDR_RESP}
    `)
    transport = await openTransportReplayer(store)
    const app = new EthereumApp(transport)

    const pubKey = await app.getPublicKey("44'/60'/0'/0/0")

    expect(pubKey).toBeInstanceOf(Uint8Array)
    expect(pubKey.length).toBe(33)
    // G has even Y, so prefix 0x02
    expect(pubKey[0]).toBe(0x02)
    store.ensureQueueEmpty()
  })

  it('getAddress returns hex address string', async () => {
    const store = RecordStore.fromString(`
      => ${ETH_GET_ADDR_APDU}
      <= ${ETH_GET_ADDR_RESP}
    `)
    transport = await openTransportReplayer(store)
    const app = new EthereumApp(transport)

    const address = await app.getAddress("44'/60'/0'/0/0")

    expect(address).toMatch(/^0x[0-9a-fA-F]{40}$/)
    store.ensureQueueEmpty()
  })

  it('signPersonalMessage returns 64-byte compact signature', async () => {
    const store = RecordStore.fromString(`
      => ${ETH_SIGN_MSG_APDU}
      <= ${ETH_SIGN_MSG_RESP}
    `)
    transport = await openTransportReplayer(store)
    const app = new EthereumApp(transport)

    // signWithKeccak256 strips EIP-191 prefix up to '{', so pass a payload starting with '{'
    const payload = new Uint8Array([0x7b, 0x7d]) // '{}'
    const sig = await app.sign("44'/60'/0'/0/0", payload)

    expect(sig).toBeInstanceOf(Uint8Array)
    expect(sig.length).toBe(64)
    // r should be padded 0x11 bytes
    expect(sig[0]).toBe(0x11)
    expect(sig[31]).toBe(0x11)
    // s should be padded 0x22 bytes
    expect(sig[32]).toBe(0x22)
    expect(sig[63]).toBe(0x22)
    store.ensureQueueEmpty()
  })

  it('signPersonal passes raw bytes to signPersonalMessage without prefix stripping', async () => {
    const store = RecordStore.fromString(`
      => ${ETH_SIGN_MSG_APDU}
      <= ${ETH_SIGN_MSG_RESP}
    `)
    transport = await openTransportReplayer(store)
    const app = new EthereumApp(transport)

    // Pass raw '{}' bytes — signPersonal should hex-encode and send to signPersonalMessage directly
    const payload = new Uint8Array([0x7b, 0x7d]) // '{}'
    const sig = await app.signPersonal("44'/60'/0'/0/0", payload)
    expect(sig).toBeInstanceOf(Uint8Array)
    expect(sig.length).toBe(64)
    store.ensureQueueEmpty()
  })

  it('signText returns 64-byte signature from personal_sign', async () => {
    const store = RecordStore.fromString(`
      => ${ETH_SIGN_TEXT_APDU}
      <= ${ETH_SIGN_TEXT_RESP}
    `)
    transport = await openTransportReplayer(store)
    const app = new EthereumApp(transport)

    const sig = await app.signText("44'/60'/0'/0/0", 'hello ledger')

    expect(sig).toBeInstanceOf(Uint8Array)
    expect(sig.length).toBe(64)
    store.ensureQueueEmpty()
  })
})

// ---------------------------------------------------------------------------
// Tests — CosmosApp (APDU-level)
// ---------------------------------------------------------------------------

describe('CosmosApp (APDU replayer)', () => {
  let transport: Awaited<ReturnType<typeof openTransportReplayer>>

  afterEach(() => transport?.close())

  it('getVersion parses major.minor.patch from device response', async () => {
    const store = RecordStore.fromString(`
      => ${COS_GET_VERSION_APDU}
      <= ${COS_GET_VERSION_RESP}
    `)
    transport = await openTransportReplayer(store)
    const app = new CosmosApp(transport)

    const version = await app.getVersion()

    expect(version).toBe('2.37.3')
    store.ensureQueueEmpty()
  })

  it('getPublicKey returns compressed 33-byte key', async () => {
    const store = RecordStore.fromString(`
      => ${COS_GET_ADDR_APDU}
      <= ${COS_GET_ADDR_RESP}
    `)
    transport = await openTransportReplayer(store)
    const app = new CosmosApp(transport)

    const pubKey = await app.getPublicKey("m/44'/118'/0'/0/0")

    expect(pubKey).toBeInstanceOf(Uint8Array)
    expect(pubKey.length).toBe(33)
    expect(pubKey[0]).toBe(0x02)
    store.ensureQueueEmpty()
  })

  it('getAddress returns bech32 address', async () => {
    const store = RecordStore.fromString(`
      => ${COS_GET_ADDR_APDU}
      <= ${COS_GET_ADDR_RESP}
    `)
    transport = await openTransportReplayer(store)
    const app = new CosmosApp(transport)

    const address = await app.getAddress("m/44'/118'/0'/0/0")

    expect(address).toMatch(/^init1/)
    store.ensureQueueEmpty()
  })

  it('sign parses DER signature into 64-byte compact format', async () => {
    const store = RecordStore.fromString(`
      => ${COS_SIGN_INIT_APDU}
      <= ${COS_SIGN_INIT_RESP}
      => ${COS_SIGN_LAST_APDU}
      <= ${COS_SIGN_LAST_RESP}
    `)
    transport = await openTransportReplayer(store)
    const app = new CosmosApp(transport)

    const msg = new Uint8Array([0x7b, 0x7d]) // '{}'
    const sig = await app.sign("m/44'/118'/0'/0/0", msg)

    expect(sig).toBeInstanceOf(Uint8Array)
    expect(sig.length).toBe(64)
    // r = 0x33 repeated
    expect(sig[0]).toBe(0x33)
    expect(sig[31]).toBe(0x33)
    // s = 0x44 repeated
    expect(sig[32]).toBe(0x44)
    expect(sig[63]).toBe(0x44)
    store.ensureQueueEmpty()
  })
})

// ---------------------------------------------------------------------------
// Tests — LedgerKey full stack (Transport -> App -> Key)
// ---------------------------------------------------------------------------

describe('LedgerKey full stack (APDU replayer)', () => {
  let transport: Awaited<ReturnType<typeof openTransportReplayer>>

  afterEach(() => transport?.close())

  it('LedgerKey.createEthereumApp() with Ethereum app: version check + public key load', async () => {
    // createEthereumApp() calls: getVersion() -> getPublicKey()
    // getVersion -> getAppConfiguration: e0 06 00 00 00
    // getPublicKey -> getAddress: e0 02 00 00 15 <data>
    const store = RecordStore.fromString(`
      => ${ETH_GET_CONFIG_APDU}
      <= ${ETH_GET_CONFIG_RESP}
      => ${ETH_GET_ADDR_APDU}
      <= ${ETH_GET_ADDR_RESP}
    `)
    transport = await openTransportReplayer(store)

    const key = await LedgerKey.createEthereumApp(transport)

    expect(key).toBeInstanceOf(LedgerKey)
    expect(key.publicKey).toBeInstanceOf(Uint8Array)
    expect(key.publicKey.length).toBe(33)
    expect(key.publicKey[0]).toBe(0x02)
    expect(key.isEth).toBe(true)
    expect(key.getApplicationKind()).toBe(Kind.Ethereum)
    expect(key.address).toMatch(/^init1/)
    store.ensureQueueEmpty()
  })

  it('LedgerKey.createCosmosApp() with Cosmos app: version check + public key load', async () => {
    // createCosmosApp() calls: getVersion() -> getPublicKey()
    // getVersion: 55 00 00 00 00
    // getPublicKey -> getAddressAndPubKey: 55 04 00 00 19 <data>
    const store = RecordStore.fromString(`
      => ${COS_GET_VERSION_APDU}
      <= ${COS_GET_VERSION_RESP}
      => ${COS_GET_ADDR_APDU}
      <= ${COS_GET_ADDR_RESP}
    `)
    transport = await openTransportReplayer(store)

    const key = await LedgerKey.createCosmosApp(transport, { coinType: 118 })

    expect(key).toBeInstanceOf(LedgerKey)
    expect(key.publicKey).toBeInstanceOf(Uint8Array)
    expect(key.publicKey.length).toBe(33)
    expect(key.publicKey[0]).toBe(0x02)
    expect(key.isEth).toBe(false)
    expect(key.getApplicationKind()).toBe(Kind.Cosmos)
    expect(key.address).toMatch(/^init1/)
    store.ensureQueueEmpty()
  })

  it('Ethereum LedgerKey signText produces 64-byte signature', async () => {
    const store = RecordStore.fromString(`
      => ${ETH_GET_CONFIG_APDU}
      <= ${ETH_GET_CONFIG_RESP}
      => ${ETH_GET_ADDR_APDU}
      <= ${ETH_GET_ADDR_RESP}
      => ${ETH_SIGN_TEXT_APDU}
      <= ${ETH_SIGN_TEXT_RESP}
    `)
    transport = await openTransportReplayer(store)

    const key = await LedgerKey.createEthereumApp(transport)
    const sig = await key.signText('hello ledger')

    expect(sig).toBeInstanceOf(Uint8Array)
    expect(sig.length).toBe(64)
    store.ensureQueueEmpty()
  })

  it('Cosmos LedgerKey signRaw produces 64-byte signature via DER parsing', async () => {
    const store = RecordStore.fromString(`
      => ${COS_GET_VERSION_APDU}
      <= ${COS_GET_VERSION_RESP}
      => ${COS_GET_ADDR_APDU}
      <= ${COS_GET_ADDR_RESP}
      => ${COS_SIGN_INIT_APDU}
      <= ${COS_SIGN_INIT_RESP}
      => ${COS_SIGN_LAST_APDU}
      <= ${COS_SIGN_LAST_RESP}
    `)
    transport = await openTransportReplayer(store)

    const key = await LedgerKey.createCosmosApp(transport, { coinType: 118 })
    // Access protected signRaw
    const raw = key as unknown as { signRaw(msg: Uint8Array): Promise<Uint8Array> }
    const sig = await raw.signRaw(new Uint8Array([0x7b, 0x7d]))

    expect(sig).toBeInstanceOf(Uint8Array)
    expect(sig.length).toBe(64)
    // r = 0x33, s = 0x44
    expect(sig[0]).toBe(0x33)
    expect(sig[32]).toBe(0x44)
    store.ensureQueueEmpty()
  })

  it('LedgerKey.create() rejects when Ethereum version is below minimum', async () => {
    // Return version 1.0.0 (below minimum 1.17.0)
    const oldVersionResp = '01010000' + SW_OK // flags=1, major=1, minor=0, patch=0
    const store = RecordStore.fromString(`
      => ${ETH_GET_CONFIG_APDU}
      <= ${oldVersionResp}
    `)
    transport = await openTransportReplayer(store)

    await expect(LedgerKey.createEthereumApp(transport)).rejects.toThrow(/Outdated version/)
  })

  it('LedgerKey.create() rejects when Cosmos version is below minimum', async () => {
    // Return version 1.0.0 (below minimum 2.37.3)
    const oldVersionResp = '0001000000' + SW_OK // testMode=0, major=1, minor=0, patch=0, locked=0
    const store = RecordStore.fromString(`
      => ${COS_GET_VERSION_APDU}
      <= ${oldVersionResp}
    `)
    transport = await openTransportReplayer(store)

    await expect(LedgerKey.createCosmosApp(transport)).rejects.toThrow(/Outdated version/)
  })
})
