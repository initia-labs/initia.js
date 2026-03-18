/**
 * CosmWasm Schema Utilities Tests
 */

import { describe, it, expect } from 'vitest'
import {
  getSchemaVariants,
  getVariantSchema,
  validateMessageStructure,
  validateExecuteMsg,
  validateQueryMsg,
  getSchemaInfo,
  getResponseSchema,
  inferTypeFromSchema,
} from '../../../../src/contracts/wasm/schema'
import type { WasmContractSchema, JsonSchema } from '../../../../src/contracts/wasm/types'

// Sample CW20 schema (simplified)
const cw20Schema: WasmContractSchema = {
  contract_name: 'cw20-base',
  contract_version: '0.16.0',
  instantiate: {
    type: 'object',
    properties: {
      name: { type: 'string' },
      symbol: { type: 'string' },
      decimals: { type: 'integer' },
      initial_balances: {
        type: 'array',
        items: {
          type: 'object',
          properties: {
            address: { type: 'string' },
            amount: { type: 'string' },
          },
        },
      },
    },
    required: ['name', 'symbol', 'decimals'],
  },
  execute: {
    oneOf: [
      {
        properties: {
          transfer: {
            type: 'object',
            properties: {
              recipient: { type: 'string' },
              amount: { type: 'string' },
            },
            required: ['recipient', 'amount'],
          },
        },
      },
      {
        properties: {
          burn: {
            type: 'object',
            properties: {
              amount: { type: 'string' },
            },
            required: ['amount'],
          },
        },
      },
      {
        properties: {
          mint: {
            type: 'object',
            properties: {
              recipient: { type: 'string' },
              amount: { type: 'string' },
            },
            required: ['recipient', 'amount'],
          },
        },
      },
    ],
  },
  query: {
    oneOf: [
      { properties: { balance: { type: 'object' } } },
      { properties: { token_info: { type: 'object' } } },
      { properties: { all_accounts: { type: 'object' } } },
    ],
  },
  responses: {
    balance: {
      type: 'object',
      properties: {
        balance: { type: 'string' },
      },
    },
    token_info: {
      type: 'object',
      properties: {
        name: { type: 'string' },
        symbol: { type: 'string' },
        decimals: { type: 'integer' },
        total_supply: { type: 'string' },
      },
    },
  },
}

