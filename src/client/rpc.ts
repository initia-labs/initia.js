/**
 * CometBFT HTTP RPC Client
 *
 * Provides HTTP-based RPC methods for CometBFT endpoints not available via gRPC.
 * Primary use case: block_results (finalize_block_events, validator_updates).
 */

import { httpRequest, type HttpClientConfig } from './http-client'
import { validateHeaderConflict } from './headers'
import type { AuthConfig, HttpRequestOptions } from './types'

// =============================================================================
// Types
// =============================================================================

/** ABCI event attribute */
export interface AbciEventAttribute {
  key: string
  value: string
  index: boolean
}

/** ABCI event */
export interface AbciEvent {
  type: string
  attributes: AbciEventAttribute[]
}

/** Transaction execution result from CometBFT */
export interface ExecTxResult {
  code: number
  data: string
  log: string
  info: string
  gas_wanted: string
  gas_used: string
  events: AbciEvent[]
  codespace: string
}

/** /block_results response */
export interface BlockResultsResponse {
  height: string
  txs_results: ExecTxResult[] | null
  finalize_block_events: AbciEvent[] | null
  validator_updates: ValidatorUpdate[] | null
  consensus_param_updates: ConsensusParams | null
  app_hash: string
}

/** Validator update info */
export interface ValidatorUpdate {
  pub_key: { type: string; value: string }
  power: string
}

/** Consensus parameters */
export interface ConsensusParams {
  block?: { max_bytes?: string; max_gas?: string }
  evidence?: { max_age_num_blocks?: string; max_age_duration?: string; max_bytes?: string }
  validator?: { pub_key_types?: string[] }
  version?: Record<string, unknown>
  abci?: { vote_extensions_enable_height?: string }
}

/** /tx response */
export interface RpcTxResponse {
  hash: string
  height: string
  index: number
  tx_result: ExecTxResult
  tx: string
}

/** /block response */
export interface RpcBlockResponse {
  block_id: { hash: string; parts: { total: number; hash: string } }
  block: {
    header: {
      version: { block: string; app?: string }
      chain_id: string
      height: string
      time: string
      last_block_id: { hash: string; parts: { total: number; hash: string } }
      last_commit_hash: string
      data_hash: string
      validators_hash: string
      next_validators_hash: string
      consensus_hash: string
      app_hash: string
      last_results_hash: string
      evidence_hash: string
      proposer_address: string
    }
    data: { txs: string[] | null }
    evidence: { evidence: unknown[] }
    last_commit: {
      height: string
      round: number
      block_id: { hash: string; parts: { total: number; hash: string } }
      signatures: Array<{
        block_id_flag: number
        validator_address: string
        timestamp: string
        signature: string
      }>
    }
  }
}

/** /status response */
export interface RpcStatusResponse {
  node_info: {
    protocol_version?: { p2p?: string; block?: string; app?: string }
    id?: string
    listen_addr?: string
    network: string
    version?: string
    channels?: string
    moniker?: string
    other?: Record<string, string>
  }
  sync_info: {
    latest_block_hash: string
    latest_app_hash: string
    latest_block_height: string
    latest_block_time: string
    earliest_block_hash?: string
    earliest_app_hash?: string
    earliest_block_height?: string
    earliest_block_time?: string
    catching_up: boolean
  }
  validator_info?: {
    address: string
    pub_key: { type: string; value: string }
    voting_power: string
  }
}

/** /tx_search response */
export interface RpcTxSearchResponse {
  txs: RpcTxResponse[]
  total_count: string
}

/** Pagination options for validators/search endpoints */
export interface PaginationOptions {
  page?: number
  perPage?: number
}

/** /tx_search pagination options */
export interface TxSearchOptions extends PaginationOptions {
  orderBy?: 'asc' | 'desc'
}

/** Client constructor options */
export interface RpcClientOptions {
  timeoutMs?: number
  headers?: Record<string, string>
  auth?: AuthConfig
}

/** /commit response */
export interface RpcCommitResponse {
  signed_header: {
    header: RpcBlockResponse['block']['header']
    commit: RpcBlockResponse['block']['last_commit']
  }
  canonical: boolean
}

/**
 * /validators response.
 * CometBFT returns max 100 validators per page (default 30).
 */
