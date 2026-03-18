import type { Transport } from '@connectrpc/connect'
import type { ChainInfo } from '../provider/types'
import type { BaseClient, AuthConfig } from './types'
import { createBaseConfig } from '../chains/common'
import { createGrpcClient } from './grpc-client'
import { wrapClientWithCache } from './cached-client'

export function createClientWithConfig(
  chainInfo: ChainInfo,
  transport: Transport,
  contextAuth?: AuthConfig,
  contextHeaders?: Record<string, string>
): BaseClient {
  const config = /* @__PURE__ */ createBaseConfig().build()
  const client = createGrpcClient(
    transport,
    config.services,
    contextAuth,
    contextHeaders,
    config.registry
  )
  return wrapClientWithCache(client, chainInfo.chainId) as BaseClient
}
