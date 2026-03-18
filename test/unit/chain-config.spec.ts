import { describe, it, expect } from 'vitest'
import { createChainConfig } from '../../src/chain-config'
import { Msg as BankTxMsg } from '@buf/cosmos_cosmos-sdk.bufbuild_es/cosmos/bank/v1beta1/tx_pb'
import { Query as BankQuery } from '@buf/cosmos_cosmos-sdk.bufbuild_es/cosmos/bank/v1beta1/query_pb'
import { Query as AuthQuery } from '@buf/cosmos_cosmos-sdk.bufbuild_es/cosmos/auth/v1beta1/query_pb'
import { Msg as MoveTxMsg } from '@buf/initia-labs_initia.bufbuild_es/initia/move/v1/tx_pb'
import { file_cosmos_crypto_ed25519_keys } from '@buf/cosmos_cosmos-sdk.bufbuild_es/cosmos/crypto/ed25519/keys_pb'
import { Msg as ChannelTxMsg } from '@buf/cosmos_ibc.bufbuild_es/ibc/core/channel/v1/tx_pb'
import { Msg as ClientTxMsg } from '@buf/cosmos_ibc.bufbuild_es/ibc/core/client/v1/tx_pb'
import { Msg as ConnectionTxMsg } from '@buf/cosmos_ibc.bufbuild_es/ibc/core/connection/v1/tx_pb'
import { Query as IbcChannelQuery } from '@buf/cosmos_ibc.bufbuild_es/ibc/core/channel/v1/query_pb'
import { Query as IbcClientQuery } from '@buf/cosmos_ibc.bufbuild_es/ibc/core/client/v1/query_pb'
import { Query as AuthzQuery } from '@buf/cosmos_cosmos-sdk.bufbuild_es/cosmos/authz/v1beta1/query_pb'
import { coin } from '../../src/core/coin'

describe('createChainConfig', () => {
  it('returns a ChainConfigBuilder', () => {
    const builder = createChainConfig()
    expect(builder).toBeDefined()
    expect(typeof builder.addModule).toBe('function')
    expect(typeof builder.addTypes).toBe('function')
    expect(typeof builder.build).toBe('function')
  })
})

describe('addModule + build', () => {
  it('registers query + tx module', () => {
    const config = createChainConfig()
      .addModule('bank', { query: BankQuery, tx: BankTxMsg })
      .build()

    expect(config.services.bank).toBe(BankQuery)
    expect(typeof config.msgs.bank.send).toBe('function')
    expect(typeof config.msgs.bank.multiSend).toBe('function')
  })

  it('registers query-only module', () => {
    const config = createChainConfig().addModule('auth', { query: AuthQuery }).build()

    expect(config.services.auth).toBe(AuthQuery)
  })

  it('registers tx-only module', () => {
    const config = createChainConfig().addModule('move', { tx: MoveTxMsg }).build()

    expect(typeof config.msgs.move.execute).toBe('function')
    expect(typeof config.msgs.move.publish).toBe('function')
  })

  it('auto-generated builder creates valid Message', () => {
    const config = createChainConfig()
      .addModule('bank', { query: BankQuery, tx: BankTxMsg })
      .build()

    const msg = config.msgs.bank.send({
      fromAddress: 'init1sender',
      toAddress: 'init1receiver',
      amount: [coin('uinit', '1000000')],
    })

    expect(msg.typeUrl).toBe('/cosmos.bank.v1beta1.MsgSend')
    expect(msg.value.fromAddress).toBe('init1sender')
  })

  it('provides custom() and decode()', () => {
    const config = createChainConfig()
      .addModule('bank', { query: BankQuery, tx: BankTxMsg })
      .build()

    expect(typeof config.msgs.custom).toBe('function')
    expect(typeof config.msgs.decode).toBe('function')
  })

  it('decode() works for registered schemas', () => {
    const config = createChainConfig()
      .addModule('bank', { query: BankQuery, tx: BankTxMsg })
      .build()

    const msg = config.msgs.bank.send({
      fromAddress: 'init1sender',
      toAddress: 'init1receiver',
      amount: [coin('uinit', '1000000')],
    })

    const decoded = config.msgs.decode(msg.toAny())
    expect(decoded.typeUrl).toBe('/cosmos.bank.v1beta1.MsgSend')
  })

  it('rejects empty input', () => {
    expect(() => {
      createChainConfig().addModule('empty', {} as any)
    }).toThrow('at least one of query or tx')
  })

  it('throws ValidationError for addModule with empty input', async () => {
    const { ValidationError } = await import('../../src/errors')
    expect(() => {
      createChainConfig().addModule('bad', {} as any)
    }).toThrow(ValidationError)
  })

  it('throws ValidationError for invalid tx service (missing .method)', () => {
    // Passing an object without a .method property throws at addModule time
    // because extractSchemas validates the service structure
    expect(() => {
      createChainConfig().addModule('broken', { tx: { notAService: true } as any })
    }).toThrow('Expected a GenService with a .method record')
  })
})

