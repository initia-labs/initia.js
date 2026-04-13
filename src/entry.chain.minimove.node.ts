/**
 * Per-chain entry point: initia.js/minimove (Node.js)
 * Only includes minimove proto — no initia L1/minievm/miniwasm.
 */
import { createTransport } from './client/transport.node'
import { buildTypedFactory } from './wallet/typed-context'
import { minimoveContextConfig } from './contexts/minimove'
import { createClientWithConfig } from './client/create-client-minimove'
import type { ChainInfo } from './provider/types'
import type { TransportOptions } from './client/transport-common'
import type { MinimoveClient } from './client/types'

export { minimoveChain } from './chains/minimove'
export const createMoveContext = /* @__PURE__ */ buildTypedFactory(
  'minimove',
  createTransport,
  minimoveContextConfig[0],
  minimoveContextConfig[1]
)
export function createClient(chainInfo: ChainInfo, options?: TransportOptions): MinimoveClient {
  const transport = createTransport(chainInfo, options)
  return createClientWithConfig(chainInfo, transport)
}