describe('CosmWasm Schema Utilities', () => {
  describe('getSchemaVariants', () => {
    it('should extract variants from oneOf schema', () => {
      const variants = getSchemaVariants(cw20Schema.execute)
      expect(variants).toEqual(['transfer', 'burn', 'mint'])
    })

    it('should extract variants from query schema', () => {
      const variants = getSchemaVariants(cw20Schema.query)
      expect(variants).toEqual(['balance', 'token_info', 'all_accounts'])
    })

    it('should return empty array for undefined schema', () => {
      expect(getSchemaVariants(undefined)).toEqual([])
    })

    it('should handle anyOf schema', () => {
      const schema: JsonSchema = {
        anyOf: [{ properties: { option_a: {} } }, { properties: { option_b: {} } }],
      }
      expect(getSchemaVariants(schema)).toEqual(['option_a', 'option_b'])
    })

    it('should handle direct properties', () => {
      const schema: JsonSchema = {
        properties: {
          field1: {},
          field2: {},
        },
      }
      expect(getSchemaVariants(schema)).toEqual(['field1', 'field2'])
    })
  })

  describe('getVariantSchema', () => {
    it('should return schema for variant in oneOf', () => {
      const transferSchema = getVariantSchema(cw20Schema.execute, 'transfer')
      expect(transferSchema).toBeDefined()
      expect(transferSchema?.type).toBe('object')
      expect(transferSchema?.properties?.recipient).toBeDefined()
    })

    it('should return undefined for unknown variant', () => {
      const schema = getVariantSchema(cw20Schema.execute, 'nonexistent')
      expect(schema).toBeUndefined()
    })

    it('should return undefined for undefined schema', () => {
      expect(getVariantSchema(undefined, 'transfer')).toBeUndefined()
    })
  })

  describe('validateMessageStructure', () => {
    it('should validate message with single variant', () => {
      const result = validateMessageStructure({
        transfer: { recipient: 'init1...', amount: '100' },
      })
      expect(result.valid).toBe(true)
      expect(result.variant).toBe('transfer')
    })

    it('should reject empty message', () => {
      const result = validateMessageStructure({})
      expect(result.valid).toBe(false)
      expect(result.error).toContain('at least one')
    })

    it('should reject message with multiple variants', () => {
      const result = validateMessageStructure({ transfer: {}, burn: {} })
      expect(result.valid).toBe(false)
      expect(result.error).toContain('exactly one')
    })
  })

  describe('validateExecuteMsg', () => {
    it('should validate known execute variant', () => {
      const result = validateExecuteMsg(
        { transfer: { recipient: 'init1...', amount: '100' } },
        cw20Schema
      )
      expect(result.valid).toBe(true)
    })

    it('should reject unknown execute variant', () => {
      const result = validateExecuteMsg({ unknown_action: {} }, cw20Schema)
      expect(result.valid).toBe(false)
      expect(result.error).toContain('Unknown execute variant')
      expect(result.error).toContain('transfer')
    })

    it('should pass when no schema is available', () => {
      const result = validateExecuteMsg({ any_action: {} }, { contract_name: 'test' })
      expect(result.valid).toBe(true)
    })

    it('should reject invalid structure', () => {
      const result = validateExecuteMsg({}, cw20Schema)
      expect(result.valid).toBe(false)
    })
  })

  describe('validateQueryMsg', () => {
    it('should validate known query variant', () => {
      const result = validateQueryMsg({ balance: { address: 'init1...' } }, cw20Schema)
      expect(result.valid).toBe(true)
    })

    it('should reject unknown query variant', () => {
      const result = validateQueryMsg({ unknown_query: {} }, cw20Schema)
      expect(result.valid).toBe(false)
      expect(result.error).toContain('Unknown query variant')
    })

    it('should pass when no query schema', () => {
      const result = validateQueryMsg({ any_query: {} }, { contract_name: 'test' })
      expect(result.valid).toBe(true)
    })
  })

  describe('getSchemaInfo', () => {
    it('should return schema information', () => {
      const info = getSchemaInfo(cw20Schema)

      expect(info.name).toBe('cw20-base')
      expect(info.version).toBe('0.16.0')
      expect(info.executeVariants).toEqual(['transfer', 'burn', 'mint'])
      expect(info.queryVariants).toEqual(['balance', 'token_info', 'all_accounts'])
      expect(info.hasInstantiate).toBe(true)
      expect(info.hasMigrate).toBe(false)
      expect(info.hasSudo).toBe(false)
    })

    it('should handle minimal schema', () => {
      const info = getSchemaInfo({ contract_name: 'minimal' })

      expect(info.name).toBe('minimal')
      expect(info.executeVariants).toEqual([])
      expect(info.queryVariants).toEqual([])
      expect(info.hasInstantiate).toBe(false)
    })
  })

  describe('getResponseSchema', () => {
    it('should find response schema by exact name', () => {
      const schema = getResponseSchema(cw20Schema, 'balance')
      expect(schema).toBeDefined()
      expect(schema?.properties?.balance).toBeDefined()
    })

    it('should find response schema for token_info', () => {
      const schema = getResponseSchema(cw20Schema, 'token_info')
      expect(schema).toBeDefined()
      expect(schema?.properties?.name).toBeDefined()
    })

    it('should return undefined for unknown query', () => {
      const schema = getResponseSchema(cw20Schema, 'nonexistent')
      expect(schema).toBeUndefined()
    })

    it('should return undefined when no responses', () => {
      const schema = getResponseSchema({ contract_name: 'test' }, 'balance')
      expect(schema).toBeUndefined()
    })
  })

  describe('inferTypeFromSchema', () => {
    it('should infer primitive types', () => {
      expect(inferTypeFromSchema({ type: 'string' })).toBe('string')
      expect(inferTypeFromSchema({ type: 'number' })).toBe('number')
      expect(inferTypeFromSchema({ type: 'integer' })).toBe('number')
      expect(inferTypeFromSchema({ type: 'boolean' })).toBe('boolean')
      expect(inferTypeFromSchema({ type: 'null' })).toBe('null')
    })

    it('should infer array type', () => {
      const schema: JsonSchema = {
        type: 'array',
        items: { type: 'string' },
      }
      expect(inferTypeFromSchema(schema)).toBe('string[]')
    })

    it('should infer object type with properties', () => {
      const schema: JsonSchema = {
        type: 'object',
        properties: {
          name: { type: 'string' },
          count: { type: 'number' },
        },
        required: ['name'],
      }
      const result = inferTypeFromSchema(schema)
      expect(result).toContain('name: string')
      expect(result).toContain('count?: number')
    })

    it('should infer oneOf as union', () => {
      const schema: JsonSchema = {
        oneOf: [{ type: 'string' }, { type: 'number' }],
      }
      expect(inferTypeFromSchema(schema)).toBe('string | number')
    })

    it('should infer enum', () => {
      const schema: JsonSchema = {
        enum: ['a', 'b', 'c'],
      }
      expect(inferTypeFromSchema(schema)).toBe("'a' | 'b' | 'c'")
    })

    it('should infer const', () => {
      expect(inferTypeFromSchema({ const: 'fixed' })).toBe("'fixed'")
      expect(inferTypeFromSchema({ const: 42 })).toBe('42')
    })

    it('should return unknown for undefined', () => {
      expect(inferTypeFromSchema(undefined)).toBe('unknown')
    })

    it('should return Record for object without properties', () => {
      expect(inferTypeFromSchema({ type: 'object' })).toBe('Record<string, unknown>')
    })
  })
})
