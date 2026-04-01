/**
 * Move ABI Fetcher Tests
 */

import { describe, it, expect, beforeEach } from 'vitest'
import {
  parseModuleAbi,
  findFunction,
  findStruct,
  getEntryFunctions,
  getViewFunctions,
  requiresSigner,
  getNonSignerParams,
} from '../../../../src/contracts/move/abi-fetcher'
import type { MoveModuleAbi, MoveFunctionAbi } from '../../../../src/contracts/move/types'

// Sample ABI JSON matching the on-chain format
const sampleAbiJson = JSON.stringify({
  address: '0x1',
  name: 'coin',
  friends: ['0x1::genesis'],
  exposed_functions: [
    {
      name: 'transfer',
      visibility: 'public',
      is_entry: true,
      is_view: false,
      generic_type_params: [{ constraints: [] }],
      params: ['&signer', 'address', 'u64'],
      return: [],
    },
    {
      name: 'balance',
      visibility: 'public',
      is_entry: false,
      is_view: true,
      generic_type_params: [{ constraints: [] }],
      params: ['address'],
      return: ['u64'],
    },
    {
      name: 'internal_helper',
      visibility: 'private',
      is_entry: false,
      is_view: false,
      generic_type_params: [],
      params: ['u64'],
      return: ['u64'],
    },
  ],
  structs: [
    {
      name: 'CoinStore',
      is_native: false,
      abilities: ['key'],
      generic_type_params: [{ constraints: [] }],
      fields: [
        { name: 'coin', type: '0x1::coin::Coin<T0>' },
        { name: 'frozen', type: 'bool' },
      ],
    },
    {
      name: 'Coin',
      is_native: false,
      abilities: ['store'],
      generic_type_params: [{ constraints: [] }],
      fields: [{ name: 'value', type: 'u64' }],
    },
  ],
})

