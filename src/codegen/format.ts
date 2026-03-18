/**
 * Shared formatting utilities for codegen output files.
 *
 * All three VM generators (Move, EVM, Wasm) produce .ts files with a common
 * structure: header comment, import statement, exported const with
 * `as const satisfies`. This module provides that shared formatting logic.
 */

export interface FormatAbiFileOptions {
  /** Source description for header comment */
  source: string
  /** Type name to import (e.g., "ReadonlyMoveModuleAbi") */
  importType: string
  /** Module to import from (e.g., "initia.js/move") */
  importFrom: string
  /** Export variable name (e.g., "COIN_ABI") */
  exportName: string
  /** Formatted value string (from formatObjectLiteral) */
  value: string
}

/**
 * Generates a complete TypeScript file string with:
 * - Header comment (source + auto-generated notice)
 * - `import type` statement
 * - `export const = value as const satisfies Type`
 */
export function formatAbiFile(options: FormatAbiFileOptions): string {
  const { source, importType, importFrom, exportName, value } = options

  const header = [`// ${source}`, '// This file is auto-generated. Do not edit manually.', ''].join(
    '\n'
  )

  const importLine = `import type { ${importType} } from '${importFrom}'`

  const exportLine = `export const ${exportName} = ${value} as const satisfies ${importType}`

  return `${header}\n${importLine}\n\n${exportLine}\n`
}

/**
 * Converts a name into UPPER_SNAKE_CASE with a suffix.
 *
 * Examples:
 * - "coin" -> "COIN_ABI"
 * - "cw20-base" -> "CW20_BASE_ABI"
 * - "myModule" -> "MY_MODULE_ABI"
 * - "erc20" -> "ERC20_ABI"
 * - "cw20-base", "SCHEMA" -> "CW20_BASE_SCHEMA"
 */
export function deriveExportName(name: string, suffix = 'ABI'): string {
  // Step 1: Replace hyphens with underscores
  let result = name.replace(/-/g, '_')

  // Step 2: Insert underscore before camelCase boundaries
  // Before a capital letter that is followed by a lowercase letter,
  // and preceded by a lowercase letter or digit.
  result = result.replace(/([a-z0-9])([A-Z])/g, '$1_$2')

  // Step 3: Uppercase everything
  result = result.toUpperCase()

  return `${result}_${suffix}`
}

/**
 * Converts a JS value to a TypeScript object literal string with single quotes.
 *
 * Handles: null, boolean, number, string, arrays, nested objects.
 * Uses 2-space indentation.
 *
 * @param obj - The value to format
 * @param indent - Initial indentation level (default 0)
 */
export function formatObjectLiteral(obj: unknown, indent = 0): string {
  const INDENT_SIZE = 2
  const pad = (level: number) => ' '.repeat(level * INDENT_SIZE)

  function format(value: unknown, level: number): string {
    if (value === null) return 'null'
    if (typeof value === 'boolean') return String(value)
    if (typeof value === 'number') return String(value)
    if (typeof value === 'string') {
      const escaped = value.replace(/\\/g, '\\\\').replace(/'/g, "\\'")
      return `'${escaped}'`
    }

    if (Array.isArray(value)) {
      if (value.length === 0) return '[]'
      const items = value.map(item => `${pad(level + 1)}${format(item, level + 1)},`)
      return `[\n${items.join('\n')}\n${pad(level)}]`
    }

    if (typeof value === 'object') {
      const entries = Object.entries(value as Record<string, unknown>)
      if (entries.length === 0) return '{}'
      const props = entries.map(
        ([key, val]) => `${pad(level + 1)}${key}: ${format(val, level + 1)},`
      )
      return `{\n${props.join('\n')}\n${pad(level)}}`
    }

    throw new Error(`formatObjectLiteral: unsupported value type '${typeof value}'`)
  }

  return format(obj, indent)
}
