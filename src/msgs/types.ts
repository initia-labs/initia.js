/**
 * Message builder type definitions.
 *
 * Each chain type has its own message interface with chain-specific module namespaces.
 * All Cosmos SDK, IBC, Initia-specific, and VM-specific modules are available as
 * first-class builders. For any message not covered by your chain's modules,
 * use `msgs.custom()`. To decode a protobuf Any from on-chain data,
 * use `msgs.decode(any)`.
 *
 * @example
 * ```typescript
 * // Use a module builder (recommended)
 * const msg = msgs.bank.send({ fromAddress, toAddress, amount })
 *
 * // Use custom() for any proto schema
 * const msg = msgs.custom(SomeSchema, { field: '...' })
 * ```
 */

import type { DescMessage, DescField, MessageInitShape, MessageShape } from '@bufbuild/protobuf'
import { type Any, anyUnpack, timestampFromDate } from '@bufbuild/protobuf/wkt'
import { ScalarType, create, toJson as msgToJson } from '@bufbuild/protobuf'
import { anyPack } from '../util/any'
import { hexToBytes } from '../util/hex'
import { toAmino as protoToAmino, type AminoMsg } from '../tx/amino'
import { InitiaError, ValidationError, ParseError } from '../errors'
import type { Coin } from '../core/coin'
import { CoinSchema } from '@buf/cosmos_cosmos-sdk.bufbuild_es/cosmos/base/v1beta1/coin_pb'

// Chain-specific message types are derived from ChainConfigBuilder in chain-types.ts
// (kept separate to avoid circular: chain-config.ts → msgs/types.ts → chains/*.ts → chain-config.ts)
export type {
  InitiaMsgs,
  MinievmMsgs,
  MinimoveMsgs,
  MiniwasmMsgs,
  BaseMsgs,
  MsgsForChain,
} from './chain-types'

/**
 * Human-readable JSON representation of a message.
 */
export interface JsonMsg {
  typeUrl: string
  value: Record<string, unknown>
}

/**
 * Transaction message with schema and value.
 *
 * Holds the protobuf schema alongside the message value, enabling
 * conversion to both proto Any (for direct signing) and Amino format
 * (for amino/eip191 signing) from a single source.
 *
 * @example
 * ```typescript
 * // High-level (via msg builders — no schema knowledge needed)
 * const msg = msgs.bank.send({ fromAddress: from, toAddress: to, amount })
 *
 * // Mid-level (raw proto init — no Coin/Date/hex transforms applied)
 * const msg = new Message(MsgUnjailSchema, { validatorAddr: '...' })
 *
 * // Low-level (custom amino conversion)
 * const msg = new Message(CustomSchema, data, {
 *   toAmino: (v) => ({ type: 'custom/Msg', value: { field: v.someField } })
 * })
 * ```
 */
export class Message<T extends DescMessage = DescMessage> {
  // _schema and _value are undefined for rawAny messages (created via fromAny(Any) single-arg).
  // Accessors that depend on schema/value must call assertDecoded() first.
  private _schema?: T
  private _value?: MessageShape<T>
  private _rawAny?: Any
  private _aminoOverride?: (value: MessageShape<T>) => AminoMsg

  constructor(
    schema: T,
    init: MessageInitShape<T>,
    options?: { toAmino?: (value: MessageShape<T>) => AminoMsg }
  ) {
    this._schema = schema
    this._value = create(schema, init)
    if (options?.toAmino) this._aminoOverride = options.toAmino
  }

  /** Whether this message has decoded schema and value accessible (not a pre-packed Any). */
  get isDecoded(): boolean {
    return !this._rawAny
  }

  private assertDecoded(operation: string): void {
    if (this._rawAny) {
      throw new InitiaError(
        `Cannot ${operation} on a pre-packed Any message. ` +
          'Use Message.fromAny(schema, any) to decode with a specific schema.'
      )
    }
  }

  /** Protobuf schema descriptor. Throws on pre-packed Any messages. */
  get schema(): T {
    this.assertDecoded('access schema')
    return this._schema as T
  }

  /** Decoded message value. Throws on pre-packed Any messages. */
  get value(): MessageShape<T> {
    this.assertDecoded('access value')
    return this._value as MessageShape<T>
  }

  /** Convert to Amino format for amino/eip191 signing. */
  toAmino(): AminoMsg {
    this.assertDecoded('convert to Amino')
    if (this._aminoOverride) return this._aminoOverride(this._value!)
    return protoToAmino(this._schema!, this._value!)
  }

