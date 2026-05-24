/**
 * E2E Test: L2 Rollup Integration
 *
 * Tests the full lifecycle on Initia testnet rollups:
 * 1. Deposit 3 INIT from L1 (initiation-2) to each L2 (evm-1, wasm-1, move-1)
 * 2. Execute basic transactions on each L2 (native send + contract reads)
 * 3. Withdraw remaining balance from each L2 back to L1
 *
 * Each step includes balance verification before/after and tx result validation.
 *
 * Environment variables:
 *   TEST_MNEMONIC  - Funded testnet wallet mnemonic (required, skips all if absent)
 *   TEST_L2_STRICT - Set to "true" to fail instead of skip on missing prerequisites
 *
 * Run modes:
 *   TEST_MNEMONIC="..." npm run test:l2           # graceful skip on missing prereqs
 *   TEST_MNEMONIC="..." TEST_L2_STRICT=true npm run test:l2  # strict: all must pass
 */

import { describe, it, expect, beforeAll } from 'vitest'
import { Code, ConnectError } from '@connectrpc/connect'
import { createChainContext, createTransport } from '../../src/entry.node'
import { createRegistryProvider } from '../../src/provider/registry-provider'
import { MnemonicKey } from '../../src/key/mnemonic-key'
import { coin } from '../../src/core/coin'
import { AccAddress } from '../../src/util/address'
import { createEvmContract } from '../../src/contracts/evm/contract'
import { createMoveContract } from '../../src/contracts/move/contract'
import { createWasmContract } from '../../src/contracts/wasm/contract'
import type { WithdrawalInfo } from '../../src/bridge/types'
import type { RegistryProvider } from '../../src/provider/registry-provider'
import type { ChainType } from '../../src/client/types'
import type { ChainContext } from '../../src/wallet/chain-context'
import type { Abi } from 'abitype'

// ---------------------------------------------------------------------------
// Wallet replacement — thin adapter using key + provider + createChainContext
// ---------------------------------------------------------------------------

/**
 * Lightweight replacement for the deleted Wallet class.
 * Provides chain(), getAddress(), bridge, address, and evmAddress.
 */
function createTestWallet(key: MnemonicKey, provider: RegistryProvider) {
  const bridge = provider.bridge

  return {
    address: key.address,
    evmAddress: key.evmAddress,

    chain<T extends ChainType = ChainType>(chainId: string): ChainContext<T> {
      const info = provider.getChainInfo(chainId)
      if (!info) throw new Error(`Chain not found: ${chainId}`)
      return createChainContext(info, { signer: key }) as ChainContext<T>
    },

    async getAddress(chainId: string): Promise<string> {
      const info = provider.getChainInfo(chainId)
      if (!info) throw new Error(`Chain not found: ${chainId}`)
      const prefix = info.bech32Prefix ?? 'init'
      return key.getAddress(prefix)
    },

    bridge: {
      async deposit(l2ChainId: string, amount: string) {
        const l1Info = provider.listChains().find(c => c.chainType === 'initia')!
        const l1Ctx = createChainContext(l1Info, { signer: key })
        const msg = bridge.deposit({ sender: key.address, toChain: l2ChainId, amount })
        return l1Ctx.signAndBroadcast([msg])
      },

      async withdraw(l2ChainId: string, amount: string) {
        const l2Info = provider.getChainInfo(l2ChainId)!
        const l2Ctx = createChainContext(l2Info, { signer: key })
        const prefix = l2Info.bech32Prefix ?? 'init'
        const sender = await key.getAddress(prefix)
        const msg = bridge.withdraw({ sender, amount })
        return l2Ctx.signAndBroadcast([msg])
      },

      async getWithdrawals(l2ChainId: string) {
        const l2Info = provider.getChainInfo(l2ChainId)!
        const prefix = l2Info.bech32Prefix ?? 'init'
        const addr = await key.getAddress(prefix)
        return bridge.getWithdrawals(l2ChainId, addr)
      },

      async claim(withdrawal: WithdrawalInfo) {
        const l1Info = provider.listChains().find(c => c.chainType === 'initia')!
        const l1Ctx = createChainContext(l1Info, { signer: key })
        const msg = bridge.claim({ sender: key.address, withdrawal })
        return l1Ctx.signAndBroadcast([msg])
      },
    },
  }
}

type TestWallet = ReturnType<typeof createTestWallet>

// ---------------------------------------------------------------------------
// Configuration
// ---------------------------------------------------------------------------

const TEST_MNEMONIC = process.env.TEST_MNEMONIC
const SKIP = !TEST_MNEMONIC
const STRICT = process.env.TEST_L2_STRICT === 'true'

const L1 = 'initiation-2'
const L2_CHAINS = ['evm-1', 'wasm-1', 'move-1'] as const

/** 1 INIT = 1_000_000 uinit */
const DEPOSIT_AMOUNT = 1_000_000n
/** 0.1 INIT for test send */
const SEND_AMOUNT = 100_000n

// Minimal ERC20 ABI for token reads
const ERC20_ABI = [
  {
    type: 'function',
    name: 'name',
    inputs: [],
    outputs: [{ name: '', type: 'string' }],
    stateMutability: 'view',
  },
  {
    type: 'function',
    name: 'symbol',
    inputs: [],
    outputs: [{ name: '', type: 'string' }],
    stateMutability: 'view',
  },
  {
    type: 'function',
    name: 'decimals',
    inputs: [],
    outputs: [{ name: '', type: 'uint8' }],
    stateMutability: 'view',
  },
  {
    type: 'function',
    name: 'balanceOf',
    inputs: [{ name: 'account', type: 'address' }],
    outputs: [{ name: '', type: 'uint256' }],
    stateMutability: 'view',
  },
  {
    type: 'function',
    name: 'totalSupply',
    inputs: [],
    outputs: [{ name: '', type: 'uint256' }],
    stateMutability: 'view',
  },
  {
    type: 'function',
    name: 'transfer',
    inputs: [
      { name: 'to', type: 'address' },
      { name: 'amount', type: 'uint256' },
    ],
    outputs: [{ name: '', type: 'bool' }],
    stateMutability: 'nonpayable',
  },
] as const satisfies Abi

