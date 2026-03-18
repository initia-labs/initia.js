import type { Transport } from '@connectrpc/connect'
import type { ChainInfo } from '../provider/types'
import type { MinievmClient, AuthConfig } from './types'
import { minievmChain } from '../chains/minievm'
import { createGrpcClient } from './grpc-client'
import { wrapClientWithCache } from './cached-client'

export function createClientWithConfig(
  chainInfo: ChainInfo,
  transport: Transport,
  contextAuth?: AuthConfig,
  contextHeaders?: Record<string, string>
): MinievmClient {
  const config = minievmChain.build()
  const client = createGrpcClient(
    transport,
    config.services,
    contextAuth,
    contextHeaders,
    config.registry
  )
  return wrapClientWithCache(client, chainInfo.chainId) as MinievmClient
}
