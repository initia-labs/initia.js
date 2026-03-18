/**
 * ChainContext — Unified interface for querying, signing, and broadcasting
 * transactions on a specific chain.
 *
 * Recommended usage via typed factories:
 * ```typescript
 * // All-in-one (async — creates provider internally)
 * const ctx = await createInitiaContext({ network: 'testnet', signer: key })
 * await ctx.signAndBroadcast([msg])
 *
 * // L2 chains require explicit chainId
 * const evm = await createMinievmContext({ network: 'testnet', chainId: 'evm-1' })
 * ```
 *
 * Generic `createChainContext(chainInfo, options?)` is also available for
 * advanced use cases (custom providers, dynamic chain resolution, etc.).
 *
 * The raw gRPC client is always accessible via `ctx.client` for direct service calls.
 *
 * Platform-agnostic: use `buildChainContextFactory(createTransport)` to
 * inject the platform-specific transport creator (Node.js gRPC or browser gRPC-web).
 */

import type { Numeric } from '../types'
import { create, toBinary, type DescService, type Registry } from '@bufbuild/protobuf'
import { type MsgInput, normalizeMsg } from '../msgs/types'
import { base64 } from '@scure/base'
import {
  TxBodySchema,
  AuthInfoSchema,
  TxRawSchema,
  SignerInfoSchema,
  ModeInfoSchema,
  FeeSchema,
} from '@buf/cosmos_cosmos-sdk.bufbuild_es/cosmos/tx/v1beta1/tx_pb'
import { SignMode } from '@buf/cosmos_cosmos-sdk.bufbuild_es/cosmos/tx/signing/v1beta1/signing_pb'
import type { Transport } from '@connectrpc/connect'
import {
  type DirectSigner,
  type AminoSigner,
  type DirectSignDoc,
  type AminoSignDoc,
  isDirectSigner,
  isAminoSigner,
  type EIP191Signer,
  isEIP191Signer,
} from '../signer'
import type { ChainInfo } from '../provider/types'
import type {
  ChainType,
  NetworkType,
  Client,
  ClientFor,
  TxOptions,
  SignedTx,
  SignModeType,
  AuthConfig,
} from '../client/types'
import { UnsignedTx } from '../client/types'
import { EvmRpcClient } from '../client/evm-rpc'
import { RpcClient } from '../client/rpc'
import type { TransportOptions, Interceptor } from '../client/transport-common'
import { createGrpcClient } from '../client/grpc-client'
import { wrapClientWithCache, type CachedClient } from '../client/cached-client'
import { validateHeaderConflict } from '../client/headers'
import {
  broadcast,
  createBroadcastResultWithWait,
  type BroadcastResult,
  type BroadcastResultWithWait,
  type SignBroadcastOptions,
} from '../client/broadcast'
import {
  estimateGas as estimateGasInternal,
  type GasEstimate,
  type EstimateOptions,
} from '../client/gas'
import {
  subscribe,
  createSession,
  hasWebSocketEndpoint,
  waitForTx as waitForTxInternal,
  waitForEvent as waitForEventInternal,
  WebSocketSession,
  type Subscription,
  type TxResult,
  type WaitForTxOptions,
  type EventFilter,
  type WaitForEventOptions,
  type TxSearchClient,
} from '../client/websocket'
import { getAccount, type AccountInfo } from '../core/account'
import type { Coin } from '../core/coin'
import type { MsgsForChain } from '../msgs'
import type { ModuleInput, ExtendedClient, ExtendedMsgs } from '../chain-config'
import { packPubKey } from '../util/public-key'
import { makeStdSignDoc, makeAminoSignBytes, encodeTxDirect, buildStdFee } from '../tx/sign'
import { DEFAULT_GAS_LIMIT } from '../constants'
import type { TokenContract } from '../token/types'
import type { TokenInfo } from '../contracts/types'
import type { UsernameService } from '../client/usernames'
import {
  createUsernameService,
  createUnsupportedUsernameService,
  isUsernameServiceSupported,
} from '../client/usernames'
import {
  getTx,
  createAbiRegistry,
  createNoopAbiRegistry,
  type AbiRegistry,
  type AbiRegistryFor,
  type MessageEnricher,
  type GetTxOptionsFor,
  type DecodedTx,
} from '../tx/get-tx'

// Re-export types for convenience
export type { Subscription, TxResult, WaitForTxOptions, EventFilter, WaitForEventOptions }
export type { BroadcastResult, BroadcastResultWithWait, SignBroadcastOptions }
export { WebSocketSession }

/** Factory that creates enrichers for a specific chain's VM capabilities. */
export type EnricherFactory = (
  client: Record<string, unknown>,
  abis: AbiRegistry
) => MessageEnricher[]

// =============================================================================
// Token Resolver
// =============================================================================

/**
 * Signature for a function that resolves a token identifier to a TokenContract.
 * Injected into ChainContext to decouple chain-context from specific VM token implementations.
 */
export type TokenResolver = (
  client: unknown,
  chainType: ChainType,
  token: string,
  sender?: string
) => TokenContract

