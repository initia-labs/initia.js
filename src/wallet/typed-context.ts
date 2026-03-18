/**
 * Typed ChainContext factory helpers.
 *
 * Provides chain-type-specific convenience functions that eliminate
 * generic type parameters and optionally bundle provider creation:
 *
 * ```typescript
 * // All-in-one (async — creates provider internally)
 * const ctx = await createInitiaContext({ network: 'testnet', signer: key })
 *
 * // Provider reuse (sync)
 * const ctx = createInitiaContext(provider, 'initiation-2', { signer: key })
 *
 * // Direct chainInfo (sync)
 * const ctx = createInitiaContext(chainInfo, { signer: key })
 * ```
 */

import type { DescService } from '@bufbuild/protobuf'
import type { Transport } from '@connectrpc/connect'
import type { ChainInfoProvider, ChainInfoForType, ChainInfo } from '../provider/types'
import type { ChainType } from '../client/types'
import type { TransportOptions } from '../client/transport-common'
import type { MsgsForChain } from '../msgs/types'
import type { ChainConfigBuilder, ModuleInput } from '../chain-config'
import { CompositeProvider } from '../provider/composite-provider'
import type { ChainDataProvider } from '../provider/types'
import {
  buildChainContextFactory,
  type ChainContext,
  type ChainContextOptions,
  type TokenResolver,
  type EnricherFactory,
} from './chain-context'
import { ChainNotFoundError, ValidationError } from '../errors'

// =============================================================================
// Constants
// =============================================================================

/** Default L1 chain IDs per network. L2 chains have no default. */
export const L1_CHAIN_IDS: Record<string, string> = {
  mainnet: 'interwoven-1',
  testnet: 'initiation-2',
}

// =============================================================================
// Types
// =============================================================================

/**
 * Options for typed context creation (all-in-one mode).
 *
 * Resolution priority:
 * 1. `providers` (composed) or `provider` + `chainId` → uses provider
 * 2. `network` (+ optional `chainId`) → creates RegistryProvider internally
 */
export interface TypedContextOptions extends ChainContextOptions {
  /** Network (creates RegistryProvider internally if no provider given) */
  network?: 'mainnet' | 'testnet'
  /** Chain ID (required for L2; for Initia L1, auto-inferred from network) */
  chainId?: string
  /** Existing provider (skips internal provider creation) */
  provider?: ChainInfoProvider
  /** Multiple providers (internally composed). Takes priority over `provider`. */
  providers?: ChainDataProvider[]
  /** Custom proto modules. Only available on typed factories, not on createChainContext. */
  modules?: (
    base: ChainConfigBuilder<Record<string, ModuleInput>>
  ) => ChainConfigBuilder<Record<string, ModuleInput>>
}

/**
 * Overloaded factory function type for typed context creation.
 */
export interface TypedContextFactory<T extends ChainType> {
  // ── 1. modules + evmTransport (most specific, match first) ─────────

  <TExt extends Record<string, ModuleInput>>(
    chainInfo: ChainInfoForType<T>,
    options: ChainContextOptions & {
      evmTransport: 'jsonrpc'
      modules: (base: ChainConfigBuilder) => ChainConfigBuilder<TExt>
    }
  ): ChainContext<T, TExt> & { evmTransport: 'jsonrpc' }

  <TExt extends Record<string, ModuleInput>>(
    provider: ChainInfoProvider,
    chainId: string,
    options: ChainContextOptions & {
      evmTransport: 'jsonrpc'
      modules: (base: ChainConfigBuilder) => ChainConfigBuilder<TExt>
    }
  ): ChainContext<T, TExt> & { evmTransport: 'jsonrpc' }

  <TExt extends Record<string, ModuleInput>>(
    options: TypedContextOptions & {
      evmTransport: 'jsonrpc'
      modules: (base: ChainConfigBuilder) => ChainConfigBuilder<TExt>
    }
  ): Promise<ChainContext<T, TExt> & { evmTransport: 'jsonrpc' }>

  // ── 2. modules only ────────────────────────────────────────────────

  <TExt extends Record<string, ModuleInput>>(
    chainInfo: ChainInfoForType<T>,
    options: ChainContextOptions & {
      modules: (base: ChainConfigBuilder) => ChainConfigBuilder<TExt>
    }
  ): ChainContext<T, TExt>

  <TExt extends Record<string, ModuleInput>>(
    provider: ChainInfoProvider,
    chainId: string,
    options: ChainContextOptions & {
      modules: (base: ChainConfigBuilder) => ChainConfigBuilder<TExt>
    }
  ): ChainContext<T, TExt>

