import { describe, it, expect } from 'vitest'
import { createChainConfig } from '../../../src/chain-config'
import { composeProviders } from '../../../src/provider/compose'
import { CompositeProvider } from '../../../src/provider/composite-provider'
import { CustomProvider } from '../../../src/provider/custom-provider'
import { buildTypedFactory } from '../../../src/wallet/typed-context'
import type { ChainInfoForType } from '../../../src/provider/types'
import type { Transport } from '@connectrpc/connect'

// Real DescService/GenService from bufbuild_es (already in devDependencies)
import { Query as BankQuery } from '@buf/cosmos_cosmos-sdk.bufbuild_es/cosmos/bank/v1beta1/query_pb'
import { Msg as BankTxMsg } from '@buf/cosmos_cosmos-sdk.bufbuild_es/cosmos/bank/v1beta1/tx_pb'

// ---------------------------------------------------------------------------
// Test helpers
// ---------------------------------------------------------------------------

const mockTransport = {} as Transport

const mockChainInfo: ChainInfoForType<'other'> = {
  chainId: 'test-1',
  chainName: 'Test',
  chainType: 'other',
  network: 'testnet',
  grpc: 'localhost:9090',
  nativeDenom: 'utest',
  bech32Prefix: 'test',
}

function createTestFactory() {
  const baseConfig = createChainConfig().addModule('bank', { query: BankQuery, tx: BankTxMsg })

  return buildTypedFactory('other', () => mockTransport, baseConfig)
}

// ---------------------------------------------------------------------------
// addModule accumulation
// ---------------------------------------------------------------------------

describe('modules callback — addModule accumulates', () => {
  it('custom module appears in built services', () => {
    const config = createChainConfig().addModule('myBank', { query: BankQuery }).build()
    expect(config.services).toHaveProperty('myBank')
  })

  it('custom module appears in built msgs', () => {
    const config = createChainConfig()
      .addModule('myBank', { query: BankQuery, tx: BankTxMsg })
      .build()
    expect(config.msgs).toHaveProperty('myBank')
  })

  it('addModule with existing key silently overrides', () => {
    const config = createChainConfig()
      .addModule('bank', { query: BankQuery })
      .addModule('bank', { query: BankQuery })
      .build()
    expect(config.services).toHaveProperty('bank')
  })
})

// ---------------------------------------------------------------------------
// composeProviders
// ---------------------------------------------------------------------------

describe('composeProviders', () => {
  it('returns a CompositeProvider', () => {
    const p1 = new CustomProvider([])
    const p2 = new CustomProvider([])
    const composed = composeProviders(p1, p2)
    expect(composed).toBeInstanceOf(CompositeProvider)
  })
})

// ---------------------------------------------------------------------------
// createWithModules — end-to-end runtime
// ---------------------------------------------------------------------------

describe('modules callback — runtime integration', () => {
  it('extended context has custom module on client', () => {
    const factory = createTestFactory()

    const ctx = factory(mockChainInfo, {
      modules: base => base.addModule('custom', { query: BankQuery }),
    })

    // base modules preserved
    expect(ctx.client).toHaveProperty('bank')
    // custom module added
    expect(ctx.client).toHaveProperty('custom')
  })

  it('extended context has custom module on msgs', () => {
    const factory = createTestFactory()

    const ctx = factory(mockChainInfo, {
      modules: base => base.addModule('custom', { query: BankQuery, tx: BankTxMsg }),
    })

    expect(ctx.msgs).toHaveProperty('custom')
  })

  it('withSigner preserves extended modules at runtime', () => {
    const factory = createTestFactory()

    const ctx = factory(mockChainInfo, {
      modules: base => base.addModule('custom', { query: BankQuery }),
    })

    // Create derived context — custom module should survive
    const derived = ctx.withSigner({
      getAddress: async () => 'test1abc',
      signDirect: async () => ({ signed: {} as any, signature: new Uint8Array() }),
    } as any)

    expect(derived.client).toHaveProperty('custom')
    expect(derived.client).toHaveProperty('bank')
  })

  it('forAddress preserves extended modules at runtime', () => {
    const factory = createTestFactory()

    const ctx = factory(mockChainInfo, {
      modules: base => base.addModule('custom', { query: BankQuery }),
    })

    const derived = ctx.forAddress('test1xyz')
    expect(derived.client).toHaveProperty('custom')
  })

  it('modules callback returning undefined throws descriptive error', () => {
    const factory = createTestFactory()

    expect(() => {
      factory(mockChainInfo, {
        modules: ((_base: any) => undefined) as any,
      })
    }).toThrow('modules callback must return a ChainConfigBuilder')
  })
})