// =============================================================================
// Options Types
// =============================================================================

/**
 * Options for creating a ChainContext.
 */
export interface ChainContextOptions {
  /** Signer for signing transactions (optional) */
  signer?: DirectSigner | AminoSigner
  /** Address to track (optional, derived from signer if not provided) */
  address?: string
  /** Custom transport (optional, overrides internal transport creation) */
  transport?: Transport
  /** Context-level auth config (injected into every gRPC request) */
  auth?: AuthConfig
  /** Context-level custom headers (injected into every gRPC request) */
  headers?: Record<string, string>
  /** Default timeout for gRPC calls in milliseconds (used when creating transport internally) */
  timeoutMs?: number
  /** Interceptors for gRPC calls (used when creating transport internally) */
  interceptors?: Interceptor[]
  /** Default EVM contract transport for createEvmContract (default: 'grpc'). */
  evmTransport?: 'grpc' | 'jsonrpc'
}

/**
 * Options for signing operations.
 * Allows providing a one-time signer override.
 */
export interface SignOptions extends TxOptions {
  /** One-time signer override for this signing operation */
  signer?: DirectSigner | AminoSigner
  /** Query this address's account instead of the signer's address */
  address?: string
  /** Skip account query and use this account number directly */
  accountNumber?: Numeric
  /** Skip account query and use this sequence directly */
  sequence?: Numeric
}

/**
 * Options for getBalance query.
 */
export interface GetBalanceOptions {
  /** Address to query (uses context address if not provided) */
  address?: string
  /** Specific denom to query (omit for all balances) */
  denom?: string
  /** Block height for historical query */
  height?: Numeric
  /** Bypass cache for fresh data */
  skipCache?: boolean
}

/**
 * Options for getAccount query.
 */
export interface GetAccountOptions {
  /** Address to query (uses context address if not provided) */
  address?: string
  /** Block height for historical query */
  height?: Numeric
}

/**
 * Options for getTokenInfo query.
 */
export interface GetTokenInfoOptions {
  /** Token identifier (contract address or metadata address) */
  token: string
  /** Block height for historical query */
  height?: Numeric
}

/**
 * Error thrown when signing is attempted without a signer.
 */
export class NoSignerError extends Error {
  constructor() {
    super(
      'Cannot sign: no signer provided.\n' +
        'Create context with signer: createInitiaContext({ network, signer }) or createChainContext(chainInfo, { signer })\n' +
        'Or provide signer per-operation: ctx.sign(tx, { signer })'
    )
    this.name = 'NoSignerError'
  }
}

// =============================================================================
// ChainContext Interface
// =============================================================================

/**
 * Context for interacting with a specific chain.
 *
 * Created via typed factories (`createInitiaContext`, `createMinievmContext`, etc.)
 * or the generic `createChainContext(chainInfo, options?)`.
 *
 * Supports three modes:
 * - **Query-only**: No signer, no address — direct gRPC queries via `ctx.client`
 * - **Watch-only**: Address set but no signer — query + track balances/account for an address
 * - **Full signing**: Signer set — query + sign + broadcast transactions
 */
interface BaseChainContext<
  T extends ChainType = ChainType,
  // eslint-disable-next-line @typescript-eslint/no-empty-object-type
  TExt extends Record<string, ModuleInput> = {},
