/**
 * Miniwasm rollup context config.
 */
import { miniwasmChain } from '../chains/miniwasm'
import { createCw20Token } from '../token/cw20'
import { createWasmEnricher } from '../tx/enrichers/wasm'
import type { TypedFactoryOptions } from '../wallet/typed-context'
import { createContractResolver } from '../wallet/chain-context'
import type { WasmEnabled } from '../token/resolver'
import { createWasmContract } from '../contracts/wasm/contract'

export const miniwasmContextConfig = [
  miniwasmChain,
  {
    tokenResolver: (_client, _ct, token) => createCw20Token((_client as WasmEnabled).wasm, token),
    contractResolver: createContractResolver('miniwasm', createWasmContract),
    enricherFactory: () => [createWasmEnricher()],
  } satisfies TypedFactoryOptions,
] as const
