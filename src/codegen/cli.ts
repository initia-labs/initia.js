#!/usr/bin/env node

/**
 * abigen CLI
 *
 * Generates TypeScript ABI files for Move, EVM, and CosmWasm contracts.
 * Thin wrapper over the codegen functions; no external CLI framework needed.
 *
 * Usage:
 *   abigen <command> [options]
 *
 * Commands:
 *   move   Fetch Move module ABI from chain via gRPC
 *   evm    Convert EVM ABI from JSON file or Etherscan-compatible explorer
 *   wasm   Convert CosmWasm schema from JSON files
 *
 * Run `abigen <command> --help` for command-specific options.
 */

import { readFile, writeFile, mkdir } from 'node:fs/promises'
import { resolve, join } from 'node:path'

import { createGrpcTransport } from '@connectrpc/connect-node'
import { Query as MoveQuery } from '@buf/initia-labs_initia.bufbuild_es/initia/move/v1/query_pb'

import { createGrpcClient } from '../client/grpc-client'
import { normalizeUrl } from '../client/transport-common'
import { generateMoveAbi, generateMoveAbiBatch, generateMoveAbiAll } from './move'
import type { GeneratedModule } from './move'
import { generateEvmAbiFromJson, generateEvmAbiFromExplorer } from './evm'
import { generateWasmAbiFromJson } from './wasm'

// =============================================================================
// Arg parsing
// =============================================================================

interface ParsedArgs {
  command: string | undefined
  flags: Record<string, string>
  help: boolean
}

/**
 * Minimal key-value parser for `--key value` pairs.
 * Supports `--flag` (boolean) and `--key value` (string).
 */
function parseArgs(argv: string[]): ParsedArgs {
  const flags: Record<string, string> = {}
  let command: string | undefined
  let help = false

  let i = 0
  while (i < argv.length) {
    const arg = argv[i]

    if (arg === '--help' || arg === '-h') {
      help = true
      i++
      continue
    }

    if (arg.startsWith('--')) {
      const key = arg.slice(2)
      const next = argv[i + 1]

      // If next arg exists and is not a flag, treat it as the value
      if (next !== undefined && !next.startsWith('--')) {
        flags[key] = next
        i += 2
      } else {
        flags[key] = 'true'
        i++
      }
      continue
    }

    // First non-flag argument is the command
    if (command === undefined) {
      command = arg
    }
    i++
  }

  return { command, flags, help }
}

// =============================================================================
// Help text
// =============================================================================

const MAIN_HELP = `
abigen <command> [options]

Commands:
  move   Fetch Move module ABI from chain via gRPC
  evm    Convert EVM ABI from JSON file or Etherscan-compatible explorer
  wasm   Convert CosmWasm schema from JSON files

Common options:
  --out <path>     Output .ts file path (default: stdout)
  --name <name>    Export variable name
  --help           Show help
`.trim()

const MOVE_HELP = `
abigen move [options]

Fetch Move module ABI(s) from chain via gRPC and generate TypeScript file(s).

Required:
  --address <addr>     Module address (e.g., 0x1)
  --endpoint <url>     gRPC endpoint URL

Module selection (one of):
  --module <name>      Single module name (e.g., coin)
  --modules <names>    Comma-separated module names (e.g., coin,oracle,staking)
  --all                Fetch all modules from the address

Output:
  --out <path>         Output .ts file path (single module only, default: stdout)
  --outdir <dir>       Output directory (batch mode: one file per module + index.ts)
  --name <name>        Export variable name (single module only)
`.trim()

const EVM_HELP = `
abigen evm [options]

Convert an EVM ABI from a JSON file or Etherscan-compatible explorer.

From JSON file:
  --json <path>        Path to ABI JSON file (raw array or Hardhat/Foundry artifact)

From explorer:
  --address <addr>     Contract address
  --explorer <url>     Etherscan-compatible API base URL
  --api-key <key>      API key (optional)

Optional:
  --name <name>        Export variable name
  --out <path>         Output .ts file path (default: stdout)
`.trim()

const WASM_HELP = `
abigen wasm [options]

Convert CosmWasm JSON Schema files into a TypeScript file.

At least one of --execute or --query is required.

Options:
  --execute <path>     Path to execute_msg.json
  --query <path>       Path to query_msg.json

Optional:
  --name <name>        Export variable name (default: CONTRACT_SCHEMA)
  --out <path>         Output .ts file path (default: stdout)
`.trim()

// =============================================================================
// Command handlers
// =============================================================================

function createMoveClient(endpoint: string) {
  const transport = createGrpcTransport({ baseUrl: normalizeUrl(endpoint) })
  return { client: createGrpcClient(transport, { move: MoveQuery }) }
}

async function handleMove(flags: Record<string, string>): Promise<string | GeneratedModule[]> {
  const address = flags['address']
  const endpoint = flags['endpoint']

  if (!address) throw new Error('Missing required option: --address')
  if (!endpoint) throw new Error('Missing required option: --endpoint')

  const context = createMoveClient(endpoint)

  // Batch: --all
  if (flags['all'] === 'true') {
    return generateMoveAbiAll(context, address)
  }

  // Batch: --modules (comma-separated)
  if (flags['modules']) {
    const names = flags['modules']
      .split(',')
      .map(s => s.trim())
      .filter(Boolean)
    if (names.length === 0) throw new Error('--modules requires at least one module name')
    return generateMoveAbiBatch(context, address, names)
  }

  // Single: --module
  const moduleName = flags['module']
  if (!moduleName) {
    throw new Error('Missing module selection: use --module, --modules, or --all')
  }

  const content = await generateMoveAbi(
    context,
    address,
    moduleName,
    flags['name'] ? { exportName: flags['name'] } : undefined
  )
  return content
}

