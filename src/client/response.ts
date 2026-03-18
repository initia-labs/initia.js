import type {
  DescMessage,
  DescField,
  Message,
  MessageShape,
  JsonValue,
  JsonWriteOptions,
  Registry,
} from '@bufbuild/protobuf'
import { toJson } from '@bufbuild/protobuf'

const WRAPPED_MARKER = Symbol.for('initia.wrappedResponse')

// Synthetic property names added by the Proxy wrapper.
// Included in ownKeys so they survive spread/destructuring and appear in Object.keys().
// WRAPPED_MARKER (Symbol) is intentionally excluded — internal detection sentinel,
// should not leak through enumeration.
const SYNTHETIC_KEYS = ['schema', 'typeUrl', 'toJson', 'toJSON'] as const

// =============================================================================
// Field Map Cache (WeakMap per DescMessage — build once per schema type)
// =============================================================================

type FieldMap = Map<string, DescField>
const fieldMapCache = new WeakMap<DescMessage, FieldMap>()

function getFieldMap(schema: DescMessage): FieldMap {
  let map = fieldMapCache.get(schema)
  if (!map) {
    map = new Map()
    for (const field of schema.fields) {
      const isMessageField =
        field.fieldKind === 'message' ||
        (field.fieldKind === 'list' && field.listKind === 'message') ||
        (field.fieldKind === 'map' && field.mapKind === 'message')
      if (isMessageField) {
        map.set(field.localName, field)
      }
    }
    fieldMapCache.set(schema, map)
  }
  return map
}

// =============================================================================
// Response Wrapper
// =============================================================================

/**
 * Wrap a gRPC response with a Proxy that adds schema, typeUrl, and toJson()
 * while preserving depth — property access stays identical.
 *
 * - `schema`: The DescMessage schema descriptor
 * - `typeUrl`: '/' + schema.typeName (same pattern as Message class)
 * - `toJson(options?)`: Canonical protobuf JSON serialization with optional JsonWriteOptions
 * - `toJSON()`: Called by JSON.stringify(), delegates to toJson() with no options
 *
 * **Shadowing rules**:
 * - `schema` and `typeUrl` are non-shadowing: if the underlying object already
 *   has these properties, the original values pass through unchanged.
 * - `toJson` and `toJSON` always shadow the underlying object's methods to
 *   ensure consistent protobuf JSON serialization.
 *
 * Nested message-type fields are recursively wrapped using the field's
 * DescMessage from the schema descriptor. Supported field kinds:
 * - `fieldKind: 'message'` — single nested message
 * - `fieldKind: 'list', listKind: 'message'` — repeated message
 * - `fieldKind: 'map', mapKind: 'message'` — map with message values
 *
 * Field maps are cached per schema via WeakMap for O(1) lookup after first access.
 * Assumes protobuf-es message immutability — nestedCache may return stale data
 * if underlying fields are mutated after wrapping.
 *
 * Protobuf's own `$typeName` passes through from the underlying message.
 *
 * @param schema - The DescMessage schema descriptor for the response type
 * @param value - The raw gRPC response object to wrap
 * @param registry - Optional protobuf Registry for google.protobuf.Any serialization.
 *   When provided, injected as default registry into toJson() calls.
 *   Callers can override it by passing their own `registry` in JsonWriteOptions.
 *   Propagated to all recursively wrapped nested message fields.
 */
