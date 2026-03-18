import { defineConfig } from 'tsdown'

export default defineConfig({
  sourcemap: true,
  // Inline BSR proto packages into dist — they become tree-shakeable chunks.
  // Runtime libraries stay external to avoid duplication.
  noExternal: [/@buf\//],
  outputOptions: {
    paths: id => {
      if (id.endsWith('.js')) return id

      // chain-registry: CJS with no exports map, directory/file imports need extensions
      if (id.startsWith('chain-registry/')) {
        const parts = id.split('/')
        return parts.length === 2 ? id + '/index.js' : id + '.js'
      }

      return id
    },
  },
})
