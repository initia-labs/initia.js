/**
 * Browser compatibility tests.
 *
 * Verifies that the browser entry point does not contain
 * Node.js-specific APIs or imports.
 */

import { describe, it, expect } from 'vitest'
import { build } from 'esbuild'
import path from 'path'

const ROOT = path.resolve(__dirname, '../..')

describe('Browser Compatibility', () => {
  it('browser entry should not import @connectrpc/connect-node', async () => {
    const result = await build({
      entryPoints: [path.join(ROOT, 'src/entry.browser.ts')],
      bundle: true,
      write: false,
      platform: 'browser',
      format: 'esm',
      metafile: true,
      external: [
        '@bufbuild/*',
        '@connectrpc/connect',
        '@connectrpc/connect-web',
        '@noble/*',
        '@scure/*',
        '@mysten/*',
        '@initia/*',
        '@chain-registry/*',
        'chain-registry',
        'viem',
        'abitype',
      ],
    })

    const inputs = Object.keys(result.metafile.inputs)
    const hasConnectNode = inputs.some(p => p.includes('connect-node'))
    expect(hasConnectNode, 'browser bundle should not include @connectrpc/connect-node').toBe(false)
  })

  it('browser entry should not use require()', async () => {
    const result = await build({
      entryPoints: [path.join(ROOT, 'src/entry.browser.ts')],
      bundle: true,
      write: false,
      platform: 'browser',
      format: 'esm',
      external: ['*'],
    })

    const code = result.outputFiles[0].text
    // Match require("...") or require('...') but not inside comments or strings about require
    const requireCalls = code.match(/\brequire\s*\(/g)
    expect(requireCalls, 'browser bundle should not contain require() calls').toBeNull()
  })

  it('browser entry should not reference Node.js Buffer', async () => {
    const result = await build({
      entryPoints: [path.join(ROOT, 'src/entry.browser.ts')],
      bundle: true,
      write: false,
      platform: 'browser',
      format: 'esm',
      external: ['*'],
    })

    const code = result.outputFiles[0].text
    const bufferUsage = code.match(/\bBuffer\b/)
    expect(bufferUsage, 'browser bundle should not reference Buffer').toBeNull()
  })

  it('browser entry should not reference process.versions', async () => {
    const result = await build({
      entryPoints: [path.join(ROOT, 'src/entry.browser.ts')],
      bundle: true,
      write: false,
      platform: 'browser',
      format: 'esm',
      external: ['*'],
    })

    const code = result.outputFiles[0].text
    const processUsage = code.match(/\bprocess\.versions\b/)
    expect(processUsage, 'browser bundle should not reference process.versions').toBeNull()
  })

  it('node entry should import @connectrpc/connect-node', async () => {
    const result = await build({
      entryPoints: [path.join(ROOT, 'src/entry.node.ts')],
      bundle: true,
      write: false,
      platform: 'node',
      format: 'esm',
      metafile: true,
      external: [
        '@bufbuild/*',
        '@connectrpc/connect',
        '@connectrpc/connect-node',
        '@connectrpc/connect-web',
        '@noble/*',
        '@scure/*',
        '@mysten/*',
        '@initia/*',
        '@chain-registry/*',
        'chain-registry',
        'viem',
        'abitype',
      ],
    })

    const code = result.outputFiles[0].text
    expect(code).toContain('@connectrpc/connect-node')
    // Note: connect-web is also present because chain-context uses it as a universal fallback
  })
})
