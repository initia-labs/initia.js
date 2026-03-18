import { describe, it, expect } from 'vitest'
import { generateWasmAbiFromJson } from '../../../src/codegen/wasm'

// CW20-style execute schema using oneOf
const EXECUTE_SCHEMA_ONEOF = {
  $schema: 'http://json-schema.org/draft-07/schema#',
  title: 'ExecuteMsg',
  oneOf: [
    {
      type: 'object',
      required: ['transfer'],
      properties: {
        transfer: {
          type: 'object',
          required: ['recipient', 'amount'],
          properties: {
            recipient: { type: 'string' },
            amount: { type: 'string' },
          },
        },
      },
    },
    {
      type: 'object',
      required: ['burn'],
      properties: {
        burn: {
          type: 'object',
          required: ['amount'],
          properties: {
            amount: { type: 'string' },
          },
        },
      },
    },
    {
      type: 'object',
      required: ['send'],
      properties: {
        send: {
          type: 'object',
          required: ['contract', 'amount', 'msg'],
          properties: {
            contract: { type: 'string' },
            amount: { type: 'string' },
            msg: { type: 'string' },
          },
        },
      },
    },
  ],
}

// Query schema using anyOf
const QUERY_SCHEMA_ANYOF = {
  $schema: 'http://json-schema.org/draft-07/schema#',
  title: 'QueryMsg',
  anyOf: [
    {
      type: 'object',
      required: ['balance'],
      properties: {
        balance: {
          type: 'object',
          required: ['address'],
          properties: {
            address: { type: 'string' },
          },
        },
      },
    },
    {
      type: 'object',
      required: ['token_info'],
      properties: {
        token_info: {
          type: 'object',
          properties: {},
        },
      },
    },
  ],
}

// Query schema using oneOf
const QUERY_SCHEMA_ONEOF = {
  $schema: 'http://json-schema.org/draft-07/schema#',
  title: 'QueryMsg',
  oneOf: [
    {
      type: 'object',
      required: ['balance'],
      properties: {
        balance: {
          type: 'object',
          required: ['address'],
          properties: {
            address: { type: 'string' },
          },
        },
      },
    },
    {
      type: 'object',
      required: ['token_info'],
      properties: {
        token_info: {
          type: 'object',
          properties: {},
        },
      },
    },
  ],
}

describe('generateWasmAbiFromJson', () => {
  it('should generate valid TypeScript from execute + query schemas (oneOf + anyOf)', () => {
    const result = generateWasmAbiFromJson({
      execute: EXECUTE_SCHEMA_ONEOF,
      query: QUERY_SCHEMA_ANYOF,
    })

    // Header comment
    expect(result).toContain('// CosmWasm contract schema')
    expect(result).toContain('// This file is auto-generated. Do not edit manually.')

    // Import statement
    expect(result).toContain("import type { ReadonlyWasmContractSchema } from 'initia.js/wasm'")

    // Default export name
    expect(result).toContain('export const CONTRACT_SCHEMA =')

    // Type assertion
    expect(result).toContain('as const satisfies ReadonlyWasmContractSchema')

    // Execute variants present (from oneOf)
    expect(result).toContain('execute:')
    expect(result).toContain('oneOf:')
    expect(result).toContain("'transfer'")
    expect(result).toContain("'burn'")
    expect(result).toContain("'send'")

    // Query variants present (from anyOf)
    expect(result).toContain('query:')
    expect(result).toContain('anyOf:')
    expect(result).toContain("'balance'")
    expect(result).toContain("'token_info'")

    // Variant structure: required + properties with empty objects
    expect(result).toContain('required:')
    expect(result).toContain('properties:')
  })

  it('should generate execute only when query is not provided', () => {
    const result = generateWasmAbiFromJson({
      execute: EXECUTE_SCHEMA_ONEOF,
    })

    expect(result).toContain('execute:')
    expect(result).toContain("'transfer'")
    expect(result).toContain("'burn'")
    expect(result).not.toContain('query:')
  })

  it('should generate query only when execute is not provided', () => {
    const result = generateWasmAbiFromJson({
      query: QUERY_SCHEMA_ONEOF,
    })

    expect(result).toContain('query:')
    expect(result).toContain("'balance'")
    expect(result).toContain("'token_info'")
    expect(result).not.toContain('execute:')
  })

  it('should use custom export name when provided', () => {
    const result = generateWasmAbiFromJson({
      execute: EXECUTE_SCHEMA_ONEOF,
      exportName: 'CW20_SCHEMA',
    })

    expect(result).toContain('export const CW20_SCHEMA =')
    expect(result).not.toContain('CONTRACT_SCHEMA')
  })

  it('should throw when neither execute nor query is provided', () => {
    expect(() => generateWasmAbiFromJson({})).toThrow()
  })

  it('should throw when execute schema has neither oneOf nor anyOf', () => {
    const badSchema = {
      title: 'ExecuteMsg',
      type: 'object',
      properties: { transfer: { type: 'object' } },
    }

    expect(() => generateWasmAbiFromJson({ execute: badSchema })).toThrow(/oneOf.*anyOf/i)
  })

  it('should throw when query schema has neither oneOf nor anyOf', () => {
    const badSchema = {
      title: 'QueryMsg',
      type: 'string',
    }

    expect(() => generateWasmAbiFromJson({ query: badSchema })).toThrow(/oneOf.*anyOf/i)
  })

  it('should throw when a variant has no required field', () => {
    const badSchema = {
      oneOf: [
        {
          type: 'object',
          properties: {
            transfer: { type: 'object' },
          },
          // missing "required"
        },
      ],
    }

    expect(() => generateWasmAbiFromJson({ execute: badSchema })).toThrow(/required/i)
  })

  it('should produce minimal properties with empty objects for each variant', () => {
    const result = generateWasmAbiFromJson({
      execute: EXECUTE_SCHEMA_ONEOF,
    })

    // Each variant property should be an empty object {}
    // The format should have: properties: { transfer: {} }
    // We check the output contains the pattern of variant name + empty object
    expect(result).toContain('transfer: {}')
    expect(result).toContain('burn: {}')
    expect(result).toContain('send: {}')
  })

  it('should handle both oneOf for execute and oneOf for query', () => {
    const result = generateWasmAbiFromJson({
      execute: EXECUTE_SCHEMA_ONEOF,
      query: QUERY_SCHEMA_ONEOF,
    })

    // Both sections present
    expect(result).toContain('execute:')
    expect(result).toContain('query:')

    // Both use oneOf
    const execIdx = result.indexOf('execute:')
    const queryIdx = result.indexOf('query:')
    const afterExec = result.slice(execIdx, queryIdx)
    const afterQuery = result.slice(queryIdx)

    expect(afterExec).toContain('oneOf:')
    expect(afterQuery).toContain('oneOf:')
  })

  it('should handle variants with multiple required fields', () => {
    const schema = {
      oneOf: [
        {
          type: 'object',
          required: ['transfer', 'extra_key'],
          properties: {
            transfer: { type: 'object' },
            extra_key: { type: 'string' },
          },
        },
      ],
    }

    const result = generateWasmAbiFromJson({ execute: schema })

    // Should include both required keys
    expect(result).toContain("'transfer'")
    expect(result).toContain("'extra_key'")
    // Properties should have empty objects for both
    expect(result).toContain('transfer: {}')
    expect(result).toContain('extra_key: {}')
  })
})