  /**
   * Convert to human-readable JSON.
   *
   * @example
   * ```typescript
   * const msg = msgs.bank.send({ fromAddress: 'init1from...', toAddress: 'init1to...', amount: coin('uinit', '1000000') })
   * msg.toJson()
   * // → { typeUrl: "/cosmos.bank.v1beta1.MsgSend",
   * //     value: { fromAddress: "init1from...", toAddress: "init1to...", amount: [...] } }
   * ```
   */
  toJson(): JsonMsg {
    this.assertDecoded('convert to JSON')
    return {
      typeUrl: '/' + this._schema!.typeName,
      value: msgToJson(this._schema!, this._value!) as Record<string, unknown>,
    }
  }

  /** Pack as protobuf Any for direct signing / TxBody. */
  toAny(): Any {
    if (this._rawAny) return this._rawAny
    return anyPack(this._schema!, this._value!)
  }

  /** Type URL for this message (e.g., '/cosmos.bank.v1beta1.MsgSend'). */
  get typeUrl(): string {
    if (this._rawAny) return this._rawAny.typeUrl
    return '/' + this._schema!.typeName
  }

  /**
   * Create a Message from a protobuf Any.
   *
   * Two modes:
   * - `fromAny(any)` — wraps as DIRECT-only Message. toAny()/typeUrl work;
   *   toAmino()/toJson()/schema/value throw. Used for opaque messages from
   *   external systems (e.g., Router API).
   * - `fromAny(schema, any)` — decodes into a full Message with all features.
   *   Throws ParseError if the Any typeUrl doesn't match the schema.
   */
  static fromAny(any: Any): Message
  static fromAny<T extends DescMessage>(schema: T, any: Any): Message<T>
  static fromAny<T extends DescMessage>(first: T | Any, second?: Any): Message | Message<T> {
    if (second !== undefined) {
      const schema = first as T
      const value = anyUnpack(second, schema)
      if (!value) {
        throw new ParseError(
          'message',
          `fromAny type mismatch: expected /${schema.typeName}, got ${second.typeUrl}`
        )
      }
      return new Message(schema, value)
    }
    const packed = first as Any
    if (!packed.typeUrl || typeof packed.typeUrl !== 'string') {
      throw new ValidationError(
        'Any',
        `fromAny() requires an Any object with a valid typeUrl string, got: ${String(packed.typeUrl)}`
      )
    }
    if (!(packed.value instanceof Uint8Array)) {
      throw new ValidationError(
        'Any',
        `fromAny() requires Any.value to be a Uint8Array, got: ${typeof packed.value}`
      )
    }
    const msg = Object.create(Message.prototype) as Message
    msg._rawAny = packed
    return msg
  }
}

/**
 * Flexible message input accepted by signAndBroadcast, createTx, etc.
 *
 * - `Message` — from msg builders, `msgs.custom(schema, init)`, or `new Message(schema, init)`
 * - `Any` — pre-serialized protobuf (DIRECT signing only)
 */
export type MsgInput = Message | Any

/**
 * Normalize a MsgInput to a Message instance.
 * @internal
 */
export function normalizeMsg(input: MsgInput): Message {
  if (input instanceof Message) return input
  if (typeof input !== 'object' || input === null) {
    throw new ValidationError(
      'MsgInput',
      `Expected a Message instance or an Any object, got: ${String(input)}`
    )
  }
  // Message.fromAny validates typeUrl (string, non-empty) and value (Uint8Array)
  return Message.fromAny(input)
}

// =============================================================================
// FriendlyInit type system and normalizeInit
// =============================================================================

type CoinInput = Coin | Coin[]
type BytesInput = Uint8Array | string
type AnyShape = { typeUrl: string; value: Uint8Array; $typeName: 'google.protobuf.Any' }
type TimestampShape = { seconds: bigint; nanos: number; $typeName: 'google.protobuf.Timestamp' }
type CoinShape = { denom: string; amount: string; $typeName: 'cosmos.base.v1beta1.Coin' }

/**
 * Recursive type transformer for ergonomic init objects.
 *
 * Array handling uses Extract<E, Shape> to detect element union members
 * without triggering distributive conditionals on the full union.
 * Singular fields use NonNullable wrapping to avoid distributive evaluation,
 * checking the full type against shape literals.
 * Shape types include $typeName literals to prevent false-positive structural matches
 * against unrelated types that happen to share similar fields.
 */
