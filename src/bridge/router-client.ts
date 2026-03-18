/**
 * RouterClient — fetch wrapper for the Initia Router API.
 *
 * Handles snake_case ↔ camelCase conversion and preserves raw server
 * responses via Route._raw for safe roundtrip in buildTransferMsgs().
 *
 * @internal Used by Bridge class. Not exported publicly.
 */

import type {
  Route,
  RouteOptions,
  RouteOperation,
  BuildTransferMsgsOptions,
  TransferTx,
  OpHookOptions,
  OpHookResult,
  TransferStatus,
  RoutableAsset,
  RouterChain,
  BalanceQuery,
  RouterBalances,
  NftTransferOptions,
  NftTransferResult,
} from './types'
import { Message } from '../msgs/types'
import { create, createRegistry, fromJson, toBinary, type JsonValue } from '@bufbuild/protobuf'
import { AnySchema } from '@bufbuild/protobuf/wkt'
import { InitiaError } from '../errors'
import { base64ToUint8Array } from '../tx/amino'
import { fetchWithTimeout } from '../util/fetch'
const INTERWOVENKIT_VERSION = '2.4.6'

// Proto files for all msg types the router API can return
import { file_cosmos_bank_v1beta1_tx } from '@buf/cosmos_cosmos-sdk.bufbuild_es/cosmos/bank/v1beta1/tx_pb'
import { file_ibc_applications_transfer_v1_tx } from '@buf/cosmos_ibc.bufbuild_es/ibc/applications/transfer/v1/tx_pb'
import { file_opinit_ophost_v1_tx } from '@buf/initia-labs_opinit.bufbuild_es/opinit/ophost/v1/tx_pb'
import { file_opinit_opchild_v1_tx } from '@buf/initia-labs_opinit.bufbuild_es/opinit/opchild/v1/tx_pb'
import { file_minievm_evm_v1_tx } from '@buf/initia-labs_minievm.bufbuild_es/minievm/evm/v1/tx_pb'
import { file_initia_move_v1_tx } from '@buf/initia-labs_initia.bufbuild_es/initia/move/v1/tx_pb'

const routerRegistry = createRegistry(
  file_cosmos_bank_v1beta1_tx,
  file_ibc_applications_transfer_v1_tx,
  file_opinit_ophost_v1_tx,
  file_opinit_opchild_v1_tx,
  file_minievm_evm_v1_tx,
  file_initia_move_v1_tx
)

// =============================================================================
// Raw response types — snake_case shapes from the Router API
// @internal Not exported; used only for type-safe normalization.
// =============================================================================

interface RawRouteResponse {
  amount_in: string
  amount_out: string
  source_asset_chain_id: string
  source_asset_denom: string
  source_asset_symbol?: string
  dest_asset_chain_id: string
  dest_asset_denom: string
  dest_asset_symbol?: string
  operations: RawOperation[]
  estimated_duration_seconds?: number
  usd_amount_in?: string
  usd_amount_out?: string
  warnings?: string[]
  extra_infos?: string[]
  extra_warnings?: string[]
  required_op_hook?: boolean
}

interface RawOperation {
  type?: string
  op_type?: string
  chain_id?: string
  channel?: string
  pool_id?: string
  denom_in?: string
  denom_out?: string
}

interface RawCosmosTx {
  chain_id?: string
  signer_address?: string
  msgs?: Array<{ msg_type_url: string; msg: string }>
}

interface RawEvmTx {
  chain_id?: string
  signer_address?: string
  to: string
  data: string
  value?: string
}

interface RawTransferTx {
  chain_id?: string
  signer_address?: string
  cosmos_tx?: RawCosmosTx
  evm_tx?: RawEvmTx
}

interface RawTransferTxsResponse {
  txs: RawTransferTx[]
}

interface RawOpHookResponse {
  chain_id: string
  hook: Array<{ msg: string; msg_type_url: string }>
}

interface RawStatusResponse {
  state: string
  transfers: unknown[]
  transfer_sequence: Array<{ src_chain_id: string; dst_chain_id: string; state: string }>
  next_blocking_transfer?: { transfer_sequence_index: number }
  transfer_asset_release?: {
    chain_id: string
    denom: string
    amount?: string
    released: boolean
  }
  error?: unknown
}

interface RawAsset {
  denom: string
  chain_id: string
  origin_denom: string
  origin_chain_id: string
  symbol?: string
  name?: string
  decimals?: number
  logo_uri?: string
  recommended_symbol?: string
  description?: string
  coingecko_id?: string
  trace: string
  is_cw20: boolean
  is_evm: boolean
  is_svm: boolean
  token_contract?: string
  hidden?: boolean
  forwardContract?: string
  oftOwner?: string
}

