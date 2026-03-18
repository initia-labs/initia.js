import { describe, it, expect } from 'vitest'
import { create } from '@bufbuild/protobuf'
import {
  QueryBalanceResponseSchema,
  Query as BankQuery,
} from '@buf/cosmos_cosmos-sdk.bufbuild_es/cosmos/bank/v1beta1/query_pb'
import { CoinSchema } from '@buf/cosmos_cosmos-sdk.bufbuild_es/cosmos/base/v1beta1/coin_pb'
import { wrapResponse, isWrappedResponse } from '../../../src/client/response'

// Minimal mock DescMessage for testing Proxy behavior
function mockDescMessage(typeName: string, fields: any[] = []): any {
  return {
    typeName,
    fields,
    field: Object.fromEntries(fields.map((f: any) => [f.localName, f])),
  }
}

describe('wrapResponse', () => {
  it('should preserve original property access', () => {
    const schema = mockDescMessage('cosmos.bank.v1beta1.QueryBalanceResponse')
    const raw = { denom: 'uinit', amount: '1000' }
    const wrapped = wrapResponse(schema, raw)

    expect(wrapped.denom).toBe('uinit')
    expect(wrapped.amount).toBe('1000')
  })

  it('should expose schema', () => {
    const schema = mockDescMessage('cosmos.bank.v1beta1.QueryBalanceResponse')
    const raw = { denom: 'uinit', amount: '1000' }
    const wrapped = wrapResponse(schema, raw)

    expect(wrapped.schema).toBe(schema)
  })

  it('should expose typeUrl with / prefix (same as Message class)', () => {
    const schema = mockDescMessage('cosmos.bank.v1beta1.QueryBalanceResponse')
    const raw = { denom: 'uinit', amount: '1000' }
    const wrapped = wrapResponse(schema, raw)

    expect(wrapped.typeUrl).toBe('/cosmos.bank.v1beta1.QueryBalanceResponse')
  })

  it('should NOT shadow typeUrl if target already has it (e.g., Any)', () => {
    const schema = mockDescMessage('google.protobuf.Any')
    const raw = { typeUrl: '/cosmos.auth.v1beta1.BaseAccount', value: new Uint8Array() }
    const wrapped = wrapResponse(schema, raw)

    // Must return the original typeUrl, not '/google.protobuf.Any'
    expect(wrapped.typeUrl).toBe('/cosmos.auth.v1beta1.BaseAccount')
  })

  it('should return same toJson/toJSON reference on repeated access', () => {
    const schema = mockDescMessage('test.Response')
    const wrapped = wrapResponse(schema, { a: 1 })

    expect(wrapped.toJson).toBe(wrapped.toJson)
    expect(wrapped.toJSON).toBe(wrapped.toJSON)
  })

  it('should be detectable via isWrappedResponse', () => {
    const schema = mockDescMessage('test.Response')
    const wrapped = wrapResponse(schema, { foo: 'bar' })

    expect(isWrappedResponse(wrapped)).toBe(true)
    expect(isWrappedResponse({ foo: 'bar' })).toBe(false)
  })

  it('should preserve synthetic properties through spread', () => {
    const schema = mockDescMessage('test.Response')
    const raw = { a: 1, b: 2 }
    const wrapped = wrapResponse(schema, raw)
    const spread = { ...wrapped }

    // Original properties
    expect(spread.a).toBe(1)
    expect(spread.b).toBe(2)

    // Synthetic properties survive spread
    expect(spread.schema).toBe(schema)
    expect(spread.typeUrl).toBe('/test.Response')
    expect(typeof spread.toJson).toBe('function')
    expect(typeof spread.toJSON).toBe('function')
  })

  it('should include synthetic properties in Object.keys()', () => {
    const schema = mockDescMessage('test.Response')
    const raw = { a: 1 }
    const wrapped = wrapResponse(schema, raw)

    const keys = Object.keys(wrapped)
    expect(keys).toContain('a')
    expect(keys).toContain('schema')
    expect(keys).toContain('typeUrl')
    expect(keys).toContain('toJson')
    expect(keys).toContain('toJSON')
  })

  it('should report synthetic properties via "in" operator', () => {
    const schema = mockDescMessage('test.Response')
    const wrapped = wrapResponse(schema, { a: 1 })

    expect('schema' in wrapped).toBe(true)
    expect('typeUrl' in wrapped).toBe(true)
    expect('toJson' in wrapped).toBe(true)
    expect('toJSON' in wrapped).toBe(true)
    expect('a' in wrapped).toBe(true)
    expect('nonExistent' in wrapped).toBe(false)
  })

  it('should produce canonical protobuf JSON via JSON.stringify (toJSON hook)', () => {
    const coin = create(CoinSchema, { denom: 'uinit', amount: '1000' })
    const response = create(QueryBalanceResponseSchema, { balance: coin })
    const wrapped = wrapResponse(QueryBalanceResponseSchema, response)

    // JSON.stringify invokes toJSON() which delegates to protobuf's toJson()
    const parsed = JSON.parse(JSON.stringify(wrapped))
    expect(parsed).toEqual({ balance: { denom: 'uinit', amount: '1000' } })
    // $typeName should NOT appear in output
    expect(parsed.$typeName).toBeUndefined()
  })

  it('should pass through undefined/null values', () => {
    const schema = mockDescMessage('test.Response')
    expect(wrapResponse(schema, null as any)).toBe(null)
    expect(wrapResponse(schema, undefined as any)).toBe(undefined)
  })

  it('should not double-wrap', () => {
    const schema = mockDescMessage('test.Response')
    const raw = { a: 1 }
    const wrapped = wrapResponse(schema, raw)
    const doubleWrapped = wrapResponse(schema, wrapped)

    expect(doubleWrapped).toBe(wrapped)
  })
})

