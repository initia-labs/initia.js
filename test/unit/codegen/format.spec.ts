import { describe, it, expect } from 'vitest'
import { formatAbiFile, deriveExportName, formatObjectLiteral } from '../../../src/codegen/format'

describe('codegen/format', () => {
  describe('formatObjectLiteral', () => {
    it('handles null', () => {
      expect(formatObjectLiteral(null)).toBe('null')
    })

    it('handles booleans', () => {
      expect(formatObjectLiteral(true)).toBe('true')
      expect(formatObjectLiteral(false)).toBe('false')
    })

    it('handles numbers', () => {
      expect(formatObjectLiteral(42)).toBe('42')
      expect(formatObjectLiteral(3.14)).toBe('3.14')
      expect(formatObjectLiteral(0)).toBe('0')
      expect(formatObjectLiteral(-1)).toBe('-1')
    })

    it('handles strings with single quotes', () => {
      expect(formatObjectLiteral('hello')).toBe("'hello'")
    })

    it('escapes single quotes inside strings', () => {
      expect(formatObjectLiteral("it's")).toBe("'it\\'s'")
    })

    it('escapes backslashes inside strings', () => {
      expect(formatObjectLiteral('a\\b')).toBe("'a\\\\b'")
    })

    it('handles empty arrays', () => {
      expect(formatObjectLiteral([])).toBe('[]')
    })

    it('handles arrays of primitives', () => {
      const result = formatObjectLiteral([1, 'two', true])
      expect(result).toBe(`[
  1,
  'two',
  true,
]`)
    })

    it('handles empty objects', () => {
      expect(formatObjectLiteral({})).toBe('{}')
    })

    it('handles flat objects', () => {
      const result = formatObjectLiteral({ name: 'coin', version: 1 })
      expect(result).toBe(`{
  name: 'coin',
  version: 1,
}`)
    })

    it('handles nested objects', () => {
      const result = formatObjectLiteral({
        module: {
          name: 'coin',
          functions: [{ name: 'transfer', visibility: 'public' }],
        },
      })
      expect(result).toBe(`{
  module: {
    name: 'coin',
    functions: [
      {
        name: 'transfer',
        visibility: 'public',
      },
    ],
  },
}`)
    })

    it('handles arrays of objects', () => {
      const result = formatObjectLiteral([{ a: 1 }, { a: 2 }])
      expect(result).toBe(`[
  {
    a: 1,
  },
  {
    a: 2,
  },
]`)
    })

    it('handles deeply nested structures', () => {
      const result = formatObjectLiteral({
        a: { b: { c: 'deep' } },
      })
      expect(result).toBe(`{
  a: {
    b: {
      c: 'deep',
    },
  },
}`)
    })

    it('respects custom initial indent', () => {
      const result = formatObjectLiteral({ x: 1 }, 1)
      expect(result).toBe(`{
    x: 1,
  }`)
    })

    it('handles null values in objects', () => {
      const result = formatObjectLiteral({ key: null })
      expect(result).toBe(`{
  key: null,
}`)
    })

    it('handles mixed arrays', () => {
      const result = formatObjectLiteral([null, 'str', 42, false])
      expect(result).toBe(`[
  null,
  'str',
  42,
  false,
]`)
    })
  })

  describe('deriveExportName', () => {
    it('converts simple lowercase name', () => {
      expect(deriveExportName('coin')).toBe('COIN_ABI')
    })

    it('converts hyphenated name', () => {
      expect(deriveExportName('cw20-base')).toBe('CW20_BASE_ABI')
    })

    it('converts camelCase name', () => {
      expect(deriveExportName('myModule')).toBe('MY_MODULE_ABI')
    })

    it('converts PascalCase name', () => {
      expect(deriveExportName('MyModule')).toBe('MY_MODULE_ABI')
    })

    it('uses custom suffix', () => {
      expect(deriveExportName('cw20-base', 'SCHEMA')).toBe('CW20_BASE_SCHEMA')
    })

    it('preserves consecutive uppercase (acronyms)', () => {
      expect(deriveExportName('erc20')).toBe('ERC20_ABI')
    })

    it('handles underscores in input', () => {
      expect(deriveExportName('my_module')).toBe('MY_MODULE_ABI')
    })

    it('handles single character name', () => {
      expect(deriveExportName('x')).toBe('X_ABI')
    })

    it('handles name that is already UPPER_SNAKE', () => {
      expect(deriveExportName('COIN')).toBe('COIN_ABI')
    })

    it('handles mixed separators', () => {
      expect(deriveExportName('my-cool_module')).toBe('MY_COOL_MODULE_ABI')
    })
  })

  describe('formatAbiFile', () => {
    it('produces correct file structure', () => {
      const result = formatAbiFile({
        source: 'Generated from 0x1::coin',
        importType: 'ReadonlyMoveModuleAbi',
        importFrom: 'initia.js/move',
        exportName: 'COIN_ABI',
        value: `{
  name: 'coin',
}`,
      })

      const lines = result.split('\n')

      // Header comment
      expect(lines[0]).toBe('// Generated from 0x1::coin')
      expect(lines[1]).toBe('// This file is auto-generated. Do not edit manually.')
      expect(lines[2]).toBe('')

      // Import statement
      expect(lines[3]).toBe("import type { ReadonlyMoveModuleAbi } from 'initia.js/move'")
      expect(lines[4]).toBe('')

      // Export with as const satisfies
      expect(lines[5]).toBe('export const COIN_ABI = {')
      expect(lines[6]).toBe("  name: 'coin',")
      expect(lines[7]).toBe('} as const satisfies ReadonlyMoveModuleAbi')

      // Trailing newline
      expect(result.endsWith('\n')).toBe(true)
    })

    it('works with array values', () => {
      const result = formatAbiFile({
        source: 'Generated from ERC20',
        importType: 'Abi',
        importFrom: 'initia.js/evm',
        exportName: 'ERC20_ABI',
        value: `[
  {
    type: 'function',
    name: 'balanceOf',
  },
]`,
      })

      expect(result).toContain('export const ERC20_ABI = [')
      expect(result).toContain('] as const satisfies Abi')
    })

    it('ends with exactly one newline', () => {
      const result = formatAbiFile({
        source: 'test',
        importType: 'T',
        importFrom: 'mod',
        exportName: 'X',
        value: '{}',
      })

      expect(result.endsWith('\n')).toBe(true)
      expect(result.endsWith('\n\n')).toBe(false)
    })
  })
})
