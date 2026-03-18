/**
 * Unified Bridge for OPInit L1 ↔ L2 transfers and smart routing.
 *
 * Access via `provider.bridge` — do not instantiate directly.
 */

import type { Numeric } from '../types'
import type { ChainInfo, ChainInfoProvider } from '../provider/types'
import type {
  DepositOptions,
  WithdrawOptions,
  ClaimOptions,
  WithdrawalInfo,
  RouteOptions,
  Route,
  BuildTransferMsgsOptions,
  TransferTx,
  OpHookOptions,
  OpHookResult,
  SignedOpHook,
  TransferStatus,
  WatchDepositOptions,
  WatchWithdrawalOptions,
  DepositEvent,
  WithdrawalEvent,
  BridgeWatchHandle,
  DepositAndWaitOptions,
  WithdrawAndClaimOptions,
  RoutableAsset,
  RouterChain,
  BalanceQuery,
  RouterBalances,
  NftTransferOptions,
  NftTransferResult,
} from './types'
import type { FetchWithdrawalsOptions } from './executor'
import {
  type Signer,
  type DirectSigner,
  type AminoSigner,
  isDirectSigner,
  isAminoSigner,
  isEIP191Signer,
} from '../signer/types'
import type { SignModeType } from '../client/types'
import type { TransportFactory } from '../client/transport-common'
import { OpBridgeInternal } from './op-bridge'
import { RouterClient } from './router-client'
import { watchDeposit, watchWithdrawal, waitForDeposit, waitForClaimable } from './watch'
import { InitiaError, isNotFoundError } from '../errors'
import { base64 } from '@scure/base'
import { fromJson, type JsonObject } from '@bufbuild/protobuf'
import { Message } from '../msgs'
import { UnsignedTx } from '../client/types'
import { buildChainContextFactory } from '../wallet/chain-context'
import { resolveServices, resolveRegistry, resolveMsgs } from '../chains/resolve'

export class Bridge {
  private opBridge: OpBridgeInternal
  private router?: RouterClient

  constructor(
    private provider: ChainInfoProvider,
    private createTransport: TransportFactory,
    routerUrl?: string
  ) {
    this.opBridge = new OpBridgeInternal(provider, createTransport)
    if (routerUrl) {
      this.router = new RouterClient(routerUrl)
    }
  }

  // ===========================================================================
  // Direct OP Bridge — OpBridgeInternal에 위임
  // ===========================================================================

  deposit(options: DepositOptions): Message {
    return this.opBridge.deposit(options)
  }

  withdraw(options: WithdrawOptions): Message {
    return this.opBridge.withdraw(options)
  }

  claim(options: ClaimOptions): Message {
    return this.opBridge.claim(options)
  }

  getWithdrawals(
    l2ChainId: string,
    address: string,
    options?: FetchWithdrawalsOptions
  ): Promise<WithdrawalInfo[]> {
    return this.opBridge.getWithdrawals(l2ChainId, address, options)
  }

  getWithdrawalStatus(l2ChainId: string, sequence: Numeric): Promise<WithdrawalInfo> {
    return this.opBridge.getWithdrawalStatus(l2ChainId, sequence)
  }

  listBridgeableChains(): ChainInfo[] {
    return this.opBridge.listBridgeableChains()
  }

  getBridgeId(l2ChainId: string): bigint {
    return this.opBridge.getBridgeId(l2ChainId)
  }

  // ===========================================================================
  // Smart Routing — RouterClient에 위임
  // ===========================================================================

  private requireRouter(): RouterClient {
    if (!this.router) {
      throw new InitiaError('Router API not available for this network')
    }
    return this.router
  }

  route(options: RouteOptions): Promise<Route> {
    return this.requireRouter().route(options)
  }

  getRoutableAssets(chainIds?: string[]): Promise<Record<string, RoutableAsset[]>> {
    return this.requireRouter().assets(chainIds)
  }

  /**
   * Resolve an asset by symbol on a specific chain.
   *
   * @returns The matching asset with denom, decimals, symbol, etc.
   * @throws If the symbol is not found or ambiguous (multiple matches).
   *
   * @example
   * ```typescript
   * const asset = await provider.bridge.resolveAsset('evm-1', 'INIT')
   * // → { denom: 'evm/2eE7...', decimals: 18, symbol: 'INIT', ... }
   * ```
   */
  async resolveAsset(chainId: string, symbol: string): Promise<RoutableAsset> {
    const assetsMap = await this.getRoutableAssets([chainId])
    const matches = assetsMap[chainId]?.filter(a => a.symbol === symbol) ?? []
    if (matches.length === 0) {
      throw new InitiaError(`No asset with symbol '${symbol}' found on chain '${chainId}'`)
    }
    if (matches.length > 1) {
      const denoms = matches.map(a => a.denom).join(', ')
      throw new InitiaError(
        `Ambiguous symbol '${symbol}' on chain '${chainId}': ${matches.length} matches (${denoms}). Use getRoutableAssets() and specify denom directly.`
      )
    }
    return matches[0]
  }

