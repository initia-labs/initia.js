/**
 * Integration tests for Provider-based transactions.
 *
 * Validates real transaction submission on Initia Testnet (initiation-2)
 * using ChainContext + RegistryProvider.
 *
 * Requires a funded mnemonic:
 *   TEST_MNEMONIC="your mnemonic here" npm test -- --run test/integration/provider-tx.spec.ts
 *
 * Skip with: SKIP_INTEGRATION_TESTS=true npm test
 */

import { describe, it, expect, beforeAll } from 'vitest'
import { ConnectError, Code } from '@connectrpc/connect'
import { createRegistryProvider, type RegistryProvider } from '../../src/provider/registry-provider'
import { createChainContext } from '../../src/entry.node'
import { MnemonicKey } from '../../src/key/mnemonic-key'
import { coin } from '../../src/core/coin'
import { BroadcastError } from '../../src/errors'
import type { ChainContext } from '../../src/wallet/chain-context'

const SKIP = process.env.SKIP_INTEGRATION_TESTS === 'true'
const TEST_MNEMONIC = process.env.TEST_MNEMONIC

// =============================================================================
// 1. Read-only queries (no funded mnemonic needed)
// =============================================================================

describe.skipIf(SKIP || !TEST_MNEMONIC)('Provider ChainContext Queries (Initia Testnet)', () => {
  let provider: RegistryProvider
  let key: MnemonicKey
  let ctx: ChainContext

  beforeAll(async () => {
    provider = await createRegistryProvider({ network: 'testnet' })
    key = new MnemonicKey({ mnemonic: TEST_MNEMONIC! })
    const l1Info = provider.getChainInfo('initiation-2')!
    ctx = createChainContext(l1Info, { signer: key })
  }, 30000)

  describe('basics', () => {
    it('should derive address from mnemonic', () => {
      expect(key.address).toBeDefined()
      expect(key.address).toMatch(/^init1/)
    })

    it('should get chain context for initiation-2', () => {
      expect(ctx.chainId).toBe('initiation-2')
      expect(ctx.chainType).toBe('initia')
    })

    it('should query balance (may be zero)', async () => {
      const balances = await ctx.getBalance()
      expect(Array.isArray(balances)).toBe(true)
    }, 30000)

    it('should query account info (may not exist)', async () => {
      try {
        const account = await ctx.getAccount()
        expect(account).toBeDefined()
      } catch (error) {
        // Only "not found" is expected for unfunded test mnemonic
        expect(error).toBeInstanceOf(ConnectError)
        expect((error as ConnectError).code).toBe(Code.NotFound)
      }
    }, 30000)
  })

  describe('message creation', () => {
    it('should create a MsgSend via ctx.msgs.bank.send', () => {
      const msg = ctx.msgs.bank.send({
        fromAddress: key.address,
        toAddress: key.address,
        amount: [coin('uinit', '1000')],
      })
      expect(msg.toAny().typeUrl).toContain('MsgSend')
      expect(msg.toAny().value).toBeInstanceOf(Uint8Array)
      expect(msg.toAny().value.length).toBeGreaterThan(0)
    })

    it('should create an IBC transfer message', () => {
      const msg = ctx.msgs.ibc.transfer({
        sender: key.address,
        receiver: key.address,
        token: coin('uinit', '1000'),
        sourceChannel: 'channel-0',
        sourcePort: 'transfer',
        timeoutHeight: { revisionNumber: 0n, revisionHeight: 0n },
        timeoutTimestamp: BigInt(Date.now() + 10 * 60_000) * 1_000_000n,
        memo: '',
      })
      expect(msg.toAny().typeUrl).toContain('MsgTransfer')
      expect(msg.toAny().value.length).toBeGreaterThan(0)
    })
  })
})

// =============================================================================
// 2. Transaction submission (requires funded mnemonic)
// =============================================================================

