import { resolve } from 'path'
import { defineConfig } from 'vite'
import dts from 'vite-plugin-dts'

export default defineConfig({
  plugins: [dts()],
  build: {
    lib: {
      entry: resolve(__dirname, 'src/index.ts'),
      fileName: (format) => (format === 'es' ? 'index.js' : 'index.cjs'),
      formats: ['es', 'cjs'],
    },
    rollupOptions: {
      external: [
        new RegExp('^@initia/.*'),
        new RegExp('^@ledgerhq/.*'),
        new RegExp('^jscrypto.*'),
        '@bitcoinerlab/secp256k1',
        '@mysten/bcs',
        'axios',
        'bech32',
        'bignumber.js',
        'bip32',
        'bip39',
        'keccak256',
        'ripemd160',
        'secp256k1',
        'semver',
        'ws',
      ],
    },
  },
})
