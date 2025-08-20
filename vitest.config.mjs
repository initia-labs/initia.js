// vitest.config.mjs
import { defineConfig } from 'vitest/config'

export default defineConfig({
  test: {
    // Test options here, e.g.:
    globals: true,
    environment: 'node',
    testTimeout: 30000,
  },
})