type DeepFriendly<T> = T extends null | undefined
  ? T
  : NonNullable<T> extends (infer E)[]
    ? [Extract<E, AnyShape>] extends [never]
      ? [Extract<E, CoinShape>] extends [never]
        ? DeepFriendly<E>[]
        : CoinInput
      : Message[] | T
    : NonNullable<T> extends AnyShape
      ? Message | T
      : NonNullable<T> extends CoinShape
        ? Coin | T
        : NonNullable<T> extends TimestampShape
          ? Date | T
          : NonNullable<T> extends bigint
            ? bigint | number
            : NonNullable<T> extends Uint8Array
              ? BytesInput
              : // eslint-disable-next-line @typescript-eslint/no-explicit-any
                T extends Record<string, any>
                ? { [K in keyof T]: DeepFriendly<T[K]> }
                : T

/**
 * Ergonomic init type — all keys required.
 *
 * Proto-optional fields allow `undefined` as a value but the key must be specified.
 * Use WithDefaults on module builders to make specific keys truly optional.
 * This ensures core fields like amount, members are never accidentally omitted.
 */
export type FriendlyInit<S extends DescMessage> = {
  [K in keyof MessageShape<S> & keyof MessageInitShape<S> as K extends '$typeName' | '$unknown'
    ? never
    : K]: undefined extends MessageInitShape<S>[K]
    ? DeepFriendly<MessageInitShape<S>[K]>
    : DeepFriendly<NonNullable<MessageInitShape<S>[K]>>
}

/** Make specific keys optional (for builders with defaults like IBC transfer). */
export type WithDefaults<T, K extends keyof T> = Omit<T, K> & Partial<Pick<T, K>>

/**
 * Ergonomic init type for custom() — preserves proto optionality.
 *
 * Unlike FriendlyInit (all fields required), this maps directly from
 * MessageInitShape so proto-optional fields keep their `?:` marker.
 * Still applies DeepFriendly transforms (Coin, Date, hex string, etc.).
 *
 * Used only by custom() where there's no module-level WithDefaults
 * to control which fields are optional.
 */
export type FriendlyCustomInit<S extends DescMessage> = {
  [K in keyof MessageInitShape<S> as K extends '$typeName' | '$unknown' ? never : K]: DeepFriendly<
    MessageInitShape<S>[K]
  >
}

// ---- Coin helpers ----

const COIN_TYPE_NAME = 'cosmos.base.v1beta1.Coin'

/** Convert an SDK {@link Coin} to a proto Coin message. Validates denom (non-empty string) and amount (non-negative integer string or safe integer). */
export function toProtoCoin(c: Coin) {
  if (!c || typeof c !== 'object') {
    throw new ValidationError('coin', `Expected a Coin object, got: ${String(c)}`)
  }
  if (typeof c.denom !== 'string' || !c.denom) {
    throw new ValidationError(
      'coin',
      `Coin must have a non-empty "denom" field, got: ${JSON.stringify(c)}`
    )
  }
  if (c.amount == null) {
    throw new ValidationError('coin', `Coin must have an "amount" field, got: ${JSON.stringify(c)}`)
  }
  // Runtime guard for JS consumers who may pass number instead of string
  if (typeof c.amount === 'number') {
    if (!Number.isSafeInteger(c.amount) || c.amount < 0) {
      throw new ValidationError(
        'coin',
        `Coin amount as number must be a non-negative safe integer, got: ${String(c.amount)}`
      )
    }
  }
  const amountStr = String(c.amount)
  if (!/^\d+$/.test(amountStr)) {
    throw new ValidationError(
      'coin',
      `Coin amount must be a non-negative integer string, got: "${amountStr}"`
    )
  }
  return create(CoinSchema, { denom: c.denom, amount: amountStr })
}

/** Convert one or more SDK {@link Coin}s to an array of proto Coin messages. Returns `[]` for null/undefined. */
export function toProtoCoins(amount?: Coin | Coin[]) {
  if (amount == null) return []
  const arr = Array.isArray(amount) ? amount : [amount]
  return arr.map(toProtoCoin)
}

export { hexToBytes } from '../util/hex'

// ---- Schema field analysis cache ----

interface FieldAnalysis {
  coinListFields: Set<string>
  coinSingularFields: Set<string>
  bytesFields: Set<string>
  bigintFields: Set<string>
  fieldMap: Map<string, DescField>
}

const fieldAnalysisCache = new WeakMap<DescMessage, FieldAnalysis>()

const BIGINT_SCALARS = new Set([
  ScalarType.INT64,
  ScalarType.UINT64,
  ScalarType.SINT64,
  ScalarType.FIXED64,
  ScalarType.SFIXED64,
])