> {
  /** Chain identifier */
  readonly chainId: string

  /** Chain type (initia, minimove, miniwasm, minievm, other) */
  readonly chainType: T

  /** Network type (mainnet, testnet, local) */
  readonly network: NetworkType

  /** Full chain info */
  readonly chainInfo: ChainInfo

  /** Account address on this chain (undefined if no signer or address set) */
  readonly address: string | undefined

  /** Signer (undefined if query-only or watch-only) */
  readonly signer: DirectSigner | AminoSigner | undefined

  /** Whether this context can sign transactions (has signer) */
  readonly canSign: boolean

  /** Whether this context supports EIP-191 personal signing */
  readonly canSignEIP191: boolean

  /** gRPC client for this chain (with cache management) */
  readonly client: ClientFor<T> & ExtendedClient<TExt> & CachedClient

  /** Message builders for this chain type */
  readonly msgs: MsgsForChain<T> & ExtendedMsgs<TExt>

  /** CometBFT HTTP RPC client for endpoints not available via gRPC */
  readonly rpc: RpcClient

  /**
   * Create a new context with an external signer.
   * Reuses the existing client (including auth/headers).
   *
   * @param signer - External signer for signing transactions
   */
  withSigner(signer: DirectSigner | AminoSigner): ChainContext<T, TExt>

  /**
   * Create a new context tracking a specific address (watch-only).
   * Reuses the existing client (including auth/headers).
   *
   * @param address - Address to track
   */
  forAddress(address: string): ChainContext<T, TExt>

  /**
   * Get account information from chain.
   *
   * @param options - Query options (address, height)
   * @throws Error if no address available
   */
  getAccount(options?: GetAccountOptions): Promise<AccountInfo>

  /**
   * Get balance(s) for an account.
   *
   * @param options - Query options (address, denom, height, skipCache)
   * @throws Error if no address available
   *
   * @example
   * ```typescript
   * await ctx.getBalance()                                        // all balances
   * await ctx.getBalance({ denom: 'uinit' })                     // specific denom
   * await ctx.getBalance({ denom: 'uinit', height: 1000000n })   // historical
   * await ctx.getBalance({ address: 'init1...' })                 // other address
   * ```
   */
  getBalance(options?: GetBalanceOptions): Promise<Coin[]>

  /**
   * Estimate gas for messages.
   *
   * @param msgs - Messages to estimate gas for
   * @param options - Estimation options (multiplier, gasPrice, signer address)
   */
  estimateGas(
    msgs: MsgInput[],
    options?: EstimateOptions & { signer?: DirectSigner | AminoSigner }
  ): Promise<GasEstimate>

  /**
   * Sign and broadcast messages in one call.
   * Fetches account info automatically.
   *
   * @param msgs - Messages to include in transaction
   * @param options - Transaction options (fee, gasLimit, memo, signer, waitForConfirmation)
   * @throws NoSignerError if no signer is available
   */
  signAndBroadcast(
    msgs: MsgInput[],
    options: SignBroadcastOptions & {
      signer?: DirectSigner | AminoSigner
      waitForConfirmation: true | WaitForTxOptions
    }
  ): Promise<TxResult>
  signAndBroadcast(
    msgs: MsgInput[],
    options?: SignBroadcastOptions & { signer?: DirectSigner | AminoSigner }
  ): Promise<BroadcastResultWithWait>

  /**
   * Reset the locally tracked sequence counter.
   * Forces the next createTx to use the on-chain sequence.
   * Useful after a failed broadcast or when switching signers.
   */
  resetSequence(): void

  /**
   * Create an unsigned transaction.
   * Fetches account info automatically.
   */
  createTx(msgs: MsgInput[], options?: SignOptions): Promise<UnsignedTx>

  /**
   * Sign an unsigned transaction.
   */
  sign(tx: UnsignedTx, options?: { signer?: DirectSigner | AminoSigner }): Promise<SignedTx>

  /**
   * Broadcast a signed transaction.
   */
  broadcast(signedTx: SignedTx): Promise<BroadcastResult>

  /**
   * Wait for a transaction to be included in a block.
   */
  waitForTx(txHash: string, options?: WaitForTxOptions): Promise<TxResult>

  /**
   * Wait for transactions containing events that match the filter criteria.
   */
  waitForEvent(
    filter: EventFilter,
    options?: Omit<WaitForEventOptions, 'chainInfo'>
  ): Promise<TxResult[]>

  // ============= WebSocket Subscriptions =============

  hasWebSocket(): boolean
  hasEvmWebSocket(): boolean
  createWebSocketSession(): WebSocketSession
  subscribeToBlocks(callback: (block: unknown) => void): Promise<Subscription>
  subscribeToTxs(query: string, callback: (tx: unknown) => void): Promise<Subscription>
  subscribeToEvmLogs(
    filter: { address?: string; topics?: string[] },
    callback: (log: unknown) => void
  ): Promise<Subscription>

  // ============= Usernames =============

  readonly usernames: UsernameService

  // ============= ABI Registry =============

  /**
   * ABI registry for VM-aware tx decoding. Call `set(key, abi)` to register.
   * Shared by reference across `withSigner()`/`forAddress()` — mutations
   * on a derived context are visible to the parent and vice versa.
   */
  readonly abis: AbiRegistryFor<T>

  /**
   * Decode a transaction with VM-aware arg enrichment.
   *
   * **Note**: `createChainContext()` (generic factory) provides protobuf decode only —
   * no VM enrichment (functionName, args, contractMsg will be undefined).
   * Use typed factories (`createInitiaContext`, `createMinievmContext`, etc.)
   * for full VM-aware arg decoding.
   */
  getTx(hash: string, options?: GetTxOptionsFor<T>): Promise<DecodedTx>

  // ============= Token Utilities =============

  /**
   * Get token metadata (name, symbol, decimals).
   *
   * @param options - Token identifier and optional height
   *
   * @example
   * ```typescript
   * await ctx.getTokenInfo({ token: '0x1234...' })
   * await ctx.getTokenInfo({ token: 'uinit', height: 100n })
   * ```
   */
  getTokenInfo(options: GetTokenInfoOptions): Promise<TokenInfo>

  /**
   * Get a VM-agnostic token contract interface.
   */
  getTokenContract(token: string): TokenContract
}

// =============================================================================
// Chain-Type-Specific Extensions
// =============================================================================

/**
 * Map of chain-type-specific extensions.
 *
 * Only minievm adds `evmRpc` — other chain types have no extensions.
 * This is intersected with BaseChainContext to form the final ChainContext type,
 * so the extra properties only appear when T is narrowed to 'minievm'.
 */
