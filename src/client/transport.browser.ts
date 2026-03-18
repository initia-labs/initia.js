/**
 * Browser transport - gRPC-web over HTTP/1.1 or HTTP/2.
 *
 * Compatible with all modern browsers.
 * Requires gRPC-web enabled endpoints.
 */

import type { Transport } from '@connectrpc/connect'
import { createGrpcWebTransport } from '@connectrpc/connect-web'
import type { ChainInfo } from '../provider/types'
import { getGrpcWebEndpoint, buildInterceptors, type TransportOptions } from './transport-common'

/**
 * Create a gRPC-web transport for browsers.
 *
 * Uses HTTP/1.1 or HTTP/2 with gRPC-web protocol.
 * Requires gRPC-web enabled endpoints.
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
  return createGrpcWebTransport({
    baseUrl: getGrpcWebEndpoint(chainInfo),
    interceptors: buildInterceptors(options),
  })
}
