import { describe, it, expect } from 'vitest'
import { create, createRegistry } from '@bufbuild/protobuf'
import { wrapResponse } from '../../../src/client/response'
import { initiaChain } from '../../../src/chains/initia'
import { minievmChain } from '../../../src/chains/minievm'
import { minimoveChain } from '../../../src/chains/minimove'
import { miniwasmChain } from '../../../src/chains/miniwasm'
import { createBaseConfig } from '../../../src/chains/common'

import { QueryAccountResponseSchema } from '@buf/cosmos_cosmos-sdk.bufbuild_es/cosmos/auth/v1beta1/query_pb'
import {
  BaseAccountSchema,
  file_cosmos_auth_v1beta1_auth,
} from '@buf/cosmos_cosmos-sdk.bufbuild_es/cosmos/auth/v1beta1/auth_pb'
import { anyPack } from '@bufbuild/protobuf/wkt'

describe('wrapResponse with Registry for Any fields', () => {
  function createAccountResponse() {
    const baseAccount = create(BaseAccountSchema, {
      address: 'init1test',
      accountNumber: 1n,
      sequence: 0n,
    })
    return create(QueryAccountResponseSchema, {
      account: anyPack(BaseAccountSchema, baseAccount),
    })
  }

  it('toJson() succeeds when registry is provided for Any field', () => {
    const response = createAccountResponse()
    const registry = createRegistry(file_cosmos_auth_v1beta1_auth)
    const wrapped = wrapResponse(QueryAccountResponseSchema, response, registry)
    const json = wrapped.toJson()
    expect(json).toBeDefined()
    expect((json as Record<string, unknown>).account).toBeDefined()
  })

  it('toJson() without registry throws on Any field', () => {
    const response = createAccountResponse()
    const wrapped = wrapResponse(QueryAccountResponseSchema, response)
    expect(() => wrapped.toJson()).toThrow()
  })

  it('toJson() allows user options to provide registry when no built-in', () => {
    const response = createAccountResponse()
    const wrapped = wrapResponse(QueryAccountResponseSchema, response)
    const registry = createRegistry(file_cosmos_auth_v1beta1_auth)
    const json = wrapped.toJson({ registry })
    expect(json).toBeDefined()
  })

  it('user-provided registry takes precedence over built-in registry', () => {
    const response = createAccountResponse()

    // Wrap with empty built-in registry (would fail if used for Any)
    const emptyRegistry = createRegistry()
    const wrapped = wrapResponse(QueryAccountResponseSchema, response, emptyRegistry)

    // User provides a complete registry — should take precedence and succeed
    const userRegistry = createRegistry(file_cosmos_auth_v1beta1_auth)
    const json = wrapped.toJson({ registry: userRegistry })
    expect(json).toBeDefined()
    expect((json as Record<string, unknown>).account).toBeDefined()
  })

  it('nested Any-wrapped field inherits registry from parent', () => {
    const response = createAccountResponse()
    const registry = createRegistry(file_cosmos_auth_v1beta1_auth)
    const wrapped = wrapResponse(QueryAccountResponseSchema, response, registry)

    // Access nested Any field — should also be wrapped with registry
    const nestedAccount = wrapped.account
    expect(nestedAccount).toBeDefined()
    const nestedJson = nestedAccount!.toJson()
    expect(nestedJson).toBeDefined()
  })
})

describe('Chain preset registries', () => {
  it('initiaChain registry resolves all expected types', () => {
    const registry = initiaChain.build().registry
    // Common types (inherited)
    expect(registry.getMessage('cosmos.crypto.ed25519.PubKey')).toBeDefined()
    expect(registry.getMessage('cosmos.crypto.secp256k1.PubKey')).toBeDefined()
    expect(registry.getMessage('cosmos.auth.v1beta1.BaseAccount')).toBeDefined()
    // Initia-specific types
    expect(registry.getMessage('initia.crypto.v1beta1.ethsecp256k1.PubKey')).toBeDefined()
    expect(registry.getMessage('initia.move.v1.ObjectAccount')).toBeDefined()
    expect(registry.getMessage('initia.move.v1.TableAccount')).toBeDefined()
  })

  it('minievmChain registry resolves common types', () => {
    const registry = minievmChain.build().registry
    expect(registry.getMessage('cosmos.crypto.ed25519.PubKey')).toBeDefined()
    expect(registry.getMessage('cosmos.crypto.secp256k1.PubKey')).toBeDefined()
    expect(registry.getMessage('cosmos.auth.v1beta1.BaseAccount')).toBeDefined()
  })

  it('minimoveChain registry resolves common types', () => {
    const registry = minimoveChain.build().registry
    expect(registry.getMessage('cosmos.crypto.ed25519.PubKey')).toBeDefined()
    expect(registry.getMessage('cosmos.crypto.secp256k1.PubKey')).toBeDefined()
    expect(registry.getMessage('cosmos.auth.v1beta1.BaseAccount')).toBeDefined()
  })

  it('miniwasmChain registry resolves common types', () => {
    const registry = miniwasmChain.build().registry
    expect(registry.getMessage('cosmos.crypto.ed25519.PubKey')).toBeDefined()
    expect(registry.getMessage('cosmos.crypto.secp256k1.PubKey')).toBeDefined()
    expect(registry.getMessage('cosmos.auth.v1beta1.BaseAccount')).toBeDefined()
  })

  it('base chain registry resolves common types', () => {
    const registry = createBaseConfig().build().registry
    expect(registry.getMessage('cosmos.crypto.ed25519.PubKey')).toBeDefined()
    expect(registry.getMessage('cosmos.crypto.secp256k1.PubKey')).toBeDefined()
    expect(registry.getMessage('cosmos.auth.v1beta1.BaseAccount')).toBeDefined()
  })
})
