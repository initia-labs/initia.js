/**
 * AddressProfile tests.
 */

import { describe, it, expect, vi, beforeEach } from 'vitest'
import { ConnectError, Code } from '@connectrpc/connect'
import type * as ProtobufWkt from '@bufbuild/protobuf/wkt'

// Mock anyUnpack from protobuf
vi.mock('@bufbuild/protobuf/wkt', async () => {
  const original = await vi.importActual<typeof ProtobufWkt>('@bufbuild/protobuf/wkt')
  return {
    ...original,
    anyUnpack: vi.fn(() => null),
  }
})

import { anyUnpack } from '@bufbuild/protobuf/wkt'
import {
  getAddressProfile,
  type AddressProfile,
  type EvmProfile,
  type ShorthandProfile,
  type MoveProfile,
  type WasmProfile,
  type EoaProfile,
} from '../../../src/client/address-profile'

const mockedAnyUnpack = vi.mocked(anyUnpack) as unknown as ReturnType<typeof vi.fn>

// =============================================================================
// Mock Helpers
// =============================================================================

/** Create a mock Any object with given typeUrl. */
function mockAny(typeUrl: string) {
  return { typeUrl, value: new Uint8Array(), $typeName: 'google.protobuf.Any' as const }
}

/** Create a ConnectError with NOT_FOUND code. */
function notFoundError() {
  return new ConnectError('not found', Code.NotFound)
}

interface MockClientOptions {
  auth?: {
    typeUrl?: string
    notFound?: boolean
    networkError?: boolean
  }
  evm?: {
    code?: string
    networkError?: boolean
  }
  move?: {
    modules?: { moduleName: string }[]
    networkError?: boolean
  }
  wasm?: {
    codeId?: bigint | null
    networkError?: boolean
  }
}

/**
 * Create a mock context with configurable services.
 * Only includes services that are specified in options.
 */
function createMockContext(options: MockClientOptions = {}) {
  const client: Record<string, unknown> = {}

  if (options.auth !== undefined) {
    client.auth = {
      account: vi.fn(async () => {
        if (options.auth!.networkError) {
          throw new Error('Network failure')
        }
        if (options.auth!.notFound) {
          throw notFoundError()
        }
        if (!options.auth!.typeUrl) {
          return { account: undefined }
        }
        return { account: mockAny(options.auth!.typeUrl) }
      }),
    }
  }

  if (options.evm !== undefined) {
    client.evm = {
      code: vi.fn(async () => {
        if (options.evm!.networkError) {
          throw new Error('Network failure')
        }
        return { code: options.evm!.code ?? '' }
      }),
    }
  }

  if (options.move !== undefined) {
    client.move = {
      modules: vi.fn(async () => {
        if (options.move!.networkError) {
          throw new Error('Network failure')
        }
        return { modules: options.move!.modules ?? [] }
      }),
    }
  }

  if (options.wasm !== undefined) {
    client.wasm = {
      contractInfo: vi.fn(async () => {
        if (options.wasm!.networkError) {
          throw new Error('Network failure')
        }
        if (options.wasm!.codeId === undefined) {
          throw notFoundError()
        }
        return {
          contractInfo: options.wasm!.codeId !== null ? { codeId: options.wasm!.codeId } : null,
        }
      }),
    }
  }

  return { client }
}

// =============================================================================
// Tests
// =============================================================================

