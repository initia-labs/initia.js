/**
 * Unit tests for username network helpers.
 */

import { describe, it, expect } from 'vitest'
import {
  getUsernamesApiUrl,
  isUsernameServiceSupported,
} from '../../../src/client/usernames/service'

describe('getUsernamesApiUrl', () => {
  it('should return mainnet URL', () => {
    expect(getUsernamesApiUrl('mainnet')).toBe('https://usernames-api.initia.xyz')
  })

  it('should return testnet URL', () => {
    expect(getUsernamesApiUrl('testnet')).toBe('https://usernames-api.testnet.initia.xyz')
  })

  it('should return undefined for unsupported network', () => {
    expect(getUsernamesApiUrl('devnet')).toBeUndefined()
    expect(getUsernamesApiUrl('')).toBeUndefined()
  })
})

describe('isUsernameServiceSupported', () => {
  it('should return true for mainnet', () => {
    expect(isUsernameServiceSupported('mainnet')).toBe(true)
  })

  it('should return true for testnet', () => {
    expect(isUsernameServiceSupported('testnet')).toBe(true)
  })

  it('should return false for other networks', () => {
    expect(isUsernameServiceSupported('devnet')).toBe(false)
    expect(isUsernameServiceSupported('localnet')).toBe(false)
    expect(isUsernameServiceSupported('')).toBe(false)
  })
})