export interface RpcValidatorsResponse {
  block_height: string
  validators: Array<{
    address: string
    pub_key: { type: string; value: string }
    voting_power: string
    proposer_priority: string
  }>
  count: string
  total: string
}

/** /consensus_params response */
export interface RpcConsensusParamsResponse {
  block_height: string
  consensus_params: ConsensusParams
}

/** Block metadata used in /blockchain response */
export interface RpcBlockMeta {
  block_id: { hash: string; parts: { total: number; hash: string } }
  block_size: string
  header: RpcBlockResponse['block']['header']
  num_txs: string
}

/**
 * /blockchain response.
 * CometBFT returns max 20 block metas per call.
 * Both minHeight and maxHeight are optional (defaults to latest blocks).
 */
export interface RpcBlockchainResponse {
  last_height: string
  block_metas: RpcBlockMeta[]
}

/** /block_search response */
export interface RpcBlockSearchResponse {
  blocks: Array<{
    block_id: { hash: string; parts: { total: number; hash: string } }
    block: RpcBlockResponse['block']
  }>
  total_count: string
}

/** /unconfirmed_txs response */
export interface RpcUnconfirmedTxsResponse {
  n_txs: string
  total: string
  total_bytes: string
  txs: string[] | null
}

/** /num_unconfirmed_txs response (same shape as unconfirmed_txs in practice) */
export interface RpcNumUnconfirmedTxsResponse {
  n_txs: string
  total: string
  total_bytes: string
  txs: string[] | null
}

/** /abci_info response */
export interface RpcAbciInfoResponse {
  response: {
    data?: string
    version?: string
    app_version?: string
    last_block_height?: string
    last_block_app_hash?: string
  }
}

/** /header response (lightweight alternative to /block) */
export interface RpcHeaderResponse {
  header: RpcBlockResponse['block']['header']
}

/** /consensus_state response */
export interface RpcConsensusStateResponse {
  round_state: {
    'height/round/step': string
    start_time: string
    proposal_block_hash: string
    locked_block_hash: string
    valid_block_hash: string
    height_vote_set: Array<{
      round: number
      prevotes: string[]
      prevotes_bit_array: string
      precommits: string[]
      precommits_bit_array: string
    }>
    proposer: {
      address: string
      index: number
    }
  }
}

/**
 * /dump_consensus_state response.
 * Very verbose — top-level fields typed, deeply nested structures
 * left as Record<string, unknown> for pragmatic balance.
 */
export interface RpcDumpConsensusStateResponse {
  round_state: {
    height: string
    round: number
    step: number
    start_time: string
    commit_time: string
    locked_round: number
    valid_round: number
    commit_round: number
    triggered_timeout_precommit: boolean
    [key: string]: unknown
  }
  peers: Array<{
    node_address: string
    peer_state: Record<string, unknown>
  }>
}

/** /genesis response */
export interface RpcGenesisResponse {
  genesis: {
    genesis_time: string
    chain_id: string
    initial_height: string
    consensus_params: ConsensusParams
    validators: Array<{
      address: string
      pub_key: { type: string; value: string }
      power: string
      name?: string
    }>
    app_hash: string
    app_state: unknown
  }
}

/** /genesis_chunked response */
export interface RpcGenesisChunkedResponse {
  chunk: string
  total: string
  data: string
}

/** /net_info response */
export interface RpcNetInfoResponse {
  listening: boolean
  listeners: string[]
  n_peers: string
  peers: Array<{
    node_info: RpcStatusResponse['node_info']
    is_outbound: boolean
    connection_status: Record<string, unknown>
    remote_ip: string
  }>
}

/** /abci_query options */
export interface AbciQueryOptions {
  data?: string
  height?: number | string
  prove?: boolean
}

/** /abci_query response */
export interface RpcAbciQueryResponse {
  response: {
    code: number
    log: string
    info: string
    index: string
    key: string
    value: string
    proof_ops?: { ops: Array<{ type: string; key: string; data: string }> } | null
    height: string
    codespace: string
  }
}

// =============================================================================
// JSON-RPC envelope
// =============================================================================

interface JsonRpcEnvelope<T> {
  jsonrpc: '2.0'
  id: number
  result?: T
  error?: { code: number; message: string; data?: unknown }
}

// =============================================================================
// Client
// =============================================================================

