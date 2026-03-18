import type { Transport } from '@connectrpc/connect'
import type { ChainInfo } from '../provider/types'
import type { MinimoveClient, AuthConfig } from './types'
import { minimoveChain } from '../chains/minimove'
import { createGrpcClient } from './grpc-client'
import { wrapClientWithCache } from './cached-client'

export function createClientWithConfig(
  chainInfo: ChainInfo,
  transport: Transport,
  contextAuth?: AuthConfig,
  contextHeaders?: Record<string, string>
): MinimoveClient {
  const config = minimoveChain.build()
  const client = createGrpcClient(
    transport,
    config.services,
    contextAuth,
    contextHeaders,
    config.registry
  )
  return wrapClientWithCache(client, chainInfo.chainId) as MinimoveClient
}
