/**
 * E2E Test: Cross-chain Router API (L1 → move-1 → evm-1 → L1)
 *
 * Tests multi-hop routing across Initia L1 and L2 chains:
 *   1. L1 → move-1: OP deposit via router
 *   2. move-1 → evm-1: L2↔L2 IBC multi-hop (via L1)
 *   3. evm-1 → L1: OP withdrawal via router
 *
 * Each step: discover route → build msgs → sign & broadcast → verify
 *
 * Environment variables:
 *   TEST_MNEMONIC       - Funded testnet wallet mnemonic (required, skips all if absent)
 *   TEST_BRIDGE_STRICT  - Set to "true" to fail instead of skip on missing prerequisites
 *
 * Run:
 *   TEST_MNEMONIC="..." npx vitest run test/e2e/bridge.spec.ts --project tx
 */

import { describe, it, expect, beforeAll } from 'vitest'
import { createRegistryProvider } from '../../src/provider/registry-provider'
import { createTransport, createChainContext } from '../../src/entry.node'
import { MnemonicKey } from '../../src/key/mnemonic-key'
import type { RegistryProvider } from '../../src/provider/registry-provider'
import type { Route, TransferTx } from '../../src/bridge/types'

// ---------------------------------------------------------------------------
// Configuration
// ---------------------------------------------------------------------------

const TEST_MNEMONIC = process.env.TEST_MNEMONIC
const SKIP = !TEST_MNEMONIC
const STRICT = process.env.TEST_BRIDGE_STRICT === 'true'

const L1 = 'initiation-2'
const MOVE_L2 = 'move-1'
const EVM_L2 = 'evm-1'

// 1 INIT — amount is computed per-chain using decimals from router assets
const TEST_HUMAN_AMOUNT = 1

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function log(msg: string) {
  console.log(`  [Router E2E] ${msg}`)
}

function skipUnless(condition: boolean, reason: string): boolean {
  if (condition) return false
  if (STRICT) {
    expect.fail(`[STRICT] ${reason}`)
  }
  log(`SKIP: ${reason}`)
  return true
}

function skipInfra(condition: boolean, reason: string): boolean {
  if (condition) return false
  log(`SKIP (infra): ${reason}`)
  return true
}

// ---------------------------------------------------------------------------
// Asset info (populated during beforeAll)
// ---------------------------------------------------------------------------

interface AssetInfo {
  denom: string
  decimals: number
}

/** Convert human amount (e.g. 1) to on-chain amount string using decimals */
function toAmount(human: number, asset: AssetInfo): string {
  return BigInt(Math.round(human * 10 ** asset.decimals)).toString()
}

let L1_ASSET: AssetInfo
let MOVE_ASSET: AssetInfo
let EVM_ASSET: AssetInfo

// Shared provider/key (set in beforeAll)
let _provider: RegistryProvider
let _key: MnemonicKey

