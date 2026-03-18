import { defineConfig } from 'vitest/config'
import { loadEnv } from 'vite'

Object.assign(process.env, loadEnv('test', process.cwd(), ''))

export default defineConfig({
  test: {
    globals: true,
    environment: 'node',
    coverage: {
      provider: 'v8',
      reporter: ['text', 'json', 'html'],
    },
    projects: [
      {
        test: {
          name: 'unit',
          include: ['test/**/*.spec.ts'],
          exclude: ['test/integration/provider-tx.spec.ts', 'test/e2e/**'],
          fileParallelism: true,
        },
      },
      {
        test: {
          name: 'tx',
          include: ['test/integration/provider-tx.spec.ts', 'test/e2e/**/*.spec.ts'],
          fileParallelism: false,
        },
      },
    ],
  },
})