interface RawAssetsResponse {
  chain_to_assets_map: Record<string, { assets: RawAsset[] }>
}

interface RawChain {
  chain_id: string
  chain_name: string
  chain_type: string
  pfm_enabled: boolean
  supports_memo: boolean
  logo_uri?: string
  bech32_prefix?: string
  rest?: string
  rpc?: string
  evm_fee_asset?: { decimals: number; name: string; symbol: string }
}

interface RawChainsResponse {
  chains: RawChain[]
}

interface RawBalancesResponse {
  chains: Record<
    string,
    {
      denoms: Record<string, { amount: string; price_usd?: string; value_usd?: string }>
    }
  >
}

// =============================================================================

export class RouterClient {
  constructor(private baseUrl: string) {}

  async route(opts: RouteOptions): Promise<Route> {
    const body = {
      amount_in: opts.amount,
      source_asset_chain_id: opts.source.chainId,
      source_asset_denom: opts.source.denom,
      dest_asset_chain_id: opts.dest.chainId,
      dest_asset_denom: opts.dest.denom,
      allow_unsafe: opts.allowUnsafe,
      go_fast: opts.goFast,
      is_op_withdraw: opts.isOpWithdraw,
    }
    const res = await this.post('/v2/fungible/route', body)
    return normalizeRouteResponse((await res.json()) as RawRouteResponse)
  }

  async msgs(opts: BuildTransferMsgsOptions): Promise<TransferTx[]> {
    // Use route._raw to preserve server's original operations (roundtrip-safe)
    const raw = opts.route._raw as RawRouteResponse
    const body = {
      amount_in: raw.amount_in,
      amount_out: raw.amount_out,
      source_asset_chain_id: raw.source_asset_chain_id,
      source_asset_denom: raw.source_asset_denom,
      dest_asset_chain_id: raw.dest_asset_chain_id,
      dest_asset_denom: raw.dest_asset_denom,
      address_list: opts.addresses,
      operations: raw.operations,
      slippage_tolerance_percent: opts.slippageTolerance ?? '1',
      signed_op_hook: opts.signedOpHook,
      ignore_blacklist: opts.ignoreBlacklist,
    }
    const res = await this.post('/v2/fungible/msgs', body)
    return normalizeTransferTxs((await res.json()) as RawTransferTxsResponse)
  }

  async opHook(opts: OpHookOptions): Promise<OpHookResult> {
    const body = {
      source_address: opts.sourceAddress,
      source_asset_chain_id: opts.sourceChainId,
      source_asset_denom: opts.sourceDenom,
      dest_address: opts.destAddress,
      dest_asset_chain_id: opts.destChainId,
      dest_asset_denom: opts.destDenom,
    }
    const res = await this.post('/op-hook', body)
    return normalizeOpHookResponse((await res.json()) as RawOpHookResponse)
  }

  async track(txHash: string, chainId: string): Promise<void> {
    await this.post('/v2/tx/track', { tx_hash: txHash, chain_id: chainId })
  }

  async assets(chainIds?: string[]): Promise<Record<string, RoutableAsset[]>> {
    const query = chainIds?.length ? `?chain_ids=${chainIds.join(',')}` : ''
    const res = await this.get(`/v2/fungible/assets${query}`)
    return normalizeAssetsResponse((await res.json()) as RawAssetsResponse)
  }

  async chains(chainIds?: string[]): Promise<RouterChain[]> {
    const query = chainIds?.length ? `?chain_ids=${chainIds.join(',')}` : ''
    const res = await this.get(`/v2/info/chains${query}`)
    return normalizeChainsResponse((await res.json()) as RawChainsResponse)
  }

  async balances(queries: Record<string, BalanceQuery>): Promise<RouterBalances> {
    const res = await this.post('/v2/info/balances', { chains: queries })
    return normalizeBalancesResponse((await res.json()) as RawBalancesResponse)
  }

