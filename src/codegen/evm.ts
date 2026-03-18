/**
 * EVM ABI Codegen
 *
 * Generates TypeScript files from EVM contract ABI definitions.
 * Produces `as const satisfies Abi` exports (using `abitype`) for
 * full type inference in downstream contract usage.
 *
 * Supports three ABI sources:
 * - Raw ABI JSON array
 * - Hardhat/Foundry artifact JSON with `.abi` field (+ optional `contractName`)
 * - Etherscan-compatible API (async)
 */

import { formatAbiFile, deriveExportName, formatObjectLiteral } from './format'
import { fetchWithTimeout } from '../util/fetch'

// =============================================================================
// Types
// =============================================================================

export interface GenerateEvmAbiFromJsonOptions {
  /** Raw ABI array or Hardhat/Foundry artifact with .abi field */
  json: unknown
  /** Override export name (default: derived from contractName, or "CONTRACT_ABI") */
  exportName?: string
}

export interface GenerateEvmAbiFromExplorerOptions {
  /** Contract address */
  address: string
  /** Etherscan-compatible API base URL */
  explorerUrl: string
  /** Override export name (default: "CONTRACT_ABI") */
  exportName?: string
  /** Optional API key for the explorer */
  apiKey?: string
}

// =============================================================================
// Constants
// =============================================================================

const DEFAULT_EXPORT_NAME = 'CONTRACT_ABI'

// =============================================================================
// Sync: parsed JSON -> .ts file string
// =============================================================================

/**
 * Generates a TypeScript file string from a parsed ABI JSON value.
 *
 * The input can be either:
 * - A raw ABI array (e.g., `[{ type: 'function', name: 'balanceOf', ... }]`)
 * - A Hardhat/Foundry artifact object with an `.abi` field and optional `contractName`
 *
 * The output contains:
 * - Header comment with source info
 * - `import type { Abi } from 'abitype'`
 * - `export const <NAME> = [...] as const satisfies Abi`
 *
 * @param options - ABI source and optional overrides
 * @returns Complete TypeScript file content
 * @throws Error if input is not a valid ABI array or artifact with .abi array
 *
 * @example
 * ```typescript
 * import artifact from './MyToken.json'
 * const tsFile = generateEvmAbiFromJson({ json: artifact })
 * writeFileSync('my-token-abi.ts', tsFile)
 * ```
 */
export function generateEvmAbiFromJson(options: GenerateEvmAbiFromJsonOptions): string {
  const { json, exportName: exportNameOverride } = options

  // Step 1: Extract ABI array and optional contract name
  const { abi, contractName } = extractAbi(json)

  // Step 2: Determine export name
  const exportName =
    exportNameOverride ?? (contractName ? deriveExportName(contractName) : DEFAULT_EXPORT_NAME)

  // Step 3: Build source description
  const source = contractName ? `EVM contract ABI: ${contractName}` : 'EVM contract ABI'

  // Step 4: Format the ABI array as a TypeScript literal
  const value = formatObjectLiteral(abi)

  // Step 5: Wrap with standard file structure
  return formatAbiFile({
    source,
    importType: 'Abi',
    importFrom: 'abitype',
    exportName,
    value,
  })
}

// =============================================================================
// Async: Etherscan API -> .ts file string
// =============================================================================

/**
 * Fetches an EVM contract ABI from an Etherscan-compatible API and generates
 * a TypeScript file string.
 *
 * @param options - Explorer URL, contract address, and optional overrides
 * @returns Complete TypeScript file content
 * @throws Error if the API returns an error or the response is not valid ABI JSON
 *
 * @example
 * ```typescript
 * const tsFile = await generateEvmAbiFromExplorer({
 *   address: '0xdAC17F958D2ee523a2206206994597C13D831ec7',
 *   explorerUrl: 'https://api.etherscan.io',
 *   apiKey: 'YOUR_KEY',
 * })
 * writeFileSync('usdt-abi.ts', tsFile)
 * ```
 */
export async function generateEvmAbiFromExplorer(
  options: GenerateEvmAbiFromExplorerOptions
): Promise<string> {
  const { address, explorerUrl, exportName, apiKey } = options

  // Step 1: Build request URL
  const params = new URLSearchParams()
  params.set('module', 'contract')
  params.set('action', 'getabi')
  params.set('address', address)
  if (apiKey) {
    params.set('apikey', apiKey)
  }

  const baseUrl = explorerUrl.replace(/\/+$/, '')
  const url = `${baseUrl}/api?${params.toString()}`

  // Step 2: Fetch ABI from explorer
  const response = await fetchWithTimeout(url)
  if (!response.ok) {
    throw new Error(`Explorer API request failed: ${response.status} ${response.statusText}`)
  }

  const data = (await response.json()) as { status: string; result: string; message?: string }

  // Step 3: Validate response
  if (data.status !== '1') {
    throw new Error(`Explorer API error: ${data.message ?? data.result ?? 'Unknown error'}`)
  }

  // Step 4: Parse the result as ABI JSON
  let abi: unknown
  try {
    abi = JSON.parse(data.result)
  } catch (error) {
    throw new Error(
      `Failed to parse ABI from explorer: ${error instanceof Error ? error.message : String(error)}`
    )
  }

  // Step 5: Delegate to sync generator
  return generateEvmAbiFromJson({ json: abi, exportName })
}

// =============================================================================
// Internal helpers
// =============================================================================

interface ExtractedAbi {
  abi: unknown[]
  contractName?: string
}

/**
 * Extracts an ABI array from either a raw ABI array or an artifact object.
 * @throws Error if the input is not a valid ABI source
 */
function extractAbi(json: unknown): ExtractedAbi {
  // Case 1: Direct ABI array
  if (Array.isArray(json)) {
    return { abi: json }
  }

  // Case 2: Artifact object with .abi field
  if (json !== null && typeof json === 'object') {
    const artifact = json as Record<string, unknown>
    if ('abi' in artifact) {
      if (!Array.isArray(artifact.abi)) {
        throw new Error('Invalid EVM artifact: .abi field exists but is not an array')
      }

      const contractName =
        typeof artifact.contractName === 'string' ? artifact.contractName : undefined

      return { abi: artifact.abi, contractName }
    }
  }

  // Invalid input
  throw new Error(
    'Invalid EVM ABI input: expected an ABI array or an artifact object with an .abi array field'
  )
}