interface ChainContextExtrasMap {
  initia: Record<never, never>
  minievm: { readonly evmRpc: EvmRpcClient; readonly evmTransport: 'grpc' | 'jsonrpc' | undefined }
  miniwasm: Record<never, never>
  minimove: Record<never, never>
  other: Record<never, never>
}

/**
 * Context for interacting with a specific chain.
 *
 * When T is narrowed (e.g., `ChainContext<'minievm'>`), chain-specific
 * extensions like `evmRpc` become available in autocomplete.
 *
 * @example
 * ```typescript
 * // Generic — evmRpc not visible
 * const ctx = createChainContext(chainInfo)
 *
 * // Narrowed — evmRpc available
 * const ctx = createMinievmContext(chainInfo)
 * ctx.evmRpc.getBalance('0x...')   // OK, no '?' needed
 * ctx.client.evm.call(...)         // OK, evm service autocompletes
 * ```
 */
export type ChainContext<
  T extends ChainType = ChainType,
  // eslint-disable-next-line @typescript-eslint/no-empty-object-type
  TExt extends Record<string, ModuleInput> = {},
> = BaseChainContext<T, TExt> & ChainContextExtrasMap[T]

// ============================================================================
// Helper: extract QueryOptions from method options
// ============================================================================

function pickQueryOptions(options?: {
  height?: Numeric
  skipCache?: boolean
}): { height: bigint; skipCache?: boolean } | { skipCache: boolean } | undefined {
  if (options?.height !== undefined) {
    return { height: BigInt(options.height), skipCache: options.skipCache }
  }
  if (options?.skipCache) {
    return { skipCache: options.skipCache }
  }
  return undefined
}

// ============================================================================
// ChainContext Implementation
// ============================================================================

/** State preserved across withSigner()/forAddress() derivations. */
interface ContextCarryover {
  evmTransport?: 'grpc' | 'jsonrpc'
  tokenResolver?: TokenResolver
  rpcOptions: {
    auth?: AuthConfig
    headers?: Record<string, string>
    timeoutMs?: number
  }
  evmRpc?: EvmRpcClient
  rpc?: RpcClient
  abis?: AbiRegistry
  enricherFactory?: EnricherFactory
}

class ChainContextImpl<
  T extends ChainType,
  // eslint-disable-next-line @typescript-eslint/no-empty-object-type
  TExt extends Record<string, ModuleInput> = {},
