import { describe, it, expect } from 'vitest'
import {
  getDenomType,
  getIbcDenomHash,
  createIbcDenom,
  getEvmContractAddress,
  getMoveAssetInfo,
  getCw20ContractAddress,
} from '../../../src/util/denom'

describe('getDenomType', () => {
  it('should detect ibc denom', () => {
    expect(getDenomType('ibc/ABC123DEF456')).toBe('ibc')
  })

  it('should detect evm denom', () => {
    expect(getDenomType('evm/1234abcd')).toBe('evm')
  })

  it('should detect move denom', () => {
    expect(getDenomType('move/0x1::aptos_coin::AptosCoin')).toBe('move')
  })

  it('should detect l2 denom', () => {
    expect(getDenomType('l2/23c839ab')).toBe('l2')
  })

  it('should detect cw20 denom (colon separator)', () => {
    expect(getDenomType('cw20:juno1abc')).toBe('cw20')
  })

  it('should detect factory denom', () => {
    expect(getDenomType('factory/init1addr/lp')).toBe('factory')
  })

  it('should default to native for unknown prefix', () => {
    expect(getDenomType('uinit')).toBe('native')
    expect(getDenomType('uatom')).toBe('native')
  })

  it('should handle empty string as native', () => {
    expect(getDenomType('')).toBe('native')
  })

  it('should not match partial prefixes', () => {
    expect(getDenomType('ibctoken')).toBe('native')
    expect(getDenomType('evmtoken')).toBe('native')
    expect(getDenomType('movetoken')).toBe('native')
  })
})

describe('getIbcDenomHash', () => {
  it('should extract hash from ibc denom', () => {
    expect(getIbcDenomHash('ibc/ABC123DEF456')).toBe('ABC123DEF456')
  })

  it('should return undefined for non-ibc denom', () => {
    expect(getIbcDenomHash('uinit')).toBeUndefined()
    expect(getIbcDenomHash('evm/1234')).toBeUndefined()
  })

  it('should return empty string for bare ibc/ prefix', () => {
    expect(getIbcDenomHash('ibc/')).toBe('')
  })
})

describe('createIbcDenom', () => {
  it('should create ibc denom with SHA256 hash', () => {
    const result = createIbcDenom('transfer/channel-0/uinit')
    expect(result).toMatch(/^ibc\/[A-F0-9]{64}$/)
  })

  it('should produce deterministic results', () => {
    const a = createIbcDenom('transfer/channel-0/uinit')
    const b = createIbcDenom('transfer/channel-0/uinit')
    expect(a).toBe(b)
  })

  it('should produce different results for different paths', () => {
    const a = createIbcDenom('transfer/channel-0/uinit')
    const b = createIbcDenom('transfer/channel-1/uinit')
    expect(a).not.toBe(b)
  })
})

describe('getEvmContractAddress', () => {
  it('should extract address with 0x prefix', () => {
    expect(getEvmContractAddress('evm/ABC123')).toBe('0xABC123')
  })

  it('should return undefined for non-evm denom', () => {
    expect(getEvmContractAddress('uinit')).toBeUndefined()
    expect(getEvmContractAddress('ibc/ABC')).toBeUndefined()
  })
})

describe('getMoveAssetInfo', () => {
  it('should parse standard move denom', () => {
    const result = getMoveAssetInfo('move/0x1::aptos_coin::AptosCoin')
    expect(result).toEqual({
      address: '0x1',
      module: 'aptos_coin',
      name: 'AptosCoin',
    })
  })

  it('should return undefined for non-move denom', () => {
    expect(getMoveAssetInfo('uinit')).toBeUndefined()
  })

  it('should return undefined for malformed move denom', () => {
    expect(getMoveAssetInfo('move/0x1::only_two_parts')).toBeUndefined()
    expect(getMoveAssetInfo('move/no_colons')).toBeUndefined()
  })

  it('should return undefined for move denom with too many parts', () => {
    expect(getMoveAssetInfo('move/0x1::a::b::c')).toBeUndefined()
  })
})

describe('getCw20ContractAddress', () => {
  it('should extract contract address', () => {
    expect(getCw20ContractAddress('cw20:juno1abc')).toBe('juno1abc')
  })

  it('should return undefined for non-cw20 denom', () => {
    expect(getCw20ContractAddress('uinit')).toBeUndefined()
    expect(getCw20ContractAddress('cw20/wrong_separator')).toBeUndefined()
  })
})