  getRoutableChains(chainIds?: string[]): Promise<RouterChain[]> {
    return this.requireRouter().chains(chainIds)
  }

  getBalances(queries: Record<string, BalanceQuery>): Promise<RouterBalances> {
    return this.requireRouter().balances(queries)
  }

  nftTransfer(options: NftTransferOptions): Promise<NftTransferResult> {
    return this.requireRouter().nftTransfer(options)
  }

  buildTransferMsgs(options: BuildTransferMsgsOptions): Promise<TransferTx[]> {
    return this.requireRouter().msgs(options)
  }

  getOpHook(options: OpHookOptions): Promise<OpHookResult> {
    return this.requireRouter().opHook(options)
  }

  /**
   * Build and sign a Cosmos transaction from OP Hook messages.
   *
   * The hook messages (from getOpHook) are assembled into a Cosmos TxRaw,
   * signed with the appropriate sign mode, and returned as base64.
   * The L2's handleBridgeHook decodes and executes this transaction.
   *
   * opHook is minievm-only (ERC-20 6d↔18d wrapping). Default sign mode
   * is eip191 if the signer supports it, otherwise direct, then amino.
   *
   * @param hookResult - OP Hook data from getOpHook()
   * @param signer - Any Signer (Key, Keplr, WalletConnect, etc.)
   * @param options - Optional sign mode override and source chain ID
   */
  async signOpHook(
    hookResult: OpHookResult,
    signer: Signer,
    options?: {
      /** Override auto-detected sign mode */
      signMode?: SignModeType
      /** Source chain ID — if same as hook chain, sequence is incremented by 2 (minievm MsgCall accounting) */
      sourceChainId?: string
    }
  ): Promise<SignedOpHook> {
    // 1. Resolve chain info and type registry
    const chainInfo = this.provider.getChainInfo(hookResult.chainId)
    if (!chainInfo) throw new InitiaError(`Chain not found: ${hookResult.chainId}`)

    const registry = resolveRegistry(chainInfo)

    // 2. Convert CosmosMsgJson[] → Message[]
    const messages = hookResult.hook.map(hookMsg => {
      const typeUrl = hookMsg.msg_type_url
      const typeName = typeUrl.startsWith('/') ? typeUrl.slice(1) : typeUrl
      const schema = registry.getMessage(typeName)
      if (!schema) {
        throw new InitiaError(
          `Unknown message type in opHook: ${typeUrl}. ` +
            'Ensure the chain config includes this message schema.'
        )
      }
      let parsed: JsonObject
      try {
        parsed = JSON.parse(hookMsg.msg) as JsonObject
      } catch (err) {
        throw new InitiaError(
          `Failed to parse opHook message JSON (type: ${typeUrl}): ` +
            (err instanceof Error ? err.message : String(err))
        )
      }
      let msg
      try {
        msg = fromJson(schema, parsed, { registry })
      } catch (err) {
        throw new InitiaError(
          `Failed to deserialize opHook message (type: ${typeUrl}): ` +
            (err instanceof Error ? err.message : String(err))
        )
      }
      return new Message(schema, msg)
    })

    // 3. Determine sign mode (minievm defaults to eip191)
    let signMode: SignModeType
    if (options?.signMode) {
      signMode = options.signMode
    } else {
      switch (true) {
        case isEIP191Signer(signer):
          signMode = 'eip191'
          break
        case isDirectSigner(signer):
          signMode = 'direct'
          break
        case isAminoSigner(signer):
          signMode = 'amino'
          break
        default:
          throw new InitiaError('Signer must support signDirect, signAmino, or signPersonal')
      }
    }

    // Validate signer supports the resolved sign mode
    if (signMode === 'direct' && !isDirectSigner(signer)) {
      throw new InitiaError('signMode "direct" requires a signer that implements signDirect')
    }
    if (signMode === 'amino' && !isAminoSigner(signer)) {
      throw new InitiaError('signMode "amino" requires a signer that implements signAmino')
    }
    if (signMode === 'eip191' && !isEIP191Signer(signer)) {
      throw new InitiaError('signMode "eip191" requires a signer that implements signPersonal')
    }

    // 4. Create a ChainContext for the L2 chain
    const createCtx = buildChainContextFactory(this.createTransport, resolveServices, resolveMsgs)
    const ctx = createCtx(chainInfo, { signer: signer as DirectSigner | AminoSigner })

    // 5. Query L2 account for accountNumber/sequence
    const prefix = chainInfo.bech32Prefix ?? 'init'
    const address = await signer.getAddress(prefix)
    let accountNumber = 0n
    let sequence = 0n
    try {
      const account = await ctx.getAccount({ address })
      accountNumber = account.number
      sequence = account.sequence
    } catch (err) {
      if (!isNotFoundError(err)) throw err
      // Account not found — first deposit, use defaults (0n)
    }

    // Minievm same-chain hook: increment sequence by 2.
    // The source tx contains approve + toRemote (2 MsgCalls) that execute
    // before the hook, consuming 2 sequence slots on the same account.
    // Assumption: router-api's createCosmosTxWithSourceErc20ToRemoteMsg
    // always produces exactly 2 msgs for same-chain paths. If the server
    // adds more msgs to the source tx, this offset must be updated.
    if (options?.sourceChainId === hookResult.chainId) {
      sequence += 2n
    }

    // 6. Build UnsignedTx and sign via ChainContext
    const unsignedTx = new UnsignedTx({
      msgs: messages,
      signMode,
      chainId: hookResult.chainId,
      accountNumber,
      sequence,
      fee: [],
      gasLimit: 0n,
      memo: '',
      timeoutHeight: 0n,
    })

    const signed = await ctx.sign(unsignedTx)

    return {
      hook: base64.encode(signed.txBytes),
      signer: address,
    }
  }

