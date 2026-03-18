import type { HasClient } from './types'
import { isNotFoundError } from '../errors'
import type { Any } from '@bufbuild/protobuf/wkt'
import { anyUnpack } from '@bufbuild/protobuf/wkt'
import {
  ContractAccountSchema,
  ShorthandAccountSchema,
} from '@buf/initia-labs_minievm.bufbuild_es/minievm/evm/v1/auth_pb'

/**
 * On-chain account type derived from auth query's typeUrl.
 * - 'unknown': typeUrl that SDK doesn't explicitly map (e.g., vesting accounts on other Cosmos chains)
 * - Initia uses Move-based vesting, not Cosmos SDK vesting accounts
 */
export type AccountKind =
  | 'base'
  | 'module'
  | 'evm-code'
  | 'evm-shorthand'
  | 'move-object'
  | 'move-table'
  | 'unknown'

/**
 * Functional capability derived from VM queries.
 * Kept as a standalone export for convenience; inline literals used in AddressProfile for narrowing.
 */
export type ContractKind = 'none' | 'evm' | 'move' | 'wasm'

/**
 * Discriminated union representing a comprehensive address profile.
 *
 * Two independent axes:
 * - `account`: on-chain truth from auth query (undefined = not yet on-chain)
 * - `contract`: functional capability from VM queries (discriminant)
 *
 * Type-level constraints prevent impossible states:
 * - 'evm-code' always pairs with contract: 'evm'
 * - 'evm-shorthand' pairs with contract: 'evm' or 'none' (transparent resolve of canonical)
 * - Move/Wasm variants exclude EVM-specific account kinds
 */
export type AddressProfile =
  | {
      address: string
      account?: Exclude<AccountKind, 'evm-code' | 'evm-shorthand'>
      contract: 'none'
    }
  | {
      address: string
      account: 'evm-code'
      contract: 'evm'
      /** Byte count of deployed EVM code. 0 means no code. */
      codeSize: number
      codeHash: Uint8Array
    }
  | {
      address: string
      account: 'evm-shorthand'
      canonical: string
      contract: 'evm'
      /** Byte count of deployed EVM code. 0 means no code. */
      codeSize: number
      codeHash: Uint8Array
    }
  | {
      address: string
      account: 'evm-shorthand'
      canonical: string
      contract: 'none'
    }
  | {
      address: string
      account?: Exclude<AccountKind, 'evm-code' | 'evm-shorthand'>
      contract: 'move'
      modules: [string, ...string[]]
    }
  | {
      address: string
      account?: Exclude<AccountKind, 'evm-code' | 'evm-shorthand'>
      contract: 'wasm'
      codeId: bigint
    }

/** Profile where contract is 'evm' (includes both direct and shorthand). */
export type EvmProfile = Extract<AddressProfile, { contract: 'evm' }>

/** Profile with account 'evm-shorthand' (contract can be 'evm' or 'none'). */
export type ShorthandProfile = Extract<AddressProfile, { account: 'evm-shorthand' }>

/** Profile with contract 'none' excluding shorthand (pure EOA/module/etc). */
export type EoaProfile = Exclude<Extract<AddressProfile, { contract: 'none' }>, ShorthandProfile>

/** Profile where contract is 'move'. */
export type MoveProfile = Extract<AddressProfile, { contract: 'move' }>

/** Profile where contract is 'wasm'. */
export type WasmProfile = Extract<AddressProfile, { contract: 'wasm' }>

/**
 * Options for getAddressProfile.
 */
export interface GetAddressProfileOptions {
  /** Cache TTL in milliseconds. Default 60000. Set to 0 to disable caching. */
  cacheTtl?: number
  /** Bypass cache and force fresh queries. */
  forceRefresh?: boolean
}

/**
 * Cache interface for AddressProfile results.
 */
export interface ProfileCache {
  get(address: string): AddressProfile | undefined
  set(address: string, profile: AddressProfile, ttl?: number): void
  invalidate(address: string): void
}

// --- Internal implementation ---

const DEFAULT_CACHE_TTL = 60_000

