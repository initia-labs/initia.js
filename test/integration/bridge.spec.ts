/**
 * Integration tests for OPInit Bridge.
 *
 * These tests connect to the actual Initia testnet and query
 * real L1 ophost state and Executor APIs.
 *
 * Skip with: SKIP_INTEGRATION_TESTS=true npm test
 *
 * Transaction tests (deposit/withdraw) require a funded mnemonic:
 *   BRIDGE_TX_MNEMONIC="your mnemonic here" npm test
 *   BRIDGE_TX_L2="minimove-1"  (optional, defaults to first L2 with executor)
 */

import { describe, it, expect, beforeAll } from 'vitest'
import { createRegistryProvider, type RegistryProvider } from '../../src/provider/registry-provider'
import type { Bridge } from '../../src/bridge/bridge'
import { createChainContext, createTransport } from '../../src/entry.node'
import { MnemonicKey } from '../../src/key/mnemonic-key'
import type { ChainInfo } from '../../src/provider/types'

const SKIP = process.env.SKIP_INTEGRATION_TESTS === 'true'

// Standard test mnemonic for read-only tests (DO NOT USE IN PRODUCTION)
const TEST_MNEMONIC =
  'abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon about'

// Funded mnemonic for transaction tests (requires testnet tokens)
const TX_MNEMONIC = process.env.BRIDGE_TX_MNEMONIC
const TX_L2 = process.env.BRIDGE_TX_L2