> implements BaseChainContext<T, TExt> {
  readonly client: ClientFor<T> & ExtendedClient<TExt> & CachedClient
  readonly msgs: MsgsForChain<T> & ExtendedMsgs<TExt>
  readonly abis: AbiRegistryFor<T>
  private readonly _signer: DirectSigner | AminoSigner | undefined
  readonly chainInfo: ChainInfo
  readonly usernames: UsernameService
  private _address: string | undefined
  private _nextSequence: bigint | undefined
  private _evmRpc: EvmRpcClient | undefined
  private readonly _evmTransport: 'grpc' | 'jsonrpc' | undefined
  private _rpc: RpcClient | undefined
  private readonly _tokenResolver: TokenResolver | undefined
  private readonly _enricherFactory: EnricherFactory | undefined
  private readonly _enrichers: MessageEnricher[]
  private readonly _rpcOptions: {
    auth?: AuthConfig
    headers?: Record<string, string>
    timeoutMs?: number
  }

  constructor(
    chainInfo: ChainInfo,
    client: ClientFor<T> & ExtendedClient<TExt> & CachedClient,
    msgs: MsgsForChain<T> & ExtendedMsgs<TExt>,
    options?: {
      signer?: DirectSigner | AminoSigner
      address?: string
    } & Partial<ContextCarryover>
  ) {
    this.chainInfo = chainInfo
    this.client = client
    this.msgs = msgs
    this._signer = options?.signer

    this._address = options?.address

    this._evmTransport = options?.evmTransport
    this._tokenResolver = options?.tokenResolver
    this._enricherFactory = options?.enricherFactory
    this._rpcOptions = options?.rpcOptions ?? {}
    if (options?.evmRpc) this._evmRpc = options.evmRpc
    if (options?.rpc) this._rpc = options.rpc

    // ABI registry: reuse from carryover (shared by reference) or create new
    this.abis = (options?.abis ??
      (options?.enricherFactory
        ? createAbiRegistry()
        : createNoopAbiRegistry())) as AbiRegistryFor<T>
    this._enrichers = options?.enricherFactory ? options.enricherFactory(client, this.abis) : []

    // Usernames: real service for Initia L1 mainnet/testnet, stub for others
    this.usernames =
      chainInfo.chainType === 'initia' && isUsernameServiceSupported(chainInfo.network)
        ? createUsernameService({ network: chainInfo.network })
        : createUnsupportedUsernameService()
  }

  get signer(): DirectSigner | AminoSigner | undefined {
    return this._signer
  }

  get chainId(): string {
    return this.chainInfo.chainId
  }

  get chainType(): T {
    return this.chainInfo.chainType as T
  }

  get network(): NetworkType {
    return this.chainInfo.network
  }

  get address(): string | undefined {
    return this._address
  }

  get canSign(): boolean {
    return this._signer !== undefined
  }

  get canSignEIP191(): boolean {
    return isEIP191Signer(this._signer)
  }

  /**
   * EVM JSON-RPC client (lazy-initialized).
   * Only available for minievm chains with evmRpc endpoint.
   * Hidden from autocomplete unless T is narrowed to 'minievm'.
   */
  get evmRpc(): EvmRpcClient {
    if (this._evmRpc) return this._evmRpc
    if (!this.chainInfo.evmRpc) {
      throw new Error(
        `EVM RPC not available for chain "${this.chainInfo.chainId}".\n` +
          'This is only available for minievm chains with a JSON-RPC endpoint.'
      )
    }
    this._evmRpc = new EvmRpcClient(this.chainInfo.evmRpc, {
      auth: this._rpcOptions.auth,
      headers: this._rpcOptions.headers,
      timeoutMs: this._rpcOptions.timeoutMs,
    })
    return this._evmRpc
  }

  /**
   * Default EVM contract transport preference.
   * When 'jsonrpc', createEvmContract uses JSON-RPC instead of gRPC.
   */
  get evmTransport(): 'grpc' | 'jsonrpc' | undefined {
    return this._evmTransport
  }

  /**
   * CometBFT HTTP RPC client (lazy-initialized).
   * Provides access to block_results, tx with index, txSearch, etc.
   */
  get rpc(): RpcClient {
    if (this._rpc) return this._rpc
    if (!this.chainInfo.rpc) {
      throw new Error(
        `RPC not available for chain "${this.chainInfo.chainId}".\n` +
          'Provide an RPC endpoint in chain configuration.'
      )
    }
    this._rpc = new RpcClient(this.chainInfo.rpc, {
      auth: this._rpcOptions.auth,
      headers: this._rpcOptions.headers,
      timeoutMs: this._rpcOptions.timeoutMs,
    })
    return this._rpc
  }

  private async getSignerAddress(signerOverride?: DirectSigner | AminoSigner): Promise<string> {
    const signer = signerOverride ?? this._signer
    if (!signer) throw new NoSignerError()

    const prefix = this.chainInfo.bech32Prefix ?? 'init'

    // Override signer: always resolve fresh (different key = different address)
    if (signerOverride) {
      return signer.getAddress(prefix)
    }

    // Default signer: lazy cache
    if (!this._address) {
      this._address = await signer.getAddress(prefix)
    }
    return this._address
  }

  private async requireAddress(addressOverride?: string): Promise<string> {
    if (addressOverride) return addressOverride
    if (this._address) return this._address

    // Lazy resolution from signer (works for both Key and external signers)
    if (this._signer) {
      const prefix = this.chainInfo.bech32Prefix ?? 'init'
      this._address = await this._signer.getAddress(prefix)
      return this._address
    }

    throw new Error(
      'No address available. Either create context with signer/address or provide address parameter.'
    )
  }

  withSigner(signer: DirectSigner | AminoSigner): ChainContext<T, TExt> {
    return new ChainContextImpl<T, TExt>(this.chainInfo, this.client, this.msgs, {
      signer,
      ...this.carryover(),
    }) as ChainContext<T, TExt>
  }

  forAddress(address: string): ChainContext<T, TExt> {
    return new ChainContextImpl<T, TExt>(this.chainInfo, this.client, this.msgs, {
      address,
      ...this.carryover(),
    }) as ChainContext<T, TExt>
  }

  /** Collect state to preserve across withSigner()/forAddress(). */
  private carryover(): ContextCarryover {
    return {
      evmTransport: this._evmTransport,
      tokenResolver: this._tokenResolver,
      rpcOptions: this._rpcOptions,
      evmRpc: this._evmRpc,
      rpc: this._rpc,
      abis: this.abis,
      enricherFactory: this._enricherFactory,
    }
  }

  async getAccount(options?: GetAccountOptions): Promise<AccountInfo> {
    const addr = await this.requireAddress(options?.address)
    return getAccount(
      this.client,
      addr,
      options?.height !== undefined ? { height: options.height } : undefined
    )
  }

  async getBalance(options?: GetBalanceOptions): Promise<Coin[]> {
    const { Coin } = await import('../core/coin')
    const addr = await this.requireAddress(options?.address)
    const queryOptions = pickQueryOptions(options)

    if (options?.denom) {
      const response = await this.client.bank.balance(
        { address: addr, denom: options.denom },
        queryOptions
      )
      if (!response.balance) {
        return []
      }
      return [new Coin(response.balance.denom, response.balance.amount)]
    }

    const response = await this.client.bank.allBalances({ address: addr }, queryOptions)
    return response.balances.map(b => new Coin(b.denom, b.amount))
  }

  resetSequence(): void {
    this._nextSequence = undefined
  }

  async estimateGas(
    msgs: MsgInput[],
    options?: EstimateOptions & { signer?: DirectSigner | AminoSigner }
  ): Promise<GasEstimate> {
    const addr = await this.getSignerAddress(options?.signer)
    return estimateGasInternal(this.client, msgs, addr, options)
  }

  async createTx(msgs: MsgInput[], options?: SignOptions): Promise<UnsignedTx> {
    let accountNumber: bigint
    let sequence: bigint

    const hasAccount = options?.accountNumber !== undefined
    const hasSequence = options?.sequence !== undefined
    if (hasAccount !== hasSequence) {
      throw new Error('Both accountNumber and sequence must be provided together, or neither')
    }

    if (hasAccount && hasSequence) {
      // Manual: skip account query, use provided values directly
      accountNumber = BigInt(options.accountNumber!)
      sequence = BigInt(options.sequence!)
    } else {
      // Auto: query account by address (options.address overrides signer address)
      const address = options?.address ?? (await this.getSignerAddress(options?.signer))
      const account = await getAccount(this.client, address)
      accountNumber = account.number
      // Use the higher of chain sequence vs locally tracked sequence.
      // Prevents sequence mismatch when the node hasn't indexed a recent TX yet.
      sequence =
        this._nextSequence !== undefined && this._nextSequence > account.sequence
          ? this._nextSequence
          : account.sequence
    }

    const normalizedMsgs = msgs.map(m => normalizeMsg(m))

    return new UnsignedTx({
      msgs: normalizedMsgs,
      signMode: options?.signMode ?? this.defaultSignMode(options?.signer),
      chainId: this.chainId,
      accountNumber,
      sequence,
      fee: options?.fee ?? [],
      gasLimit: BigInt(options?.gasLimit ?? DEFAULT_GAS_LIMIT),
      memo: options?.memo ?? '',
    })
  }

  /**
   * Auto-determine signMode based on signer capabilities.
   * preferredSignMode hint → AminoSigner-only → 'amino' → 'direct'
   */
  private defaultSignMode(signerOverride?: DirectSigner | AminoSigner): SignModeType {
    const s = signerOverride ?? this._signer
    if (s?.preferredSignMode) return s.preferredSignMode
    if (s && isAminoSigner(s) && !isDirectSigner(s)) return 'amino'
    return 'direct'
  }

  async sign(tx: UnsignedTx, options?: { signer?: DirectSigner | AminoSigner }): Promise<SignedTx> {
    const signer = options?.signer ?? this._signer
    if (!signer) throw new NoSignerError()

    const prefix = this.chainInfo.bech32Prefix ?? 'init'
    const address = this._address ?? (await signer.getAddress(prefix))
    const pubKey = await signer.getPublicKey()
    const algorithm =
      signer.algorithm === 'eth_secp256k1' ? ('ethsecp256k1' as const) : ('secp256k1' as const)

    switch (tx.signMode) {
      case 'direct':
        return this.signDirect(tx, signer, address, pubKey, algorithm)
      case 'amino':
        return this.signWithAmino(tx, signer, address, pubKey, algorithm)
      case 'eip191':
        return this.signWithEIP191(tx, signer, pubKey, algorithm)
    }
  }

  // ============= Unified Signing Paths =============

  private async signDirect(
    tx: UnsignedTx,
    signer: DirectSigner | AminoSigner,
    address: string,
    pubKey: Uint8Array,
    algorithm: 'ethsecp256k1' | 'secp256k1'
  ): Promise<SignedTx> {
    if (!isDirectSigner(signer)) {
      throw new Error(
        'Signer does not support direct signing. Use a signer that implements DirectSigner, ' +
          'or set signMode to "amino".'
      )
    }
    const { bodyBytes, authInfoBytes } = encodeTxDirect(tx, pubKey, algorithm)
    const signDoc: DirectSignDoc = {
      bodyBytes,
      authInfoBytes,
      chainId: tx.chainId,
      accountNumber: tx.accountNumber,
    }
    const response = await signer.signDirect(address, signDoc)

    const txRaw = create(TxRawSchema, {
      bodyBytes: response.signed.bodyBytes,
      authInfoBytes: response.signed.authInfoBytes,
      signatures: [response.signature.signature],
    })
    return { txBytes: toBinary(TxRawSchema, txRaw) }
  }

  private async signWithAmino(
    tx: UnsignedTx,
    signer: DirectSigner | AminoSigner,
    address: string,
    pubKey: Uint8Array,
    algorithm: 'ethsecp256k1' | 'secp256k1'
  ): Promise<SignedTx> {
    if (!isAminoSigner(signer)) {
      throw new Error(
        'Signer does not support amino signing. Use a signer that implements AminoSigner.'
      )
    }
    const aminoMsgs = tx.msgs.map(m => m.toAmino())
    const aminoSignDoc: AminoSignDoc = {
      chain_id: tx.chainId,
      account_number: tx.accountNumber.toString(),
      sequence: tx.sequence.toString(),
      fee: buildStdFee(tx),
      msgs: aminoMsgs,
      memo: tx.memo,
    }

    const response = await signer.signAmino(address, aminoSignDoc)
    const signed = response.signed

    // bodyBytes: from original proto msgs (not affected by amino signing)
    const txBody = create(TxBodySchema, {
      messages: tx.msgs.map(m => m.toAny()),
      memo: signed.memo,
      timeoutHeight: 0n,
      extensionOptions: [],
      nonCriticalExtensionOptions: [],
    })
    const bodyBytes = toBinary(TxBodySchema, txBody)

    // authInfoBytes: from signed fee (signer may have modified fee)
    const pubKeyAny = packPubKey(pubKey, algorithm)
    const signerInfo = create(SignerInfoSchema, {
      publicKey: pubKeyAny,
      modeInfo: create(ModeInfoSchema, {
        sum: { case: 'single', value: { mode: SignMode.LEGACY_AMINO_JSON } },
      }),
      sequence: BigInt(signed.sequence),
    })
    const fee = create(FeeSchema, {
      amount: signed.fee.amount.map(c => ({ denom: c.denom, amount: c.amount })),
      gasLimit: BigInt(signed.fee.gas),
      payer: signed.fee.payer ?? '',
      granter: signed.fee.granter ?? '',
    })
    const authInfo = create(AuthInfoSchema, {
      signerInfos: [signerInfo],
      fee,
      tip: undefined,
    })
    const authInfoBytes = toBinary(AuthInfoSchema, authInfo)

    const signatureBytes = base64.decode(response.signature.signature)
    const txRaw = create(TxRawSchema, { bodyBytes, authInfoBytes, signatures: [signatureBytes] })
    return { txBytes: toBinary(TxRawSchema, txRaw) }
  }

  private async signWithEIP191(
    tx: UnsignedTx,
    signer: DirectSigner | AminoSigner,
    pubKey: Uint8Array,
    algorithm: 'ethsecp256k1' | 'secp256k1'
  ): Promise<SignedTx> {
    if (!isEIP191Signer(signer)) {
      throw new Error(
        'Signer does not support EIP-191 signing. Use a signer that implements signPersonal().'
      )
    }

    const aminoMsgs = tx.msgs.map(m => m.toAmino())
    const stdSignDoc = makeStdSignDoc(
      aminoMsgs,
      buildStdFee(tx),
      tx.chainId,
      tx.memo,
      tx.accountNumber,
      tx.sequence
    )
    const aminoBytes = makeAminoSignBytes(stdSignDoc)
    const signature = await (signer as EIP191Signer).signPersonal(aminoBytes)

    // TxRaw: encodeTxDirect for bodyBytes/authInfoBytes + raw signature
    const { bodyBytes, authInfoBytes } = encodeTxDirect(tx, pubKey, algorithm)
    const txRaw = create(TxRawSchema, { bodyBytes, authInfoBytes, signatures: [signature] })
    return { txBytes: toBinary(TxRawSchema, txRaw) }
  }

  async broadcast(signedTx: SignedTx): Promise<BroadcastResult> {
    return broadcast(this.client, signedTx)
  }

  async waitForTx(txHash: string, options?: WaitForTxOptions): Promise<TxResult> {
    return waitForTxInternal(this.client, txHash, {
      ...options,
      chainInfo: this.chainInfo,
    })
  }

  async waitForEvent(
    filter: EventFilter,
    options?: Omit<WaitForEventOptions, 'chainInfo'>
  ): Promise<TxResult[]> {
    return waitForEventInternal(this.client as TxSearchClient, filter, {
      ...options,
      chainInfo: this.chainInfo,
    })
  }

  // Overload signatures
  signAndBroadcast(
    msgs: MsgInput[],
    options: SignBroadcastOptions & {
      signer?: DirectSigner | AminoSigner
      waitForConfirmation: true | WaitForTxOptions
    }
  ): Promise<TxResult>
  signAndBroadcast(
    msgs: MsgInput[],
    options?: SignBroadcastOptions & { signer?: DirectSigner | AminoSigner }
  ): Promise<BroadcastResultWithWait>
  // Implementation
  async signAndBroadcast(
    msgs: MsgInput[],
    options?: SignBroadcastOptions & { signer?: DirectSigner | AminoSigner }
  ): Promise<BroadcastResultWithWait | TxResult> {
    // Auto-estimate gas when no fee is provided
    let txOptions = options
    if (!options?.fee || options.fee.length === 0) {
      const estimate = await this.estimateGas(msgs, {
        gasPrice: options?.gasPrice ?? this.chainInfo.gasPrice,
        multiplier: options?.gasMultiplier,
        signer: options?.signer,
      })
      txOptions = {
        ...options,
        fee: estimate.fee.map(c => c.toProto()),
        gasLimit: options?.gasLimit ?? estimate.gasLimit,
      }
    }

    const tx = await this.createTx(msgs, txOptions)
    const signedTx = await this.sign(tx, txOptions)
    const broadcastResult = await broadcast(this.client, signedTx)

    // TX accepted into mempool — advance local sequence to prevent mismatch
    // on consecutive broadcasts before the node indexes the previous TX.
    this._nextSequence = tx.sequence + 1n

    if (options?.waitForConfirmation) {
      const waitOptions = options.waitForConfirmation === true ? {} : options.waitForConfirmation
      return this.waitForTx(broadcastResult.txHash, waitOptions)
    }

    return createBroadcastResultWithWait(broadcastResult, (txHash, waitOpts) =>
      this.waitForTx(txHash, waitOpts)
    )
  }

  // ============= WebSocket Subscriptions =============

  hasWebSocket(): boolean {
    return hasWebSocketEndpoint(this.chainInfo, 'cosmos')
  }

  hasEvmWebSocket(): boolean {
    return hasWebSocketEndpoint(this.chainInfo, 'evm')
  }

  createWebSocketSession(): WebSocketSession {
    return createSession(this.chainInfo)
  }

  subscribeToBlocks(callback: (block: unknown) => void): Promise<Subscription> {
    return subscribe(this.chainInfo, { event: 'block' }, callback)
  }

  subscribeToTxs(query: string, callback: (tx: unknown) => void): Promise<Subscription> {
    return subscribe(this.chainInfo, { event: 'tx', filter: query }, callback)
  }

  subscribeToEvmLogs(
    filter: { address?: string; topics?: string[] },
    callback: (log: unknown) => void
  ): Promise<Subscription> {
    return subscribe(this.chainInfo, { event: 'evmLogs', filter }, callback)
  }

  // ============= Token Utilities =============

  async getTokenInfo(options: GetTokenInfoOptions): Promise<TokenInfo> {
    const contract = this.getTokenContract(options.token)
    return contract.getInfo()
  }

  async getTx(hash: string, options?: GetTxOptionsFor<T>): Promise<DecodedTx> {
    return getTx(this.client, packed => this.msgs.decode(packed), hash, this._enrichers, options)
  }

  getTokenContract(token: string): TokenContract {
    if (!this._tokenResolver) {
      throw new Error(
        'Token resolver not configured. ' +
          'Use a typed factory (createInitiaContext, createMinievmContext, etc.) or pass tokenResolver to buildChainContextFactory.'
      )
    }
    return this._tokenResolver(this.client, this.chainInfo.chainType, token, this._address)
  }
}