  <TExt extends Record<string, ModuleInput>>(
    options: TypedContextOptions & {
      modules: (base: ChainConfigBuilder) => ChainConfigBuilder<TExt>
    }
  ): Promise<ChainContext<T, TExt>>

  // ── 3. evmTransport only (existing) ────────────────────────────────

  (
    chainInfo: ChainInfoForType<T>,
    options: ChainContextOptions & { evmTransport: 'jsonrpc' }
  ): ChainContext<T> & { evmTransport: 'jsonrpc' }
  (
    provider: ChainInfoProvider,
    chainId: string,
    options: ChainContextOptions & { evmTransport: 'jsonrpc' }
  ): ChainContext<T> & { evmTransport: 'jsonrpc' }
  (
    options: TypedContextOptions & { evmTransport: 'jsonrpc' }
  ): Promise<ChainContext<T> & { evmTransport: 'jsonrpc' }>

  // ── 4. base (existing) ─────────────────────────────────────────────

  (chainInfo: ChainInfoForType<T>, options?: ChainContextOptions): ChainContext<T>
  (provider: ChainInfoProvider, chainId: string, options?: ChainContextOptions): ChainContext<T>
  (options: TypedContextOptions): Promise<ChainContext<T>>
}

/**
 * Options for buildTypedFactory.
 */
export interface TypedFactoryOptions {
  /** Resolve default chain ID for a network (used by Initia L1). */
  getDefaultChainId?: (network: string) => string | undefined
  /** Token resolver injected into ChainContext for getTokenContract(). */
  tokenResolver?: TokenResolver
  /** Enricher factory for VM-aware tx decoding (injected per chain type). */
  enricherFactory?: EnricherFactory
}

// =============================================================================
// Factory Builder
// =============================================================================

function isChainInfo(obj: unknown): obj is ChainInfo {
  return typeof obj === 'object' && obj !== null && 'chainType' in obj && 'chainId' in obj
}

/**
 * Build a typed ChainContext factory for a specific chain type.
 *
 * Each factory creates its own internal `createChainContext` wired with
 * chain-specific services and message builders, enabling tree-shaking
 * of unused chain types.
 *
 * @param chainType - The chain type this factory handles
 * @param createTransport - Platform-specific transport creator
 * @param chainConfig - ChainConfigBuilder for this chain type
 * @param options - Additional options (e.g., getDefaultChainId for L1)
 *
 * @example
 * ```typescript
 * export const createInitiaContext = buildTypedFactory(
 *   'initia', createTransport, initiaChain,
 *   { getDefaultChainId: n => L1_CHAIN_IDS[n] }
 * )
 * ```
 */