class MemoryProfileCache implements ProfileCache {
  private store = new Map<string, { profile: AddressProfile; expiresAt: number }>()

  get(address: string): AddressProfile | undefined {
    const entry = this.store.get(address)
    if (!entry) return undefined
    if (Date.now() > entry.expiresAt) {
      this.store.delete(address)
      return undefined
    }
    return entry.profile
  }

  set(address: string, profile: AddressProfile, ttl: number = DEFAULT_CACHE_TTL): void {
    this.store.set(address, { profile, expiresAt: Date.now() + ttl })
  }

  invalidate(address: string): void {
    this.store.delete(address)
  }
}

// --- Internal: typeUrl mapping ---

const typeUrlToAccountKind: Record<string, AccountKind> = {
  '/cosmos.auth.v1beta1.BaseAccount': 'base',
  '/cosmos.auth.v1beta1.ModuleAccount': 'module',
  '/initia.move.v1.ObjectAccount': 'move-object',
  '/initia.move.v1.TableAccount': 'move-table',
  '/minievm.evm.v1.ContractAccount': 'evm-code',
  '/minievm.evm.v1.ShorthandAccount': 'evm-shorthand',
}

/** Resolve a proto typeUrl to AccountKind. Returns 'unknown' for unmapped typeUrls. */
function resolveAccountKind(typeUrl: string): AccountKind {
  return typeUrlToAccountKind[typeUrl] ?? 'unknown'
}

// --- Internal: client type interfaces ---

interface AuthQueryClient {
  auth: { account(req: { address: string }): Promise<{ account?: Any }> }
}

interface EvmQueryClient {
  evm: { code(req: { contractAddr: string }): Promise<{ code: string }> }
}

interface MoveQueryClient {
  move: { modules(req: { address: string }): Promise<{ modules: { moduleName: string }[] }> }
}

interface WasmQueryClient {
  wasm: { contractInfo(req: { address: string }): Promise<{ contractInfo?: { codeId: bigint } }> }
}

// --- Internal: service detection type guards ---

function hasAuthService(client: unknown): client is AuthQueryClient {
  return client !== null && typeof client === 'object' && 'auth' in client
}

function hasEvmService(client: unknown): client is EvmQueryClient {
  return client !== null && typeof client === 'object' && 'evm' in client
}

function hasMoveService(client: unknown): client is MoveQueryClient {
  return client !== null && typeof client === 'object' && 'move' in client
}

function hasWasmService(client: unknown): client is WasmQueryClient {
  return client !== null && typeof client === 'object' && 'wasm' in client
}

// --- Internal: auth query result ---

interface AuthResult {
  accountKind: AccountKind
  codeHash?: Uint8Array
  originalAddress?: string
}

// --- Internal: query helpers ---

/**
 * Query auth account. Returns null for NOT_FOUND (account doesn't exist on-chain).
 * Throws on network failure.
 */
async function queryAuth(client: AuthQueryClient, address: string): Promise<AuthResult | null> {
  let response: { account?: Any }
  try {
    response = await client.auth.account({ address })
  } catch (err) {
    if (isNotFoundError(err)) {
      return null
    }
    throw err
  }

  if (!response.account) {
    return null
  }

  const { typeUrl } = response.account
  const accountKind = resolveAccountKind(typeUrl)

  const result: AuthResult = { accountKind }

  if (accountKind === 'evm-code') {
    const unpacked = anyUnpack(response.account, ContractAccountSchema)
    if (unpacked) {
      result.codeHash = unpacked.codeHash
    }
  } else if (accountKind === 'evm-shorthand') {
    const unpacked = anyUnpack(response.account, ShorthandAccountSchema)
    if (unpacked) {
      result.originalAddress = unpacked.originalAddress
    }
  }

  return result
}

/**
 * Query EVM code size. Returns 0 if no code deployed. Throws on network failure.
 * Note: returns byte count of deployed code (Uint8Array.length).
 */
async function queryEvmCode(client: EvmQueryClient, address: string): Promise<number> {
  const response = await client.evm.code({ contractAddr: address })
  return response.code.length
}

