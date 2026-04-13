/**
 * Minimove rollup context config.
 */
import { minimoveChain } from '../chains/minimove'
import { createFungibleAssetToken } from '../token/fungible-asset'
import { createMoveEnricher } from '../tx/enrichers/move'
import type { TypedFactoryOptions } from '../wallet/typed-context'
import { createContractResolver } from '../wallet/chain-context'
import type { MoveEnabled } from '../token/resolver'
import type { AbiRegistry } from '../tx/get-tx'
import type { MoveModuleAbi } from '../contracts/move/types'
import { createMoveContract } from '../contracts/move/contract'

export const minimoveContextConfig = [
  minimoveChain,
  {
    tokenResolver: (_client, _ct, token) =>
      createFungibleAssetToken((_client as MoveEnabled).move, token),
    contractResolver: createContractResolver('minimove', createMoveContract),
    enricherFactory: (client, abis) => [
      createMoveEnricher(
        (client as unknown as MoveEnabled).move,
        abis as AbiRegistry<MoveModuleAbi>
      ),
    ],
  } satisfies TypedFactoryOptions,
] as const
