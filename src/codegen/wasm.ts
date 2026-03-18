/**
 * Wasm Schema Codegen
 *
 * Generates TypeScript files from CosmWasm JSON Schema files
 * (typically `execute_msg.json` and `query_msg.json`).
 *
 * Produces `as const satisfies ReadonlyWasmContractSchema` exports with
 * minimal variant information (variant names only) for type-level
 * autocomplete in downstream contract usage.
 *
 * Entry point:
 * - `generateWasmAbiFromJson` — pure transformation (parsed schemas -> .ts string)
 */

import { formatAbiFile, formatObjectLiteral } from './format'

// =============================================================================
// Types
// =============================================================================

export interface GenerateWasmAbiOptions {
  /** Parsed execute_msg.json schema */
  execute?: unknown
  /** Parsed query_msg.json schema */
  query?: unknown
  /** Override export name (default: "CONTRACT_SCHEMA") */
  exportName?: string
}

// =============================================================================
// Constants
// =============================================================================

const DEFAULT_EXPORT_NAME = 'CONTRACT_SCHEMA'

// =============================================================================
// Public API
// =============================================================================

/**
 * Generates a TypeScript file string from parsed CosmWasm JSON Schema objects.
 *
 * The output contains:
 * - Header comment
 * - `import type { ReadonlyWasmContractSchema } from 'initia.js/wasm'`
 * - `export const <NAME> = { ... } as const satisfies ReadonlyWasmContractSchema`
 *
 * The schema is minimized to only include variant names (required + empty
 * property objects), which is sufficient for type-level autocomplete.
 *
 * @param options - Execute/query schemas and optional overrides
 * @returns Complete TypeScript file content
 * @throws Error if neither execute nor query schema is provided
 * @throws Error if a schema has neither oneOf nor anyOf
 * @throws Error if a variant has no required field
 *
 * @example
 * ```typescript
 * import executeSchema from './execute_msg.json'
 * import querySchema from './query_msg.json'
 *
 * const tsFile = generateWasmAbiFromJson({
 *   execute: executeSchema,
 *   query: querySchema,
 * })
 * writeFileSync('cw20-schema.ts', tsFile)
 * ```
 */
export function generateWasmAbiFromJson(options: GenerateWasmAbiOptions): string {
  const { execute, query, exportName = DEFAULT_EXPORT_NAME } = options

  // Step 1: Validate at least one schema provided
  if (!execute && !query) {
    throw new Error('At least one of execute or query schema must be provided')
  }

  // Step 2: Extract minimal schemas
  const schema: Record<string, unknown> = {}

  if (execute) {
    schema.execute = extractWasmMsgSchema(execute, 'execute')
  }

  if (query) {
    schema.query = extractWasmMsgSchema(query, 'query')
  }

  // Step 3: Format as TypeScript literal
  const value = formatObjectLiteral(schema)

  // Step 4: Wrap with standard file structure
  return formatAbiFile({
    source: 'CosmWasm contract schema',
    importType: 'ReadonlyWasmContractSchema',
    importFrom: 'initia.js/wasm',
    exportName,
    value,
  })
}

// =============================================================================
// Internal helpers
// =============================================================================

/**
 * Extracts a minimal oneOf/anyOf schema from a parsed JSON Schema.
 *
 * Looks for `oneOf` or `anyOf` arrays and extracts each variant's
 * `required` field + builds a minimal `properties` map (empty objects).
 *
 * @param schema - Parsed JSON Schema (unknown for safety)
 * @param label - Human-readable label for error messages ("execute" or "query")
 * @returns Minimal schema object with oneOf or anyOf
 * @throws Error if the schema has neither oneOf nor anyOf
 * @throws Error if any variant lacks a required field
 */
function extractWasmMsgSchema(
  schema: unknown,
  label: string
): { oneOf: unknown[] } | { anyOf: unknown[] } {
  if (schema === null || typeof schema !== 'object') {
    throw new Error(`Invalid ${label} schema: expected an object`)
  }

  const obj = schema as Record<string, unknown>

  // Prefer oneOf, fall back to anyOf
  if (Array.isArray(obj.oneOf)) {
    return { oneOf: obj.oneOf.map((v: unknown) => extractVariant(v, label)) }
  }

  if (Array.isArray(obj.anyOf)) {
    return { anyOf: obj.anyOf.map((v: unknown) => extractVariant(v, label)) }
  }

  throw new Error(`Invalid ${label} schema: expected oneOf or anyOf array at the top level`)
}

/**
 * Extracts a minimal variant from a JSON Schema variant object.
 *
 * Returns an object with:
 * - `required`: the original required array (variant names)
 * - `properties`: a map of each required key to an empty object `{}`
 *
 * @param variant - A single variant from oneOf/anyOf
 * @param label - Human-readable label for error messages
 * @returns Minimal variant with required + properties
 * @throws Error if the variant has no required field
 */
function extractVariant(
  variant: unknown,
  label: string
): { required: string[]; properties: Record<string, Record<string, never>> } {
  if (variant === null || typeof variant !== 'object') {
    throw new Error(`Invalid ${label} variant: expected an object`)
  }

  const obj = variant as Record<string, unknown>

  if (!Array.isArray(obj.required) || obj.required.length === 0) {
    throw new Error(`Invalid ${label} variant: each variant must have a non-empty "required" array`)
  }

  const required = obj.required as string[]

  // Build minimal properties map: each required key -> empty object
  const properties: Record<string, Record<string, never>> = {}
  for (const key of required) {
    properties[key] = {}
  }

  return { required, properties }
}