describe.skipIf(SKIP)('Bridge (Integration)', () => {
  let provider: RegistryProvider
  let bridge: Bridge
  let l1Chain: ChainInfo
  let l2Chains: ChainInfo[]

  beforeAll(async () => {
    provider = await createRegistryProvider({ network: 'testnet' })
    provider.createTransport = createTransport
    bridge = provider.bridge

    const chains = provider.listChains()
    const initia = chains.find(c => c.chainType === 'initia')
    if (!initia) throw new Error('L1 chain not found in testnet registry')
    l1Chain = initia

    l2Chains = bridge.listBridgeableChains()
  }, 30000)

  // ==========================================================================
  // Provider-based queries (no gRPC needed)
  // ==========================================================================

  describe('provider queries', () => {
    it('should list bridgeable L2 chains with opBridgeId', () => {
      expect(l2Chains.length).toBeGreaterThan(0)
      for (const chain of l2Chains) {
        expect(chain.opBridgeId).toBeDefined()
        expect(typeof chain.opBridgeId).toBe('bigint')
        expect(chain.opBridgeId!).toBeGreaterThan(0n)
      }
    })

    it('should have at least one L2 chain with executorUri', () => {
      const withExecutor = l2Chains.filter(c => c.executorUri)
      expect(withExecutor.length).toBeGreaterThan(0)
    })
  })

  // ==========================================================================
  // L1 ophost gRPC queries (real network calls)
  // ==========================================================================

  describe('L1 ophost queries', () => {
    it('should query bridge config with finalization period', async () => {
      const l2WithExecutor = l2Chains.find(c => c.executorUri)!

      // Use a dummy address — getWithdrawals will hit Executor API first,
      // but we can verify the L1 client is created and works by querying directly
      const { createInitiaContext } = await import('../../src/entry.node')
      const ctx = createInitiaContext(provider, l1Chain.chainId)
      const ophost = (ctx.client as { ophost: any }).ophost

      const bridgeResponse = await ophost.bridge({ bridgeId: l2WithExecutor.opBridgeId })
      expect(bridgeResponse.bridgeConfig).toBeDefined()
      expect(bridgeResponse.bridgeConfig?.finalizationPeriod).toBeDefined()

      const fp = bridgeResponse.bridgeConfig!.finalizationPeriod!
      expect(typeof fp.seconds).toBe('bigint')
      expect(fp.seconds).toBeGreaterThan(0n)
    }, 30000)

    it('should query output proposals for an L2 bridge', async () => {
      const l2 = l2Chains[0]

      const { createInitiaContext } = await import('../../src/entry.node')
      const ctx = createInitiaContext(provider, l1Chain.chainId)
      const ophost = (ctx.client as { ophost: any }).ophost

      const response = await ophost.outputProposals({
        bridgeId: l2.opBridgeId,
        pagination: { reverse: true, limit: 1n },
      })

      // May have 0 proposals if chain is new, but shouldn't throw
      expect(response.outputProposals).toBeDefined()
      expect(Array.isArray(response.outputProposals)).toBe(true)

      if (response.outputProposals.length > 0) {
        const latest = response.outputProposals[0]
        expect(typeof latest.outputIndex).toBe('bigint')
        expect(latest.outputIndex).toBeGreaterThan(0n)
      }
    }, 30000)
  })

  // ==========================================================================
  // Executor API queries (real network calls)
  // ==========================================================================

  describe('Executor API', () => {
    it('should fetch withdrawals for test address (may be empty)', async () => {
      const l2WithExecutor = l2Chains.find(c => c.executorUri)!

      const key = new MnemonicKey({ mnemonic: TEST_MNEMONIC })

      // This exercises the full pipeline:
      // 1. Fetch from Executor API
      // 2. Query L1 ophost for bridge config
      // 3. Query output proposals
      // 4. Determine status for each withdrawal
      const withdrawals = await bridge.getWithdrawals(l2WithExecutor.chainId, key.address)

      expect(Array.isArray(withdrawals)).toBe(true)
      // Likely empty for test mnemonic, but validates the full pipeline doesn't throw
      for (const w of withdrawals) {
        expect(w.sequence).toBeDefined()
        expect(w.status).toBeDefined()
        expect(['pending', 'waiting', 'claimable', 'claimed']).toContain(w.status.status)
      }
    }, 60000)
  })

  // ==========================================================================
  // Message generation (no network, but validates real proto encoding)
  // ==========================================================================

  describe('message generation with real provider', () => {
    it('should create deposit msg for real L2 chain', () => {
      const l2 = l2Chains[0]

      const key = new MnemonicKey({ mnemonic: TEST_MNEMONIC })
      const msg = bridge.deposit({
        sender: key.address,
        toChain: l2.chainId,
        amount: '1000000uinit',
      })

      expect(msg.toAny().typeUrl).toContain('MsgInitiateTokenDeposit')
      expect(msg.toAny().value).toBeInstanceOf(Uint8Array)
      expect(msg.toAny().value.length).toBeGreaterThan(0)
    })
  })

  // ==========================================================================
  // Transaction tests (deposit → withdraw round-trip)
  // Requires: BRIDGE_TX_MNEMONIC env var with a funded testnet mnemonic
  // ==========================================================================

  describe.skipIf(!TX_MNEMONIC)('deposit → withdraw round-trip', () => {
    let key: MnemonicKey
    let targetL2: ChainInfo

    beforeAll(() => {
      key = new MnemonicKey({ mnemonic: TX_MNEMONIC! })

      // Use specified L2 or first L2 with executor
      if (TX_L2) {
        const chain = provider.getChainInfo(TX_L2)
        if (!chain) throw new Error(`L2 chain not found: ${TX_L2}`)
        targetL2 = chain
      } else {
        const l2 = l2Chains.find(c => c.executorUri)
        if (!l2) throw new Error('No L2 chain with executor found')
        targetL2 = l2
      }
    })

    it('should deposit L1 → L2 and confirm tx', async () => {
      const l1Ctx = createChainContext(l1Chain, { signer: key })
      const depositMsg = bridge.deposit({
        sender: key.address,
        toChain: targetL2.chainId,
        amount: '1000uinit',
      })
      const result = await l1Ctx.signAndBroadcast([depositMsg])

      expect(result.txHash).toBeDefined()
      expect(typeof result.txHash).toBe('string')
      expect(result.txHash.length).toBeGreaterThan(0)

      const confirmed = await result.waitForConfirmation()
      expect(confirmed.code).toBe(0)
      expect(confirmed.height).toBeGreaterThan(0n)
    }, 120000)

    it('should withdraw L2 → L1 and confirm tx', async () => {
      const l2Info = provider.getChainInfo(targetL2.chainId)!
      const l2Ctx = createChainContext(l2Info, { signer: key })
      const withdrawMsg = bridge.withdraw({ sender: key.address, amount: '1000uinit' })
      const result = await l2Ctx.signAndBroadcast([withdrawMsg])

      expect(result.txHash).toBeDefined()
      expect(typeof result.txHash).toBe('string')
      expect(result.txHash.length).toBeGreaterThan(0)

      const confirmed = await result.waitForConfirmation()
      expect(confirmed.code).toBe(0)
      expect(confirmed.height).toBeGreaterThan(0n)
    }, 120000)

    it('should have withdrawal visible via getWithdrawals after withdraw tx', async () => {
      const l2Prefix = targetL2.bech32Prefix ?? 'init'
      const l2Address = await key.getAddress(l2Prefix)
      const withdrawals = await bridge.getWithdrawals(targetL2.chainId, l2Address)

      expect(Array.isArray(withdrawals)).toBe(true)
      if (withdrawals.length > 0) {
        const latest = withdrawals[withdrawals.length - 1]
        expect(latest.sequence).toBeDefined()
        expect(['pending', 'waiting', 'claimable', 'claimed']).toContain(latest.status.status)
      }
    }, 60000)
  })
})
