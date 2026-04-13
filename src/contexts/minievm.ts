/**
 * Minievm rollup context config.
 */
import { minievmChain } from '../chains/minievm'
import { createErc20Token } from '../token/erc20'
import { createEvmEnricher } from '../tx/enrichers/evm'
import type { TypedFactoryOptions } from '../wallet/typed-context'
import { createContractResolver } from '../wallet/chain-context'
import type { EvmEnabled } from '../token/resolver'
import type { AbiRegistry } from '../tx/get-tx'
import type { Abi } from 'abitype'
import { createEvmContract } from '../contracts/evm/contract'

export const minievmContextConfig = [
  minievmChain,
  {
    tokenResolver: (_client, _ct, token, sender) =>
      createErc20Token((_client as EvmEnabled).evm, token, sender),
    contractResolver: createContractResolver('minievm', createEvmContract),
    enricherFactory: (_client, abis) => [createEvmEnricher(abis as AbiRegistry<Abi>)],
  } satisfies TypedFactoryOptions,
] as const
