import { resolve } from 'path'
import { defineConfig } from 'vite'
import dts from 'vite-plugin-dts'

export default defineConfig({
  plugins: [dts()],
  build: {
    lib: {
      entry: resolve(__dirname, 'src/index.ts'),
      fileName: (format) => (format === 'es' ? 'index.mjs' : 'index.cjs'),
      formats: ['es', 'cjs'],
    },
    rollupOptions: {
      external: [
        '@initia/initia.js',
        '@ledgerhq/hw-app-eth',
        '@ledgerhq/hw-transport',
        '@ledgerhq/hw-transport-webhid',
        '@ledgerhq/hw-transport-webusb',
        '@zondax/ledger-cosmos-js',
        'secp256k1',
        'semver',
      ],
    },
  },
})