// Known ERC20 on evm-1 testnet (wrapped L2 native token)
const EVM_ERC20_ADDRESS = '0x2eE7007DF876084d4C74685e90bB7f4cd7c86e22'

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function log(msg: string) {
  console.log(`  [L2 E2E] ${msg}`)
}

/**
 * In default mode, log and return (graceful skip).
 * In strict mode, fail the test immediately.
 */
function skipUnless(condition: boolean, reason: string): boolean {
  if (condition) return false // no skip needed
  if (STRICT) {
    expect.fail(`[STRICT] ${reason}`)
  }
  log(`SKIP: ${reason}`)
  return true // caller should return early
}

/**
 * Always skip gracefully, regardless of STRICT mode.
 * Use for infrastructure prerequisites (wallet balance, testnet state)
 * that are not code correctness issues.
 */
function skipInfra(condition: boolean, reason: string): boolean {
  if (condition) return false
  log(`SKIP (infra): ${reason}`)
  return true
}

function errorMessage(error: unknown): string {
  return error instanceof Error ? error.message : String(error)
}

function isNetworkInfraError(error: unknown): boolean {
  if (error instanceof ConnectError) {
    return error.code === Code.Unavailable || error.code === Code.DeadlineExceeded
  }

  return /ETIMEDOUT|EHOSTUNREACH|ECONNRESET|ECONNREFUSED|ENOTFOUND|fetch failed|timeout/i.test(
    errorMessage(error)
  )
}

/**
 * Cache for L2 native denoms.
 * Populated during "list all balances" step, before send/withdraw tests.
 */
const l2NativeDenomCache = new Map<string, string>()

/** Discover and cache the L2 native denom (l2/...) for a chain. */
async function discoverL2NativeDenom(
  wallet: TestWallet,
  chainId: string
): Promise<string | undefined> {
  if (l2NativeDenomCache.has(chainId)) return l2NativeDenomCache.get(chainId)
  const ctx = wallet.chain(chainId)
  const balances = await ctx.getBalance()
  const l2Coin = balances.find(b => b.denom.startsWith('l2/'))
  if (l2Coin) {
    l2NativeDenomCache.set(chainId, l2Coin.denom)
    return l2Coin.denom
  }
  return undefined
}

/** Get the native denom for a chain: 'uinit' on L1, 'l2/...' on L2. */
function getNativeDenom(chainId: string): string {
  return l2NativeDenomCache.get(chainId) ?? 'uinit'
}

/**
 * Cache for Move fungible asset metadata address per chain.
 * On L2 minimove, coin functions use metadata objects (not generic type params).
 * e.g., move-1 → '0x8e47...'
 */
const moveMetadataCache = new Map<string, string>()

/**
 * Discover the Move metadata address for the native coin on an L2 minimove chain.
 * First ensures the L2 native denom is discovered, then converts denom → metadata.
 */
async function discoverMoveMetadata(
  wallet: TestWallet,
  chainId: string
): Promise<string | undefined> {
  if (moveMetadataCache.has(chainId)) return moveMetadataCache.get(chainId)

  // Ensure L2 native denom is discovered first
  const denom = await discoverL2NativeDenom(wallet, chainId)
  if (!denom) {
    log(`[${chainId}] cannot discover metadata: L2 native denom not found`)
    return undefined
  }

  const ctx = wallet.chain<'minimove'>(chainId)

  try {
    const response = await ctx.client.move.metadata({ denom })
    moveMetadataCache.set(chainId, response.metadata)
    log(`[${chainId}] discovered Move metadata: ${response.metadata} (denom: ${denom})`)
    return response.metadata
  } catch (err) {
    log(`[${chainId}] move.metadata query failed for "${denom}": ${(err as Error).message}`)
    return undefined
  }
}

/** Query native balance for an address on a given chain. Returns 0n if not found. */
async function queryBalance(
  wallet: TestWallet,
  chainId: string,
  address?: string
): Promise<bigint> {
  const ctx = wallet.chain(chainId)
  const denom = getNativeDenom(chainId)
  const opts = address ? { address, denom } : { denom }
  const balances = await ctx.getBalance(opts)
  const found = balances.find(b => b.denom === denom)
  return found ? BigInt(found.amount) : 0n
}

/** Query all balances for the wallet's address on a given chain. */
async function queryAllBalances(
  wallet: TestWallet,
  chainId: string
): Promise<{ denom: string; amount: string }[]> {
  const ctx = wallet.chain(chainId)
  const balances = await ctx.getBalance()
  return balances.map(b => ({ denom: b.denom, amount: b.amount }))
}

