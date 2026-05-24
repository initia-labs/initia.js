import { describe, it, expectTypeOf } from 'vitest'
import type {
  InitiaClient,
  MinievmClient,
  MinimoveClient,
  MiniwasmClient,
  BaseClient,
  ClientFor,
  Client,
  TxOptions,
} from '../../src/client/types'
import type { EstimateOptions } from '../../src/client/gas'
import type { Numeric } from '../../src/types'
import type { Any } from '@bufbuild/protobuf/wkt'
import type { QueryDelegatorTotalUnbondingBalanceResponse } from '@buf/initia-labs_initia.bufbuild_es/initia/mstaking/v1/query_pb'

describe('derived client types', () => {
  describe('InitiaClient', () => {
    it('has base services', () => {
      expectTypeOf<InitiaClient>().toHaveProperty('auth')
      expectTypeOf<InitiaClient>().toHaveProperty('bank')
      expectTypeOf<InitiaClient>().toHaveProperty('tx')
      expectTypeOf<InitiaClient>().toHaveProperty('tendermint')
    })

    it('has initia-specific services', () => {
      expectTypeOf<InitiaClient>().toHaveProperty('move')
      expectTypeOf<InitiaClient>().toHaveProperty('mstaking')
      expectTypeOf<InitiaClient>().toHaveProperty('distribution')
      expectTypeOf<InitiaClient>().toHaveProperty('ophost')
      expectTypeOf<InitiaClient>().toHaveProperty('gov')
    })

    it('has generated mstaking total unbonding query but no v1-style wrapper', () => {
      expectTypeOf<InitiaClient['mstaking']>().toHaveProperty('delegatorTotalUnbondingBalance')
      expectTypeOf<InitiaClient['mstaking']>().not.toHaveProperty('totalUnbondingBalance')

      type Method = InitiaClient['mstaking']['delegatorTotalUnbondingBalance']
      expectTypeOf<{ delegatorAddr: string }>().toMatchTypeOf<Parameters<Method>[0]>()
      expectTypeOf<
        Awaited<ReturnType<Method>>
      >().toMatchTypeOf<QueryDelegatorTotalUnbondingBalanceResponse>()
    })
  })

  describe('MinievmClient', () => {
    it('has base + evm + opchild', () => {
      expectTypeOf<MinievmClient>().toHaveProperty('auth')
      expectTypeOf<MinievmClient>().toHaveProperty('bank')
      expectTypeOf<MinievmClient>().toHaveProperty('evm')
      expectTypeOf<MinievmClient>().toHaveProperty('opchild')
    })
  })

  describe('MinimoveClient', () => {
    it('has base + move + opchild', () => {
      expectTypeOf<MinimoveClient>().toHaveProperty('auth')
      expectTypeOf<MinimoveClient>().toHaveProperty('bank')
      expectTypeOf<MinimoveClient>().toHaveProperty('move')
      expectTypeOf<MinimoveClient>().toHaveProperty('opchild')
    })
  })

  describe('MiniwasmClient', () => {
    it('has base + wasm + opchild', () => {
      expectTypeOf<MiniwasmClient>().toHaveProperty('auth')
      expectTypeOf<MiniwasmClient>().toHaveProperty('bank')
      expectTypeOf<MiniwasmClient>().toHaveProperty('wasm')
      expectTypeOf<MiniwasmClient>().toHaveProperty('opchild')
    })
  })

  describe('BaseClient', () => {
    it('has only common query services', () => {
      expectTypeOf<BaseClient>().toHaveProperty('auth')
      expectTypeOf<BaseClient>().toHaveProperty('bank')
      expectTypeOf<BaseClient>().toHaveProperty('tx')
      expectTypeOf<BaseClient>().toHaveProperty('tendermint')
    })

    it('does not have chain-specific services', () => {
      expectTypeOf<BaseClient>().not.toHaveProperty('move')
      expectTypeOf<BaseClient>().not.toHaveProperty('evm')
      expectTypeOf<BaseClient>().not.toHaveProperty('wasm')
      expectTypeOf<BaseClient>().not.toHaveProperty('opchild')
      expectTypeOf<BaseClient>().not.toHaveProperty('ophost')
    })

    it('has ibc query service (merged ibc + ibcCore)', () => {
      expectTypeOf<BaseClient>().toHaveProperty('ibc')
    })

    it('has authz and feegrant query services', () => {
      expectTypeOf<BaseClient>().toHaveProperty('authz')
      expectTypeOf<BaseClient>().toHaveProperty('feegrant')
    })

    it('does not have tx-only modules (ibcCore removed, crisis/cosmosAuth/interTx tx-only)', () => {
      expectTypeOf<BaseClient>().not.toHaveProperty('ibcCore')
      expectTypeOf<BaseClient>().not.toHaveProperty('crisis')
      expectTypeOf<BaseClient>().not.toHaveProperty('cosmosAuth')
    })
  })

  describe('ClientFor<T>', () => {
    it('maps chain type to client', () => {
      expectTypeOf<ClientFor<'initia'>>().toEqualTypeOf<InitiaClient>()
      expectTypeOf<ClientFor<'minievm'>>().toEqualTypeOf<MinievmClient>()
      expectTypeOf<ClientFor<'minimove'>>().toEqualTypeOf<MinimoveClient>()
      expectTypeOf<ClientFor<'miniwasm'>>().toEqualTypeOf<MiniwasmClient>()
      expectTypeOf<ClientFor<'other'>>().toEqualTypeOf<BaseClient>()
    })
  })

  describe('Client union', () => {
    it('is assignable from each chain client', () => {
      expectTypeOf<InitiaClient>().toMatchTypeOf<Client>()
      expectTypeOf<MinievmClient>().toMatchTypeOf<Client>()
      expectTypeOf<MinimoveClient>().toMatchTypeOf<Client>()
      expectTypeOf<MiniwasmClient>().toMatchTypeOf<Client>()
      expectTypeOf<BaseClient>().toMatchTypeOf<Client>()
    })
  })
})

describe('transaction option types', () => {
  it('exposes TxBody fields on TxOptions', () => {
    expectTypeOf<TxOptions>().toHaveProperty('timeoutHeight').toEqualTypeOf<Numeric | undefined>()
    expectTypeOf<TxOptions>().toHaveProperty('extensionOptions').toEqualTypeOf<Any[] | undefined>()
    expectTypeOf<TxOptions>()
      .toHaveProperty('nonCriticalExtensionOptions')
      .toEqualTypeOf<Any[] | undefined>()
  })

  it('exposes TxBody fields on EstimateOptions', () => {
    expectTypeOf<EstimateOptions>()
      .toHaveProperty('timeoutHeight')
      .toEqualTypeOf<Numeric | undefined>()
    expectTypeOf<EstimateOptions>()
      .toHaveProperty('extensionOptions')
      .toEqualTypeOf<Any[] | undefined>()
    expectTypeOf<EstimateOptions>()
      .toHaveProperty('nonCriticalExtensionOptions')
      .toEqualTypeOf<Any[] | undefined>()
    expectTypeOf<EstimateOptions>().not.toHaveProperty('signMode')
  })
})