/** Query Move modules. Returns empty array if no modules. Throws on network failure. */
async function queryMoveModules(client: MoveQueryClient, address: string): Promise<string[]> {
  const response = await client.move.modules({ address })
  return response.modules.map(m => m.moduleName).filter(Boolean)
}

/** Query Wasm contract info. Returns codeId or null if not a wasm contract. Throws on network failure. */
async function queryWasmContract(client: WasmQueryClient, address: string): Promise<bigint | null> {
  try {
    const response = await client.wasm.contractInfo({ address })
    return response.contractInfo?.codeId ?? null
  } catch (err) {
    if (isNotFoundError(err)) {
      return null
    }
    throw err
  }
}

// --- Internal: consistency validation ---

/**
 * Validate consistency between auth result and EVM code query.
 * Throws on impossible state combinations.
 */
function validateEvmConsistency(address: string, accountKind: AccountKind, codeSize: number): void {
  if (accountKind === 'evm-code' && codeSize === 0) {
    throw new Error(`Inconsistent state for ${address}: ContractAccount but EVM codeSize = 0`)
  }
  if (accountKind !== 'evm-code' && accountKind !== 'evm-shorthand' && codeSize > 0) {
    throw new Error(
      `Inconsistent state for ${address}: account '${accountKind}' but EVM codeSize > 0`
    )
  }
}

/**
 * Validate that ShorthandAccount has a canonical address.
 * Throws if proto unpacking failed.
 */
function validateShorthandCanonical(
  address: string,
  originalAddress: string | undefined
): asserts originalAddress is string {
  if (!originalAddress) {
    throw new Error(`Failed to extract canonical address from ShorthandAccount ${address}`)
  }
}

// --- Internal: ShorthandAccount transparent resolve ---

/**
 * Resolve a ShorthandAccount by querying the canonical address.
 * Returns an AddressProfile with account: 'evm-shorthand'.
 *
 * ShorthandAccount only exists on Minievm chains, so only EVM is checked for canonical.
 */
async function resolveShorthand(
  client: unknown,
  shorthandAddress: string,
  canonicalAddress: string
): Promise<AddressProfile> {
  if (!hasAuthService(client)) {
    throw new Error('Auth service required for ShorthandAccount resolve')
  }

  const canonicalAuth = await queryAuth(client, canonicalAddress)

  // Canonical NOT_FOUND: address not yet on-chain
  if (!canonicalAuth) {
    return {
      address: shorthandAddress,
      account: 'evm-shorthand',
      canonical: canonicalAddress,
      contract: 'none',
    }
  }

  // Defensive assertion: canonical should never be another ShorthandAccount (20byte→32byte is one-way)
  if (canonicalAuth.accountKind === 'evm-shorthand') {
    throw new Error(`Unexpected: canonical address ${canonicalAddress} is also a ShorthandAccount`)
  }

  // Canonical is ContractAccount: query EVM code for codeSize
  if (canonicalAuth.accountKind === 'evm-code') {
    if (!canonicalAuth.codeHash) {
      throw new Error(`ContractAccount ${canonicalAddress} missing codeHash`)
    }
    if (!hasEvmService(client)) {
      throw new Error('EVM service required for ContractAccount on Minievm chain')
    }
    const codeSize = await queryEvmCode(client, canonicalAddress)
    if (codeSize === 0) {
      throw new Error(`ContractAccount ${canonicalAddress} has no EVM code (codeSize = 0)`)
    }
    return {
      address: shorthandAddress,
      account: 'evm-shorthand',
      canonical: canonicalAddress,
      contract: 'evm',
      codeSize,
      codeHash: canonicalAuth.codeHash,
    }
  }

  // Canonical is any other account type (BaseAccount, ModuleAccount, etc): not a contract
  return {
    address: shorthandAddress,
    account: 'evm-shorthand',
    canonical: canonicalAddress,
    contract: 'none',
  }
}

// --- Module-level cache ---

const profileCache = new MemoryProfileCache()

// --- Exported API: getAddressProfile ---

/**
 * Get comprehensive address profile by querying auth and VM services.
 * Uses context's address when available.
 */
