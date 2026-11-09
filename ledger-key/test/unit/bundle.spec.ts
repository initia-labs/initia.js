import { mkdirSync, mkdtempSync, rmSync } from 'fs'
import { createRequire } from 'module'
import path from 'path'
import { build } from 'vite'
import { afterAll, beforeAll, describe, expect, it } from 'vitest'

// @ledgerhq/hw-app-eth and @zondax/ledger-cosmos-js are CommonJS builds that export their
// class as `exports.default`. Vitest unwraps that for tests that import `src`, but plain Node
// does not, so these tests build the real CommonJS bundle and load it with Node's own require.
const packageRoot = path.resolve(__dirname, '../..')
const requireFromPackage = createRequire(path.join(packageRoot, 'package.json'))

describe('CommonJS bundle loaded in plain Node', () => {
  let outDir: string
  let bundle: typeof import('../../src')

  beforeAll(async () => {
    // Keep the output under node_modules so the bundle resolves its external dependencies.
    const cacheDir = path.join(packageRoot, 'node_modules', '.cache')
    mkdirSync(cacheDir, { recursive: true })
    outDir = mkdtempSync(path.join(cacheDir, 'ledger-key-bundle-'))
    await build({
      root: packageRoot,
      configFile: path.join(packageRoot, 'vite.config.ts'),
      logLevel: 'silent',
      build: { outDir, emptyOutDir: true },
    })
    bundle = requireFromPackage(path.join(outDir, 'index.cjs'))
  }, 60_000)

  afterAll(() => {
    if (outDir) rmSync(outDir, { recursive: true, force: true })
  })

  it('creates EthereumApp backed by the hw-app-eth class', () => {
    const Transport = requireFromPackage('@ledgerhq/hw-transport').default
    const Eth = requireFromPackage('@ledgerhq/hw-app-eth').default

    const app = new bundle.EthereumApp(new Transport())

    expect(app.app).toBeInstanceOf(Eth)
  })

  it('creates CosmosApp backed by the ledger-cosmos-js class', () => {
    const Transport = requireFromPackage('@ledgerhq/hw-transport').default
    const Cosmos = requireFromPackage('@zondax/ledger-cosmos-js').default

    const app = new bundle.CosmosApp(new Transport())

    expect(app.app).toBeInstanceOf(Cosmos)
  })
})