function analyzeFields(schema: DescMessage): FieldAnalysis {
  let cached = fieldAnalysisCache.get(schema)
  if (cached) return cached

  const coinListFields = new Set<string>()
  const coinSingularFields = new Set<string>()
  const bytesFields = new Set<string>()
  const bigintFields = new Set<string>()
  const fieldMap = new Map<string, DescField>()

  for (const field of schema.fields) {
    fieldMap.set(field.localName, field)
    // Map fields with Coin values are handled by the map branch in normalizeInit
    if (field.fieldKind !== 'map' && field.message?.typeName === COIN_TYPE_NAME) {
      if (field.fieldKind === 'list') {
        coinListFields.add(field.localName)
      } else {
        coinSingularFields.add(field.localName)
      }
    } else if (field.fieldKind === 'scalar') {
      if (field.scalar === ScalarType.BYTES) {
        bytesFields.add(field.localName)
      } else if (BIGINT_SCALARS.has(field.scalar)) {
        bigintFields.add(field.localName)
      }
    }
  }

  cached = { coinListFields, coinSingularFields, bytesFields, bigintFields, fieldMap }
  fieldAnalysisCache.set(schema, cached)
  return cached
}

/**
 * Runtime normalization using schema field descriptors.
 * Recursive: nested message fields and map values are normalized at every depth.
 * Oneof members are handled implicitly as regular fields.
 */
export function normalizeInit<S extends DescMessage>(
  schema: S,
  init: FriendlyInit<S> | FriendlyCustomInit<S>
): MessageInitShape<S> {
  if (init == null || typeof init !== 'object') {
    throw new ValidationError(
      schema.typeName,
      `Expected an init object for ${schema.typeName}, got: ${String(init)}`
    )
  }
  const { coinListFields, coinSingularFields, bytesFields, bigintFields, fieldMap } =
    analyzeFields(schema)
  const result: Record<string, unknown> = {}

  for (const [key, value] of Object.entries(init as Record<string, unknown>)) {
    // Skip proto metadata keys
    if (key === '$typeName' || key === '$unknown') continue

    // Validate key exists in schema (catches typos like 'froAddress')
    if (!fieldMap.has(key)) {
      const validKeys = [...fieldMap.keys()]
      throw new ValidationError(
        key,
        `Unknown field "${key}" for ${schema.typeName}. Valid fields: ${validKeys.join(', ')}`
      )
    }

    if (value == null) {
      result[key] = value
      continue
    }

    if (coinListFields.has(key)) {
      result[key] = Array.isArray(value) ? value.map(toProtoCoin) : [toProtoCoin(value as Coin)]
    } else if (coinSingularFields.has(key)) {
      result[key] = toProtoCoin(value as Coin)
    } else if (bytesFields.has(key) && typeof value === 'string') {
      result[key] = hexToBytes(value)
    } else if (bigintFields.has(key) && typeof value === 'number') {
      if (!Number.isInteger(value)) {
        throw new ValidationError(
          key,
          `Field "${key}" requires an integer for BigInt conversion, got: ${value}`
        )
      }
      result[key] = BigInt(value)
    } else {
      const field = fieldMap.get(key)!

      if (field.fieldKind === 'map') {
        if (typeof value !== 'object' || value === null || Array.isArray(value)) {
          throw new ValidationError(
            key,
            `Field "${key}" is a map field and expects an object, got: ${Array.isArray(value) ? 'array' : typeof value}`
          )
        }
        const mapObj = value as Record<string, unknown>
        const transformed: Record<string, unknown> = {}
        for (const [mk, mv] of Object.entries(mapObj)) {
          if (mv == null) {
            transformed[mk] = mv
          } else if (field.message) {
            const tn = field.message.typeName
            if (tn === COIN_TYPE_NAME) transformed[mk] = toProtoCoin(mv as Coin)
            else if (tn === 'google.protobuf.Any')
              transformed[mk] = mv instanceof Message ? mv.toAny() : mv
            else if (tn === 'google.protobuf.Timestamp')
              transformed[mk] = mv instanceof Date ? timestampFromDate(mv) : mv
            else if (typeof mv === 'object') transformed[mk] = normalizeInit(field.message, mv)
            else
              throw new ValidationError(
                key,
                `Map value for "${key}[${mk}]" expects a ${field.message.typeName} object, got ${typeof mv}`
              )
          } else if (field.scalar === ScalarType.BYTES && typeof mv === 'string') {
            transformed[mk] = hexToBytes(mv)
          } else if (field.scalar && BIGINT_SCALARS.has(field.scalar) && typeof mv === 'number') {
            if (!Number.isInteger(mv)) {
              throw new ValidationError(
                key,
                `Map value for "${key}[${mk}]" requires an integer for BigInt conversion, got: ${mv}`
              )
            }
            transformed[mk] = BigInt(mv)
          } else {
            transformed[mk] = mv
          }
        }
        result[key] = transformed
        continue
      }

      if (field.fieldKind === 'list' && !Array.isArray(value)) {
        throw new ValidationError(
          key,
          `Field "${key}" is a repeated field and expects an array, got: ${typeof value}`
        )
      }

      if (field.message) {
        const typeName = field.message.typeName
        if (typeName === 'google.protobuf.Any') {
          result[key] = mapFieldValue(field, value, v => {
            if (v instanceof Message) return v.toAny()
            if (typeof v === 'object' && v !== null && 'typeUrl' in v && 'value' in v) return v
            throw new ValidationError(
              key,
              `Field "${key}" expects a Message or Any object with { typeUrl, value }, got: ${typeof v}`
            )
          })
        } else if (typeName === 'google.protobuf.Timestamp') {
          result[key] = mapFieldValue(field, value, v => {
            if (v instanceof Date) return timestampFromDate(v)
            if (typeof v === 'object' && v !== null && 'seconds' in v) return v
            throw new ValidationError(
              key,
              `Field "${key}" expects a Date or Timestamp object with { seconds, nanos }, got: ${typeof v}`
            )
          })
        } else {
          const nestedSchema = field.message
          result[key] = mapFieldValue(field, value, v => {
            if (typeof v !== 'object' || v === null) {
              throw new ValidationError(
                key,
                `Field "${key}" expects a ${nestedSchema.typeName} object, got ${typeof v}`
              )
            }
            return normalizeInit(nestedSchema, v)
          })
        }
      } else if (field.fieldKind === 'list' && field.listKind === 'scalar') {
        if (field.scalar === ScalarType.BYTES) {
          result[key] = (value as unknown[]).map(v => (typeof v === 'string' ? hexToBytes(v) : v))
        } else if (BIGINT_SCALARS.has(field.scalar)) {
          result[key] = (value as unknown[]).map(v => {
            if (typeof v === 'number') {
              if (!Number.isInteger(v)) {
                throw new ValidationError(
                  key,
                  `List element in "${key}" requires an integer for BigInt conversion, got: ${v}`
                )
              }
              return BigInt(v)
            }
            return v
          })
        } else {
          result[key] = value
        }
      } else {
        result[key] = value
      }
    }
  }
  return result as MessageInitShape<S>
}