describe('getAddressProfile', () => {
  const ADDRESS = 'init1testaddress'

  beforeEach(() => {
    vi.clearAllMocks()
    mockedAnyUnpack.mockReturnValue(null)
  })

  // ---------------------------------------------------------------------------
  // Overload: argument parsing
  // ---------------------------------------------------------------------------

  describe('overload resolution', () => {
    it('uses context.address when no address argument', async () => {
      const ctx = createMockContext({ auth: { notFound: true } })
      const contextWithAddress = { ...ctx, address: ADDRESS }

      const profile = await getAddressProfile(contextWithAddress, { cacheTtl: 0 })
      expect(profile.address).toBe(ADDRESS)
    })

    it('throws when context has no address and no address argument', async () => {
      const ctx = createMockContext({ auth: { notFound: true } })

      await expect(getAddressProfile(ctx as any, { cacheTtl: 0 })).rejects.toThrow(
        'Context has no address'
      )
    })

    it('uses explicit address argument over context.address', async () => {
      const ctx = createMockContext({ auth: { notFound: true } })
      const explicitAddress = 'init1explicit'

      const profile = await getAddressProfile(ctx, explicitAddress, { cacheTtl: 0 })
      expect(profile.address).toBe(explicitAddress)
    })
  })

  // ---------------------------------------------------------------------------
  // NOT_FOUND (account doesn't exist on-chain)
  // ---------------------------------------------------------------------------

  describe('NOT_FOUND', () => {
    it('returns { account: undefined, contract: "none" } for non-existent address', async () => {
      const ctx = createMockContext({ auth: { notFound: true } })

      const profile = await getAddressProfile(ctx, ADDRESS, { cacheTtl: 0 })

      expect(profile).toEqual({ address: ADDRESS, contract: 'none' })
      expect(profile.account).toBeUndefined()
    })

    it('skips VM queries for non-existent address', async () => {
      const ctx = createMockContext({
        auth: { notFound: true },
        evm: { code: '0xdeadbeef' },
      })

      await getAddressProfile(ctx, ADDRESS, { cacheTtl: 0 })

      expect((ctx.client.evm as any).code).not.toHaveBeenCalled()
    })
  })

  // ---------------------------------------------------------------------------
  // Variant: contract: 'none' (EOA / module)
  // ---------------------------------------------------------------------------

  describe('contract: none', () => {
    it('BaseAccount with no VM services → { account: "base", contract: "none" }', async () => {
      const ctx = createMockContext({
        auth: { typeUrl: '/cosmos.auth.v1beta1.BaseAccount' },
      })

      const profile = await getAddressProfile(ctx, ADDRESS, { cacheTtl: 0 })

      expect(profile).toEqual({ address: ADDRESS, account: 'base', contract: 'none' })
    })

    it('ModuleAccount → { account: "module", contract: "none" }', async () => {
      const ctx = createMockContext({
        auth: { typeUrl: '/cosmos.auth.v1beta1.ModuleAccount' },
      })

      const profile = await getAddressProfile(ctx, ADDRESS, { cacheTtl: 0 })

      expect(profile).toEqual({ address: ADDRESS, account: 'module', contract: 'none' })
    })

    it('BaseAccount + EVM(0) + Move(empty) + Wasm(not_found) → contract: "none"', async () => {
      const ctx = createMockContext({
        auth: { typeUrl: '/cosmos.auth.v1beta1.BaseAccount' },
        evm: { code: '' },
        move: { modules: [] },
        wasm: {},
      })

      const profile = await getAddressProfile(ctx, ADDRESS, { cacheTtl: 0 })

      expect(profile.contract).toBe('none')
      expect(profile.account).toBe('base')
    })
  })

  // ---------------------------------------------------------------------------
  // Variant: contract: 'evm' (direct - ContractAccount)
  // ---------------------------------------------------------------------------

  describe('contract: evm (direct)', () => {
    it('ContractAccount → EvmProfile with codeSize and codeHash', async () => {
      const codeHash = new Uint8Array([1, 2, 3])
      mockedAnyUnpack.mockReturnValue({ codeHash } as any)

      const ctx = createMockContext({
        auth: { typeUrl: '/minievm.evm.v1.ContractAccount' },
        evm: { code: '0xdeadbeef' },
      })

      const profile = await getAddressProfile(ctx, ADDRESS, { cacheTtl: 0 })

      expect(profile.contract).toBe('evm')
      expect(profile.account).toBe('evm-code')
      expect((profile as EvmProfile).codeSize).toBe(10) // '0xdeadbeef'.length
      expect((profile as EvmProfile).codeHash).toEqual(codeHash)
    })

    it('ContractAccount requires EVM service', async () => {
      mockedAnyUnpack.mockReturnValue({ codeHash: new Uint8Array([1]) } as any)

      const ctx = createMockContext({
        auth: { typeUrl: '/minievm.evm.v1.ContractAccount' },
        // no evm service
      })

      await expect(getAddressProfile(ctx, ADDRESS, { cacheTtl: 0 })).rejects.toThrow(
        'EVM service required'
      )
    })
  })

  // ---------------------------------------------------------------------------
  // Variant: contract: 'evm' (shorthand → evm)
  // ---------------------------------------------------------------------------

  describe('contract: evm (shorthand)', () => {
    const CANONICAL = 'init1canonical32byte'

    it('ShorthandAccount → resolves canonical ContractAccount', async () => {
      const codeHash = new Uint8Array([4, 5, 6])

      // First call: shorthand address → ShorthandAccount
      // Second call: canonical address → ContractAccount
      mockedAnyUnpack
        .mockReturnValueOnce({ originalAddress: CANONICAL } as any)
        .mockReturnValueOnce({ codeHash } as any)

      const authMock = vi
        .fn()
        .mockResolvedValueOnce({ account: mockAny('/minievm.evm.v1.ShorthandAccount') })
        .mockResolvedValueOnce({ account: mockAny('/minievm.evm.v1.ContractAccount') })

      const ctx = {
        client: {
          auth: { account: authMock },
          evm: { code: vi.fn().mockResolvedValue({ code: '0xabcdef' }) },
        },
      }

      const profile = await getAddressProfile(ctx, ADDRESS, { cacheTtl: 0 })

      expect(profile.account).toBe('evm-shorthand')
      expect(profile.contract).toBe('evm')
      expect((profile as ShorthandProfile & { contract: 'evm' }).canonical).toBe(CANONICAL)
      expect((profile as EvmProfile).codeSize).toBe(8) // '0xabcdef'.length
      expect((profile as EvmProfile).codeHash).toEqual(codeHash)
    })
  })

  // ---------------------------------------------------------------------------
  // Variant: shorthand → contract: 'none'
  // ---------------------------------------------------------------------------

  describe('shorthand → contract: none', () => {
    const CANONICAL = 'init1canonical32byte'

    it('ShorthandAccount → canonical is BaseAccount → contract: "none"', async () => {
      mockedAnyUnpack.mockReturnValueOnce({ originalAddress: CANONICAL } as any)

      const authMock = vi
        .fn()
        .mockResolvedValueOnce({ account: mockAny('/minievm.evm.v1.ShorthandAccount') })
        .mockResolvedValueOnce({ account: mockAny('/cosmos.auth.v1beta1.BaseAccount') })

      const ctx = { client: { auth: { account: authMock } } }

      const profile = await getAddressProfile(ctx, ADDRESS, { cacheTtl: 0 })

      expect(profile.account).toBe('evm-shorthand')
      expect(profile.contract).toBe('none')
      expect((profile as ShorthandProfile).canonical).toBe(CANONICAL)
    })

    it('ShorthandAccount → canonical NOT_FOUND → contract: "none"', async () => {
      mockedAnyUnpack.mockReturnValueOnce({ originalAddress: CANONICAL } as any)

      const authMock = vi
        .fn()
        .mockResolvedValueOnce({ account: mockAny('/minievm.evm.v1.ShorthandAccount') })
        .mockRejectedValueOnce(notFoundError())

      const ctx = { client: { auth: { account: authMock } } }

      const profile = await getAddressProfile(ctx, ADDRESS, { cacheTtl: 0 })

      expect(profile.account).toBe('evm-shorthand')
      expect(profile.contract).toBe('none')
    })
  })

  // ---------------------------------------------------------------------------
  // Variant: contract: 'move'
  // ---------------------------------------------------------------------------

  describe('contract: move', () => {
    it('BaseAccount + Move modules → MoveProfile', async () => {
      const ctx = createMockContext({
        auth: { typeUrl: '/cosmos.auth.v1beta1.BaseAccount' },
        evm: { code: '' },
        move: { modules: [{ moduleName: 'coin' }, { moduleName: 'nft' }] },
      })

      const profile = await getAddressProfile(ctx, ADDRESS, { cacheTtl: 0 })

      expect(profile.contract).toBe('move')
      expect(profile.account).toBe('base')
      expect((profile as MoveProfile).modules).toEqual(['coin', 'nft'])
    })

    it('move-object account + Move modules → MoveProfile', async () => {
      const ctx = createMockContext({
        auth: { typeUrl: '/initia.move.v1.ObjectAccount' },
        move: { modules: [{ moduleName: 'object_module' }] },
      })

      const profile = await getAddressProfile(ctx, ADDRESS, { cacheTtl: 0 })

      expect(profile.contract).toBe('move')
      expect(profile.account).toBe('move-object')
    })

    it('Move empty modules → contract: "none"', async () => {
      const ctx = createMockContext({
        auth: { typeUrl: '/cosmos.auth.v1beta1.BaseAccount' },
        move: { modules: [] },
      })

      const profile = await getAddressProfile(ctx, ADDRESS, { cacheTtl: 0 })

      expect(profile.contract).toBe('none')
    })
  })

  // ---------------------------------------------------------------------------
  // Variant: contract: 'wasm'
  // ---------------------------------------------------------------------------

  describe('contract: wasm', () => {
    it('BaseAccount + Wasm codeId → WasmProfile', async () => {
      const ctx = createMockContext({
        auth: { typeUrl: '/cosmos.auth.v1beta1.BaseAccount' },
        evm: { code: '' },
        move: { modules: [] },
        wasm: { codeId: 42n },
      })

      const profile = await getAddressProfile(ctx, ADDRESS, { cacheTtl: 0 })

      expect(profile.contract).toBe('wasm')
      expect(profile.account).toBe('base')
      expect((profile as WasmProfile).codeId).toBe(42n)
    })

    it('Wasm NOT_FOUND → contract: "none"', async () => {
      const ctx = createMockContext({
        auth: { typeUrl: '/cosmos.auth.v1beta1.BaseAccount' },
        wasm: {},
      })

      const profile = await getAddressProfile(ctx, ADDRESS, { cacheTtl: 0 })

      expect(profile.contract).toBe('none')
    })
  })

  // ---------------------------------------------------------------------------
  // account: 'unknown' (unmapped typeUrl)
  // ---------------------------------------------------------------------------

  describe('account: unknown', () => {
    it('unmapped typeUrl → account: "unknown", VM queries still run', async () => {
      const ctx = createMockContext({
        auth: { typeUrl: '/cosmos.vesting.v1beta1.ContinuousVestingAccount' },
        move: { modules: [{ moduleName: 'vesting_module' }] },
      })

      const profile = await getAddressProfile(ctx, ADDRESS, { cacheTtl: 0 })

      expect(profile.account).toBe('unknown')
      expect(profile.contract).toBe('move')
      expect((profile as MoveProfile).modules).toEqual(['vesting_module'])
    })

    it('unmapped typeUrl + no VM matches → contract: "none"', async () => {
      const ctx = createMockContext({
        auth: { typeUrl: '/some.custom.v1.CustomAccount' },
        evm: { code: '' },
      })

      const profile = await getAddressProfile(ctx, ADDRESS, { cacheTtl: 0 })

      expect(profile.account).toBe('unknown')
      expect(profile.contract).toBe('none')
    })
  })

  // ---------------------------------------------------------------------------
  // Error cases
  // ---------------------------------------------------------------------------

  describe('errors', () => {
    it('auth network failure → throws', async () => {
      const ctx = createMockContext({ auth: { networkError: true } })

      await expect(getAddressProfile(ctx, ADDRESS, { cacheTtl: 0 })).rejects.toThrow(
        'Network failure'
      )
    })

    it('no auth service → throws', async () => {
      const ctx = { client: {} }

      await expect(getAddressProfile(ctx, ADDRESS, { cacheTtl: 0 })).rejects.toThrow(
        'Auth service is required'
      )
    })

    it('ContractAccount + codeSize=0 → throws inconsistency', async () => {
      mockedAnyUnpack.mockReturnValue({ codeHash: new Uint8Array([1]) } as any)

      const ctx = createMockContext({
        auth: { typeUrl: '/minievm.evm.v1.ContractAccount' },
        evm: { code: '' }, // empty = codeSize 0
      })

      await expect(getAddressProfile(ctx, ADDRESS, { cacheTtl: 0 })).rejects.toThrow(
        'Inconsistent state'
      )
    })

    it('BaseAccount + codeSize>0 → throws inconsistency', async () => {
      const ctx = createMockContext({
        auth: { typeUrl: '/cosmos.auth.v1beta1.BaseAccount' },
        evm: { code: '0xdeadbeef' }, // non-empty = has code
      })

      await expect(getAddressProfile(ctx, ADDRESS, { cacheTtl: 0 })).rejects.toThrow(
        'Inconsistent state'
      )
    })

    it('unknown typeUrl + EVM code exists → throws inconsistency', async () => {
      const ctx = createMockContext({
        auth: { typeUrl: '/some.unknown.v1.Account' },
        evm: { code: '0xdeadbeef' },
      })

      await expect(getAddressProfile(ctx, ADDRESS, { cacheTtl: 0 })).rejects.toThrow(
        'Inconsistent state'
      )
    })

    it('ShorthandAccount missing canonical address → throws', async () => {
      mockedAnyUnpack.mockReturnValue(null) // anyUnpack fails

      const ctx = createMockContext({
        auth: { typeUrl: '/minievm.evm.v1.ShorthandAccount' },
      })

      await expect(getAddressProfile(ctx, ADDRESS, { cacheTtl: 0 })).rejects.toThrow(
        'Failed to extract canonical address'
      )
    })

    it('ContractAccount missing codeHash → throws', async () => {
      mockedAnyUnpack.mockReturnValue(null) // no codeHash from unpack

      const ctx = createMockContext({
        auth: { typeUrl: '/minievm.evm.v1.ContractAccount' },
        evm: { code: '0xdeadbeef' },
      })

      await expect(getAddressProfile(ctx, ADDRESS, { cacheTtl: 0 })).rejects.toThrow(
        'missing codeHash'
      )
    })

    it('EVM network failure during VM query → throws', async () => {
      const ctx = createMockContext({
        auth: { typeUrl: '/cosmos.auth.v1beta1.BaseAccount' },
        evm: { networkError: true },
      })

      await expect(getAddressProfile(ctx, ADDRESS, { cacheTtl: 0 })).rejects.toThrow(
        'Network failure'
      )
    })

    it('Move network failure during VM query → throws', async () => {
      const ctx = createMockContext({
        auth: { typeUrl: '/cosmos.auth.v1beta1.BaseAccount' },
        evm: { code: '' },
        move: { networkError: true },
      })

      await expect(getAddressProfile(ctx, ADDRESS, { cacheTtl: 0 })).rejects.toThrow(
        'Network failure'
      )
    })
  })

  // ---------------------------------------------------------------------------
  // Service detection (skip VM queries when service absent)
  // ---------------------------------------------------------------------------

  describe('service detection', () => {
    it('no EVM service → skips EVM check, returns none', async () => {
      const ctx = createMockContext({
        auth: { typeUrl: '/cosmos.auth.v1beta1.BaseAccount' },
        // no evm, move, wasm
      })

      const profile = await getAddressProfile(ctx, ADDRESS, { cacheTtl: 0 })

      expect(profile.contract).toBe('none')
    })

    it('only Move service → checks Move only', async () => {
      const ctx = createMockContext({
        auth: { typeUrl: '/cosmos.auth.v1beta1.BaseAccount' },
        move: { modules: [{ moduleName: 'coin' }] },
        // no evm, no wasm
      })

      const profile = await getAddressProfile(ctx, ADDRESS, { cacheTtl: 0 })

      expect(profile.contract).toBe('move')
    })

    it('only Wasm service → checks Wasm only', async () => {
      const ctx = createMockContext({
        auth: { typeUrl: '/cosmos.auth.v1beta1.BaseAccount' },
        wasm: { codeId: 1n },
        // no evm, no move
      })

      const profile = await getAddressProfile(ctx, ADDRESS, { cacheTtl: 0 })

      expect(profile.contract).toBe('wasm')
    })
  })

  // ---------------------------------------------------------------------------
  // Cache behavior
  // ---------------------------------------------------------------------------

  describe('cache', () => {
    it('second call returns cached result', async () => {
      const addr = 'init1cache_hit_test'
      const authFn = vi
        .fn()
        .mockResolvedValue({ account: mockAny('/cosmos.auth.v1beta1.BaseAccount') })

      const ctx = { client: { auth: { account: authFn } } }

      const profile1 = await getAddressProfile(ctx, addr)
      const profile2 = await getAddressProfile(ctx, addr)

      expect(profile1).toEqual(profile2)
      expect(authFn).toHaveBeenCalledTimes(1) // second call uses cache
    })

    it('forceRefresh bypasses cache', async () => {
      const addr = 'init1force_refresh_test'
      const authFn = vi
        .fn()
        .mockResolvedValue({ account: mockAny('/cosmos.auth.v1beta1.BaseAccount') })

      const ctx = { client: { auth: { account: authFn } } }

      await getAddressProfile(ctx, addr)
      await getAddressProfile(ctx, addr, { forceRefresh: true })

      expect(authFn).toHaveBeenCalledTimes(2)
    })

    it('cacheTtl: 0 disables caching', async () => {
      const addr = 'init1cache_disabled_test'
      const authFn = vi
        .fn()
        .mockResolvedValue({ account: mockAny('/cosmos.auth.v1beta1.BaseAccount') })

      const ctx = { client: { auth: { account: authFn } } }

      await getAddressProfile(ctx, addr, { cacheTtl: 0 })
      await getAddressProfile(ctx, addr, { cacheTtl: 0 })

      expect(authFn).toHaveBeenCalledTimes(2)
    })
  })

  // ---------------------------------------------------------------------------
  // TypeScript narrowing (compile-time verification)
  // ---------------------------------------------------------------------------

  describe('type narrowing', () => {
    it('contract: "evm" narrows to codeSize/codeHash access', async () => {
      mockedAnyUnpack.mockReturnValue({ codeHash: new Uint8Array([1]) } as any)

      const ctx = createMockContext({
        auth: { typeUrl: '/minievm.evm.v1.ContractAccount' },
        evm: { code: '0xab' },
      })

      const profile = await getAddressProfile(ctx, ADDRESS, { cacheTtl: 0 })

      if (profile.contract === 'evm') {
        // TypeScript should allow these without errors
        const _size: number = profile.codeSize
        const _hash: Uint8Array = profile.codeHash
        expect(_size).toBe(4)
        expect(_hash).toEqual(new Uint8Array([1]))
      }
    })

    it('contract: "move" narrows to modules access', async () => {
      const ctx = createMockContext({
        auth: { typeUrl: '/cosmos.auth.v1beta1.BaseAccount' },
        move: { modules: [{ moduleName: 'token' }] },
      })

      const profile = await getAddressProfile(ctx, ADDRESS, { cacheTtl: 0 })

      if (profile.contract === 'move') {
        // TypeScript should allow this
        const _first: string = profile.modules[0]
        expect(_first).toBe('token')
      }
    })

    it('contract: "wasm" narrows to codeId access', async () => {
      const ctx = createMockContext({
        auth: { typeUrl: '/cosmos.auth.v1beta1.BaseAccount' },
        wasm: { codeId: 99n },
      })

      const profile = await getAddressProfile(ctx, ADDRESS, { cacheTtl: 0 })

      if (profile.contract === 'wasm') {
        const _id: bigint = profile.codeId
        expect(_id).toBe(99n)
      }
    })

    it('switch exhaustive narrowing compiles', async () => {
      const ctx = createMockContext({
        auth: { typeUrl: '/cosmos.auth.v1beta1.BaseAccount' },
      })

      const profile = await getAddressProfile(ctx, ADDRESS, { cacheTtl: 0 })

      switch (profile.contract) {
        case 'evm':
          expect(profile.codeSize).toBeDefined()
          break
        case 'move':
          expect(profile.modules.length).toBeGreaterThan(0)
          break
        case 'wasm':
          expect(profile.codeId).toBeDefined()
          break
        case 'none':
          expect(profile.contract).toBe('none')
          break
      }
    })

    it('helper types are assignable from narrowed AddressProfile', () => {
      const profile = {} as AddressProfile

      if (profile.contract === 'evm') {
        const _evm: EvmProfile = profile
        expect(_evm).toBeDefined()
      }

      if (profile.account === 'evm-shorthand') {
        const _shorthand: ShorthandProfile = profile
        expect(_shorthand).toBeDefined()
      }

      if (profile.contract === 'move') {
        const _move: MoveProfile = profile
        expect(_move).toBeDefined()
      }

      if (profile.contract === 'wasm') {
        const _wasm: WasmProfile = profile
        expect(_wasm).toBeDefined()
      }

      if (profile.contract === 'none' && profile.account !== 'evm-shorthand') {
        const _eoa: EoaProfile = profile
        expect(_eoa).toBeDefined()
      }
    })
  })
})
