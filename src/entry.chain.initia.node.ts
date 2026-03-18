/**
 * Per-chain entry point: initia.js/initia (Node.js)
 * Only includes initia L1 proto — no minievm/minimove/miniwasm.
 */
import { createTransport } from './client/transport.node'
import { buildTypedFactory } from './wallet/typed-context'
import { initiaContextConfig } from './contexts/initia'
import { createClientWithConfig } from './client/create-client-initia'
import type { ChainInfo } from './provider/types'
import type { TransportOptions } from './client/transport-common'
import type { InitiaClient } from './client/types'

export { initiaChain } from './chains/initia'
export const createInitiaContext = /* @__PURE__ */ buildTypedFactory(
  'initia', createTransport, initiaContextConfig[0], initiaContextConfig[1]
)
export function createClient(chainInfo: ChainInfo, options?: TransportOptions): InitiaClient {
  const transport = createTransport(chainInfo, options)
  return createClientWithConfig(chainInfo, transport)
}