describe('immutability', () => {
  it('addModule returns new builder without modifying original', () => {
    const base = createChainConfig().addModule('auth', { query: AuthQuery })

    const extended = base.addModule('bank', { query: BankQuery, tx: BankTxMsg })

    const baseConfig = base.build()
    const extendedConfig = extended.build()

    expect(baseConfig.services.auth).toBe(AuthQuery)
    expect((baseConfig.services as any).bank).toBeUndefined()
    expect(extendedConfig.services.auth).toBe(AuthQuery)
    expect(extendedConfig.services.bank).toBe(BankQuery)
  })
})

describe('addTypes', () => {
  it('returns new builder (copy-on-write)', () => {
    const base = createChainConfig()
    const withTypes = base.addTypes(file_cosmos_crypto_ed25519_keys)

    expect(base).not.toBe(withTypes)
  })

  it('registered types are in registry', () => {
    const config = createChainConfig().addTypes(file_cosmos_crypto_ed25519_keys).build()

    const desc = config.registry.getMessage('cosmos.crypto.ed25519.PubKey')
    expect(desc).toBeDefined()
  })
})

describe('module overwrite', () => {
  it('second addModule with same name replaces the first', () => {
    const config = createChainConfig()
      .addModule('bank', { query: BankQuery, tx: BankTxMsg })
      .addModule('bank', { query: AuthQuery })
      .build()

    // query replaced to AuthQuery
    expect(config.services.bank).toBe(AuthQuery)
    // tx was removed (second call had no tx)
    expect((config.msgs as any).bank).toBeUndefined()
  })
})

describe('build() idempotency', () => {
  it('multiple build() calls return equivalent configs', () => {
    const builder = createChainConfig().addModule('bank', { query: BankQuery, tx: BankTxMsg })

    const config1 = builder.build()
    const config2 = builder.build()

    expect(config1.services.bank).toBe(config2.services.bank)
    expect(typeof config1.msgs.bank.send).toBe('function')
    expect(typeof config2.msgs.bank.send).toBe('function')
  })
})

describe('multi-query addModule', () => {
  it('should accept array of query services', () => {
    const config = createChainConfig()
      .addModule('testMultiQuery', {
        query: [IbcChannelQuery, IbcClientQuery] as const,
      })
      .build()

    expect(config.services.testMultiQuery).toBeDefined()
    expect(Array.isArray(config.services.testMultiQuery)).toBe(true)
  })

  it('should accept single query service (backward compatible)', () => {
    const config = createChainConfig().addModule('authz', { query: AuthzQuery }).build()

    expect(config.services.authz).toBeDefined()
    expect(Array.isArray(config.services.authz)).toBe(false)
  })
})

describe('multi-source tx array', () => {
  it('merges methods from multiple services', () => {
    const config = createChainConfig()
      .addModule('ibcCore', { tx: [ChannelTxMsg, ClientTxMsg, ConnectionTxMsg] })
      .build()

    expect(typeof config.msgs.ibcCore.channelOpenInit).toBe('function')
    expect(typeof config.msgs.ibcCore.createClient).toBe('function')
    expect(typeof config.msgs.ibcCore.connectionOpenInit).toBe('function')
  })

  it('last service wins for duplicate method names', () => {
    // Register same service twice in array — second should override first
    const config = createChainConfig()
      .addModule('bank', { tx: [BankTxMsg, BankTxMsg] })
      .build()

    // Both are the same service, so methods should still work
    const msg = config.msgs.bank.send({
      fromAddress: 'init1a',
      toAddress: 'init1b',
      amount: [coin('uinit', '1000')],
    })
    expect(msg.typeUrl).toBe('/cosmos.bank.v1beta1.MsgSend')
  })

  it('multi-query stores DescService array and is accessible', () => {
    const config = createChainConfig()
      .addModule('ibc', {
        query: [IbcChannelQuery, IbcClientQuery],
      })
      .build()

    const ibcServices = config.services.ibc
    expect(Array.isArray(ibcServices)).toBe(true)
    expect((ibcServices as unknown[]).length).toBe(2)
  })
})
