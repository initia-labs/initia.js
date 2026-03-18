/**
 * Per-chain entry point: initia.js/miniwasm (Browser)
 * Only includes miniwasm proto — no initia L1/minievm/minimove.
 */
import { createTransport } from './client/transport.browser'
import { buildTypedFactory } from './wallet/typed-context'
import { miniwasmContextConfig } from './contexts/miniwasm'
import { createClientWithConfig } from './client/create-client-miniwasm'
import type { ChainInfo } from './provider/types'
import type { TransportOptions } from './client/transport-common'
import type { MiniwasmClient } from './client/types'

export { miniwasmChain } from './chains/miniwasm'
export const createMiniwasmContext = /* @__PURE__ */ buildTypedFactory(
  'miniwasm', createTransport, miniwasmContextConfig[0], miniwasmContextConfig[1]
)
export function createClient(chainInfo: ChainInfo, options?: TransportOptions): MiniwasmClient {
  const transport = createTransport(chainInfo, options)
  return createClientWithConfig(chainInfo, transport)
}
