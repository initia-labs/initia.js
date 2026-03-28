/**
 * Integration tests for LedgerKey with a real USB Ledger device.
 *
 * Prerequisites:
 * - Ledger device connected via USB
 * - Open the appropriate app on the device before running each describe block
 *
 * Run all:    npm run test:integration
 * Ethereum:   npm run test:integration:eth
 * Cosmos:     npm run test:integration:cosmos
 *
 * These tests are NOT run in CI — only locally with a physical device.
 */

import { describe, it, expect } from 'vitest'
import TransportNodeHidModule from '@ledgerhq/hw-transport-node-hid'
import type Transport from '@ledgerhq/hw-transport'
import { LedgerKey } from '../../src/LedgerKey'
import { coin } from 'initia.js'
import { createInitiaContext } from '../../../../src/entry.chain.initia.node'

// Handle CJS/ESM interop — the default export may be nested
const TransportNodeHid = (TransportNodeHidModule as any).default ?? TransportNodeHidModule

describe('LedgerKey with real USB device (Ethereum app)', () => {
  let transport: Transport
  let key: LedgerKey

  it('should connect to Ledger and create LedgerKey', async () => {
    transport = await TransportNodeHid.create(5000)
    key = await LedgerKey.createEthereumApp(transport)

    expect(key.publicKey).toBeInstanceOf(Uint8Array)
    expect(key.publicKey.length).toBe(33)
    expect(key.publicKey[0] === 0x02 || key.publicKey[0] === 0x03).toBe(true)
    expect(key.isEth).toBe(true)

    console.log('Address:', key.address)
    console.log('EVM Address:', key.evmAddress)
    console.log(
      'Public Key:',
      [...key.publicKey].map(b => b.toString(16).padStart(2, '0')).join('')
    )
  }, 30000)

  it('should derive a valid init1 address', async () => {
    expect(key.address).toMatch(/^init1[a-z0-9]+$/)
  })

  it('should derive a valid 0x EVM address', async () => {
    expect(key.evmAddress).toMatch(/^0x[0-9a-fA-F]{40}$/)
  })

  it('should show address on device', async () => {
    // This will prompt the user to confirm on the Ledger device
    console.log('>>> Please confirm address on Ledger device...')
    await key.showAddressAndPubKey()
    console.log('>>> Address confirmed on device')
  }, 60000)

  it('should sign a text message via signText', async () => {
    console.log('>>> Please approve signing on Ledger device...')
    const signature = await key.signText('Hello Ledger from initia.js v2')

    expect(signature).toBeInstanceOf(Uint8Array)
    expect(signature.length).toBe(64)
    console.log(
      'Signature (hex):',
      [...signature].map(b => b.toString(16).padStart(2, '0')).join('')
    )
  }, 60000)

  it('should sign and broadcast MsgSend via EIP-191', async () => {
    const ctx = await createInitiaContext({ network: 'testnet', signer: key })
    const address = key.address

    const sendMsg = ctx.msgs.bank.send({
      fromAddress: address,
      toAddress: address,
      amount: [coin('uinit', '1')],
    })

    console.log('>>> Please approve MsgSend on Ledger device (EIP-191)...')
    const result = await ctx.signAndBroadcast([sendMsg], {
      signMode: 'eip191',
      memo: 'Ledger Ethereum MsgSend test',
      fee: [coin('uinit', '20000')],
      gasLimit: 200000,
    })

    console.log('Tx hash:', result.txHash)
    expect(result.txHash).toBeDefined()
  }, 120000)

  it('should get app configuration', async () => {
    const config = (await key.getAppConfiguration()) as { version: string }
    expect(config).toBeDefined()
    expect(config.version).toBeDefined()
    console.log('App config:', config)
  })

  it('should get transport', () => {
    const t = key.getTransport()
    expect(t).toBeDefined()
  })

  it('should close transport after all tests', async () => {
    if (transport) {
      await transport.close()
    }
  })
})

describe('LedgerKey with real USB device (Cosmos app)', () => {
  let transport: Transport
  let key: LedgerKey

  it('should connect to Ledger and create LedgerKey', async () => {
    transport = await TransportNodeHid.create(5000)
    key = await LedgerKey.createCosmosApp(transport)

    expect(key.publicKey).toBeInstanceOf(Uint8Array)
    expect(key.publicKey.length).toBe(33)
    expect(key.publicKey[0] === 0x02 || key.publicKey[0] === 0x03).toBe(true)
    expect(key.isEth).toBe(false)
    expect(key.algorithm).toBe('secp256k1')

    console.log('Address:', key.address)
    console.log(
      'Public Key:',
      [...key.publicKey].map(b => b.toString(16).padStart(2, '0')).join('')
    )
  }, 30000)

  it('should derive a valid init1 address', () => {
    expect(key.address).toMatch(/^init1[a-z0-9]+$/)
  })

  it('should use cosmos derivation path (coin type 118)', () => {
    expect(key.getPath()).toBe("m/44'/118'/0'/0/0")
  })

  it('should show address on device', async () => {
    console.log('>>> Please confirm address on Ledger device...')
    await key.showAddressAndPubKey()
    console.log('>>> Address confirmed on device')
  }, 60000)

  it('should sign and broadcast MsgSend via Amino', async () => {
    const ctx = await createInitiaContext({ network: 'testnet', signer: key })
    const address = key.address
    console.log('>>> Signing MsgSend on Ledger device (Amino)...')

    const sendMsg = ctx.msgs.bank.send({
      fromAddress: address,
      toAddress: address,
      amount: [coin('uinit', '1')],
    })

    const result = await ctx.signAndBroadcast([sendMsg], {
      signMode: 'amino',
      memo: 'Ledger Cosmos MsgSend test',
      fee: [coin('uinit', '20000')],
      gasLimit: 200000,
    })

    console.log('Tx hash:', result.txHash)
    expect(result.txHash).toBeDefined()
  }, 120000)

  it('should get app configuration', async () => {
    const config = await key.getAppConfiguration()
    expect(config).toBeDefined()
    console.log('App config:', config)
  })

  it('should close transport after all tests', async () => {
    if (transport) {
      await transport.close()
    }
  })
})
