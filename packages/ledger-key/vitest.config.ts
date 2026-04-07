import { defineConfig } from 'vitest/config'
import { resolve } from 'node:path'

const initiaAlias = { '@initia/initia.js': resolve(import.meta.dirname, '../../src/index.ts') }

export default defineConfig({
  test: {
    globals: true,
    environment: 'node',
    projects: [
      {
        resolve: { alias: initiaAlias },
        test: {
          name: 'unit',
          include: ['test/unit/**/*.spec.ts'],
          exclude: ['test/integration/**'],
        },
      },
      {
        resolve: { alias: initiaAlias },
        test: {
          name: 'integration',
          include: ['test/integration/**/*.spec.ts'],
          env: { LEDGER_TEST: 'true' },
        },
      },
    ],
  },
})