// ---------------------------------------------------------------------------
// providers option — runtime integration
// ---------------------------------------------------------------------------

describe('providers option — runtime integration', () => {
  it('providers option composes into single provider', async () => {
    const p1 = new CustomProvider([
      {
        chainId: 'chain-a',
        chainName: 'Chain A',
        chainType: 'other',
        network: 'testnet',
        grpc: 'localhost:9090',
        nativeDenom: 'ua',
        bech32Prefix: 'a',
      },
    ])
    const p2 = new CustomProvider([
      {
        chainId: 'chain-b',
        chainName: 'Chain B',
        chainType: 'other',
        network: 'testnet',
        grpc: 'localhost:9091',
        nativeDenom: 'ub',
        bech32Prefix: 'b',
      },
    ])

    const baseConfig = createChainConfig().addModule('bank', { query: BankQuery })
    const factory = buildTypedFactory('other', () => mockTransport, baseConfig)

    // providers option creates context from composed providers
    const ctx = await factory({
      providers: [p1, p2],
      chainId: 'chain-a',
    })

    expect(ctx.chainInfo.chainId).toBe('chain-a')
    expect(ctx.client).toHaveProperty('bank')
  })

  it('does not mutate original options object', async () => {
    const p1 = new CustomProvider([
      {
        chainId: 'test-1',
        chainName: 'Test',
        chainType: 'other',
        network: 'testnet',
        grpc: 'localhost:9090',
        nativeDenom: 'utest',
        bech32Prefix: 'test',
      },
    ])

    const baseConfig = createChainConfig().addModule('bank', { query: BankQuery })
    const factory = buildTypedFactory('other', () => mockTransport, baseConfig)

    const opts = { providers: [p1], chainId: 'test-1' }
    const keysBefore = Object.keys(opts)
    await factory(opts)

    // Original opts should not have been mutated (no provider injected)
    expect(Object.keys(opts)).toEqual(keysBefore)
    expect((opts as Record<string, unknown>).provider).toBeUndefined()
  })
})

// ---------------------------------------------------------------------------
// chainType mismatch validation
// ---------------------------------------------------------------------------

describe('chainType mismatch validation', () => {
  it('throws when chain type does not match factory type (provider path)', () => {
    const provider = new CustomProvider([
      {
        chainId: 'wrong-type-1',
        chainName: 'Wrong Type',
        chainType: 'other',
        network: 'testnet',
        grpc: 'localhost:9090',
        nativeDenom: 'utest',
        bech32Prefix: 'test',
      },
    ])

    // Factory expects 'initia' but chain is 'other'
    const baseConfig = createChainConfig().addModule('bank', { query: BankQuery })
    const initiaFactory = buildTypedFactory('initia', () => mockTransport, baseConfig)

    expect(() => {
      initiaFactory(provider, 'wrong-type-1')
    }).toThrow("has type 'other' but this factory expects 'initia'")
  })
})

// ---------------------------------------------------------------------------
// extractModules — non-function modules option
// ---------------------------------------------------------------------------

describe('extractModules validation', () => {
  it('throws when modules is not a function', () => {
    const factory = createTestFactory()

    expect(() => {
      factory(mockChainInfo, {
        modules: { query: BankQuery } as any,
      })
    }).toThrow("'modules' option must be a callback")
  })
})

// ---------------------------------------------------------------------------
// composeProviders — empty array
// ---------------------------------------------------------------------------

describe('composeProviders — empty input', () => {
  it('throws on zero providers', () => {
    expect(() => composeProviders()).toThrow('at least one provider')
  })
})