/**
 * CometBFT HTTP RPC client.
 *
 * Provides access to CometBFT v0.38 endpoints not available via Cosmos SDK gRPC:
 *
 * **Block & Header:** `block`, `blockByHash`, `blockResults`, `header`, `headerByHash`, `blockchain`, `blockSearch`
 * **Transaction:** `tx`, `txSearch`, `unconfirmedTxs`, `numUnconfirmedTxs`
 * **Consensus:** `validators`, `commit`, `consensusParams`, `consensusState`, `dumpConsensusState`
 * **Node:** `status`, `health`, `netInfo`, `genesis`, `genesisChunked`
 * **ABCI:** `abciInfo`, `abciQuery`
 *
 * @example
 * ```typescript
 * const rpc = createRpcClient('https://rpc.initia.xyz')
 *
 * const results = await rpc.blockResults(14107946)
 * const tx = await rpc.tx('6E7457...')
 * const header = await rpc.header(14107946)
 * const healthy = await rpc.health()
 * ```
 */
export class RpcClient {
  private config: HttpClientConfig

  constructor(endpoint: string, options: RpcClientOptions = {}) {
    validateHeaderConflict(options.auth, options.headers, 'context')
    this.config = {
      endpoint,
      auth: options.auth,
      headers: options.headers,
      timeoutMs: options.timeoutMs,
    }
  }

  /**
   * Make a GET request to a CometBFT RPC endpoint.
   */
  private async get<T>(path: string, options?: HttpRequestOptions): Promise<T> {
    const response = await httpRequest(this.config, path, { method: 'GET' }, options)

    if (!response.ok) {
      const body = await response.text().catch(() => '')
      throw new Error(
        `HTTP error: ${response.status} ${response.statusText}${body ? ` — ${body}` : ''}`
      )
    }

    const json = (await response.json()) as JsonRpcEnvelope<T>

    if (json.error) {
      throw new Error(`RPC error (${json.error.code}): ${json.error.message}`)
    }

    return json.result as T
  }

  // ===========================================================================
  // Endpoints
  // ===========================================================================

  /**
   * Get ABCI results for a block, including finalize_block_events.
   *
   * This is the primary endpoint for data not available via gRPC:
   * - `finalize_block_events`: chain-level events (staking rewards, slashing, epoch)
   * - `txs_results`: per-tx execution results for the entire block
   * - `validator_updates`: validator set changes
   * - `consensus_param_updates`: consensus parameter changes
   *
   * @param height - Block height (omit for latest)
   */
  async blockResults(height?: number | string, options?: HttpRequestOptions): Promise<BlockResultsResponse> {
    const params = height !== undefined ? `?height=${height}` : ''
    return this.get<BlockResultsResponse>(`/block_results${params}`, options)
  }

  /**
   * Get transaction by hash with block index.
   *
   * Unlike gRPC GetTx, includes `index` (tx position within block).
   *
   * @param hash - Transaction hash (hex, with or without 0x prefix)
   */
  async tx(hash: string, options?: HttpRequestOptions): Promise<RpcTxResponse> {
    const normalizedHash = hash.startsWith('0x') ? hash : `0x${hash}`
    return this.get<RpcTxResponse>(`/tx?hash=${normalizedHash}`, options)
  }

  /**
   * Search transactions by TMQL event query.
   *
   * @param query - TMQL query string (e.g., "tx.height=100", "transfer.sender='init1...'")
   * @param searchOptions - Pagination options
   *
   * @example
   * ```typescript
   * // Find all txs at a specific height
   * const result = await rpc.txSearch("tx.height=14107946")
   *
   * // Find txs by event
   * const result = await rpc.txSearch("transfer.sender='init1abc...'", { perPage: 50 })
   * ```
   */
  async txSearch(
    query: string,
    searchOptions?: TxSearchOptions,
    options?: HttpRequestOptions
  ): Promise<RpcTxSearchResponse> {
    const params = new URLSearchParams()
    params.set('query', `"${query}"`)
    if (searchOptions?.page) params.set('page', String(searchOptions.page))
    if (searchOptions?.perPage) params.set('per_page', String(searchOptions.perPage))
    if (searchOptions?.orderBy) params.set('order_by', `"${searchOptions.orderBy}"`)
    return this.get<RpcTxSearchResponse>(`/tx_search?${params.toString()}`, options)
  }

