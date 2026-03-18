/**
 * Move ABI Codegen
 *
 * Generates TypeScript files from Move module ABI JSON strings.
 * Produces `as const satisfies ReadonlyMoveModuleAbi` exports for
 * full type inference in downstream contract usage.
 *
 * Two entry points:
 * - `generateMoveAbiString` — pure transformation (JSON string -> .ts string)
 * - `generateMoveAbi` — async fetch from chain + generate
 */

import type { HasMoveService } from '../client/types'
import { formatAbiFile, deriveExportName, formatObjectLiteral } from './format'

// =============================================================================
// Types
// =============================================================================

export interface GenerateMoveAbiOptions {
  /** Override export name (default: derived from module name via UPPER_SNAKE_CASE + _ABI) */
  exportName?: string
}

// =============================================================================
// Pure transformation
// =============================================================================

/**
 * Generates a TypeScript file string from a raw Move module ABI JSON string.
 *
 * The output contains:
 * - Header comment with module address and name
 * - `import type { ReadonlyMoveModuleAbi } from 'initia.js/move'`
 * - `export const <NAME>_ABI = { ... } as const satisfies ReadonlyMoveModuleAbi`
 *
 * @param abiJson - Raw JSON string from Module.abi (as returned by gRPC)
 * @param options - Optional overrides (exportName)
 * @returns Complete TypeScript file content
 * @throws Error if JSON is invalid or missing required fields (address, name)
 *
 * @example
 * ```typescript
 * const tsFile = generateMoveAbiString(rawJson)
 * writeFileSync('coin-abi.ts', tsFile)
 * ```
 */
export function generateMoveAbiString(abiJson: string, options?: GenerateMoveAbiOptions): string {
  // Step 1: Parse to validate structure and extract metadata
  let parsed: Record<string, unknown>
  try {
    parsed = JSON.parse(abiJson) as Record<string, unknown>
  } catch (error) {
    throw new Error(
      `Invalid Move ABI JSON: ${error instanceof Error ? error.message : String(error)}`
    )
  }

  const address = parsed.address
  const name = parsed.name

  if (!address || typeof address !== 'string') {
    throw new Error('Move ABI JSON missing required field: address')
  }
  if (!name || typeof name !== 'string') {
    throw new Error('Move ABI JSON missing required field: name')
  }

  // Step 2: Derive export name from module name (or use override)
  const exportName = options?.exportName ?? deriveExportName(name)

  // Step 3: Format the parsed object as a TypeScript literal with single quotes
  const value = formatObjectLiteral(parsed)

  // Step 4: Wrap with standard file structure
  return formatAbiFile({
    source: `Move module: ${address}::${name}`,
    importType: 'ReadonlyMoveModuleAbi',
    importFrom: 'initia.js/move',
    exportName,
    value,
  })
}

// =============================================================================
// Async fetch + generate
// =============================================================================

/**
 * Fetches a Move module ABI from the chain and generates a TypeScript file string.
 *
 * Uses the gRPC `move.module()` endpoint to retrieve the raw ABI JSON,
 * then delegates to `generateMoveAbiString` for the transformation.
 *
 * @param context - Object with a client that has the `move` gRPC service
 * @param moduleAddress - Module address (hex or bech32)
 * @param moduleName - Module name (e.g., 'coin')
 * @param options - Optional overrides (exportName)
 * @returns Complete TypeScript file content
 * @throws Error if the module is not found or has no ABI
 *
 * @example
 * ```typescript
 * const ctx = { client: createGrpcClient(endpoint, { chain: 'initia' }) }
 * const tsFile = await generateMoveAbi(ctx, '0x1', 'coin')
 * writeFileSync('coin-abi.ts', tsFile)
 * ```
 */
export async function generateMoveAbi(
  context: HasMoveService,
  moduleAddress: string,
  moduleName: string,
  options?: GenerateMoveAbiOptions
): Promise<string> {
  const response = await context.client.move.module({
    address: moduleAddress,
    moduleName,
  })

  if (!response.module) {
    throw new Error(`Module not found: ${moduleAddress}::${moduleName}`)
  }

  const abiJson = response.module.abi
  if (!abiJson) {
    throw new Error(`Module ABI not available: ${moduleAddress}::${moduleName}`)
  }

  return generateMoveAbiString(abiJson, options)
}

// =============================================================================
// Batch: named modules
// =============================================================================

export interface GeneratedModule {
  moduleName: string
  exportName: string
  content: string
}

/**
 * Fetches multiple Move module ABIs and generates TypeScript file strings.
 *
 * @param context - Object with a client that has the `move` gRPC service
 * @param moduleAddress - Module address (hex or bech32)
 * @param moduleNames - List of module names to fetch
 * @returns Array of generated modules with their content and metadata
 */
export async function generateMoveAbiBatch(
  context: HasMoveService,
  moduleAddress: string,
  moduleNames: string[]
): Promise<GeneratedModule[]> {
  const results: GeneratedModule[] = []

  for (const moduleName of moduleNames) {
    const content = await generateMoveAbi(context, moduleAddress, moduleName)
    results.push({
      moduleName,
      exportName: deriveExportName(moduleName),
      content,
    })
  }

  return results
}

// =============================================================================
// Batch: all modules from an address
// =============================================================================

/**
 * Fetches all Move module ABIs from an address and generates TypeScript file strings.
 *
 * Uses `move.modules()` to discover all modules, then generates each one.
 * Modules without ABI are silently skipped.
 *
 * @param context - Object with a client that has the `move` gRPC service
 * @param moduleAddress - Module address (hex or bech32)
 * @returns Array of generated modules with their content and metadata
 */
export async function generateMoveAbiAll(
  context: HasMoveService,
  moduleAddress: string
): Promise<GeneratedModule[]> {
  const response = await context.client.move.modules({ address: moduleAddress })
  const results: GeneratedModule[] = []

  for (const mod of response.modules) {
    if (!mod.abi) continue

    try {
      const content = generateMoveAbiString(mod.abi)
      const parsed = JSON.parse(mod.abi) as { name?: string }
      const moduleName = parsed.name ?? mod.moduleName
      results.push({
        moduleName,
        exportName: deriveExportName(moduleName),
        content,
      })
    } catch {
      // Skip modules with unparseable ABI
    }
  }

  return results
}
