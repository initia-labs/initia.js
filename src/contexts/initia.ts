/**
 * Initia L1 context config — chain config + factory options.
 * Transport is NOT imported here; injected by entry points.
 */
import { initiaChain } from '../chains/initia'
import { createFungibleAssetToken } from '../token/fungible-asset'
import { createMoveEnricher } from '../tx/enrichers/move'
import type { TypedFactoryOptions } from '../wallet/typed-context'
import { createContractResolver } from '../wallet/chain-context'
import type { MoveEnabled } from '../token/resolver'
import type { AbiRegistry } from '../tx/get-tx'
import type { MoveModuleAbi } from '../contracts/move/types'
import { L1_CHAIN_IDS } from '../wallet/typed-context'
import { createMoveContract } from '../contracts/move/contract'

export const initiaContextConfig = [
  initiaChain,
  {
    getDefaultChainId: (n: string) => L1_CHAIN_IDS[n],
    tokenResolver: (_client, _ct, token) =>
      createFungibleAssetToken((_client as MoveEnabled).move, token),
    contractResolver: createContractResolver('initia', createMoveContract),
    enricherFactory: (client, abis) => [
      createMoveEnricher(
        (client as unknown as MoveEnabled).move,
        abis as AbiRegistry<MoveModuleAbi>
      ),
    ],
  } satisfies TypedFactoryOptions,
] as const