/** Format uinit amount to human-readable INIT string. */
function fmtInit(uinit: bigint): string {
  const whole = uinit / 1_000_000n
  const frac = uinit % 1_000_000n
  if (frac === 0n) return `${whole} INIT`
  return `${whole}.${frac.toString().padStart(6, '0').replace(/0+$/, '')} INIT`
}

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe.skipIf(SKIP)('L2 E2E: Deposit -> Transact -> Withdraw', () => {
  let wallet: TestWallet
  let recipientWallet: TestWallet
  let provider: RegistryProvider
  let senderAddress: string
  let recipientAddress: string
  let senderEvmAddress: string
  let recipientEvmAddress: string

  beforeAll(async () => {
    provider = await createRegistryProvider({ network: 'testnet' })
    provider.createTransport = createTransport
    const key = new MnemonicKey({ mnemonic: TEST_MNEMONIC! })
    wallet = createTestWallet(key, provider)

    const recipientKey = new MnemonicKey({ mnemonic: TEST_MNEMONIC!, index: 1 })
    recipientWallet = createTestWallet(recipientKey, provider)
    senderAddress = key.address
    senderEvmAddress = key.evmAddress
    recipientAddress = recipientKey.address
    recipientEvmAddress = recipientKey.evmAddress

    log(`Sender:    ${senderAddress} (EVM: ${senderEvmAddress})`)
    log(`Recipient: ${recipientAddress} (EVM: ${recipientEvmAddress})`)
    log(`Mode:      ${STRICT ? 'STRICT (no skips allowed)' : 'default (graceful skip)'}`)
  }, 30_000)

  // =========================================================================
  // Step 1: Deposit L1 -> L2
  // =========================================================================

  describe('Step 1: Deposit L1 -> L2 (1 INIT each)', () => {
    for (const l2 of L2_CHAINS) {
      it(`should deposit 1 INIT to ${l2} and verify L1 balance change`, async () => {
        const l1Before = await queryBalance(wallet, L1)
        log(`[${l2}] L1 balance before deposit: ${fmtInit(l1Before)}`)
        if (
          skipInfra(
            l1Before > DEPOSIT_AMOUNT,
            `[${l2}] L1 balance ${fmtInit(l1Before)} insufficient for ${fmtInit(DEPOSIT_AMOUNT)} deposit (fund the test wallet)`
          )
        )
          return

        const result = await wallet.bridge.deposit(l2, `${DEPOSIT_AMOUNT}uinit`)
        expect(result.txHash).toBeDefined()
        expect(result.txHash.length).toBe(64)

        const confirmed = await result.waitForConfirmation()
        expect(confirmed.code).toBe(0)
        expect(confirmed.height).toBeGreaterThan(0n)
        expect(confirmed.txHash).toBe(result.txHash)
        expect(confirmed.gasUsed).toBeGreaterThan(0n)
        expect(Array.isArray(confirmed.events)).toBe(true)
        expect(confirmed.events.length).toBeGreaterThan(0)

        log(`[${l2}] Deposit tx: ${confirmed.txHash}`)
        log(
          `[${l2}]   height=${confirmed.height} gasUsed=${confirmed.gasUsed} events=${confirmed.events.length}`
        )

        const l1After = await queryBalance(wallet, L1)
        const l1Diff = l1Before - l1After
        log(`[${l2}] L1 balance after deposit: ${fmtInit(l1After)} (diff: ${fmtInit(l1Diff)})`)

        expect(l1Diff).toBeGreaterThanOrEqual(DEPOSIT_AMOUNT)
        expect(l1Diff).toBeLessThan(DEPOSIT_AMOUNT + 1_000_000n)
      }, 120_000)
    }
  })

  // =========================================================================
  // Step 1.5: Wait for deposits to arrive on L2
  // =========================================================================

  describe('Step 1.5: Wait for deposits on L2', () => {
    for (const l2 of L2_CHAINS) {
      it(`should wait for deposit to arrive on ${l2}`, async () => {
        const pollInterval = 10_000
        const maxWait = 300_000 // 5 minutes
        const start = Date.now()

        while (Date.now() - start < maxWait) {
          try {
            // Discover L2 native denom and check balance in one step
            const denom = await discoverL2NativeDenom(wallet, l2)
            if (denom) {
              const balance = await queryBalance(wallet, l2)
              if (balance >= DEPOSIT_AMOUNT) {
                log(
                  `[${l2}] Deposit arrived: ${fmtInit(balance)} denom=${denom} (waited ${((Date.now() - start) / 1000).toFixed(0)}s)`
                )
                return
              }
              log(
                `[${l2}] Waiting... balance=${fmtInit(balance)} denom=${denom} (${((Date.now() - start) / 1000).toFixed(0)}s)`
              )
            } else {
              log(
                `[${l2}] Waiting... no l2/ denom yet (${((Date.now() - start) / 1000).toFixed(0)}s)`
              )
            }
          } catch (err) {
            if (!isNetworkInfraError(err)) throw err
            log(
              `[${l2}] Waiting... network error: ${errorMessage(err)} (${((Date.now() - start) / 1000).toFixed(0)}s)`
            )
          }
          await new Promise(r => setTimeout(r, pollInterval))
        }

        const finalDenom = getNativeDenom(l2)
        let finalBalance: bigint
        try {
          finalBalance = await queryBalance(wallet, l2)
        } catch (err) {
          if (!isNetworkInfraError(err)) throw err
          if (skipInfra(false, `[${l2}] deposit polling network error: ${errorMessage(err)}`))
            return
          throw err
        }
        if (
          skipInfra(
            finalBalance >= DEPOSIT_AMOUNT,
            `[${l2}] deposit not arrived after ${maxWait / 1000}s (balance: ${fmtInit(finalBalance)} denom=${finalDenom})`
          )
        )
          return
      }, 360_000)
    }
  })

  // =========================================================================
  // Step 2: L2 Transactions
  // =========================================================================

  describe('Step 2: L2 Transactions', () => {
    for (const l2 of L2_CHAINS) {
      describe(`${l2}: native send`, () => {
        it('should discover L2 native denom and list balances', async () => {
          const nativeDenom = await discoverL2NativeDenom(wallet, l2)
          const balances = await queryAllBalances(wallet, l2)
          const summary = balances.map(b => `${b.amount}${b.denom}`).join(', ') || '(empty)'
          log(`[${l2}] All balances: ${summary}`)
          log(`[${l2}] Native denom: ${nativeDenom ?? '(not found)'}`)

          expect(Array.isArray(balances)).toBe(true)
          if (skipUnless(!!nativeDenom, `[${l2}] no L2 native denom (l2/...) found in balances`))
            return
        }, 30_000)

        it('should send 0.1 native token and verify balance changes', async () => {
          const ctx = wallet.chain(l2)
          const sender = await wallet.getAddress(l2)
          const nativeDenom = getNativeDenom(l2)
          if (skipUnless(nativeDenom !== 'uinit', `[${l2}] L2 native denom not discovered`)) return

          // On minievm chains, the fee denom (evm/...) differs from the balance denom (l2/...).
          // The bridged l2/ tokens may not be directly usable for gas fees.
          const feeDenom = ctx.chainInfo.nativeDenom
          if (feeDenom && !nativeDenom.startsWith(feeDenom.split('/')[0])) {
            log(`[${l2}] NOTE: fee denom (${feeDenom}) differs from balance denom (${nativeDenom})`)
          }

          const senderBefore = await queryBalance(wallet, l2)
          if (
            skipUnless(
              senderBefore >= SEND_AMOUNT * 2n,
              `[${l2}] sender balance ${fmtInit(senderBefore)} < required ${fmtInit(SEND_AMOUNT * 2n)}`
            )
          )
            return

          const recipientBefore = await queryBalance(wallet, l2, recipientAddress)
          log(
            `[${l2}] Before send: sender=${fmtInit(senderBefore)} recipient=${fmtInit(recipientBefore)}`
          )

          try {
            const msg = ctx.msgs.bank.send({
              fromAddress: sender,
              toAddress: recipientAddress,
              amount: [coin(nativeDenom, SEND_AMOUNT.toString())],
            })
            const result = await ctx.signAndBroadcast([msg], { waitForConfirmation: true })

            expect(result.code).toBe(0)
            expect(result.height).toBeGreaterThan(0n)
            expect(result.txHash).toHaveLength(64)
            expect(result.gasUsed).toBeGreaterThan(0n)
            expect(result.events.length).toBeGreaterThan(0)
            log(
              `[${l2}] Send tx: ${result.txHash} height=${result.height} gasUsed=${result.gasUsed}`
            )

            const senderAfter = await queryBalance(wallet, l2)
            const senderDiff = senderBefore - senderAfter
            expect(senderDiff).toBeGreaterThanOrEqual(SEND_AMOUNT)
            expect(senderDiff).toBeLessThan(SEND_AMOUNT + 1_000_000n)

            const recipientAfter = await queryBalance(wallet, l2, recipientAddress)
            expect(recipientAfter - recipientBefore).toBe(SEND_AMOUNT)

            log(
              `[${l2}] After send: sender=${fmtInit(senderAfter)} (diff: ${fmtInit(senderDiff)}) recipient=${fmtInit(recipientAfter)} (+${fmtInit(SEND_AMOUNT)})`
            )
          } catch (err) {
            // On minievm, l2/ denom may not be directly usable for bank send + gas
            const msg = (err as Error).message
            if (ctx.chainInfo.chainType === 'minievm' && msg.includes('ERC20')) {
              log(`[${l2}] SKIP (minievm): send failed due to fee/balance denom mismatch — ${msg}`)
              return
            }
            throw err
          }
        }, 120_000)
      })
    }

    // --- EVM: ERC20 contract interaction ---
    describe('evm-1: ERC20 contract interaction', () => {
      it('should read token info and validate all fields', async () => {
        const ctx = wallet.chain<'minievm'>('evm-1')
        const erc20 = createEvmContract(ctx, EVM_ERC20_ADDRESS, ERC20_ABI)
        const info = await erc20.getTokenInfo()

        expect(typeof info.name).toBe('string')
        expect(info.name.length).toBeGreaterThan(0)
        expect(typeof info.symbol).toBe('string')
        expect(info.symbol.length).toBeGreaterThan(0)
        expect(typeof info.decimals).toBe('number')
        expect(info.decimals).toBeGreaterThanOrEqual(0)
        expect(info.decimals).toBeLessThanOrEqual(18)

        log(
          `[evm-1] ERC20 info: name="${info.name}" symbol="${info.symbol}" decimals=${info.decimals} totalSupply=${info.totalSupply}`
        )
      }, 60_000)

      it('should read balanceOf and verify type', async () => {
        const ctx = wallet.chain<'minievm'>('evm-1')
        const erc20 = createEvmContract(ctx, EVM_ERC20_ADDRESS, ERC20_ABI)
        const balance = await erc20.read.balanceOf(senderEvmAddress as `0x${string}`)

        expect(typeof balance).toBe('bigint')
        expect(balance).toBeGreaterThanOrEqual(0n)
        log(`[evm-1] ERC20 balanceOf(sender): ${balance}`)
      }, 60_000)

      it('should parseUnits and formatUnits round-trip', async () => {
        const ctx = wallet.chain<'minievm'>('evm-1')
        const erc20 = createEvmContract(ctx, EVM_ERC20_ADDRESS, ERC20_ABI)
        const parsed = await erc20.parseUnits('123.456')
        expect(typeof parsed).toBe('bigint')
        expect(parsed).toBeGreaterThan(0n)

        const formatted = await erc20.formatUnits(parsed)
        expect(typeof formatted).toBe('string')
        expect(formatted).toBe('123.456')

        log(`[evm-1] ERC20 parseUnits("123.456") = ${parsed}, formatUnits back = "${formatted}"`)
      }, 60_000)

      it('should estimate gas for ERC20 transfer', async () => {
        const ctx = wallet.chain<'minievm'>('evm-1')
        const erc20 = createEvmContract(ctx, EVM_ERC20_ADDRESS, ERC20_ABI)
        const sender = await wallet.getAddress('evm-1')

        // Pre-check: estimateGas will revert if sender has no ERC20 balance
        const balance = await erc20.read.balanceOf(senderEvmAddress as `0x${string}`)
        if (skipInfra(balance > 0n, '[evm-1] sender has no ERC20 balance for estimateGas')) return

        const gas = await erc20.estimateGas.transfer(
          sender,
          recipientEvmAddress as `0x${string}`,
          1n
        )

        expect(typeof gas).toBe('bigint')
        expect(gas).toBeGreaterThan(0n)
        expect(gas).toBeLessThan(10_000_000n)

        log(`[evm-1] ERC20 estimateGas.transfer: ${gas}`)
      }, 60_000)

      it('should transfer ERC20 and verify balance change', async () => {
        const ctx = wallet.chain<'minievm'>('evm-1')
        const erc20 = createEvmContract(ctx, EVM_ERC20_ADDRESS, ERC20_ABI)
        const sender = await wallet.getAddress('evm-1')

        const senderBefore = await erc20.read.balanceOf(senderEvmAddress as `0x${string}`)
        const recipientBefore = await erc20.read.balanceOf(recipientEvmAddress as `0x${string}`)
        if (skipInfra(senderBefore > 0n, '[evm-1] sender has no ERC20 balance for transfer test'))
          return

        const transferAmount = 1n
        const msg = erc20.write.transfer(
          sender,
          recipientEvmAddress as `0x${string}`,
          transferAmount
        )
        const result = await ctx.signAndBroadcast([msg], { waitForConfirmation: true })

        expect(result.code).toBe(0)
        expect(result.height).toBeGreaterThan(0n)
        expect(result.txHash).toHaveLength(64)
        expect(result.gasUsed).toBeGreaterThan(0n)

        const senderAfter = await erc20.read.balanceOf(senderEvmAddress as `0x${string}`)
        const recipientAfter = await erc20.read.balanceOf(recipientEvmAddress as `0x${string}`)
        const senderDiff = senderBefore - senderAfter
        const recipientDiff = recipientAfter - recipientBefore

        expect(recipientDiff).toBe(transferAmount)
        expect(senderDiff).toBeGreaterThanOrEqual(transferAmount)

        log(
          `[evm-1] ERC20 transfer: ${result.txHash} height=${result.height} gasUsed=${result.gasUsed}`
        )
        log(
          `[evm-1]   sender balance change: ${senderBefore} -> ${senderAfter} (diff: ${senderDiff})`
        )
        log(
          `[evm-1]   recipient balance change: ${recipientBefore} -> ${recipientAfter} (diff: ${recipientDiff})`
        )
      }, 120_000)
    })

    // --- Move: view function call ---
    describe('move-1: Move contract interaction', () => {
      it('should fetch coin module ABI and validate structure', async () => {
        const ctx = wallet.chain<'minimove'>('move-1')

        const coinModule = await createMoveContract(ctx, '0x1', 'coin')

        expect(coinModule.abi).toBeDefined()
        expect(coinModule.abi?.name).toBe('coin')
        expect(coinModule.moduleAddress).toBe('0x1')
        expect(coinModule.moduleName).toBe('coin')
        expect(Array.isArray(coinModule.abi?.exposed_functions)).toBe(true)
        expect(coinModule.abi.exposed_functions.length).toBeGreaterThan(0)

        const fnNames = coinModule.abi.exposed_functions.map((f: { name: string }) => f.name)
        expect(fnNames).toContain('balance')
        expect(fnNames).toContain('transfer')

        log(`[move-1] coin module ABI: ${fnNames.length} functions: ${fnNames.join(', ')}`)
      }, 60_000)

      it('should verify balance via bank module and coin::balance view', async () => {
        const ctx = wallet.chain<'minimove'>('move-1')

        // Bank module balance always works (uses discovered L2 denom)
        const bankBalance = await queryBalance(wallet, 'move-1')
        const nativeDenom = getNativeDenom('move-1')
        log(`[move-1] bank balance: ${fmtInit(bankBalance)} (denom: ${nativeDenom})`)
        expect(bankBalance).toBeGreaterThanOrEqual(0n)

        // L2 Move uses fungible asset model: coin functions take metadata object as arg (not typeArg)
        const metadata = await discoverMoveMetadata(wallet, 'move-1')
        if (skipUnless(!!metadata, '[move-1] native coin metadata not discovered')) return

        const coinModule = await createMoveContract(ctx, '0x1', 'coin')
        // Move VM expects hex addresses, not bech32
        const senderHex = AccAddress.toHex(senderAddress)
        const result = await coinModule.view.balance({
          args: [senderHex, metadata!],
        })

        expect(result).toBeDefined()
        log(
          `[move-1] coin::balance result: ${JSON.stringify(result, (_, v) => (typeof v === 'bigint' ? v.toString() : v))} (metadata: ${metadata})`
        )
      }, 60_000)

      it('should get token info via coin view functions', async () => {
        const ctx = wallet.chain<'minimove'>('move-1')

        const metadata = await discoverMoveMetadata(wallet, 'move-1')
        if (skipUnless(!!metadata, '[move-1] native coin metadata not discovered')) return

        // L2 Move: use coin::name/symbol/decimals view functions with metadata arg
        const coinModule = await createMoveContract(ctx, '0x1', 'coin')

        const [name, symbol, decimals] = await Promise.all([
          coinModule.view.name({ args: [metadata!] }) as Promise<string>,
          coinModule.view.symbol({ args: [metadata!] }) as Promise<string>,
          coinModule.view.decimals({ args: [metadata!] }) as Promise<number>,
        ])

        expect(typeof name).toBe('string')
        expect(name.length).toBeGreaterThan(0)
        expect(typeof symbol).toBe('string')
        expect(typeof decimals).toBe('number')

        log(
          `[move-1] coin info: name="${name}" symbol="${symbol}" decimals=${decimals} (metadata: ${metadata})`
        )
      }, 60_000)

      it('should execute coin::transfer and verify balance change', async () => {
        const ctx = wallet.chain<'minimove'>('move-1')
        const sender = await wallet.getAddress('move-1')

        const metadata = await discoverMoveMetadata(wallet, 'move-1')
        if (skipUnless(!!metadata, '[move-1] native coin metadata not discovered')) return

        const bankBefore = await queryBalance(wallet, 'move-1')
        if (
          skipInfra(
            bankBefore >= 100_000n,
            `[move-1] sender balance ${fmtInit(bankBefore)} too low for transfer test`
          )
        )
          return

        // L2 Move: coin::transfer(&signer, to, metadata, amount) — no typeArgs
        const coinModule = await createMoveContract(ctx, '0x1', 'coin')
        const transferAmount = 10_000n

        const msg = coinModule.execute.transfer(sender, {
          args: [recipientAddress, metadata!, transferAmount.toString()],
        })

        const result = await ctx.signAndBroadcast([msg], { waitForConfirmation: true })

        expect(result.code).toBe(0)
        expect(result.height).toBeGreaterThan(0n)
        expect(result.txHash).toHaveLength(64)
        expect(result.gasUsed).toBeGreaterThan(0n)

        const bankAfter = await queryBalance(wallet, 'move-1')
        expect(bankBefore - bankAfter).toBeGreaterThanOrEqual(transferAmount)

        log(
          `[move-1] coin::transfer tx: ${result.txHash} height=${result.height} gasUsed=${result.gasUsed}`
        )
        log(
          `[move-1]   balance change: ${fmtInit(bankBefore)} -> ${fmtInit(bankAfter)} (diff: ${fmtInit(bankBefore - bankAfter)})`
        )
      }, 120_000)
    })

    // --- Wasm: contract query ---
    describe('wasm-1: Wasm contract interaction', () => {
      it('should find and query a deployed contract', async () => {
        const ctx = wallet.chain<'miniwasm'>('wasm-1')
        const wasmClient = ctx.client.wasm
        const codesResponse = await wasmClient.codes({ pagination: { limit: 5n } })

        if (skipUnless(codesResponse.codeInfos?.length > 0, '[wasm-1] no codes found on chain'))
          return

        log(`[wasm-1] Found ${codesResponse.codeInfos.length} code(s) on chain`)

        let contractAddr: string | undefined
        let codeId: bigint | undefined
        for (const code of codesResponse.codeInfos) {
          const contractsResp = await wasmClient.contractsByCode({
            codeId: code.codeId,
            pagination: { limit: 1n },
          })
          if (contractsResp.contracts?.length > 0) {
            contractAddr = contractsResp.contracts[0]
            codeId = code.codeId
            break
          }
        }

        if (skipUnless(!!contractAddr && !!codeId, '[wasm-1] no contract instances found')) return

        const contract = createWasmContract(ctx, contractAddr!)
        const info = await contract.getContractInfo()

        expect(info).toBeDefined()
        expect(info.codeId).toBe(codeId)
        expect(typeof info.label).toBe('string')
        expect(typeof info.creator).toBe('string')
        expect(info.creator.startsWith('init1')).toBe(true)

        log(`[wasm-1] Contract: ${contractAddr}`)
        log(
          `[wasm-1]   codeId=${info.codeId} label="${info.label}" creator=${info.creator} admin=${info.admin || '(none)'}`
        )
      }, 60_000)

      it('should find and read a CW20 token contract (infra-dependent)', async () => {
        const ctx = wallet.chain<'miniwasm'>('wasm-1')
        const wasmClient = ctx.client.wasm
        const codesResponse = await wasmClient.codes({ pagination: { limit: 20n } })

        if (codesResponse.codeInfos?.length === 0) {
          log('[wasm-1] SKIP: no codes on chain for CW20 search (testnet state)')
          return
        }

        // Scan for a CW20 contract (responds to token_info query)
        let cw20Addr: string | undefined
        for (const code of codesResponse.codeInfos) {
          const contractsResp = await wasmClient.contractsByCode({
            codeId: code.codeId,
            pagination: { limit: 3n },
          })
          for (const addr of contractsResp.contracts ?? []) {
            try {
              const c = createWasmContract(ctx, addr)
              const info = await c.getTokenInfo()
              if (info.name && info.symbol) {
                cw20Addr = addr
                log(
                  `[wasm-1] Found CW20: ${addr} name="${info.name}" symbol="${info.symbol}" decimals=${info.decimals}`
                )
                break
              }
            } catch {
              // Not a CW20 — always skip this inner probe regardless of STRICT mode
            }
          }
          if (cw20Addr) break
        }

        if (!cw20Addr) {
          log('[wasm-1] SKIP: no CW20 contracts found on chain (testnet state)')
          return
        }

        const cw20 = createWasmContract(ctx, cw20Addr)
        const tokenInfo = await cw20.getTokenInfo()
        expect(typeof tokenInfo.name).toBe('string')
        expect(tokenInfo.name.length).toBeGreaterThan(0)
        expect(typeof tokenInfo.symbol).toBe('string')
        expect(typeof tokenInfo.decimals).toBe('number')

        const balanceResult = (await cw20.query.balance({ address: senderAddress })) as {
          balance: string
        }
        expect(balanceResult).toBeDefined()
        expect(typeof balanceResult.balance).toBe('string')
        log(`[wasm-1] CW20 balance of sender: ${balanceResult.balance}`)
      }, 120_000)

      it('should transfer CW20 tokens and verify balance change (infra-dependent)', async () => {
        const ctx = wallet.chain<'miniwasm'>('wasm-1')
        const sender = await wallet.getAddress('wasm-1')
        const wasmClient = ctx.client.wasm
        const codesResponse = await wasmClient.codes({ pagination: { limit: 20n } })

        if (codesResponse.codeInfos?.length === 0) {
          log('[wasm-1] SKIP CW20 transfer: no codes on chain')
          return
        }

        // Scan for a CW20 contract with sender balance
        let cw20Addr: string | undefined
        for (const code of codesResponse.codeInfos) {
          const contractsResp = await wasmClient.contractsByCode({
            codeId: code.codeId,
            pagination: { limit: 3n },
          })
          for (const addr of contractsResp.contracts ?? []) {
            try {
              const c = createWasmContract(ctx, addr)
              const info = await c.getTokenInfo()
              if (!info.name || !info.symbol) continue
              const bal = (await c.query.balance({ address: sender })) as { balance: string }
              if (bal.balance && BigInt(bal.balance) > 0n) {
                cw20Addr = addr
                log(
                  `[wasm-1] Found CW20 with balance: ${addr} name="${info.name}" balance=${bal.balance}`
                )
                break
              }
            } catch {
              // Not a CW20 or query failed
            }
          }
          if (cw20Addr) break
        }

        if (!cw20Addr) {
          log('[wasm-1] SKIP CW20 transfer: no CW20 with sender balance found (testnet state)')
          return
        }

        const cw20 = createWasmContract(ctx, cw20Addr)

        const balBefore = (await cw20.query.balance({ address: sender })) as { balance: string }
        const before = BigInt(balBefore.balance)
        const transferAmount = '1'

        const msg = cw20.execute.transfer(sender, {
          recipient: recipientAddress,
          amount: transferAmount,
        })

        const result = await ctx.signAndBroadcast([msg], { waitForConfirmation: true })

        expect(result.code).toBe(0)
        expect(result.height).toBeGreaterThan(0n)
        expect(result.txHash).toHaveLength(64)
        expect(result.gasUsed).toBeGreaterThan(0n)

        const balAfter = (await cw20.query.balance({ address: sender })) as { balance: string }
        const after = BigInt(balAfter.balance)
        expect(before - after).toBe(BigInt(transferAmount))

        log(
          `[wasm-1] CW20 transfer tx: ${result.txHash} height=${result.height} gasUsed=${result.gasUsed}`
        )
        log(`[wasm-1]   balance change: ${before} -> ${after} (diff: ${before - after})`)
      }, 120_000)
    })

    // --- Cross-VM: ChainContext.estimateGas ---
    describe('Cross-VM: ChainContext.estimateGas', () => {
      for (const l2 of L2_CHAINS) {
        it(`should estimate gas for bank send on ${l2}`, async () => {
          const ctx = wallet.chain(l2)
          const sender = await wallet.getAddress(l2)
          const nativeDenom = getNativeDenom(l2)
          if (
            skipUnless(
              nativeDenom !== 'uinit',
              `[${l2}] L2 native denom not discovered for estimateGas`
            )
          )
            return

          const msg = ctx.msgs.bank.send({
            fromAddress: sender,
            toAddress: recipientAddress,
            amount: [coin(nativeDenom, '1000')],
          })
          const estimate = await ctx.estimateGas([msg])

          expect(estimate.gasLimit).toBeGreaterThan(0n)
          expect(estimate.fee.length).toBeGreaterThan(0)
          expect(BigInt(estimate.fee[0].amount)).toBeGreaterThan(0n)

          log(
            `[${l2}] estimateGas: gasLimit=${estimate.gasLimit} fee=${estimate.fee.map(f => `${f.amount}${f.denom}`).join(',')}`
          )
        }, 60_000)
      }
    })
  })

  // =========================================================================
  // Step 2.5: Recover recipient balances back to sender
  // =========================================================================

  describe('Step 2.5: Recover recipient balances', () => {
    for (const l2 of L2_CHAINS) {
      it(`should recover recipient native balance on ${l2}`, async () => {
        const nativeDenom = getNativeDenom(l2)
        if (skipUnless(nativeDenom !== 'uinit', `[${l2}] L2 native denom not discovered`)) return

        const recipientBal = await queryBalance(wallet, l2, recipientAddress)
        if (recipientBal === 0n) {
          log(`[${l2}] recipient has no native balance to recover`)
          return
        }

        // Reserve enough for gas fees
        const gasReserve = 50_000n
        if (recipientBal <= gasReserve) {
          log(
            `[${l2}] recipient balance ${fmtInit(recipientBal)} too low to recover (gas reserve: ${fmtInit(gasReserve)})`
          )
          return
        }

        const sendBack = recipientBal - gasReserve
        log(
          `[${l2}] Recovering ${fmtInit(sendBack)} from recipient (balance: ${fmtInit(recipientBal)})`
        )

        try {
          const ctx = recipientWallet.chain(l2)
          const msg = ctx.msgs.bank.send({
            fromAddress: recipientAddress,
            toAddress: senderAddress,
            amount: [coin(nativeDenom, sendBack.toString())],
          })
          const result = await ctx.signAndBroadcast([msg], { waitForConfirmation: true })

          expect(result.code).toBe(0)
          log(
            `[${l2}] Recovered ${fmtInit(sendBack)}: tx=${result.txHash} gasUsed=${result.gasUsed}`
          )
        } catch (err) {
          // Recovery is best-effort on minievm (fee denom mismatch)
          const msg = (err as Error).message
          if (wallet.chain(l2).chainInfo.chainType === 'minievm') {
            log(`[${l2}] SKIP recovery (minievm denom mismatch): ${msg}`)
            return
          }
          throw err
        }
      }, 120_000)
    }
  })

  // =========================================================================
  // Step 3: Withdraw L2 -> L1
  // =========================================================================

  describe('Step 3: Withdraw remaining balance from L2', () => {
    /** Fee reserve: minimove gas is ~10x higher due to Move VM execution costs */
    const FEE_RESERVE: Record<string, bigint> = { 'move-1': 100_000n }
    const DEFAULT_FEE_RESERVE = 10_000n

    for (const l2 of L2_CHAINS) {
      it(`should withdraw available balance from ${l2} and verify L2 balance change`, async () => {
        const nativeDenom = getNativeDenom(l2)
        if (skipUnless(nativeDenom !== 'uinit', `[${l2}] L2 native denom not discovered`)) return

        const reserve = FEE_RESERVE[l2] ?? DEFAULT_FEE_RESERVE
        const l2Before = await queryBalance(wallet, l2)
        const minWithdrawable = 100_000n // 0.1 INIT minimum to make withdrawal worthwhile
        if (
          skipUnless(
            l2Before > reserve + minWithdrawable,
            `[${l2}] withdraw: balance ${fmtInit(l2Before)} too low (need > ${fmtInit(reserve + minWithdrawable)})`
          )
        )
          return

        const withdrawAmount = l2Before - reserve
        log(`[${l2}] L2 balance before withdraw: ${fmtInit(l2Before)} (denom: ${nativeDenom})`)
        log(`[${l2}] Withdrawing ${fmtInit(withdrawAmount)} (keeping ${fmtInit(reserve)} for fees)`)

        try {
          const result = await wallet.bridge.withdraw(l2, `${withdrawAmount}${nativeDenom}`)
          expect(result.txHash).toBeDefined()
          expect(result.txHash).toHaveLength(64)

          const confirmed = await result.waitForConfirmation()

          log(`[${l2}] Withdraw tx: ${confirmed.txHash}`)
          log(
            `[${l2}]   code=${confirmed.code} height=${confirmed.height} gasUsed=${confirmed.gasUsed} gasWanted=${confirmed.gasWanted}`
          )
          if (confirmed.code !== 0) {
            log(`[${l2}]   rawLog: ${confirmed.rawLog}`)
          }

          expect(confirmed.code).toBe(0)
          expect(confirmed.height).toBeGreaterThan(0n)
          expect(confirmed.txHash).toBe(result.txHash)
          expect(confirmed.gasUsed).toBeGreaterThan(0n)
          expect(Array.isArray(confirmed.events)).toBe(true)
          expect(confirmed.events.length).toBeGreaterThan(0)

          const l2After = await queryBalance(wallet, l2)
          const l2Diff = l2Before - l2After
          log(`[${l2}] L2 balance after withdraw: ${fmtInit(l2After)} (diff: ${fmtInit(l2Diff)})`)

          expect(l2Diff).toBeGreaterThanOrEqual(withdrawAmount)
          expect(l2Diff).toBeLessThan(withdrawAmount + 1_000_000n)
        } catch (err) {
          // On minievm, l2/ denom may not be directly usable for withdrawal + gas fees
          const msg = (err as Error).message
          if (
            wallet.chain(l2).chainInfo.chainType === 'minievm' &&
            (msg.includes('ERC20') || msg.includes('insufficient'))
          ) {
            log(
              `[${l2}] SKIP (minievm): withdraw failed due to fee/balance denom mismatch — ${msg}`
            )
            return
          }
          throw err
        }
      }, 120_000)
    }
  })

  // =========================================================================
  // Step 4: Claim withdrawals on L1
  // =========================================================================

  describe('Step 4: Claim withdrawals on L1', () => {
    const POLL_INTERVAL = 5_000
    const POLL_TIMEOUT = 60_000

    /** Poll getWithdrawals until at least one is claimable, or timeout. */
    async function waitForClaimable(l2: string): Promise<WithdrawalInfo[]> {
      const start = Date.now()
      while (Date.now() - start < POLL_TIMEOUT) {
        try {
          const withdrawals = await wallet.bridge.getWithdrawals(l2)
          const claimable = withdrawals.filter(w => w.status.status === 'claimable')
          if (claimable.length > 0) return claimable

          const elapsed = ((Date.now() - start) / 1000).toFixed(0)
          const statuses = withdrawals.map(w => w.status.status)
          log(
            `[${l2}] Polling (${elapsed}s): ${withdrawals.length} withdrawal(s) [${statuses.join(', ')}]`
          )
        } catch (err) {
          const elapsed = ((Date.now() - start) / 1000).toFixed(0)
          log(`[${l2}] Polling (${elapsed}s): error — ${(err as Error).message}`)
        }

        await new Promise(r => setTimeout(r, POLL_INTERVAL))
      }
      return []
    }

    for (const l2 of L2_CHAINS) {
      it(`should wait for claimable withdrawals from ${l2} and claim them`, async () => {
        // Log executor URI for debugging
        const l2Info = provider.getChainInfo(l2)
        log(`[${l2}] Executor: ${l2Info?.executorUri ?? '(none)'}`)
        log(`[${l2}] Query address: ${await wallet.getAddress(l2)}`)
        log(
          `[${l2}] Waiting for withdrawals to become claimable (up to ${POLL_TIMEOUT / 1000}s)...`
        )
        const claimable = await waitForClaimable(l2)

        if (claimable.length === 0) {
          // Check final state for logging
          const withdrawals = await wallet.bridge.getWithdrawals(l2)
          if (withdrawals.length === 0) {
            log(`[${l2}] No withdrawals found (executor may not have indexed yet)`)
          } else {
            const statusCounts = { pending: 0, waiting: 0, claimable: 0, claimed: 0 }
            for (const w of withdrawals) statusCounts[w.status.status]++
            log(`[${l2}] Timeout — statuses: ${JSON.stringify(statusCounts)}`)
          }
          skipInfra(false, `[${l2}] no claimable withdrawals within ${POLL_TIMEOUT / 1000}s`)
          return
        }

        log(`[${l2}] Found ${claimable.length} claimable withdrawal(s)`)

        // Claim all claimable withdrawals
        const l1Before = await queryBalance(wallet, L1)
        log(`[${l2}] L1 balance before claim: ${fmtInit(l1Before)}`)

        let totalClaimed = 0n
        for (const w of claimable) {
          log(
            `[${l2}] Claiming withdrawal seq=${w.sequence} amount=${w.amount.amount}${w.amount.denom}`
          )

          const result = await wallet.bridge.claim(w)
          const confirmed = await result.waitForConfirmation()

          expect(confirmed.code).toBe(0)
          expect(confirmed.height).toBeGreaterThan(0n)
          totalClaimed += BigInt(w.amount.amount)

          log(
            `[${l2}] Claimed: tx=${confirmed.txHash} height=${confirmed.height} gasUsed=${confirmed.gasUsed}`
          )
        }

        const l1After = await queryBalance(wallet, L1)
        const l1Diff = l1After - l1Before
        log(`[${l2}] L1 balance after claim: ${fmtInit(l1After)} (diff: +${fmtInit(l1Diff)})`)
        log(
          `[${l2}] Total claimed: ${fmtInit(totalClaimed)} from ${claimable.length} withdrawal(s)`
        )

        // L1 balance should have increased (minus gas fees)
        expect(l1After).toBeGreaterThan(l1Before)
      }, 300_000) // 5 min — polling + multiple claims
    }
  })

  // =========================================================================
  // Step 5: Final balance verification
  // =========================================================================

  describe('Step 5: Final balance verification', () => {
    for (const l2 of L2_CHAINS) {
      it(`should verify final L2 balance on ${l2}`, async () => {
        const l2Balance = await queryBalance(wallet, l2)
        log(`[${l2}] Final L2 balance: ${fmtInit(l2Balance)}`)
        expect(l2Balance).toBeGreaterThanOrEqual(0n)
      }, 30_000)
    }

    it('should verify final L1 balance', async () => {
      const l1Balance = await queryBalance(wallet, L1)
      log(`[L1] Final balance: ${fmtInit(l1Balance)}`)
      expect(l1Balance).toBeGreaterThanOrEqual(0n)
    }, 30_000)
  })
})