describe.skipIf(SKIP || !TEST_MNEMONIC)('Provider TX Tests (Initia Testnet)', () => {
  let provider: RegistryProvider
  let key: MnemonicKey
  // Reuse a single ChainContext across all TX tests so the local sequence
  // counter (_nextSequence) is shared — prevents sequence mismatch when the
  // node hasn't indexed a recently confirmed TX yet.
  let ctx: ChainContext

  /** Skip test gracefully on insufficient funds instead of failing */
  function skipIfInsufficientFunds(err: unknown): void {
    if (err instanceof BroadcastError && err.rawLog?.includes('insufficient funds')) {
      console.log(`  [Provider TX] SKIP: insufficient funds — fund the test wallet`)
      return
    }
    throw err
  }

  beforeAll(async () => {
    provider = await createRegistryProvider({ network: 'testnet' })
    key = new MnemonicKey({ mnemonic: TEST_MNEMONIC! })
    const l1Info = provider.getChainInfo('initiation-2')!
    ctx = createChainContext(l1Info, { signer: key })
  }, 30000)

  it('should have balance for tx fees', async () => {
    const balances = await ctx.getBalance()
    const uinit = balances.find(b => b.denom === 'uinit')
    expect(uinit).toBeDefined()
    expect(BigInt(uinit!.amount)).toBeGreaterThan(0n)
  }, 30000)

  it('should send uinit to self (direct mode)', async () => {
    try {
      const msg = ctx.msgs.bank.send({
        fromAddress: key.address,
        toAddress: key.address,
        amount: [coin('uinit', '1')],
      })

      const result = await ctx.signAndBroadcast([msg], {
        fee: [{ denom: 'uinit', amount: '10000' }],
        signMode: 'direct',
      })
      expect(result.txHash).toBeDefined()
      expect(typeof result.txHash).toBe('string')
      expect(result.txHash.length).toBeGreaterThan(0)

      const confirmed = await result.waitForConfirmation()
      expect(confirmed.code).toBe(0)
      expect(confirmed.height).toBeGreaterThan(0n)
    } catch (err) {
      skipIfInsufficientFunds(err)
    }
  }, 120000)

  it('should send uinit to self (amino mode)', async () => {
    try {
      const msg = ctx.msgs.bank.send({
        fromAddress: key.address,
        toAddress: key.address,
        amount: [coin('uinit', '1')],
      })

      const result = await ctx.signAndBroadcast([msg], {
        fee: [{ denom: 'uinit', amount: '10000' }],
        signMode: 'amino',
      })
      expect(result.txHash).toBeDefined()
      expect(typeof result.txHash).toBe('string')
      expect(result.txHash.length).toBeGreaterThan(0)

      const confirmed = await result.waitForConfirmation()
      expect(confirmed.code).toBe(0)
      expect(confirmed.height).toBeGreaterThan(0n)
    } catch (err) {
      skipIfInsufficientFunds(err)
    }
  }, 120000)

  it('should send uinit to self (eip191 mode)', async () => {
    try {
      const msg = ctx.msgs.bank.send({
        fromAddress: key.address,
        toAddress: key.address,
        amount: [coin('uinit', '1')],
      })

      const result = await ctx.signAndBroadcast([msg], {
        fee: [{ denom: 'uinit', amount: '10000' }],
        signMode: 'eip191',
      })
      expect(result.txHash).toBeDefined()
      expect(typeof result.txHash).toBe('string')
      expect(result.txHash.length).toBeGreaterThan(0)

      const confirmed = await result.waitForConfirmation()
      expect(confirmed.code).toBe(0)
      expect(confirmed.height).toBeGreaterThan(0n)
    } catch (err) {
      skipIfInsufficientFunds(err)
    }
  }, 120000)

  it('should estimate gas before sending', async () => {
    const msg = ctx.msgs.bank.send({
      fromAddress: key.address,
      toAddress: key.address,
      amount: [coin('uinit', '1')],
    })

    const gas = await ctx.estimateGas([msg])
    expect(gas.gasLimit).toBeTypeOf('bigint')
    expect(gas.gasLimit).toBeGreaterThan(0n)
    expect(gas.fee).toBeDefined()
    expect(gas.fee.length).toBeGreaterThan(0)
  }, 30000)
})