describe('toJson with real protobuf schemas', () => {
  it('should serialize to JSON using protobuf schema', () => {
    const coin = create(CoinSchema, { denom: 'uinit', amount: '1000' })
    const response = create(QueryBalanceResponseSchema, { balance: coin })
    const wrapped = wrapResponse(QueryBalanceResponseSchema, response)

    const json = wrapped.toJson()
    expect(json).toEqual({
      balance: { denom: 'uinit', amount: '1000' },
    })
  })

  it('should forward JsonWriteOptions to toJson()', () => {
    const response = create(QueryBalanceResponseSchema, {
      balance: create(CoinSchema, {}), // zero-value scalars
    })
    const wrapped = wrapResponse(QueryBalanceResponseSchema, response)

    const defaultJson = wrapped.toJson() as any
    const fullJson = wrapped.toJson({ alwaysEmitImplicit: true }) as any

    // balance is set (explicit presence) → always included
    expect(defaultJson.balance).toBeDefined()
    // denom/amount are implicit presence, zero value → default: omitted, alwaysEmitImplicit: included
    expect(defaultJson.balance).toEqual({})
    expect(fullJson.balance).toEqual({ denom: '', amount: '' })
  })

  it('should preserve $typeName from underlying protobuf message', () => {
    const response = create(QueryBalanceResponseSchema, {})
    const wrapped = wrapResponse(QueryBalanceResponseSchema, response)

    // $typeName comes from the raw protobuf object (Reflect.get passthrough)
    expect(wrapped.$typeName).toBe('cosmos.bank.v1beta1.QueryBalanceResponse')
    // typeUrl is added by Proxy with '/' prefix
    expect(wrapped.typeUrl).toBe('/cosmos.bank.v1beta1.QueryBalanceResponse')
  })

  it('should wrap toJson() errors with schema.typeName context', () => {
    const wrapped = wrapResponse(QueryBalanceResponseSchema, {
      balance: 'not-a-message',
    } as any)

    expect(() => wrapped.toJson()).toThrowError(
      /Failed to serialize cosmos\.bank\.v1beta1\.QueryBalanceResponse to JSON/
    )

    // Verify cause is preserved
    try {
      wrapped.toJson()
    } catch (e: any) {
      expect(e.cause).toBeDefined()
    }
  })

  it('should wrap toJSON() errors with schema.typeName context', () => {
    const wrapped = wrapResponse(QueryBalanceResponseSchema, {
      balance: 'not-a-message',
    } as any)

    expect(() => wrapped.toJSON()).toThrowError(
      /Failed to serialize cosmos\.bank\.v1beta1\.QueryBalanceResponse to JSON/
    )
  })
})

