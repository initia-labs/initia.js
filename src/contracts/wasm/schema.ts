/**
 * CosmWasm JSON Schema Utilities
 *
 * Provides utilities for working with CosmWasm contract schemas.
 * Note: Full JSON schema validation would require a library like ajv.
 * This module provides basic schema inspection and variant extraction.
 */

import type { JsonSchema, WasmContractSchema, ExecuteMsg, QueryMsg } from './types'

// =============================================================================
// Schema Inspection
// =============================================================================

/**
 * Extracts message variant names from a JSON schema.
 * CosmWasm messages typically use oneOf with single-property objects.
 *
 * @param schema - JSON schema for the message type
 * @returns Array of variant names
 *
 * @example
 * ```typescript
 * const executeVariants = getSchemaVariants(schema.execute)
 * // ['transfer', 'approve', 'mint', 'burn']
 * ```
 */
export function getSchemaVariants(schema: JsonSchema | undefined): string[] {
  if (!schema) return []

  // Handle oneOf (most common for CosmWasm messages)
  if (schema.oneOf) {
    return schema.oneOf.flatMap(variant => {
      if (variant.properties) {
        return Object.keys(variant.properties)
      }
      if (variant.required) {
        return variant.required
      }
      return []
    })
  }

  // Handle anyOf
  if (schema.anyOf) {
    return schema.anyOf.flatMap(variant => {
      if (variant.properties) {
        return Object.keys(variant.properties)
      }
      return []
    })
  }

  // Handle direct properties (less common)
  if (schema.properties) {
    return Object.keys(schema.properties)
  }

  return []
}

/**
 * Gets the schema for a specific message variant.
 *
 * @param schema - JSON schema for the message type
 * @param variant - Variant name to look up
 * @returns Schema for the variant's arguments, or undefined
 */
export function getVariantSchema(
  schema: JsonSchema | undefined,
  variant: string
): JsonSchema | undefined {
  if (!schema) return undefined

  // Handle oneOf
  if (schema.oneOf) {
    for (const variantSchema of schema.oneOf) {
      if (variantSchema.properties?.[variant]) {
        return variantSchema.properties[variant]
      }
    }
  }

  // Handle anyOf
  if (schema.anyOf) {
    for (const variantSchema of schema.anyOf) {
      if (variantSchema.properties?.[variant]) {
        return variantSchema.properties[variant]
      }
    }
  }

  // Handle direct properties
  if (schema.properties?.[variant]) {
    return schema.properties[variant]
  }

  return undefined
}

// =============================================================================
// Basic Validation
// =============================================================================

/**
 * Validates that a message has exactly one variant key.
 * This is a basic structural validation for CosmWasm messages.
 *
 * @param msg - Message to validate
 * @returns Validation result with variant name if valid
 */
export function validateMessageStructure(msg: ExecuteMsg | QueryMsg): {
  valid: boolean
  variant?: string
  error?: string
} {
  const keys = Object.keys(msg)

  if (keys.length === 0) {
    return { valid: false, error: 'Message must have at least one variant key' }
  }

  if (keys.length > 1) {
    return { valid: false, error: 'Message must have exactly one variant key' }
  }

  return { valid: true, variant: keys[0] }
}

/**
 * Validates an execute message against a schema (basic check).
 *
 * @param msg - Execute message to validate
 * @param schema - Contract schema
 * @returns Validation result
 */
export function validateExecuteMsg(
  msg: ExecuteMsg,
  schema: WasmContractSchema
): { valid: boolean; error?: string } {
  // First, validate structure
  const structureResult = validateMessageStructure(msg)
  if (!structureResult.valid) {
    return structureResult
  }

  // Check if schema is available
  if (!schema.execute) {
    return { valid: true } // No schema to validate against
  }

  // Check if variant exists in schema
  const variants = getSchemaVariants(schema.execute)
  if (variants.length > 0 && !variants.includes(structureResult.variant!)) {
    return {
      valid: false,
      error: `Unknown execute variant: ${structureResult.variant}. Available: ${variants.join(', ')}`,
    }
  }

  return { valid: true }
}

/**
 * Validates a query message against a schema (basic check).
 *
 * @param msg - Query message to validate
 * @param schema - Contract schema
 * @returns Validation result
 */
