/**
 * Per-chain entry point: initia.js/minievm (Browser)
 * Only includes minievm proto — no initia L1/minimove/miniwasm.
 */
import { createTransport } from './client/transport.browser'
import { buildTypedFactory } from './wallet/typed-context'
import { minievmContextConfig } from './contexts/minievm'
import { createClientWithConfig } from './client/create-client-minievm'
import type { ChainInfo } from './provider/types'
import type { TransportOptions } from './client/transport-common'
import type { MinievmClient } from './client/types'

export { minievmChain } from './chains/minievm'
export const createMinievmContext = /* @__PURE__ */ buildTypedFactory(
  'minievm', createTransport, minievmContextConfig[0], minievmContextConfig[1]
)
export function createClient(chainInfo: ChainInfo, options?: TransportOptions): MinievmClient {
  const transport = createTransport(chainInfo, options)
  return createClientWithConfig(chainInfo, transport)
}
