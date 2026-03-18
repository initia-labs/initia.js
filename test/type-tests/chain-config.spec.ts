import { expectTypeOf, test } from 'vitest'
import { createChainConfig } from '../../src/chain-config'
import { Msg as BankTxMsg } from '@buf/cosmos_cosmos-sdk.bufbuild_es/cosmos/bank/v1beta1/tx_pb'
import { Query as BankQuery } from '@buf/cosmos_cosmos-sdk.bufbuild_es/cosmos/bank/v1beta1/query_pb'
import { Query as AuthQuery } from '@buf/cosmos_cosmos-sdk.bufbuild_es/cosmos/auth/v1beta1/query_pb'
import { Msg as MoveTxMsg } from '@buf/initia-labs_initia.bufbuild_es/initia/move/v1/tx_pb'

test('ChainConfigBuilder type inference', () => {
  const config = createChainConfig()
    .addModule('auth', { query: AuthQuery })
    .addModule('bank', { query: BankQuery, tx: BankTxMsg })
    .addModule('move', { tx: MoveTxMsg })
    .build()

  // Query services: auth and bank have query descriptors
  expectTypeOf(config.services.auth).toMatchTypeOf<typeof AuthQuery>()
  expectTypeOf(config.services.bank).toMatchTypeOf<typeof BankQuery>()

  // move is tx-only — should NOT be in services
  expectTypeOf(config.services).not.toHaveProperty('move')

  // bank.send should return Message
  expectTypeOf(config.msgs.bank.send).toBeFunction()

  // move.execute should exist (tx-only module)
  expectTypeOf(config.msgs.move.execute).toBeFunction()

  // auth should NOT be in msgs (query-only)
  expectTypeOf(config.msgs).not.toHaveProperty('auth')

  // custom and decode always present
  expectTypeOf(config.msgs.custom).toBeFunction()
  expectTypeOf(config.msgs.decode).toBeFunction()
})