export function wrapResponse<T extends object>(
  schema: DescMessage,
  value: T,
  registry?: Registry
): WrappedResponse<T> {
  // eslint-disable-next-line @typescript-eslint/no-unsafe-return, @typescript-eslint/no-explicit-any
  if (value == null || typeof value !== 'object') return value as any

  // Don't double-wrap
  // eslint-disable-next-line @typescript-eslint/no-unsafe-return, @typescript-eslint/no-explicit-any
  if (WRAPPED_MARKER in value) return value as any

  const fieldMap = getFieldMap(schema)
  const nestedCache = new Map<string, unknown>()
  const msg = value as MessageShape<typeof schema>
  const toJsonFn = (options?: Partial<JsonWriteOptions>) => {
    try {
      // Inject built-in registry as default; user-provided registry takes precedence.
      let mergedOptions = options
      if (registry && !options?.registry) {
        mergedOptions = { ...options, registry }
      }
      return toJson(schema, msg, mergedOptions)
    } catch (e) {
      const cause = e instanceof Error ? e.message : String(e)
      throw new Error(`Failed to serialize ${schema.typeName} to JSON: ${cause}`, { cause: e })
    }
  }
  const toJSONFn = () => toJsonFn()

  const proxy = new Proxy(value, {
    get(target, prop, receiver) {
      if (prop === WRAPPED_MARKER) return true
      if (prop === 'schema' && !Reflect.has(target, prop)) return schema
      if (prop === 'typeUrl' && !Reflect.has(target, prop)) return '/' + schema.typeName
      if (prop === 'toJson') return toJsonFn
      if (prop === 'toJSON') return toJSONFn

      const raw = Reflect.get(target, prop, receiver)

      // Recursively wrap message-type fields
      if (typeof prop === 'string' && fieldMap.has(prop) && raw != null) {
        if (nestedCache.has(prop)) return nestedCache.get(prop)

        const field = fieldMap.get(prop)!
        let wrapped: unknown

        if (field.fieldKind === 'message') {
          wrapped = wrapResponse(field.message, raw as object, registry)
        } else if (field.fieldKind === 'list' && field.listKind === 'message') {
          const arr = raw as object[]
          wrapped = arr.map(item => wrapResponse(field.message, item, registry))
        } else if (field.fieldKind === 'map' && field.mapKind === 'message') {
          const entries = Object.entries(raw as Record<string, object>)
          wrapped = Object.fromEntries(
            entries.map(([k, v]) => [k, wrapResponse(field.message, v, registry)])
          )
        } else {
          // Unreachable — getFieldMap only includes message-type fields.
          // If this fires, getFieldMap and wrapping logic are out of sync.
          throw new Error(
            `[initia.js] Internal error: unexpected field kind for ${prop}: ${field.fieldKind}. ` +
              'getFieldMap and wrapping logic are out of sync.'
          )
        }

        if (wrapped !== undefined) {
          nestedCache.set(prop, wrapped)
          return wrapped
        }
      }

      return raw
    },

    has(target, prop) {
      if (prop === WRAPPED_MARKER || prop === 'schema' || prop === 'toJson' || prop === 'toJSON')
        return true
      if (prop === 'typeUrl') return true // either from target or computed
      return Reflect.has(target, prop)
    },

    ownKeys(target) {
      const keys = Reflect.ownKeys(target)
      for (const k of SYNTHETIC_KEYS) {
        if (!keys.includes(k)) keys.push(k)
      }
      return keys
    },

    getOwnPropertyDescriptor(target, prop) {
      if (prop === 'schema' && !Reflect.has(target, 'schema'))
        return { configurable: true, enumerable: true, writable: false, value: schema }
      if (prop === 'typeUrl' && !Reflect.has(target, 'typeUrl'))
        return {
          configurable: true,
          enumerable: true,
          writable: false,
          value: '/' + schema.typeName,
        }
      if (prop === 'typeUrl') return Reflect.getOwnPropertyDescriptor(target, prop)
      if (prop === 'toJson')
        return { configurable: true, enumerable: true, writable: false, value: toJsonFn }
      if (prop === 'toJSON')
        return { configurable: true, enumerable: true, writable: false, value: toJSONFn }
      return Reflect.getOwnPropertyDescriptor(target, prop)
    },
  })
  return proxy as WrappedResponse<T>
}

// =============================================================================
// Type Guard & Types
// =============================================================================

/**
 * Type guard: check if a value is a wrapped gRPC response.
 * Generic preserves the input type through narrowing:
 *   isWrappedResponse(coin) → coin is WrappedResponse<Coin>
 */
export function isWrappedResponse<T>(value: T): value is WrappedResponse<T> {
  return value != null && typeof value === 'object' && WRAPPED_MARKER in (value as object)
}

/** Synthetic properties added by the response wrapper Proxy. */
type WrappedProps = {
  /** The protobuf schema descriptor. */
  readonly schema: DescMessage
  /** Type URL with '/' prefix (e.g., '/cosmos.bank.v1beta1.QueryBalanceResponse') */
  readonly typeUrl: string
  /** Serialize to canonical protobuf JSON. */
  toJson(options?: Partial<JsonWriteOptions>): JsonValue
  /** Called by JSON.stringify(). Returns canonical protobuf JSON (no options). */
  toJSON(): JsonValue
}

/**
 * Recursively wraps nested protobuf message fields with WrappedProps.
 * - Single message fields (`balance?: Coin`) → `WrappedResponse<Coin> | undefined`
 * - Repeated message fields (`validators: Validator[]`) → `WrappedResponse<Validator>[]`
 * - Map fields with message values (`{ [key: string]: Msg }`) → `Record<string, WrappedResponse<Msg>>`
 * - Scalar / Uint8Array / non-message fields pass through unchanged.
 *
 * Map detection uses `string extends keyof T[K]` to distinguish index signatures
 * from named properties, preventing false positives on `{ a: Msg; b: Msg }`.
 */
type DeepWrapFields<T> = {
  [K in keyof T]: T[K] extends Message | undefined
    ? WrappedResponse<NonNullable<T[K]>> | Extract<T[K], undefined>
    : T[K] extends (infer U)[]
      ? U extends Message
        ? WrappedResponse<U>[]
        : T[K]
      : string extends keyof T[K]
        ? T[K] extends Record<string, infer V>
          ? V extends Message
            ? Record<string, WrappedResponse<V>>
            : T[K]
          : T[K]
        : T[K]
}

/**
 * A gRPC response enhanced with schema access and JSON serialization.
 * Nested message fields are also recursively wrapped with the same properties.
 *
 * **Spread/destructuring**: `{ ...wrapped }` copies all properties including
 * synthetic ones (`schema`, `typeUrl`, `toJson`, `toJSON`) and nested Proxy-wrapped
 * fields. The spread result itself is a plain object (not a Proxy), so
 * `isWrappedResponse({ ...wrapped })` returns false.
 */
export type WrappedResponse<T = unknown> = T & WrappedProps & DeepWrapFields<T>

/**
 * Transforms Promise return types to include WrappedResponse.
 * Non-Promise types (e.g., AsyncIterable for streaming) pass through unchanged.
 */
export type WrapReturnType<T> = T extends Promise<infer O> ? Promise<WrappedResponse<O>> : T