  trackTransfer(txHash: string, chainId: string): Promise<void> {
    return this.requireRouter().track(txHash, chainId)
  }

  getTransferStatus(txHash: string, chainId: string): Promise<TransferStatus> {
    return this.requireRouter().status(txHash, chainId)
  }

  // ===========================================================================
  // WebSocket Monitoring
  // ===========================================================================

  watchDeposit(
    options: WatchDepositOptions,
    callback: (event: DepositEvent) => void
  ): BridgeWatchHandle {
    return watchDeposit(this.provider, options, callback)
  }

  watchWithdrawal(
    options: WatchWithdrawalOptions,
    callback: (event: WithdrawalEvent) => void
  ): BridgeWatchHandle {
    return watchWithdrawal(this.provider, options, callback, this.createTransport)
  }

  waitForDeposit(
    options: WatchDepositOptions & { timeout?: number }
  ): Promise<DepositEvent & { status: 'finalized' }> {
    return waitForDeposit(this.provider, options)
  }

  waitForClaimable(
    options: WatchWithdrawalOptions & { timeout?: number }
  ): Promise<WithdrawalEvent & { status: 'claimable' }> {
    return waitForClaimable(this.provider, options, this.createTransport)
  }

  // ===========================================================================
  // High-level helpers — end-to-end bridge operations
  // ===========================================================================

  /**
   * Deposit L1 → L2 and wait for finalization on L2.
   *
   * Combines `deposit()` + `signAndBroadcast()` + `waitForDeposit()` into one call.
   *
   * @example
   * ```typescript
   * const event = await bridge.depositAndWait({
   *   sender: key.address,
   *   toChain: 'rollup-1',
   *   amount: coin('uinit', 1_000_000),
   *   signAndBroadcast: (msgs) => l1.signAndBroadcast(msgs),
   * })
   * console.log(event.status) // 'finalized'
   * ```
   */
  async depositAndWait(
    options: DepositAndWaitOptions
  ): Promise<DepositEvent & { status: 'finalized' }> {
    const msg = this.deposit({
      sender: options.sender,
      to: options.to,
      toChain: options.toChain,
      amount: options.amount,
      data: options.data,
    })
    await options.signAndBroadcast([msg])
    return this.waitForDeposit({
      l2ChainId: options.toChain,
      sender: options.sender,
      recipient: options.to ?? options.sender,
      timeout: options.timeout,
    })
  }

  /**
   * Withdraw L2 → L1, wait for finalization, and auto-claim on L1.
   *
   * Combines `withdraw()` + `signAndBroadcastL2()` + `waitForClaimable()` +
   * `getWithdrawals()` + `claim()` + `signAndBroadcastL1()`.
   *
   * @example
   * ```typescript
   * const withdrawal = await bridge.withdrawAndClaim({
   *   sender: key.address,
   *   amount: coin('uinit', 1_000_000),
   *   l2ChainId: 'rollup-1',
   *   signAndBroadcastL2: (msgs) => l2.signAndBroadcast(msgs),
   *   signAndBroadcastL1: (msgs) => l1.signAndBroadcast(msgs),
   * })
   * ```
   */
  async withdrawAndClaim(options: WithdrawAndClaimOptions): Promise<WithdrawalInfo> {
    // 1. Withdraw on L2
    const withdrawMsg = this.withdraw({
      sender: options.sender,
      to: options.to,
      amount: options.amount,
    })
    await options.signAndBroadcastL2([withdrawMsg])

    // 2. Wait for finalization period
    await this.waitForClaimable({
      l2ChainId: options.l2ChainId,
      sender: options.sender,
      timeout: options.timeout,
    })

    // 3. Fetch withdrawal info with proofs
    const recipient = options.to ?? options.sender
    const withdrawals = await this.getWithdrawals(options.l2ChainId, recipient)
    const claimable = withdrawals.find(w => w.status.status === 'claimable')
    if (!claimable) {
      throw new InitiaError('No claimable withdrawal found after finalization')
    }

    // 4. Claim on L1
    const claimMsg = this.claim({ sender: recipient, withdrawal: claimable })
    await options.signAndBroadcastL1([claimMsg])

    return claimable
  }
}
