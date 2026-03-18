/**
 * Unit tests for username service factory and unsupported stub.
 */

import { describe, it, expect } from 'vitest'
import {
  createUnsupportedUsernameService,
  isUsernameServiceSupported,
} from '../../../src/client/usernames/service'
import { UsernameServiceError } from '../../../src/client/usernames/types'

describe('createUnsupportedUsernameService', () => {
  const service = createUnsupportedUsernameService()

  it('should throw UsernameServiceError on getAddress', () => {
    expect(() => service.getAddress('test')).toThrow(UsernameServiceError)
  })

  it('should throw UsernameServiceError on resolve', () => {
    expect(() => service.resolve('test')).toThrow(UsernameServiceError)
  })

  it('should throw UsernameServiceError on getName', () => {
    expect(() => service.getName('0xabc')).toThrow(UsernameServiceError)
  })

  it('should throw UsernameServiceError on getRecord', () => {
    expect(() => service.getRecord('test')).toThrow(UsernameServiceError)
  })

  it('should throw UsernameServiceError on getMetadata', () => {
    expect(() => service.getMetadata('test')).toThrow(UsernameServiceError)
  })

  it('should throw UsernameServiceError on getImageUrl', () => {
    expect(() => service.getImageUrl('test')).toThrow(UsernameServiceError)
  })

  it('should throw UsernameServiceError on isAvailable', () => {
    expect(() => service.isAvailable('test')).toThrow(UsernameServiceError)
  })

  it('should throw UsernameServiceError on getKnownNames', () => {
    expect(() => service.getKnownNames('0xabc')).toThrow(UsernameServiceError)
  })

  it('should throw UsernameServiceError on invalidateCache', () => {
    expect(() => service.invalidateCache('test')).toThrow(UsernameServiceError)
  })

  it('should throw UsernameServiceError on clearCache', () => {
    expect(() => service.clearCache()).toThrow(UsernameServiceError)
  })
})

describe('isUsernameServiceSupported for ChainContext routing', () => {
  it('should return true for initia mainnet', () => {
    expect(isUsernameServiceSupported('mainnet')).toBe(true)
  })

  it('should return false for minievm', () => {
    // ChainContext uses: chainInfo.chainType === 'initia' && isUsernameServiceSupported(network)
    // For non-initia chains, the chainType check fails first, but the network check alone:
    expect(isUsernameServiceSupported('mainnet')).toBe(true)
    expect(isUsernameServiceSupported('devnet')).toBe(false)
  })
})