// ============================================================================
// Factory
// ============================================================================

/**
 * Build a platform-specific `createChainContext` function.
 *
 * This is an internal factory that injects the transport creator
 * (Node.js gRPC or browser gRPC-web) so that `chain-context.ts`
 * remains platform-agnostic.
 *
 * End users should prefer typed factories (`createInitiaContext`, etc.)
 * built via {@link buildTypedFactory}, which wrap this function with
 * chain-specific services, messages, and provider auto-creation.
 *
 * @param createTransport - Platform-specific transport creator
 * @returns `createChainContext` function
 *
 * @see buildTypedFactory — Builds the user-facing typed factories
 */
export function buildChainContextFactory(
  createTransport: (chainInfo: ChainInfo, options?: TransportOptions) => Transport,
  getServices: (chainInfo: ChainInfo) => Record<string, DescService>,
  getMsgs: (chainType: ChainType) => MsgsForChain<ChainType>,
  factoryOptions?: {
    tokenResolver?: TokenResolver
    enricherFactory?: EnricherFactory
    getTypeRegistry?: (chainInfo: ChainInfo) => Registry
  }
) {
  return function createChainContext<T extends ChainType>(
    chainInfo: ChainInfo & { chainType: T },
    options?: ChainContextOptions
  ): ChainContext<T> {
    // Validate auth + headers conflict at context level
    if (options?.auth && options?.headers) {
      validateHeaderConflict(options.auth, options.headers, 'context')
    }

    // Create transport (or use provided)
    const transport =
      options?.transport ??
      createTransport(chainInfo, {
        timeoutMs: options?.timeoutMs,
        interceptors: options?.interceptors,
      })

    // Create client from injected services
    // Cast through unknown: createGrpcClient returns ServiceClients<Record<string, DescService>>
    // which is structurally correct but too wide for TypeScript to narrow automatically.
    const services = getServices(chainInfo)
    const typeRegistry = factoryOptions?.getTypeRegistry?.(chainInfo)
    const rawClient = createGrpcClient(
      transport,
      services,
      options?.auth,
      options?.headers,
      typeRegistry
    ) as unknown as Client
    const client = wrapClientWithCache(rawClient, chainInfo.chainId) as unknown as ClientFor<T> &
      CachedClient

    // Create message builders from injected resolver
    const msgs = getMsgs(chainInfo.chainType) as MsgsForChain<T>

    return new ChainContextImpl<T>(chainInfo, client, msgs, {
      signer: options?.signer,
      address: options?.address,
      evmTransport: options?.evmTransport,
      tokenResolver: factoryOptions?.tokenResolver,
      enricherFactory: factoryOptions?.enricherFactory,
      rpcOptions: {
        auth: options?.auth,
        headers: options?.headers,
        timeoutMs: options?.timeoutMs,
      },
    }) as ChainContext<T>
  }
}
