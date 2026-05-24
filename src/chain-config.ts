import type {
  DescService,
  DescMessage,
  DescFile,
  DescEnum,
  DescExtension,
  Registry,
} from '@bufbuild/protobuf'
import { createRegistry } from '@bufbuild/protobuf'
import type { GenService, GenServiceMethods } from '@bufbuild/protobuf/codegenv2'
import {
  msg as buildMsg,
  msgCustom,
  type FriendlyInit,
  type FriendlyCustomInit,
  type Message,
} from './msgs/types'
import { createDecode } from './msgs/decode'
import { ValidationError } from './errors'
import type { Any } from '@bufbuild/protobuf/wkt'
import type { ServiceClients } from './client/grpc-client'

// ─── Core Type Utilities ───────────────────────────────────────────

import type { UnionToIntersection } from './util/types'
export type { UnionToIntersection } from './util/types'

type BuildersFromOne<S extends GenService<GenServiceMethods>> =
  S extends GenService<infer Methods>
    ? {
        [K in keyof Methods]: Methods[K] extends { input: infer I extends DescMessage }
          ? (init: FriendlyInit<I>) => Message<I>
          : never
      }
    : never

export type QueryInput = DescService | readonly DescService[]

export type TxInput = GenService<GenServiceMethods> | readonly GenService<GenServiceMethods>[]

export type MsgBuildersFromTx<S extends TxInput> =
  S extends readonly GenService<GenServiceMethods>[]
    ? UnionToIntersection<BuildersFromOne<S[number]>>
    : S extends GenService<GenServiceMethods>
      ? BuildersFromOne<S>
      : never

export interface CoreMsgMethods {
  custom<T extends DescMessage>(schema: T, init: FriendlyCustomInit<T>): Message<T>
  decode(any: Any): Message
}

export interface ModuleInput<
  Q extends QueryInput | undefined = QueryInput | undefined,
  T extends TxInput | undefined = TxInput | undefined,
> {
  query?: Q
  tx?: T
}

export interface ChainConfig<TModules extends Record<string, ModuleInput>> {
  services: {
    [K in keyof TModules as TModules[K] extends { query: QueryInput } ? K : never]: NonNullable<
      TModules[K]['query']
    >
  }
  msgs: {
    [K in keyof TModules as TModules[K] extends { tx: TxInput } ? K : never]: MsgBuildersFromTx<
      NonNullable<TModules[K]['tx']>
    >
  } & CoreMsgMethods
  registry: Registry
}

// ─── Runtime Helpers ───────────────────────────────────────────────

interface MethodDescriptor {
  input: DescMessage
}

function getMethodEntries(svc: GenService<GenServiceMethods>): [string, MethodDescriptor][] {
  if (!svc.method || typeof svc.method !== 'object') {
    const detail =
      svc == null ? String(svc) : `object with keys [${Object.keys(svc as object).join(', ')}]`
    throw new ValidationError('tx', `Expected a GenService with a .method record, got: ${detail}`)
  }
  return Object.entries(svc.method as Record<string, MethodDescriptor>)
}

function extractSchemas(tx: TxInput): DescMessage[] {
  const services = Array.isArray(tx) ? tx : [tx]
  const schemas: DescMessage[] = []
  for (const svc of services) {
    // eslint-disable-next-line @typescript-eslint/no-unsafe-argument
    for (const [, method] of getMethodEntries(svc)) {
      schemas.push(method.input)
    }
  }
  return schemas
}

function createMsgBuilders(
  tx: TxInput
): Record<string, (init: FriendlyInit<DescMessage>) => Message> {
  const services = Array.isArray(tx) ? tx : [tx]
  const builders: Record<string, (init: FriendlyInit<DescMessage>) => Message> = {}
  for (const svc of services) {
    // eslint-disable-next-line @typescript-eslint/no-unsafe-argument
    for (const [name, method] of getMethodEntries(svc)) {
      // Duplicate method names across multi-source tx services are expected
      // (e.g., ibcCore merges Channel + Client + Connection, all have updateParams).
      // Last service wins silently — this is intentional override semantics.
      builders[name] = init => buildMsg(method.input, init)
    }
  }
  return builders
}