  /**
   * Get block by height.
   *
   * @param height - Block height (omit for latest)
   */
  async block(height?: number | string, options?: HttpRequestOptions): Promise<RpcBlockResponse> {
    const params = height !== undefined ? `?height=${height}` : ''
    return this.get<RpcBlockResponse>(`/block${params}`, options)
  }

  /**
   * Get node status including sync info.
   */
  async status(options?: HttpRequestOptions): Promise<RpcStatusResponse> {
    return this.get<RpcStatusResponse>('/status', options)
  }

  /**
   * Check if the node is healthy.
   *
   * Returns `true` if healthy, `false` otherwise. Never throws for health status.
   */
  async health(options?: HttpRequestOptions): Promise<boolean> {
    try {
      await this.get<Record<string, never>>('/health', options)
      return true
    } catch {
      return false
    }
  }

  /**
   * Get ABCI application info.
   */
  async abciInfo(options?: HttpRequestOptions): Promise<RpcAbciInfoResponse> {
    return this.get<RpcAbciInfoResponse>('/abci_info', options)
  }

  /**
   * Get signed header (commit) at a given height.
   *
   * @param height - Block height (omit for latest)
   */
  async commit(height?: number | string, options?: HttpRequestOptions): Promise<RpcCommitResponse> {
    const params = height !== undefined ? `?height=${height}` : ''
    return this.get<RpcCommitResponse>(`/commit${params}`, options)
  }

  /**
   * Get validator set at a given height.
   *
   * CometBFT returns max 100 validators per page (default 30).
   *
   * @param height - Block height (omit for latest)
   * @param pagination - Pagination options
   */
  async validators(
    height?: number | string,
    pagination?: PaginationOptions,
    options?: HttpRequestOptions
  ): Promise<RpcValidatorsResponse> {
    const params = new URLSearchParams()
    if (height !== undefined) params.set('height', String(height))
    if (pagination?.page) params.set('page', String(pagination.page))
    if (pagination?.perPage) params.set('per_page', String(pagination.perPage))
    const qs = params.toString()
    return this.get<RpcValidatorsResponse>(`/validators${qs ? `?${qs}` : ''}`, options)
  }

  /**
   * Get consensus parameters at a given height.
   *
   * @param height - Block height (omit for latest)
   */
  async consensusParams(
    height?: number | string,
    options?: HttpRequestOptions
  ): Promise<RpcConsensusParamsResponse> {
    const params = height !== undefined ? `?height=${height}` : ''
    return this.get<RpcConsensusParamsResponse>(`/consensus_params${params}`, options)
  }

  /**
   * Get block metadata for a range of heights.
   *
   * CometBFT returns max 20 block metas per call.
   *
   * @param minHeight - Minimum block height (optional)
   * @param maxHeight - Maximum block height (optional)
   */
  async blockchain(
    minHeight?: number | string,
    maxHeight?: number | string,
    options?: HttpRequestOptions
  ): Promise<RpcBlockchainResponse> {
    const params = new URLSearchParams()
    if (minHeight !== undefined) params.set('minHeight', String(minHeight))
    if (maxHeight !== undefined) params.set('maxHeight', String(maxHeight))
    const qs = params.toString()
    return this.get<RpcBlockchainResponse>(`/blockchain${qs ? `?${qs}` : ''}`, options)
  }

  /**
   * Get block by hash.
   *
   * @param hash - Block hash (hex, with or without 0x prefix)
   */
  async blockByHash(hash: string, options?: HttpRequestOptions): Promise<RpcBlockResponse> {
    const normalizedHash = hash.startsWith('0x') ? hash : `0x${hash}`
    return this.get<RpcBlockResponse>(`/block_by_hash?hash=${normalizedHash}`, options)
  }

  /**
   * Search blocks by TMQL event query.
   *
   * @param query - TMQL query string
   * @param searchOptions - Pagination and ordering options
   */
  async blockSearch(
    query: string,
    searchOptions?: TxSearchOptions,
    options?: HttpRequestOptions
  ): Promise<RpcBlockSearchResponse> {
    const params = new URLSearchParams()
    params.set('query', `"${query}"`)
    if (searchOptions?.page) params.set('page', String(searchOptions.page))
    if (searchOptions?.perPage) params.set('per_page', String(searchOptions.perPage))
    if (searchOptions?.orderBy) params.set('order_by', `"${searchOptions.orderBy}"`)
    return this.get<RpcBlockSearchResponse>(`/block_search?${params.toString()}`, options)
  }

