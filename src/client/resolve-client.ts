/**
 * Runtime client dispatch — maps chainType to per-chain factory.
 *
 * Each factory returns a specific client type (e.g. InitiaClient) which
 * widens to Client naturally, eliminating double casts.
 */

import type { Transport } from '@connectrpc/connect'
import type { ChainInfo } from '../provider/types'
import type { Client } from './types'
import { createClientWithConfig as createInitia } from './create-client-initia'
import { createClientWithConfig as createMinievm } from './create-client-minievm'
import { createClientWithConfig as createMinimove } from './create-client-minimove'
import { createClientWithConfig as createMiniwasm } from './create-client-miniwasm'
import { createClientWithConfig as createCosmos } from './create-client-cosmos'

type ClientFactory = (chainInfo: ChainInfo, transport: Transport) => Client

const factories: Record<string, ClientFactory> = {
  initia: createInitia,
  minievm: createMinievm,
  minimove: createMinimove,
  miniwasm: createMiniwasm,
}

const defaultFactory: ClientFactory = createCosmos

/** Dispatch chainInfo.chainType to the correct per-chain client factory. */
export function resolveClient(chainInfo: ChainInfo, transport: Transport): Client {
  const factory = factories[chainInfo.chainType] ?? defaultFactory
  return factory(chainInfo, transport)
}