// ─── ChainConfigBuilder ───────────────────────────────────────────

type TypeInput = Registry | DescFile | DescMessage | DescEnum | DescExtension | DescService

export class ChainConfigBuilder<
  // eslint-disable-next-line @typescript-eslint/no-empty-object-type
  TDefault extends Record<string, ModuleInput> = {},
> {
  private modules: Record<string, ModuleInput> = {}
  private typeInputs: TypeInput[] = []
  private decodeSchemas: DescMessage[] = []

  addModule<K extends string, M extends ModuleInput>(
    name: K,
    input: M
  ): ChainConfigBuilder<TDefault & Record<K, M>> {
    if (!input.query && !input.tx) {
      throw new ValidationError(name, 'at least one of query or tx must be provided')
    }
    const next = this.clone()
    next.modules[name] = input
    if (input.tx) {
      const schemas = extractSchemas(input.tx)
      next.typeInputs.push(...schemas)
    }
    // eslint-disable-next-line @typescript-eslint/no-unsafe-return, @typescript-eslint/no-explicit-any
    return next as any
  }

  addTypes(...inputs: TypeInput[]): ChainConfigBuilder<TDefault> {
    const next = this.clone()
    next.typeInputs.push(...inputs)
    return next
  }

  addDecodeTypes(...schemas: DescMessage[]): ChainConfigBuilder<TDefault> {
    const next = this.clone()
    next.decodeSchemas.push(...schemas)
    return next
  }

  build(): ChainConfig<TDefault> {
    // Build services map
    const services: Record<string, DescService | readonly DescService[]> = {}
    for (const [name, mod] of Object.entries(this.modules)) {
      if (mod.query) services[name] = mod.query
    }

    // Build msg builders
    const msgBuilders: Record<
      string,
      Record<string, (init: FriendlyInit<DescMessage>) => Message>
    > = {}
    for (const [name, mod] of Object.entries(this.modules)) {
      if (mod.tx) {
        msgBuilders[name] = createMsgBuilders(mod.tx)
      }
    }

    // Collect schemas for decode
    const allSchemas: DescMessage[] = []
    for (const mod of Object.values(this.modules)) {
      if (mod.tx) allSchemas.push(...extractSchemas(mod.tx))
    }
    allSchemas.push(...this.decodeSchemas)

    // decode: resolves Any by typeUrl using schemas from registered modules
    // registry: resolves types from typeInputs (accumulated via addModule + addTypes),
    //           additionally contains non-module types from addTypes() (e.g., crypto keys, auth)
    const decode = createDecode(allSchemas)
    const registry = createRegistry(...this.typeInputs, ...this.decodeSchemas)

    const msgs = {
      ...msgBuilders,
      custom: msgCustom,
      decode,
    }

    // eslint-disable-next-line @typescript-eslint/no-unsafe-return, @typescript-eslint/no-explicit-any
    return { services, msgs, registry } as any
  }

  private clone(): ChainConfigBuilder<TDefault> {
    const next = new ChainConfigBuilder<TDefault>()
    next.modules = { ...this.modules }
    next.typeInputs = [...this.typeInputs]
    next.decodeSchemas = [...this.decodeSchemas]
    return next
  }
}

export function createChainConfig(): ChainConfigBuilder {
  return new ChainConfigBuilder()
}

// ─── Extended Client/Msgs Types ────────────────────────────────────
// Colocated with ModuleInput/QueryInput/TxInput which they depend on.

/** Maps custom module definitions to their gRPC query client types. */
export type ExtendedClient<TModules extends Record<string, ModuleInput>> = ServiceClients<{
  [K in keyof TModules as TModules[K] extends { query: QueryInput } ? K : never]: NonNullable<
    TModules[K]['query']
  >
}>

/** Maps custom module definitions to their message builder types. */
export type ExtendedMsgs<TModules extends Record<string, ModuleInput>> = {
  [K in keyof TModules as TModules[K] extends { tx: TxInput } ? K : never]: MsgBuildersFromTx<
    NonNullable<TModules[K]['tx']>
  >
}