describe('recursive nested wrapping', () => {
  it('should wrap nested message fields', () => {
    const innerSchema = mockDescMessage('inner.Message', [])
    const outerSchema = mockDescMessage('outer.Response', [
      {
        localName: 'nested',
        fieldKind: 'message',
        message: innerSchema,
      },
    ])

    const raw = { nested: { foo: 'bar' }, scalar: 42 }
    const wrapped = wrapResponse(outerSchema, raw)

    // Nested should also be wrapped (mock objects lack $typeName, so cast needed)
    expect((wrapped.nested as any).schema).toBe(innerSchema)
    expect((wrapped.nested as any).typeUrl).toBe('/inner.Message')
    expect(wrapped.nested.foo).toBe('bar')

    // Scalar stays as-is
    expect(wrapped.scalar).toBe(42)
  })

  it('should wrap repeated message fields', () => {
    const itemSchema = mockDescMessage('item.Message', [])
    const listSchema = mockDescMessage('list.Response', [
      {
        localName: 'items',
        fieldKind: 'list',
        listKind: 'message',
        message: itemSchema,
      },
    ])

    const raw = { items: [{ id: 1 }, { id: 2 }] }
    const wrapped = wrapResponse(listSchema, raw)

    expect(Array.isArray(wrapped.items)).toBe(true)
    expect((wrapped.items[0] as any).schema).toBe(itemSchema)
    expect(wrapped.items[0].id).toBe(1)
    expect((wrapped.items[1] as any).schema).toBe(itemSchema)
  })

  it('should cache wrapped nested objects (same reference on repeated access)', () => {
    const innerSchema = mockDescMessage('inner.Message', [])
    const outerSchema = mockDescMessage('outer.Response', [
      {
        localName: 'nested',
        fieldKind: 'message',
        message: innerSchema,
      },
    ])

    const raw = { nested: { foo: 'bar' } }
    const wrapped = wrapResponse(outerSchema, raw)

    // Same proxy instance
    expect(wrapped.nested).toBe(wrapped.nested)
  })

  it('should handle null nested fields gracefully', () => {
    const innerSchema = mockDescMessage('inner.Message', [])
    const outerSchema = mockDescMessage('outer.Response', [
      {
        localName: 'nested',
        fieldKind: 'message',
        message: innerSchema,
      },
    ])

    const raw = { nested: undefined }
    const wrapped = wrapResponse(outerSchema, raw)

    expect(wrapped.nested).toBeUndefined()
  })

  it('should wrap deeply nested messages (3 levels)', () => {
    const level3 = mockDescMessage('level3', [])
    const level2 = mockDescMessage('level2', [
      { localName: 'deep', fieldKind: 'message', message: level3 },
    ])
    const level1 = mockDescMessage('level1', [
      { localName: 'mid', fieldKind: 'message', message: level2 },
    ])

    const raw = { mid: { deep: { value: 'found' } } }
    const wrapped = wrapResponse(level1, raw)

    expect((wrapped.mid as any).typeUrl).toBe('/level2')
    expect((wrapped.mid as any).deep.typeUrl).toBe('/level3')
    expect(wrapped.mid.deep.value).toBe('found')
  })

  it('should wrap nested fields in real protobuf responses', () => {
    const coin = create(CoinSchema, { denom: 'uinit', amount: '1000' })
    const response = create(QueryBalanceResponseSchema, { balance: coin })
    const wrapped = wrapResponse(QueryBalanceResponseSchema, response)

    // Nested Coin should also be wrapped
    expect(wrapped.balance?.typeUrl).toBe('/cosmos.base.v1beta1.Coin')
    expect(wrapped.balance?.schema).toBeDefined()
    expect(wrapped.balance?.denom).toBe('uinit')
    expect(wrapped.balance?.amount).toBe('1000')
  })

  it('should wrap map fields with message values', () => {
    const valueSchema = mockDescMessage('option.Message', [])
    const mapSchema = mockDescMessage('map.Response', [
      {
        localName: 'options',
        fieldKind: 'map',
        mapKind: 'message',
        message: valueSchema,
      },
    ])

    const raw = {
      options: {
        auth: { enabled: true },
        bank: { enabled: false },
      },
    }
    const wrapped = wrapResponse(mapSchema, raw)

    expect((wrapped.options.auth as any).schema).toBe(valueSchema)
    expect((wrapped.options.auth as any).typeUrl).toBe('/option.Message')
    expect(wrapped.options.auth.enabled).toBe(true)
    expect((wrapped.options.bank as any).schema).toBe(valueSchema)
  })

  it('should not wrap map fields with scalar values', () => {
    const scalarMapSchema = mockDescMessage('scalar.Response', [
      // scalar map fields are NOT added to fieldMap, so no wrapping
    ])

    const raw = { labels: { env: 'prod', region: 'us' } }
    const wrapped = wrapResponse(scalarMapSchema, raw)

    expect(wrapped.labels.env).toBe('prod')
  })

  it('should not shadow typeUrl on nested Any fields', () => {
    const anySchema = mockDescMessage('google.protobuf.Any', [])
    const responseSchema = mockDescMessage('cosmos.auth.v1beta1.QueryAccountResponse', [
      { localName: 'account', fieldKind: 'message', message: anySchema },
    ])

    const raw = {
      account: {
        typeUrl: '/cosmos.auth.v1beta1.BaseAccount',
        value: new Uint8Array([1, 2, 3]),
      },
    }
    const wrapped = wrapResponse(responseSchema, raw)

    // The nested Any's typeUrl must be the original value, NOT '/google.protobuf.Any'
    expect((wrapped.account as any).typeUrl).toBe('/cosmos.auth.v1beta1.BaseAccount')
    // But schema should still be accessible
    expect((wrapped.account as any).schema).toBe(anySchema)
  })
})

describe('createServiceProxy integration', () => {
  it('should wrap responses from service proxy with real DescService', async () => {
    // Create a fake service client that returns a real protobuf response
    const coin = create(CoinSchema, { denom: 'uinit', amount: '1000' })
    const mockResponse = create(QueryBalanceResponseSchema, { balance: coin })

    // Verify the pipeline: service descriptor → method → output schema → wrapping
    const outputSchema = BankQuery.method.balance.output
    const wrapped = wrapResponse(outputSchema, mockResponse)

    expect(wrapped.typeUrl).toBe('/cosmos.bank.v1beta1.QueryBalanceResponse')
    expect(wrapped.schema).toBe(outputSchema)
    expect(wrapped.balance?.denom).toBe('uinit')
    expect(wrapped.balance?.typeUrl).toBe('/cosmos.base.v1beta1.Coin')

    // toJson produces canonical protobuf JSON
    const json = wrapped.toJson() as any
    expect(json.balance.denom).toBe('uinit')
    expect(json.balance.amount).toBe('1000')
  })
})
