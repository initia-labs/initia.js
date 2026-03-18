import { describe, it, expect } from 'vitest'
import { initiaContextConfig } from '../../../src/contexts/initia'
import { minievmContextConfig } from '../../../src/contexts/minievm'
import { minimoveContextConfig } from '../../../src/contexts/minimove'
import { miniwasmContextConfig } from '../../../src/contexts/miniwasm'
import { cosmosContextConfig } from '../../../src/contexts/cosmos'

describe('context configs', () => {
  const configs = [
    ['initia', initiaContextConfig],
    ['minievm', minievmContextConfig],
    ['minimove', minimoveContextConfig],
    ['miniwasm', miniwasmContextConfig],
    ['cosmos', cosmosContextConfig],
  ] as const

  for (const [name, config] of configs) {
    it(`${name} exports a [ChainConfigBuilder, TypedFactoryOptions] tuple`, () => {
      expect(config).toHaveLength(2)
      const [builder, options] = config
      expect(typeof builder.build).toBe('function')
      expect(typeof options).toBe('object')
    })

    it(`${name} builder produces valid config`, () => {
      const built = config[0].build()
      expect(built.services).toBeDefined()
      expect(built.msgs).toBeDefined()
      expect(built.registry).toBeDefined()
    })
  }

  it('initia has getDefaultChainId', () => {
    expect(initiaContextConfig[1].getDefaultChainId).toBeDefined()
    expect(initiaContextConfig[1].getDefaultChainId('mainnet')).toBe('interwoven-1')
  })

  it('initia has tokenResolver and enricherFactory', () => {
    expect(initiaContextConfig[1].tokenResolver).toBeDefined()
    expect(initiaContextConfig[1].enricherFactory).toBeDefined()
  })

  it('minievm has tokenResolver and enricherFactory', () => {
    expect(minievmContextConfig[1].tokenResolver).toBeDefined()
    expect(minievmContextConfig[1].enricherFactory).toBeDefined()
  })

  it('minimove has tokenResolver and enricherFactory', () => {
    expect(minimoveContextConfig[1].tokenResolver).toBeDefined()
    expect(minimoveContextConfig[1].enricherFactory).toBeDefined()
  })

  it('miniwasm has tokenResolver and enricherFactory', () => {
    expect(miniwasmContextConfig[1].tokenResolver).toBeDefined()
    expect(miniwasmContextConfig[1].enricherFactory).toBeDefined()
  })

  it('cosmos has no tokenResolver', () => {
    expect((cosmosContextConfig[1] as Record<string, unknown>).tokenResolver).toBeUndefined()
  })
})