  /**
   * Get unconfirmed transactions from the mempool.
   *
   * @param limit - Max number of transactions to return
   */
  async unconfirmedTxs(
    limit?: number,
    options?: HttpRequestOptions
  ): Promise<RpcUnconfirmedTxsResponse> {
    const params = limit !== undefined ? `?limit=${limit}` : ''
    return this.get<RpcUnconfirmedTxsResponse>(`/unconfirmed_txs${params}`, options)
  }

  /**
   * Get number of unconfirmed transactions in the mempool.
   */
  async numUnconfirmedTxs(options?: HttpRequestOptions): Promise<RpcNumUnconfirmedTxsResponse> {
    return this.get<RpcNumUnconfirmedTxsResponse>('/num_unconfirmed_txs', options)
  }

  /**
   * Get block header by height (lightweight alternative to block()).
   *
   * @param height - Block height (omit for latest)
   */
  async header(height?: number | string, options?: HttpRequestOptions): Promise<RpcHeaderResponse> {
    const params = height !== undefined ? `?height=${height}` : ''
    return this.get<RpcHeaderResponse>(`/header${params}`, options)
  }

  /**
   * Get block header by hash.
   *
   * @param hash - Block hash (hex, with or without 0x prefix)
   */
  async headerByHash(hash: string, options?: HttpRequestOptions): Promise<RpcHeaderResponse> {
    const normalizedHash = hash.startsWith('0x') ? hash : `0x${hash}`
    return this.get<RpcHeaderResponse>(`/header_by_hash?hash=${normalizedHash}`, options)
  }

  /**
   * Get current consensus state.
   */
  async consensusState(options?: HttpRequestOptions): Promise<RpcConsensusStateResponse> {
    return this.get<RpcConsensusStateResponse>('/consensus_state', options)
  }

  /**
   * Dump full consensus state (verbose debugging).
   */
  async dumpConsensusState(options?: HttpRequestOptions): Promise<RpcDumpConsensusStateResponse> {
    return this.get<RpcDumpConsensusStateResponse>('/dump_consensus_state', options)
  }

  /**
   * Get the full genesis document.
   *
   * Can be very large — consider using genesisChunked() for large genesis files.
   */
  async genesis(options?: HttpRequestOptions): Promise<RpcGenesisResponse> {
    return this.get<RpcGenesisResponse>('/genesis', options)
  }

  /**
   * Get genesis document in chunks (16MB per chunk).
   *
   * @param chunk - 0-based chunk index
   */
  async genesisChunked(
    chunk: number,
    options?: HttpRequestOptions
  ): Promise<RpcGenesisChunkedResponse> {
    return this.get<RpcGenesisChunkedResponse>(`/genesis_chunked?chunk=${chunk}`, options)
  }

  /**
   * Get network info including connected peers.
   */
  async netInfo(options?: HttpRequestOptions): Promise<RpcNetInfoResponse> {
    return this.get<RpcNetInfoResponse>('/net_info', options)
  }

  /**
   * Query the ABCI application directly.
   *
   * @param path - ABCI query path (e.g., "/store/bank/key")
   * @param queryOptions - Optional data, height, and prove parameters
   */
  async abciQuery(
    path: string,
    queryOptions?: AbciQueryOptions,
    options?: HttpRequestOptions
  ): Promise<RpcAbciQueryResponse> {
    const params = new URLSearchParams()
    params.set('path', `"${path}"`)
    if (queryOptions?.data) params.set('data', `"${queryOptions.data}"`)
    if (queryOptions?.height !== undefined) params.set('height', String(queryOptions.height))
    if (queryOptions?.prove !== undefined) params.set('prove', String(queryOptions.prove))
    return this.get<RpcAbciQueryResponse>(`/abci_query?${params.toString()}`, options)
  }
}

// =============================================================================
// Factory
// =============================================================================

/**
 * Create a CometBFT HTTP RPC client.
 *
 * @param endpoint - CometBFT RPC endpoint URL (e.g., 'https://rpc.initia.xyz')
 * @param options - Client options (auth, headers, timeout)
 */
export function createRpcClient(
  endpoint: string,
  options?: RpcClientOptions
): RpcClient {
  return new RpcClient(endpoint, options)
}
