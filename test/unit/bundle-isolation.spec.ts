import { describe, it, expect } from 'vitest'
import { readFileSync, existsSync } from 'fs'
import { join } from 'path'

const distDir = join(__dirname, '../../dist')

/**
 * Collect all code reachable from an entry file by following chunk imports.
 * tsdown code-splits into chunks like "./chunk-xxx.mjs" — we recursively
 * read all imported chunks to get the full dependency closure.
 */
function collectReachableCode(entryFile: string): string {
  const visited = new Set<string>()
  function walk(file: string) {
    if (visited.has(file)) return ''
    visited.add(file)
    const filePath = join(distDir, file)
    if (!existsSync(filePath)) return ''
    const content = readFileSync(filePath, 'utf-8')
    // Match relative imports: from "./chunk-xxx.mjs" or from './chunk-xxx.mjs'
    const chunks = [...content.matchAll(/from\s+["']\.\/([\w.-]+\.mjs)["']/g)].map(m => m[1])
    let all = content
    for (const chunk of chunks) {
      all += walk(chunk)
    }
    return all
  }
  return walk(entryFile)
}

describe('bundle isolation', () => {
  // Skip if dist doesn't exist (CI may run tests before build)
  const skipIfNoDist = existsSync(distDir) ? it : it.skip

  skipIfNoDist('minievm entry does not include move proto', () => {
    const code = collectReachableCode('entry.chain.minievm.node.mjs')
    expect(code).not.toContain('initia/move/v1')
    expect(code).not.toContain('MsgPublish')
  })

  skipIfNoDist('initia entry does not include evm proto', () => {
    const code = collectReachableCode('entry.chain.initia.node.mjs')
    expect(code).not.toContain('minievm/evm/v1')
  })

  skipIfNoDist('miniwasm entry does not include move or evm proto', () => {
    const code = collectReachableCode('entry.chain.miniwasm.node.mjs')
    expect(code).not.toContain('initia/move/v1')
    expect(code).not.toContain('minievm/evm/v1')
  })
})
