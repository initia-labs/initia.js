import { describe, it, expect } from 'vitest'
import { CosmosApp, LedgerError } from '../../src'

// Minimal mock transport
const mockTransport = {
  decorateAppAPIMethods: () => {},
} as any

describe('CosmosApp', () => {
  it('should throw error on signWithKeccak256', async () => {
    const app = new CosmosApp(mockTransport)
    await expect(app.signWithKeccak256('path', Buffer.from('test'))).rejects.toThrow(LedgerError)
  })

  it('should throw error on signText', async () => {
    const app = new CosmosApp(mockTransport)
    await expect(app.signText('path', 'test')).rejects.toThrow(LedgerError)
  })

  it('should throw error on setLoadConfig', () => {
    const app = new CosmosApp(mockTransport)
    expect(() => app.setLoadConfig({})).toThrow(LedgerError)
  })
})