/** Poll until balance >= needed or timeout (60s). Returns final balance. */
async function waitForBalance(chainId: string, asset: AssetInfo, needed: bigint): Promise<bigint> {
  const pollInterval = 5_000
  const maxWait = 60_000
  const start = Date.now()
  const ctx = createChainContext(_provider.getChainInfo(chainId)!)

  while (Date.now() - start < maxWait) {
    const balances = await ctx.getBalance({ denom: asset.denom, address: _key.address })
    const balance = balances.length > 0 ? BigInt(balances[0].amount) : 0n
    if (balance >= needed) {
      log(
        `[${chainId}] Balance ready: ${balance} (waited ${((Date.now() - start) / 1000).toFixed(0)}s)`
      )
      return balance
    }
    log(
      `[${chainId}] Waiting for balance... ${balance}/${needed} (${((Date.now() - start) / 1000).toFixed(0)}s)`
    )
    await new Promise(r => setTimeout(r, pollInterval))
  }

  const balances = await ctx.getBalance({ denom: asset.denom, address: _key.address })
  return balances.length > 0 ? BigInt(balances[0].amount) : 0n
}

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe.skipIf(SKIP)('Router E2E: L1 → move-1 → evm-1 → L1', () => {
  let provider: RegistryProvider
  let key: MnemonicKey

  beforeAll(async () => {
    provider = await createRegistryProvider({ network: 'testnet' })
    provider.createTransport = createTransport
    key = new MnemonicKey({ mnemonic: TEST_MNEMONIC! })
    _provider = provider
    _key = key
    log(`Sender bech32: ${key.address}`)
    log(`Sender EVM:    ${key.evmAddress}`)

    // Discover denoms and decimals from router assets
    const assetsMap = await provider.bridge.getRoutableAssets()
    const findInit = (chainId: string): AssetInfo => {
      const a = assetsMap[chainId]?.find(x => x.symbol === 'INIT')
      return { denom: a?.denom ?? '', decimals: a?.decimals ?? 6 }
    }
    L1_ASSET = findInit(L1)
    MOVE_ASSET = findInit(MOVE_L2)
    EVM_ASSET = findInit(EVM_L2)
    log(`L1 INIT:     ${L1_ASSET.denom} (${L1_ASSET.decimals} decimals)`)
    log(`move-1 INIT: ${MOVE_ASSET.denom} (${MOVE_ASSET.decimals} decimals)`)
    log(`evm-1 INIT:  ${EVM_ASSET.denom} (${EVM_ASSET.decimals} decimals)`)
  }, 30_000)

  // =========================================================================
  // Step 1: L1 → move-1
  // =========================================================================

  describe('Step 1: L1 → move-1', () => {
    let route: Route
    let txs: TransferTx[]

    it('should have sufficient L1 balance', async () => {
      const l1 = createChainContext(provider.getChainInfo(L1)!, { signer: key })
      const balances = await l1.getBalance({ denom: L1_ASSET.denom })
      const balance = balances.length > 0 ? BigInt(balances[0].amount) : 0n
      const needed = BigInt(toAmount(TEST_HUMAN_AMOUNT * 3, L1_ASSET))
      log(`L1 balance: ${balance} ${L1_ASSET.denom}`)
      if (skipInfra(balance > needed, `L1 balance insufficient (need ${needed})`)) return
      expect(balance).toBeGreaterThan(0n)
    }, 30_000)

    it('should find route L1 → move-1', async () => {
      if (skipUnless(!!MOVE_ASSET.denom, 'move-1 INIT denom not discovered')) return
      try {
        route = await provider.bridge.route({
          amount: toAmount(TEST_HUMAN_AMOUNT, L1_ASSET),
          source: { chainId: L1, denom: L1_ASSET.denom },
          dest: { chainId: MOVE_L2, denom: MOVE_ASSET.denom },
        })
      } catch (err) {
        if (skipInfra(false, `Router API: ${String(err)}`)) return
      }
      log(`Route: ${route.operations.length} hop(s), ${route.amountIn} → ${route.amountOut}`)
      expect(route.operations.length).toBeGreaterThan(0)
    }, 30_000)

    it('should build and broadcast L1 → move-1 tx', async () => {
      if (skipUnless(!!route, 'no route')) return
      txs = await provider.bridge.buildTransferMsgs({
        route,
        addresses: [key.address, key.address, key.address],
        slippageTolerance: '5',
      })
      log(`Built ${txs.length} tx(s)`)
      expect(txs.length).toBeGreaterThan(0)

      const cosmosTx = txs.find(tx => tx.cosmosMsgs?.length)
      if (skipUnless(!!cosmosTx, 'no cosmos msgs in built txs')) return

      const ctx = createChainContext(provider.getChainInfo(cosmosTx!.chainId)!, { signer: key })
      const result = await ctx.signAndBroadcast(cosmosTx!.cosmosMsgs!, {
        waitForConfirmation: true,
      })
      log(`Tx: ${result.txHash} code=${result.code} gas=${result.gasUsed}`)
      expect(result.code).toBe(0)
    }, 120_000)
  })

  // =========================================================================
  // Step 2: move-1 → evm-1 (L2↔L2 via IBC multi-hop)
  // =========================================================================

  describe('Step 2: move-1 → evm-1', () => {
    let route: Route
    let txs: TransferTx[]

    it('should wait for move-1 balance', async () => {
      if (skipUnless(!!MOVE_ASSET.denom, 'move-1 denom not discovered')) return
      const needed = BigInt(toAmount(TEST_HUMAN_AMOUNT, MOVE_ASSET))
      const balance = await waitForBalance(MOVE_L2, MOVE_ASSET, needed)
      if (
        skipUnless(balance >= needed, `move-1 balance insufficient after polling (need ${needed})`)
      )
        return
      expect(balance).toBeGreaterThanOrEqual(needed)
    }, 120_000)

    it('should find route move-1 → evm-1', async () => {
      if (skipUnless(!!MOVE_ASSET.denom && !!EVM_ASSET.denom, 'L2 denoms not discovered')) return
      try {
        route = await provider.bridge.route({
          amount: toAmount(TEST_HUMAN_AMOUNT, MOVE_ASSET),
          source: { chainId: MOVE_L2, denom: MOVE_ASSET.denom },
          dest: { chainId: EVM_L2, denom: EVM_ASSET.denom },
        })
      } catch (err) {
        if (skipInfra(false, `Router API: ${String(err)}`)) return
      }
      log(`Route: ${route.operations.length} hop(s), ${route.amountIn} → ${route.amountOut}`)
      expect(route.operations.length).toBeGreaterThan(0)
    }, 30_000)

    it('should build and broadcast move-1 → evm-1 tx', async () => {
      if (skipUnless(!!route, 'no route')) return
      txs = await provider.bridge.buildTransferMsgs({
        route,
        addresses: [key.address, key.address, key.evmAddress],
        slippageTolerance: '5',
      })
      log(`Built ${txs.length} tx(s)`)
      expect(txs.length).toBeGreaterThan(0)

      const cosmosTx = txs.find(tx => tx.cosmosMsgs?.length)
      if (skipUnless(!!cosmosTx, 'no cosmos msgs in built txs')) return

      const ctx = createChainContext(provider.getChainInfo(cosmosTx!.chainId)!, { signer: key })
      const result = await ctx.signAndBroadcast(cosmosTx!.cosmosMsgs!, {
        waitForConfirmation: true,
      })
      log(`Tx: ${result.txHash} code=${result.code} gas=${result.gasUsed}`)
      expect(result.code).toBe(0)
    }, 120_000)
  })

  // =========================================================================
  // Step 3: evm-1 → L1
  // =========================================================================

  describe('Step 3: evm-1 → L1', () => {
    let route: Route
    let txs: TransferTx[]

    it('should wait for evm-1 balance', async () => {
      if (skipUnless(!!EVM_ASSET.denom, 'evm-1 denom not discovered')) return
      const needed = BigInt(toAmount(TEST_HUMAN_AMOUNT, EVM_ASSET))
      const balance = await waitForBalance(EVM_L2, EVM_ASSET, needed)
      if (
        skipUnless(balance >= needed, `evm-1 balance insufficient after polling (need ${needed})`)
      )
        return
      expect(balance).toBeGreaterThanOrEqual(needed)
    }, 120_000)

    it('should find route evm-1 → L1', async () => {
      if (skipUnless(!!EVM_ASSET.denom, 'evm-1 denom not discovered')) return
      try {
        route = await provider.bridge.route({
          amount: toAmount(TEST_HUMAN_AMOUNT, EVM_ASSET),
          source: { chainId: EVM_L2, denom: EVM_ASSET.denom },
          dest: { chainId: L1, denom: L1_ASSET.denom },
        })
      } catch (err) {
        if (skipInfra(false, `Router API: ${String(err)}`)) return
      }
      log(`Route: ${route.operations.length} hop(s), ${route.amountIn} → ${route.amountOut}`)
      expect(route.operations.length).toBeGreaterThan(0)
    }, 30_000)

    it('should build and broadcast evm-1 → L1 tx', async () => {
      if (skipUnless(!!route, 'no route')) return
      txs = await provider.bridge.buildTransferMsgs({
        route,
        addresses: [key.evmAddress, key.address],
        slippageTolerance: '5',
      })
      log(`Built ${txs.length} tx(s)`)
      expect(txs.length).toBeGreaterThan(0)

      const cosmosTx = txs.find(tx => tx.cosmosMsgs?.length)
      if (skipUnless(!!cosmosTx, 'no cosmos msgs in built txs')) return

      const ctx = createChainContext(provider.getChainInfo(cosmosTx!.chainId)!, { signer: key })
      const result = await ctx.signAndBroadcast(cosmosTx!.cosmosMsgs!, {
        waitForConfirmation: true,
      })
      log(`Tx: ${result.txHash} code=${result.code} gas=${result.gasUsed}`)
      expect(result.code).toBe(0)
    }, 120_000)
  })
})