async function handleEvm(flags: Record<string, string>): Promise<string> {
  const jsonPath = flags['json']
  const address = flags['address']
  const explorerUrl = flags['explorer']

  if (jsonPath) {
    // Read ABI from local JSON file
    const absolutePath = resolve(jsonPath)
    const content = await readFile(absolutePath, 'utf-8')
    const json: unknown = JSON.parse(content)

    return generateEvmAbiFromJson({
      json,
      exportName: flags['name'],
    })
  }

  if (address && explorerUrl) {
    return generateEvmAbiFromExplorer({
      address,
      explorerUrl,
      exportName: flags['name'],
      apiKey: flags['api-key'],
    })
  }

  throw new Error(
    'EVM command requires either --json <path> or both --address and --explorer. Run with --help for usage.'
  )
}

async function handleWasm(flags: Record<string, string>): Promise<string> {
  const executePath = flags['execute']
  const queryPath = flags['query']

  if (!executePath && !queryPath) {
    throw new Error(
      'Wasm command requires at least one of --execute or --query. Run with --help for usage.'
    )
  }

  let execute: unknown
  let query: unknown

  if (executePath) {
    const content = await readFile(resolve(executePath), 'utf-8')
    execute = JSON.parse(content)
  }

  if (queryPath) {
    const content = await readFile(resolve(queryPath), 'utf-8')
    query = JSON.parse(content)
  }

  return generateWasmAbiFromJson({
    execute,
    query,
    exportName: flags['name'],
  })
}

// =============================================================================
// Output
// =============================================================================

async function writeOutput(content: string, outPath: string | undefined): Promise<void> {
  if (outPath) {
    const absolutePath = resolve(outPath)
    await writeFile(absolutePath, content, 'utf-8')
    console.error(`Written to ${absolutePath}`)
  } else {
    process.stdout.write(content)
  }
}

/**
 * Derives a kebab-case filename from a module name.
 * e.g., "coin" → "coin-abi.ts", "fungibleAsset" → "fungible-asset-abi.ts"
 */
function toFileName(moduleName: string): string {
  return (
    moduleName
      .replace(/([a-z0-9])([A-Z])/g, '$1-$2')
      .replace(/_/g, '-')
      .toLowerCase() + '-abi.ts'
  )
}

/**
 * Writes batch-generated modules to a directory with a barrel index.ts.
 */
async function writeOutputDir(modules: GeneratedModule[], outDir: string): Promise<void> {
  const absoluteDir = resolve(outDir)
  await mkdir(absoluteDir, { recursive: true })

  const indexLines: string[] = []

  for (const mod of modules) {
    const fileName = toFileName(mod.moduleName)
    const filePath = join(absoluteDir, fileName)
    await writeFile(filePath, mod.content, 'utf-8')
    console.error(`  ${fileName}`)

    const importPath = './' + fileName.replace(/\.ts$/, '')
    indexLines.push(`export { ${mod.exportName} } from '${importPath}'`)
  }

  // Write barrel index.ts
  const indexContent =
    '// Auto-generated barrel export. Do not edit manually.\n\n' + indexLines.join('\n') + '\n'
  const indexPath = join(absoluteDir, 'index.ts')
  await writeFile(indexPath, indexContent, 'utf-8')
  console.error(`  index.ts`)
  console.error(`Written ${modules.length} modules to ${absoluteDir}`)
}

// =============================================================================
// Main
// =============================================================================

function printHelp(text: string): void {
  process.stdout.write(text + '\n')
}

async function main(): Promise<void> {
  const { command, flags, help } = parseArgs(process.argv.slice(2))

  // No command or top-level --help
  if (!command || (help && !command)) {
    printHelp(MAIN_HELP)
    process.exit(0)
  }

  // Command-specific --help
  if (help) {
    switch (command) {
      case 'move':
        printHelp(MOVE_HELP)
        break
      case 'evm':
        printHelp(EVM_HELP)
        break
      case 'wasm':
        printHelp(WASM_HELP)
        break
      default:
        printHelp(MAIN_HELP)
    }
    process.exit(0)
  }

  let result: string | GeneratedModule[]

  switch (command) {
    case 'move':
      result = await handleMove(flags)
      break
    case 'evm':
      result = await handleEvm(flags)
      break
    case 'wasm':
      result = await handleWasm(flags)
      break
    default:
      console.error(`Unknown command: ${command}`)
      console.error(MAIN_HELP)
      process.exit(1)
  }

  // Batch result (array of modules)
  if (Array.isArray(result)) {
    const outDir = flags['outdir']
    if (!outDir) {
      throw new Error('Batch mode (--modules or --all) requires --outdir <directory>')
    }
    await writeOutputDir(result, outDir)
    return
  }

  // Single result
  await writeOutput(result, flags['out'])
}

main().catch((error: unknown) => {
  const message = error instanceof Error ? error.message : String(error)
  console.error(`Error: ${message}`)
  process.exit(1)
})