describe('Move ABI Fetcher', () => {
  describe('parseModuleAbi', () => {
    it('should parse valid ABI JSON', () => {
      const abi = parseModuleAbi(sampleAbiJson)

      expect(abi.address).toBe('0x1')
      expect(abi.name).toBe('coin')
      expect(abi.friends).toEqual(['0x1::genesis'])
    })

    it('should parse exposed functions', () => {
      const abi = parseModuleAbi(sampleAbiJson)

      expect(abi.exposed_functions).toHaveLength(3)

      const transfer = abi.exposed_functions[0]
      expect(transfer.name).toBe('transfer')
      expect(transfer.visibility).toBe('public')
      expect(transfer.is_entry).toBe(true)
      expect(transfer.is_view).toBe(false)
      expect(transfer.params).toEqual(['&signer', 'address', 'u64'])
    })

    it('should parse view functions', () => {
      const abi = parseModuleAbi(sampleAbiJson)

      const balance = abi.exposed_functions[1]
      expect(balance.name).toBe('balance')
      expect(balance.is_view).toBe(true)
      expect(balance.return).toEqual(['u64'])
    })

    it('should parse structs', () => {
      const abi = parseModuleAbi(sampleAbiJson)

      expect(abi.structs).toHaveLength(2)

      const coinStore = abi.structs[0]
      expect(coinStore.name).toBe('CoinStore')
      expect(coinStore.abilities).toEqual(['key'])
      expect(coinStore.fields).toHaveLength(2)
    })

    it('should parse generic type params', () => {
      const abi = parseModuleAbi(sampleAbiJson)

      const transfer = abi.exposed_functions[0]
      expect(transfer.generic_type_params).toHaveLength(1)
      expect(transfer.generic_type_params[0].constraints).toEqual([])
    })

    it('should throw on invalid JSON', () => {
      expect(() => parseModuleAbi('not json')).toThrow('Failed to parse')
    })

    it('should throw on missing address', () => {
      expect(() => parseModuleAbi('{"name":"test"}')).toThrow('Missing required field')
    })

    it('should throw on missing name', () => {
      expect(() => parseModuleAbi('{"address":"0x1"}')).toThrow('Missing required field')
    })

    it('should handle missing optional fields', () => {
      const minimalAbi = JSON.stringify({
        address: '0x1',
        name: 'minimal',
      })

      const abi = parseModuleAbi(minimalAbi)
      expect(abi.friends).toEqual([])
      expect(abi.exposed_functions).toEqual([])
      expect(abi.structs).toEqual([])
    })

    it('should normalize visibility to lowercase', () => {
      const abiWithUpperVis = JSON.stringify({
        address: '0x1',
        name: 'test',
        exposed_functions: [
          {
            name: 'func',
            visibility: 'PUBLIC',
            is_entry: true,
            is_view: false,
            generic_type_params: [],
            params: [],
            return: [],
          },
        ],
      })

      const abi = parseModuleAbi(abiWithUpperVis)
      expect(abi.exposed_functions[0].visibility).toBe('public')
    })
  })

  describe('ABI Utilities', () => {
    let abi: MoveModuleAbi

    beforeEach(() => {
      abi = parseModuleAbi(sampleAbiJson)
    })

    describe('findFunction', () => {
      it('should find function by name', () => {
        const fn = findFunction(abi, 'transfer')
        expect(fn).toBeDefined()
        expect(fn?.name).toBe('transfer')
      })

      it('should return undefined for non-existent function', () => {
        const fn = findFunction(abi, 'nonexistent')
        expect(fn).toBeUndefined()
      })
    })

    describe('findStruct', () => {
      it('should find struct by name', () => {
        const struct = findStruct(abi, 'CoinStore')
        expect(struct).toBeDefined()
        expect(struct?.name).toBe('CoinStore')
      })

      it('should return undefined for non-existent struct', () => {
        const struct = findStruct(abi, 'NonExistent')
        expect(struct).toBeUndefined()
      })
    })

    describe('getEntryFunctions', () => {
      it('should return only entry functions', () => {
        const entryFns = getEntryFunctions(abi)
        expect(entryFns).toHaveLength(1)
        expect(entryFns[0].name).toBe('transfer')
        expect(entryFns.every(fn => fn.is_entry)).toBe(true)
      })
    })

    describe('getViewFunctions', () => {
      it('should return only view functions', () => {
        const viewFns = getViewFunctions(abi)
        expect(viewFns).toHaveLength(1)
        expect(viewFns[0].name).toBe('balance')
        expect(viewFns.every(fn => fn.is_view)).toBe(true)
      })
    })

    describe('requiresSigner', () => {
      it('should return true for functions with &signer param', () => {
        const transfer = findFunction(abi, 'transfer')!
        expect(requiresSigner(transfer)).toBe(true)
      })

      it('should return false for functions without signer param', () => {
        const balance = findFunction(abi, 'balance')!
        expect(requiresSigner(balance)).toBe(false)
      })

      it('should return false for empty params', () => {
        const fn: MoveFunctionAbi = {
          name: 'empty',
          visibility: 'public',
          is_entry: false,
          is_view: false,
          generic_type_params: [],
          params: [],
          return: [],
        }
        expect(requiresSigner(fn)).toBe(false)
      })
    })

    describe('getNonSignerParams', () => {
      it('should filter out signer params', () => {
        const transfer = findFunction(abi, 'transfer')!
        const nonSignerParams = getNonSignerParams(transfer)
        expect(nonSignerParams).toEqual(['address', 'u64'])
      })

      it('should return all params if no signer', () => {
        const balance = findFunction(abi, 'balance')!
        const nonSignerParams = getNonSignerParams(balance)
        expect(nonSignerParams).toEqual(['address'])
      })

      it('should handle signer type (not reference)', () => {
        const fn: MoveFunctionAbi = {
          name: 'test',
          visibility: 'public',
          is_entry: true,
          is_view: false,
          generic_type_params: [],
          params: ['signer', 'u64'],
          return: [],
        }
        expect(getNonSignerParams(fn)).toEqual(['u64'])
      })
    })
  })
})
