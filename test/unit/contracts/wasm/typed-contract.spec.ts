import { describe, it, expectTypeOf } from 'vitest'
import type {
  ReadonlyWasmContractSchema,
  WasmExecuteProxyTyped,
  WasmQueryProxyTyped,
  TypedWasmContract,
} from '../../../../src/contracts/wasm/types'

// Define schema types directly to avoid eslint no-unused-vars on const values
type CW20Schema = {
  readonly execute: {
    readonly oneOf: readonly [
      {
        readonly required: readonly ['transfer']
        readonly properties: { readonly transfer: object }
      },
      { readonly required: readonly ['burn']; readonly properties: { readonly burn: object } },
      { readonly required: readonly ['send']; readonly properties: { readonly send: object } },
    ]
  }
  readonly query: {
    readonly oneOf: readonly [
      {
        readonly required: readonly ['balance']
        readonly properties: { readonly balance: object }
      },
      {
        readonly required: readonly ['token_info']
        readonly properties: { readonly token_info: object }
      },
    ]
  }
} & ReadonlyWasmContractSchema

type AnyOfSchema = {
  readonly execute: {
    readonly anyOf: readonly [
      { readonly required: readonly ['mint']; readonly properties: { readonly mint: object } },
      { readonly required: readonly ['burn']; readonly properties: { readonly burn: object } },
    ]
  }
} & ReadonlyWasmContractSchema

describe('TypedWasmContract type inference', () => {
  it('extracts execute variant names from oneOf', () => {
    type Exec = WasmExecuteProxyTyped<CW20Schema['execute']>
    expectTypeOf<Exec>().toHaveProperty('transfer')
    expectTypeOf<Exec>().toHaveProperty('burn')
    expectTypeOf<Exec>().toHaveProperty('send')
  })

  it('extracts query variant names from oneOf', () => {
    type Query = WasmQueryProxyTyped<CW20Schema['query']>
    expectTypeOf<Query>().toHaveProperty('balance')
    expectTypeOf<Query>().toHaveProperty('token_info')
  })

  it('TypedWasmContract has typed execute and query proxies', () => {
    type Contract = TypedWasmContract<CW20Schema>
    expectTypeOf<Contract['execute']>().toHaveProperty('transfer')
    expectTypeOf<Contract['execute']>().toHaveProperty('burn')
    expectTypeOf<Contract['query']>().toHaveProperty('balance')
    expectTypeOf<Contract['query']>().toHaveProperty('token_info')
  })

  it('extracts variant names from anyOf', () => {
    type Exec = WasmExecuteProxyTyped<NonNullable<AnyOfSchema['execute']>>
    expectTypeOf<Exec>().toHaveProperty('mint')
    expectTypeOf<Exec>().toHaveProperty('burn')
  })

  it('falls back to WasmExecuteProxy when no execute schema', () => {
    type EmptySchema = ReadonlyWasmContractSchema
    type Contract = TypedWasmContract<EmptySchema>
    // Should have index signature (string keys)
    expectTypeOf<Contract['execute']>().toBeObject()
  })
})
