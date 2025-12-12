import { describe, it, expect, beforeAll, afterAll } from 'vitest'
import TransportNodeHid from '@ledgerhq/hw-transport-node-hid'
import type Transport from '@ledgerhq/hw-transport'
import { RESTClient, MsgSend } from '@initia/initia.js'
import { SignMode } from '@initia/initia.proto/cosmos/tx/signing/v1beta1/signing'
import { LedgerKey, Kind } from '../../src'

const LEDGER_TEST_ETH = process.env.LEDGER_TEST_ETH === 'true'
const LEDGER_TEST_COSMOS = process.env.LEDGER_TEST_COSMOS === 'true'

const REST_URL = 'https://rest.testnet.initia.xyz'
const CHAIN_ID = 'initiation-2'

let transport: Transport

beforeAll(async () => {
  if (LEDGER_TEST_ETH || LEDGER_TEST_COSMOS) {
    transport = await TransportNodeHid.create()
  }
})

afterAll(async () => {
  if (transport) {
    await transport.close()
  }
})

describe.skipIf(!LEDGER_TEST_ETH)('Ethereum App', () => {
  it('should connect and get version', async () => {
    const key = await LedgerKey.create(transport, 0, Kind.Ethereum)
    const config = await key.getAppConfiguration()
    expect(config.version).toBeDefined()
  })

  it('should get address', async () => {
    const key = await LedgerKey.create(transport, 0, Kind.Ethereum)
    const address = key.accAddress
    expect(address).toMatch(/^init1/)
  })

  it('should get public key', async () => {
    const key = await LedgerKey.create(transport, 0, Kind.Ethereum)
    expect(key.publicKey).toBeDefined()
  })

  it('should create wallet and sign transaction with EIP191', { timeout: 120000 }, async () => {
    const key = await LedgerKey.create(transport, 0, Kind.Ethereum)
    const client = new RESTClient(REST_URL, { chainId: CHAIN_ID })
    const wallet = client.wallet(key)

    const address = key.accAddress
    console.log('Ethereum App address:', address)
    const msg = new MsgSend(address, address, { uinit: '1' })

    // Create and sign transaction (requires Ledger approval)
    const signedTx = await wallet.createAndSignTx({
      msgs: [msg],
      signMode: SignMode.SIGN_MODE_EIP_191,
    })

    expect(signedTx.signatures.length).toBeGreaterThan(0)
    expect(signedTx.auth_info.signer_infos.length).toBeGreaterThan(0)

    // Broadcast transaction
    const result = await client.tx.broadcast(signedTx)
    console.log('Ethereum App tx hash:', result.txhash)
    expect(result.txhash).toBeDefined()
  })
})

describe.skipIf(!LEDGER_TEST_COSMOS)('Cosmos App', () => {
  it('should connect and get version', async () => {
    const key = await LedgerKey.create(transport, 0, Kind.Cosmos)
    const config = await key.getAppConfiguration()
    expect(config).toBeDefined()
  })

  it('should get address', async () => {
    const key = await LedgerKey.create(transport, 0, Kind.Cosmos)
    const address = key.accAddress
    expect(address).toMatch(/^init1/)
  })

  it('should get public key', async () => {
    const key = await LedgerKey.create(transport, 0, Kind.Cosmos)
    expect(key.publicKey).toBeDefined()
  })

  it('should create wallet and sign transaction with Amino', { timeout: 120000 }, async () => {
    const key = await LedgerKey.create(transport, 0, Kind.Cosmos)
    const client = new RESTClient(REST_URL, { chainId: CHAIN_ID })
    const wallet = client.wallet(key)

    const address = key.accAddress
    console.log('Cosmos App address:', address)
    const msg = new MsgSend(address, address, { uinit: '1' })

    // Create and sign transaction (requires Ledger approval)
    const signedTx = await wallet.createAndSignTx({
      msgs: [msg],
      signMode: SignMode.SIGN_MODE_LEGACY_AMINO_JSON,
    })

    expect(signedTx.signatures.length).toBeGreaterThan(0)
    expect(signedTx.auth_info.signer_infos.length).toBeGreaterThan(0)

    // Broadcast transaction
    const result = await client.tx.broadcast(signedTx)
    console.log('Cosmos App tx hash:', result.txhash)
    expect(result.txhash).toBeDefined()
  })
})