function mapFieldValue(
  field: DescField,
  value: unknown,
  transform: (v: unknown) => unknown
): unknown {
  if (field.fieldKind === 'list') {
    return (value as unknown[]).map(transform)
  }
  return transform(value)
}

/** Type guard for narrowing a Message to a specific schema type. Returns false for rawAny messages. */
export function isMessageOf<T extends DescMessage>(msg: Message, schema: T): msg is Message<T> {
  return msg.isDecoded && msg.typeUrl === '/' + schema.typeName
}

/** Build a Message from a schema and FriendlyInit input (with normalizeInit transforms). */
export function msg<S extends DescMessage>(schema: S, init: FriendlyInit<S>): Message<S> {
  return new Message(schema, normalizeInit(schema, init))
}

/** Message builder for custom() — same as msg() but accepts FriendlyCustomInit (proto-optional fields as ?:). */
export function msgCustom<S extends DescMessage>(
  schema: S,
  init: FriendlyCustomInit<S>
): Message<S> {
  return new Message(schema, normalizeInit(schema, init))
}

/**
 * Message builder with type-checked defaults.
 *
 * Centralizes a single type assertion (`as any`) so module files
 * don't scatter type assertions. The `defaults` param is validated against
 * `Partial<FriendlyInit<S>>`, catching mismatched default value types.
 */
export function msgWithDefaults<S extends DescMessage>(
  schema: S,
  defaults: Partial<FriendlyInit<S>>,
  init: Partial<FriendlyInit<S>>
): Message<S> {
  // Type safety: module interface signatures (via WithDefaults) enforce that defaults + init cover all required keys.
  // eslint-disable-next-line @typescript-eslint/no-explicit-any, @typescript-eslint/no-unsafe-argument
  return msg(schema, { ...defaults, ...init } as any)
}

/** Default IBC timeout: current time + 10 minutes, as Unix timestamp in nanoseconds. */
export function defaultTimeout(): bigint {
  return BigInt(Date.now() + 10 * 60_000) * 1_000_000n
}