export async function getAddressProfile(
  context: { readonly client: unknown; readonly address: string },
  options?: GetAddressProfileOptions
): Promise<AddressProfile>
/**
 * Get comprehensive address profile by querying auth and VM services.
 * Address is provided as a separate parameter.
 */
export async function getAddressProfile(
  context: HasClient,
  address: string,
  options?: GetAddressProfileOptions
): Promise<AddressProfile>
export async function getAddressProfile(
  context: HasClient,
  addressOrOptions?: string | GetAddressProfileOptions,
  maybeOptions?: GetAddressProfileOptions
): Promise<AddressProfile> {
  let address: string
  let options: GetAddressProfileOptions | undefined

  if (typeof addressOrOptions === 'string') {
    address = addressOrOptions
    options = maybeOptions
  } else {
    const ctx = context as { address?: string }
    if (!ctx.address) {
      throw new Error('Context has no address. Pass address as second argument.')
    }
    address = ctx.address
    options = addressOrOptions
  }

  const cacheTtl = options?.cacheTtl ?? DEFAULT_CACHE_TTL

  // Cache check
  if (!options?.forceRefresh && cacheTtl > 0) {
    const cached = profileCache.get(address)
    if (cached) return cached
  }

  const { client } = context

  // Auth query (always first)
  if (!hasAuthService(client)) {
    throw new Error('Auth service is required for getAddressProfile')
  }

  const authResult = await queryAuth(client, address)

  // NOT_FOUND: account doesn't exist on-chain
  if (!authResult) {
    const profile: AddressProfile = { address, contract: 'none' }
    if (cacheTtl > 0) profileCache.set(address, profile, cacheTtl)
    return profile
  }

  const { accountKind, codeHash, originalAddress } = authResult

  // ShorthandAccount: transparent resolve
  if (accountKind === 'evm-shorthand') {
    validateShorthandCanonical(address, originalAddress)
    const profile = await resolveShorthand(client, address, originalAddress)
    if (cacheTtl > 0) profileCache.set(address, profile, cacheTtl)
    return profile
  }

  // ContractAccount: must query EVM for codeSize
  if (accountKind === 'evm-code') {
    if (!codeHash) {
      throw new Error(`ContractAccount ${address} missing codeHash`)
    }
    if (!hasEvmService(client)) {
      throw new Error('EVM service required for ContractAccount')
    }
    const codeSize = await queryEvmCode(client, address)
    validateEvmConsistency(address, accountKind, codeSize)
    const profile: AddressProfile = {
      address,
      account: 'evm-code',
      contract: 'evm',
      codeSize,
      codeHash,
    }
    if (cacheTtl > 0) profileCache.set(address, profile, cacheTtl)
    return profile
  }

  // Remaining account types: base, module, move-object, move-table, unknown
  const account = accountKind

  // EVM consistency check: proactively query EVM code for non-EVM accounts
  // to detect impossible states (e.g., BaseAccount with deployed EVM code).
  // Adds one extra network call on EVM-enabled chains, but ensures fail-fast
  // on data inconsistency rather than silently returning a wrong profile.
  if (hasEvmService(client)) {
    const codeSize = await queryEvmCode(client, address)
    validateEvmConsistency(address, accountKind, codeSize)
  }

  // Move check
  if (hasMoveService(client)) {
    const modules = await queryMoveModules(client, address)
    if (modules.length > 0) {
      const profile: AddressProfile = {
        address,
        account,
        contract: 'move',
        modules: modules as [string, ...string[]],
      }
      if (cacheTtl > 0) profileCache.set(address, profile, cacheTtl)
      return profile
    }
  }

  // Wasm check
  if (hasWasmService(client)) {
    const codeId = await queryWasmContract(client, address)
    if (codeId !== null) {
      const profile: AddressProfile = {
        address,
        account,
        contract: 'wasm',
        codeId,
      }
      if (cacheTtl > 0) profileCache.set(address, profile, cacheTtl)
      return profile
    }
  }

  // No VM contract found
  const profile: AddressProfile = { address, account, contract: 'none' }
  if (cacheTtl > 0) profileCache.set(address, profile, cacheTtl)
  return profile
}