  async nftTransfer(opts: NftTransferOptions): Promise<NftTransferResult> {
    const body: Record<string, unknown> = {
      from_address: opts.fromAddress,
      from_chain_id: opts.fromChainId,
      to_address: opts.toAddress,
      to_chain_id: opts.toChainId,
      token_ids: opts.tokenIds,
      collection_address: opts.collectionAddress,
    }
    if (opts.classId) body.class_id = opts.classId
    if (opts.classTrace) {
      body.class_trace = { path: opts.classTrace.path, base_class_id: opts.classTrace.baseClassId }
    }
    if (opts.objectAddresses) body.object_addresses = opts.objectAddresses
    if (opts.l1RecoverAddress) body.l1_recover_address = opts.l1RecoverAddress
    if (opts.outgoingProxy) body.outgoing_proxy = opts.outgoingProxy
    if (opts.timeout !== undefined) body.timeout = opts.timeout
    if (opts.ignoreBlacklist) body.ignore_blacklist = opts.ignoreBlacklist

    const res = await this.post('/nft', body)
    return (await res.json()) as NftTransferResult
  }

  async status(txHash: string, chainId: string): Promise<TransferStatus> {
    const params = new URLSearchParams({ tx_hash: txHash, chain_id: chainId })
    const res = await this.get(`/v2/tx/status?${params.toString()}`)
    return normalizeStatus((await res.json()) as RawStatusResponse)
  }

  private headers(): Record<string, string> {
    return { 'InterwovenKit-Version': INTERWOVENKIT_VERSION }
  }

  private async throwIfNotOk(res: Response, path: string): Promise<void> {
    if (res.ok) return
    let detail = ''
    try {
      const body = (await res.json()) as { message?: string }
      if (body.message) detail = `: ${body.message}`
    } catch {
      /* ignore parse errors */
    }
    throw new InitiaError(`Router API ${path} failed (${res.status})${detail}`)
  }

  private async get(path: string): Promise<Response> {
    const res = await fetchWithTimeout(`${this.baseUrl}${path}`, {
      headers: this.headers(),
    })
    await this.throwIfNotOk(res, path)
    return res
  }

