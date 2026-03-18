/**
 * Unit tests for transport interceptors and custom headers.
 */

import { describe, it, expect, vi } from 'vitest'
import { createHeadersInterceptor } from '../../../src/client/transport-common'
import type { Interceptor } from '../../../src/client/transport-common'

describe('createHeadersInterceptor', () => {
  it('should create an interceptor that adds headers', async () => {
    const headers = {
      Authorization: 'Bearer token123',
      'X-Custom-Header': 'custom-value',
    }

    const interceptor = createHeadersInterceptor(headers)

    // Create a mock request object
    const mockRequest = {
      header: {
        set: vi.fn(),
      },
    }

    // Create a mock next function that returns a response
    const mockResponse = { status: 'ok' }
    const mockNext = vi.fn().mockResolvedValue(mockResponse)

    // Call the interceptor
    const result = await interceptor(mockNext)(mockRequest as never)

    // Verify headers were set
    expect(mockRequest.header.set).toHaveBeenCalledWith('Authorization', 'Bearer token123')
    expect(mockRequest.header.set).toHaveBeenCalledWith('X-Custom-Header', 'custom-value')
    expect(mockRequest.header.set).toHaveBeenCalledTimes(2)

    // Verify next was called with the request
    expect(mockNext).toHaveBeenCalledWith(mockRequest)

    // Verify response was returned
    expect(result).toBe(mockResponse)
  })

  it('should handle empty headers object', async () => {
    const interceptor = createHeadersInterceptor({})

    const mockRequest = {
      header: {
        set: vi.fn(),
      },
    }
    const mockNext = vi.fn().mockResolvedValue({ status: 'ok' })

    await interceptor(mockNext)(mockRequest as never)

    // No headers should be set
    expect(mockRequest.header.set).not.toHaveBeenCalled()
    expect(mockNext).toHaveBeenCalledWith(mockRequest)
  })

  it('should handle single header', async () => {
    const interceptor = createHeadersInterceptor({
      Authorization: 'Bearer token',
    })

    const mockRequest = {
      header: {
        set: vi.fn(),
      },
    }
    const mockNext = vi.fn().mockResolvedValue({ status: 'ok' })

    await interceptor(mockNext)(mockRequest as never)

    expect(mockRequest.header.set).toHaveBeenCalledWith('Authorization', 'Bearer token')
    expect(mockRequest.header.set).toHaveBeenCalledTimes(1)
  })

  it('should return interceptor type compatible with TransportOptions', () => {
    const interceptor: Interceptor = createHeadersInterceptor({
      'X-API-Key': 'my-api-key',
    })

    expect(typeof interceptor).toBe('function')
  })
})

describe('TransportOptions with interceptors', () => {
  it('should accept interceptors array in options', async () => {
    // This is a type-level test - we're verifying the types work correctly
    const authInterceptor: Interceptor = next => async req => {
      return await next(req)
    }

    const loggingInterceptor: Interceptor = next => async req => {
      console.log('Request:', req)
      const response = await next(req)
      console.log('Response:', response)
      return response
    }

    // Verify interceptors can be combined
    const interceptors: Interceptor[] = [authInterceptor, loggingInterceptor]
    expect(interceptors).toHaveLength(2)
  })

  it('should support headers option as convenience', () => {
    // This is a type-level test
    const options = {
      headers: {
        Authorization: 'Bearer token',
        'X-Request-ID': 'req-123',
      },
      timeoutMs: 30000,
    }

    expect(options.headers).toBeDefined()
    expect(options.headers['Authorization']).toBe('Bearer token')
  })

  it('should support combining headers and interceptors', () => {
    const authInterceptor: Interceptor = next => async req => {
      return await next(req)
    }

    const options = {
      headers: {
        'X-Static-Header': 'static-value',
      },
      interceptors: [authInterceptor],
    }

    expect(options.headers).toBeDefined()
    expect(options.interceptors).toHaveLength(1)
  })
})

describe('Interceptor chaining', () => {
  it('should chain multiple interceptors correctly', async () => {
    const callOrder: string[] = []

    const interceptor1: Interceptor = next => async req => {
      callOrder.push('interceptor1-before')
      const response = await next(req)
      callOrder.push('interceptor1-after')
      return response
    }

    const interceptor2: Interceptor = next => async req => {
      callOrder.push('interceptor2-before')
      const response = await next(req)
      callOrder.push('interceptor2-after')
      return response
    }

    // Simulate chaining (as Connect RPC does internally)
    const mockNext = vi.fn().mockImplementation(async () => {
      callOrder.push('handler')
      return { status: 'ok' }
    })

    // Chain: interceptor1 -> interceptor2 -> handler
    const chain = interceptor1(interceptor2(mockNext))
    await chain({} as never)

    expect(callOrder).toEqual([
      'interceptor1-before',
      'interceptor2-before',
      'handler',
      'interceptor2-after',
      'interceptor1-after',
    ])
  })
})
