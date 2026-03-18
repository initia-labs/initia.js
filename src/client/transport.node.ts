/**
 * Node.js transport - Native gRPC over HTTP/2.
 *
 * Provides full Cosmos chain support with optimal performance.
 */

import type { Transport } from '@connectrpc/connect'
import { createGrpcTransport } from '@connectrpc/connect-node'
import type { ChainInfo } from '../provider/types'
import { getGrpcEndpoint, buildInterceptors, type TransportOptions } from './transport-common'
import { DEFAULT_GRPC_TIMEOUT_MS } from '../constants'

/**
 * Create a native gRPC transport for Node.js.
 *
 * Uses HTTP/2 for full gRPC protocol support.
 * Works with standard Cosmos SDK gRPC endpoints.
 *
 * @param chainInfo - Chain configuration with endpoint URLs
 * @param options - Transport options
 * @returns Transport instance
 *
 * @example
 * ```typescript
 * import { createTransport } from 'initia.js'
 *
 * const transport = createTransport(chainInfo)
 * const client = createClientWithTransport(chainInfo, transport)
 * ```
 */
export function createTransport(chainInfo: ChainInfo, options?: TransportOptions): Transport {
  return createGrpcTransport({
    baseUrl: getGrpcEndpoint(chainInfo),
    defaultTimeoutMs: options?.timeoutMs ?? DEFAULT_GRPC_TIMEOUT_MS,
    interceptors: buildInterceptors(options),
  })
}