  private async post(path: string, body: unknown): Promise<Response> {
    const res = await fetchWithTimeout(`${this.baseUrl}${path}`, {
      method: 'POST',
      headers: { ...this.headers(), 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    })
    await this.throwIfNotOk(res, path)
    return res
  }
}

// =============================================================================
// Normalization functions — snake_case (server) → camelCase (SDK)
// =============================================================================

/**
 * Normalize route response. Preserves the entire raw response in `_raw`
 * so that buildTransferMsgs() can pass server-original data without loss.
 */
function normalizeRouteResponse(raw: RawRouteResponse): Route {
  return {
    amountIn: raw.amount_in,
    amountOut: raw.amount_out,
    source: {
      chainId: raw.source_asset_chain_id,
      denom: raw.source_asset_denom,
      symbol: raw.source_asset_symbol,
    },
    dest: {
      chainId: raw.dest_asset_chain_id,
      denom: raw.dest_asset_denom,
      symbol: raw.dest_asset_symbol,
    },
    operations: normalizeOperations(raw.operations),
    estimatedDurationSeconds: raw.estimated_duration_seconds,
    usdAmountIn: raw.usd_amount_in,
    usdAmountOut: raw.usd_amount_out,
    warnings: raw.warnings,
    extraInfos: raw.extra_infos,
    extraWarnings: raw.extra_warnings,
    requiresOpHook: raw.required_op_hook,
    _raw: raw,
  }
}

/**
 * Normalize operations array (display-only; originals preserved in _raw).
 */
function normalizeOperations(raw: RawOperation[]): RouteOperation[] {
  return raw.map((op): RouteOperation => {
    const type = op.type ?? op.op_type
    switch (type) {
      case 'transfer':
        return {
          type: 'transfer',
          chainId: op.chain_id ?? '',
          channel: op.channel ?? '',
          denomIn: op.denom_in ?? '',
          denomOut: op.denom_out ?? '',
        }
      case 'swap':
        return {
          type: 'swap',
          poolId: op.pool_id ?? '',
          denomIn: op.denom_in ?? '',
          denomOut: op.denom_out ?? '',
        }
      default:
        return {
          type: type as RouteOperation['type'],
          denomIn: op.denom_in ?? '',
          denomOut: op.denom_out ?? '',
        } as RouteOperation
    }
  })
}

/**
 * Normalize transfer transactions response.
 * Converts base64-encoded proto messages to SDK Message format.
 */
function normalizeTransferTxs(raw: RawTransferTxsResponse): TransferTx[] {
  const txs = raw.txs
  return txs.map(
    (tx): TransferTx => ({
      chainId: tx.chain_id ?? tx.cosmos_tx?.chain_id ?? tx.evm_tx?.chain_id ?? '',
      cosmosMsgs: normalizeCosmosMsgs(tx.cosmos_tx?.msgs),
      evmTx: tx.evm_tx
        ? { to: tx.evm_tx.to, data: tx.evm_tx.data, value: tx.evm_tx.value }
        : undefined,
      signerAddress:
        tx.signer_address ?? tx.cosmos_tx?.signer_address ?? tx.evm_tx?.signer_address ?? '',
    })
  )
}

/**
 * Convert router API message format to SDK Message format.
 *
 * The Router API returns `msg` as a JSON string (snake_case),
 * not base64-encoded proto bytes. We use the routerRegistry to
 * resolve the schema, then `fromJson` → `toBinary` → `Any`.
 */
function normalizeCosmosMsgs(
  msgs: Array<{ msg_type_url: string; msg: string }> | undefined
): Message[] | undefined {
  if (!msgs?.length) return undefined
  return msgs.map(m => {
    let value: Uint8Array
    if (m.msg.startsWith('{')) {
      const typeName = m.msg_type_url.replace(/^\//, '')
      const desc = routerRegistry.getMessage(typeName)
      if (!desc) throw new InitiaError(`Unknown router msg type: ${m.msg_type_url}`)
      value = toBinary(desc, fromJson(desc, JSON.parse(m.msg) as JsonValue))
    } else {
      value = base64ToUint8Array(m.msg)
    }
    return Message.fromAny(create(AnySchema, { typeUrl: m.msg_type_url, value }))
  })
}

function normalizeOpHookResponse(raw: RawOpHookResponse): OpHookResult {
  return {
    chainId: raw.chain_id,
    hook: raw.hook,
  }
}

function normalizeAssetsResponse(raw: RawAssetsResponse): Record<string, RoutableAsset[]> {
  const result: Record<string, RoutableAsset[]> = {}
  for (const [chainId, { assets }] of Object.entries(raw.chain_to_assets_map)) {
    result[chainId] = assets.map(
      (a): RoutableAsset => ({
        denom: a.denom,
        chainId: a.chain_id,
        originDenom: a.origin_denom,
        originChainId: a.origin_chain_id,
        symbol: a.symbol,
        name: a.name,
        decimals: a.decimals,
        logoUri: a.logo_uri,
        recommendedSymbol: a.recommended_symbol,
        description: a.description,
        coingeckoId: a.coingecko_id,
        trace: a.trace,
        isCw20: a.is_cw20,
        isEvm: a.is_evm,
        isSvm: a.is_svm,
        tokenContract: a.token_contract,
        hidden: a.hidden,
        forwardContract: a.forwardContract,
        oftOwner: a.oftOwner,
      })
    )
  }
  return result
}

function normalizeStatus(raw: RawStatusResponse): TransferStatus {
  return {
    state: raw.state as TransferStatus['state'],
    transfers: raw.transfers ?? [],
    transferSequence: (raw.transfer_sequence ?? []).map(h => ({
      srcChainId: h.src_chain_id,
      dstChainId: h.dst_chain_id,
      state: h.state,
    })),
    nextBlockingTransfer: raw.next_blocking_transfer
      ? { transferSequenceIndex: raw.next_blocking_transfer.transfer_sequence_index }
      : undefined,
    transferAssetRelease: raw.transfer_asset_release
      ? {
          chainId: raw.transfer_asset_release.chain_id,
          denom: raw.transfer_asset_release.denom,
          amount: raw.transfer_asset_release.amount ?? undefined,
          released: raw.transfer_asset_release.released,
        }
      : undefined,
    error: raw.error ?? undefined,
  }
}

function normalizeBalancesResponse(raw: RawBalancesResponse): RouterBalances {
  const result: RouterBalances = {}
  for (const [chainId, chainData] of Object.entries(raw.chains ?? {})) {
    result[chainId] = {}
    for (const [denom, info] of Object.entries(chainData.denoms ?? {})) {
      result[chainId][denom] = {
        amount: info.amount,
        priceUsd: info.price_usd,
        valueUsd: info.value_usd,
      }
    }
  }
  return result
}

function normalizeChainsResponse(raw: RawChainsResponse): RouterChain[] {
  return (raw.chains ?? []).map(c => ({
    chainId: c.chain_id,
    chainName: c.chain_name,
    chainType: c.chain_type,
    pfmEnabled: c.pfm_enabled,
    supportsMemo: c.supports_memo,
    logoUri: c.logo_uri,
    bech32Prefix: c.bech32_prefix,
    rest: c.rest,
    rpc: c.rpc,
    evmFeeAsset: c.evm_fee_asset,
  }))
}
