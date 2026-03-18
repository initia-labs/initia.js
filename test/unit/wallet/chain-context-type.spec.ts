import { describe, it, expectTypeOf } from 'vitest'
import type { ChainContext } from '../../../src/wallet/chain-context'

describe('ChainContext<T, TExt> type tests', () => {
  it('ChainContext<T> defaults TExt to {} — backward compatible', () => {
    type Ctx = ChainContext<'initia'>
    // Should compile without error — TExt defaults to {}
    expectTypeOf<Ctx>().toHaveProperty('client')
    expectTypeOf<Ctx>().toHaveProperty('msgs')
  })

  it('ChainContext<T, TExt> exposes extended client and msgs', () => {
    type Ext = { myDex: { query: any } }
    type Ctx = ChainContext<'minievm', Ext>
    expectTypeOf<Ctx['client']>().toHaveProperty('myDex')
    expectTypeOf<Ctx['client']>().toHaveProperty('evm')
  })
})