export function buildTypedFactory<T extends ChainType>(
  chainType: T,
  createTransport: (chainInfo: ChainInfo, options?: TransportOptions) => Transport,
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  chainConfig: ChainConfigBuilder<any>,
  options?: TypedFactoryOptions
): TypedContextFactory<T> {
  const getDefaultChainId = options?.getDefaultChainId

  // Build config once — used for all context creation
  const defaultConfig = chainConfig.build()

  const create = buildChainContextFactory(
    createTransport,
    () => defaultConfig.services as Record<string, DescService>,
    () => defaultConfig.msgs as unknown as MsgsForChain<ChainType>,
    {
      tokenResolver: options?.tokenResolver,
      enricherFactory: options?.enricherFactory,
      getTypeRegistry: () => defaultConfig.registry,
    }
  )

  function resolveChainId(network?: string, chainId?: string): string {
    const resolved = chainId ?? (network ? getDefaultChainId?.(network) : undefined)
    if (!resolved) {
      throw new ValidationError(
        'chainId',
        `chainId is required for ${chainType} context` +
          (network ? ` (no default for network '${network}')` : '')
      )
    }
    return resolved
  }

  /** Inject transport factory onto provider if not already set. */
  function ensureTransport(provider: ChainInfoProvider): void {
    if (!provider.createTransport) {
      provider.createTransport = createTransport
    }
  }

  /** Throw if chainInfo.chainType does not match this factory's expected type. */
  function validateChainType(chainInfo: ChainInfo): asserts chainInfo is ChainInfoForType<T> {
    if (chainInfo.chainType !== chainType) {
      throw new ValidationError(
        'chainType',
        `Chain '${chainInfo.chainId}' has type '${chainInfo.chainType}' but this factory expects '${chainType}'`
      )
    }
  }

  /** Look up and validate chain info from a provider. */
  function resolveChainInfo(provider: ChainInfoProvider, chainId: string): ChainInfoForType<T> {
    ensureTransport(provider)
    const chainInfo = provider.getChainInfo<T>(chainId)
    if (!chainInfo) throw new ChainNotFoundError(chainId)
    validateChainType(chainInfo)
    return chainInfo
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  type ModulesFn = (base: ChainConfigBuilder<any>) => ChainConfigBuilder<any>

  /** Create context with extended modules via a separate buildChainContextFactory call. */
  function createWithModules(
    chainInfo: ChainInfoForType<T>,
    modulesFn: ModulesFn,
    ctxOptions?: ChainContextOptions
  ): ChainContext<T> {
    // eslint-disable-next-line @typescript-eslint/no-unsafe-argument, @typescript-eslint/no-explicit-any
    const extended = modulesFn(chainConfig as any)
    if (!extended || typeof extended.build !== 'function') {
      throw new Error(
        'modules callback must return a ChainConfigBuilder (did you forget to return the builder chain?)'
      )
    }
    const extConfig = extended.build()
    const createExt = buildChainContextFactory(
      createTransport,
      () => extConfig.services as Record<string, DescService>,
      () => extConfig.msgs as unknown as MsgsForChain<ChainType>,
      {
        tokenResolver: options?.tokenResolver,
        enricherFactory: options?.enricherFactory,
        getTypeRegistry: () => extConfig.registry,
      }
    )
    // eslint-disable-next-line @typescript-eslint/no-unsafe-return, @typescript-eslint/no-explicit-any
    return createExt(chainInfo, ctxOptions) as any
  }

  /** Extract and validate modules callback from options, if present. */
  function extractModules(opts?: ChainContextOptions): ModulesFn | undefined {
    if (!opts || !('modules' in opts)) return undefined
    const fn = (opts as TypedContextOptions).modules
    if (fn === undefined) return undefined
    if (typeof fn !== 'function') {
      throw new Error(
        `'modules' option must be a callback (base => base.addModule(...)), got ${typeof fn}`
      )
    }
    return fn as ModulesFn
  }

  /** Create context, delegating to createWithModules when modulesFn is provided. */
  function createOrExtend(
    chainInfo: ChainInfoForType<T>,
    modulesFn: ModulesFn | undefined,
    ctxOptions?: ChainContextOptions
  ): ChainContext<T> {
    if (modulesFn) return createWithModules(chainInfo, modulesFn, ctxOptions)
    return create(chainInfo, ctxOptions)
  }

  function factory(
    first: ChainInfoForType<T> | ChainInfoProvider | TypedContextOptions,
    second?: string | ChainContextOptions,
    third?: ChainContextOptions
  ): ChainContext<T> | Promise<ChainContext<T>> {
    // Overload: provider + chainId (sync)
    if (typeof second === 'string') {
      const chainInfo = resolveChainInfo(first as ChainInfoProvider, second)
      return createOrExtend(chainInfo, extractModules(third), third)
    }

    // Overload: direct chainInfo (sync)
    if (isChainInfo(first)) {
      validateChainType(first)
      return createOrExtend(first, extractModules(second), second)
    }

    // Overload: options object (async) — shallow copy to avoid mutating caller's object
    const opts = { ...(first as TypedContextOptions) }

    // Handle providers (plural) — compose into single provider
    if (opts.providers) {
      if (opts.provider) {
        throw new ValidationError('provider', 'Cannot specify both `provider` and `providers`')
      }
      for (const p of opts.providers) {
        ensureTransport(p)
      }
      opts.provider = new CompositeProvider(opts.providers)
    }

    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const { network, chainId, provider, providers: _, modules: modulesFn, ...contextOptions } = opts

    if (provider) {
      const info = resolveChainInfo(provider, resolveChainId(network, chainId))
      return Promise.resolve(createOrExtend(info, modulesFn, contextOptions))
    }

    if (!network) {
      throw new Error('One of network, provider, or chainInfo (via overload) is required')
    }

    const id = resolveChainId(network, chainId)
    // Dynamic import keeps registry-provider out of the static import graph,
    // enabling tree-shaking of unused chain services.
    // .catch() wraps import + createRegistryProvider errors with a user-friendly message.
    return import('../provider/registry-provider')
      .then(({ createRegistryProvider }) => createRegistryProvider({ network }))
      .catch((cause: unknown) => {
        const err = cause instanceof Error ? cause : new Error(String(cause))
        throw new Error(
          `Registry unavailable (${network}): ${err.message}. ` +
            'Provide a pre-built provider via the `provider` option to skip registry fetch.',
          { cause: err }
        )
      })
      .then(prov => {
        ensureTransport(prov)
        const info = resolveChainInfo(prov, id)
        return createOrExtend(info, modulesFn, contextOptions)
      })
  }

  return factory as TypedContextFactory<T>
}
