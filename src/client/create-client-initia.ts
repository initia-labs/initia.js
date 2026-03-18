import type { Transport } from '@connectrpc/connect'
import type { ChainInfo } from '../provider/types'
import type { InitiaClient, AuthConfig } from './types'
import { initiaChain } from '../chains/initia'
import { createGrpcClient } from './grpc-client'
import { wrapClientWithCache } from './cached-client'

export function createClientWithConfig(
  chainInfo: ChainInfo,
  transport: Transport,
  contextAuth?: AuthConfig,
  contextHeaders?: Record<string, string>
): InitiaClient {
  const config = initiaChain.build()
  const client = createGrpcClient(
    transport,
    config.services,
    contextAuth,
    contextHeaders,
    config.registry
  )
  return wrapClientWithCache(client, chainInfo.chainId) as InitiaClient
}
