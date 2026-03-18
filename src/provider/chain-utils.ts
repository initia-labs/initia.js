/**
 * Shared helper functions for chain data conversion.
 *
 * Used by RegistryProvider and LocalRegistryProvider to convert
 * @initia/initia-registry-types Chain/Asset objects to SDK types.
 */

import type { Chain, Asset } from '@initia/initia-registry-types'
import type { ChainType, NetworkType } from '../client/types'
import type { ChainInfo, AssetInfo, IbcChannelInfo } from './types'

/**
 * Normalize endpoint URL by adding https:// if no scheme is present.
 * Required for gRPC-Web transport compatibility.
 */
export function normalizeEndpoint(endpoint: string | undefined): string | undefined {
  if (!endpoint) return undefined
  if (endpoint.startsWith('http://') || endpoint.startsWith('https://')) {
    return endpoint
  }
  return `https://${endpoint}`
}

/**
 * Derive WebSocket URL from RPC endpoint.
 * Cosmos chains expose WebSocket at /websocket path on the RPC endpoint.
 */
export function deriveWssFromRpc(rpcEndpoint: string | undefined): string | undefined {
  if (!rpcEndpoint) return undefined

  try {
    const url = new URL(rpcEndpoint)
    url.protocol = url.protocol === 'https:' ? 'wss:' : 'ws:'
    if (!url.pathname.endsWith('/websocket')) {
      url.pathname = url.pathname.replace(/\/?$/, '/websocket')
    }
    return url.toString()
  } catch {
    return undefined
  }
}

/**
 * Detect chain type from registry metadata.
 */
export function detectChainType(chain: Chain): ChainType {
  if (chain.metadata?.is_l1) {
    return 'initia'
  }

  const minitiaType = chain.metadata?.minitia?.type
  if (minitiaType === 'minievm') return 'minievm'
  if (minitiaType === 'miniwasm') return 'miniwasm'
  if (minitiaType === 'minimove') return 'minimove'

  return 'other'
}

/**
 * Map registry network type to SDK NetworkType.
 */
export function mapNetworkType(networkType: Chain['network_type']): NetworkType {
  if (networkType === 'mainnet') return 'mainnet'
  if (networkType === 'testnet') return 'testnet'
  return 'local'
}

/**
 * Parse IBC channels from chain metadata.
 */
export function parseIbcChannels(metadata: Record<string, unknown> | undefined): IbcChannelInfo[] {
  const rawIbcChannels =
    (metadata?.ibc_channels as Array<{
      chain_id: string
      port_id: string
      channel_id: string
      version: string
    }>) ?? []
  return rawIbcChannels.map(ch => ({
    chainId: ch.chain_id,
    portId: ch.port_id,
    channelId: ch.channel_id,
    version: ch.version,
  }))
}

/**
 * Derive gas price string from registry fee token data.
 * Uses average_gas_price if available, falls back to low_gas_price or fixed_min_gas_price.
 */
function deriveGasPrice(
  feeToken:
    | {
        denom: string
        fixed_min_gas_price?: number
        low_gas_price?: number
        average_gas_price?: number
      }
    | undefined
): string | undefined {
  if (!feeToken) return undefined
  const price = feeToken.average_gas_price ?? feeToken.low_gas_price ?? feeToken.fixed_min_gas_price
  if (price == null) return undefined
  return `${price}${feeToken.denom}`
}

/**
 * Convert registry Chain to ChainInfo.
 */
export function toChainInfo(chain: Chain): ChainInfo {
  const rpcEndpoint = chain.apis.rpc?.[0]?.address

  const metadata = chain.metadata as Record<string, unknown> | undefined
  const opBridgeIdStr = metadata?.op_bridge_id as string | undefined
  const executorUri = metadata?.executor_uri as string | undefined

  const ibcChannels = parseIbcChannels(metadata)

  return {
    chainId: chain.chain_id,
    chainName: chain.pretty_name ?? chain.chain_name,
    chainType: detectChainType(chain),
    network: mapNetworkType(chain.network_type),
    rpc: rpcEndpoint,
    rest: chain.apis.rest[0]?.address,
    grpc: normalizeEndpoint(chain.apis.grpc?.[0]?.address),
    grpcWeb: normalizeEndpoint(chain.apis['grpc-web']?.[0]?.address),
    wss: chain.apis.wss?.[0]?.address ?? deriveWssFromRpc(rpcEndpoint),
    evmRpc: chain.apis['json-rpc']?.[0]?.address,
    evmWss: chain.apis['json-rpc-websocket']?.[0]?.address,
    api: chain.apis.api?.[0]?.address,
    indexer: chain.apis.indexer?.[0]?.address,
    nativeDenom: chain.fees.fee_tokens[0]?.denom,
    gasPrice: deriveGasPrice(chain.fees.fee_tokens[0]),
    bech32Prefix: chain.bech32_prefix,
    evmChainId: chain.evm_chain_id ?? undefined,
    slip44: chain.slip44,
    opBridgeId: opBridgeIdStr ? BigInt(opBridgeIdStr) : undefined,
    opDenoms: (metadata?.op_denoms as string[]) ?? undefined,
    executorUri,
    explorerUrl: chain.explorers?.[0]?.url,
    ibcChannels: ibcChannels.length > 0 ? ibcChannels : undefined,
  }
}

/**
 * Convert a registry Asset to normalized AssetInfo.
 */
export function toAssetInfo(raw: Asset, chainId: string): AssetInfo {
  const displayUnit = raw.denom_units.find(u => u.denom === raw.display)
  const decimals = displayUnit?.exponent ?? 0

  let originChainId: string | undefined
  let originDenom: string | undefined
  if (raw.traces?.length) {
    const trace = raw.traces[0]
    originChainId = trace.counterparty.chain_id
    originDenom = trace.counterparty.base_denom
  }

  const logoUrl = raw.logo_URIs?.png ?? raw.images?.[0]?.png

  return {
    chainId,
    denom: raw.base,
    symbol: raw.symbol,
    name: raw.name,
    description: raw.description,
    display: raw.display,
    denomUnits: raw.denom_units.map(u => ({
      denom: u.denom,
      exponent: u.exponent,
      ...(u.aliases?.length ? { aliases: u.aliases } : {}),
    })),
    decimals,
    contractAddress: raw.address,
    logoUrl,
    coingeckoId: raw.coingecko_id,
    oracleSymbol: raw.oracle_symbol,
    originChainId,
    originDenom,
    typeAsset: raw.type_asset,
  }
}