export function validateQueryMsg(
  msg: QueryMsg,
  schema: WasmContractSchema
): { valid: boolean; error?: string } {
  // First, validate structure
  const structureResult = validateMessageStructure(msg)
  if (!structureResult.valid) {
    return structureResult
  }

  // Check if schema is available
  if (!schema.query) {
    return { valid: true } // No schema to validate against
  }

  // Check if variant exists in schema
  const variants = getSchemaVariants(schema.query)
  if (variants.length > 0 && !variants.includes(structureResult.variant!)) {
    return {
      valid: false,
      error: `Unknown query variant: ${structureResult.variant}. Available: ${variants.join(', ')}`,
    }
  }

  return { valid: true }
}

// =============================================================================
// Schema Information
// =============================================================================

/**
 * Gets information about a contract schema.
 *
 * @param schema - Contract schema
 * @returns Schema information
 */
export function getSchemaInfo(schema: WasmContractSchema): {
  name?: string
  version?: string
  executeVariants: string[]
  queryVariants: string[]
  hasInstantiate: boolean
  hasMigrate: boolean
  hasSudo: boolean
} {
  return {
    name: schema.contract_name,
    version: schema.contract_version,
    executeVariants: getSchemaVariants(schema.execute),
    queryVariants: getSchemaVariants(schema.query),
    hasInstantiate: !!schema.instantiate,
    hasMigrate: !!schema.migrate,
    hasSudo: !!schema.sudo,
  }
}

/**
 * Gets the response schema for a query variant.
 *
 * @param schema - Contract schema
 * @param queryVariant - Query variant name
 * @returns Response schema, or undefined
 */
export function getResponseSchema(
  schema: WasmContractSchema,
  queryVariant: string
): JsonSchema | undefined {
  if (!schema.responses) return undefined

  // Try exact match first
  if (schema.responses[queryVariant]) {
    return schema.responses[queryVariant]
  }

  // Try with "Response" suffix (common pattern)
  const responseKey = `${queryVariant}_response`
  if (schema.responses[responseKey]) {
    return schema.responses[responseKey]
  }

  // Try PascalCase with Response suffix
  const pascalCase =
    queryVariant.charAt(0).toUpperCase() +
    queryVariant.slice(1).replace(/_([a-z])/g, (_, c: string) => c.toUpperCase())
  const pascalResponseKey = `${pascalCase}Response`
  if (schema.responses[pascalResponseKey]) {
    return schema.responses[pascalResponseKey]
  }

  return undefined
}

// =============================================================================
// TypeScript Type Inference (Basic)
// =============================================================================

/**
 * Infers a basic TypeScript type string from a JSON schema.
 * This is a simplified inference for documentation purposes.
 *
 * @param schema - JSON schema
 * @returns TypeScript type string
 */
export function inferTypeFromSchema(schema: JsonSchema | undefined): string {
  if (!schema) return 'unknown'

  // Handle explicit type
  if (typeof schema.type === 'string') {
    switch (schema.type) {
      case 'string':
        return 'string'
      case 'number':
      case 'integer':
        return 'number'
      case 'boolean':
        return 'boolean'
      case 'null':
        return 'null'
      case 'array':
        if (schema.items) {
          const itemType = inferTypeFromSchema(
            Array.isArray(schema.items) ? schema.items[0] : schema.items
          )
          return `${itemType}[]`
        }
        return 'unknown[]'
      case 'object':
        if (schema.properties) {
          const props = Object.entries(schema.properties)
            .map(([key, propSchema]) => {
              const optional = !schema.required?.includes(key)
              return `${key}${optional ? '?' : ''}: ${inferTypeFromSchema(propSchema)}`
            })
            .join('; ')
          return `{ ${props} }`
        }
        return 'Record<string, unknown>'
    }
  }

  // Handle oneOf
  if (schema.oneOf) {
    return schema.oneOf.map(inferTypeFromSchema).join(' | ')
  }

  // Handle anyOf
  if (schema.anyOf) {
    return schema.anyOf.map(inferTypeFromSchema).join(' | ')
  }

  // Handle const
  if (schema.const !== undefined) {
    return typeof schema.const === 'string'
      ? `'${schema.const}'`
      : typeof schema.const === 'object'
        ? JSON.stringify(schema.const)
        : String(schema.const as string | number | boolean | bigint)
  }

  // Handle enum
  if (schema.enum) {
    return schema.enum.map(v => (typeof v === 'string' ? `'${v}'` : String(v))).join(' | ')
  }

  return 'unknown'
}
