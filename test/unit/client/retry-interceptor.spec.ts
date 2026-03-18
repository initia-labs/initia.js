/**
 * Unit tests for retry interceptor.
 */

import { describe, it, expect, vi } from 'vitest'
import { ConnectError, Code } from '@connectrpc/connect'
import { createRetryInterceptor } from '../../../src/client/transport-common'

// Mock request - uses 'any' type assertion for Connect RPC request interface
const createMockRequest = () => ({ header: new Map() }) as any

describe('createRetryInterceptor', () => {
  it('should pass through successful requests', async () => {
    const interceptor = createRetryInterceptor()
    const mockNext = vi.fn().mockResolvedValue({ data: 'success' })
    const mockReq = createMockRequest()

    const handler = interceptor(mockNext)
    const result = await handler(mockReq)

    expect(result).toEqual({ data: 'success' })
    expect(mockNext).toHaveBeenCalledTimes(1)
  })

  it('should retry on retryable errors', async () => {
    const interceptor = createRetryInterceptor({
      maxRetries: 2,
      initialDelayMs: 10, // Very short for testing
      jitter: false,
    })
    const mockNext = vi
      .fn()
      .mockRejectedValueOnce(new Error('network error'))
      .mockRejectedValueOnce(new Error('network error'))
      .mockResolvedValue({ data: 'success' })
    const mockReq = createMockRequest()

    const handler = interceptor(mockNext)
    const result = await handler(mockReq)

    expect(result).toEqual({ data: 'success' })
    expect(mockNext).toHaveBeenCalledTimes(3)
  }, 10000)

  it('should throw after max retries exceeded', async () => {
    const interceptor = createRetryInterceptor({
      maxRetries: 2,
      initialDelayMs: 10,
      jitter: false,
    })
    const mockNext = vi.fn().mockRejectedValue(new Error('network error'))
    const mockReq = createMockRequest()

    const handler = interceptor(mockNext)

    await expect(handler(mockReq)).rejects.toThrow('network error')
    expect(mockNext).toHaveBeenCalledTimes(3) // Initial + 2 retries
  }, 10000)

  it('should not retry non-retryable errors', async () => {
    const interceptor = createRetryInterceptor()
    const mockNext = vi.fn().mockRejectedValue(new Error('invalid argument'))
    const mockReq = createMockRequest()

    const handler = interceptor(mockNext)

    await expect(handler(mockReq)).rejects.toThrow('invalid argument')
    expect(mockNext).toHaveBeenCalledTimes(1)
  })

  it('should respect maxDelayMs cap', async () => {
    // Test that exponential backoff is capped
    const interceptor = createRetryInterceptor({
      maxRetries: 3,
      initialDelayMs: 10,
      maxDelayMs: 15, // Cap at 15ms (less than 10*2=20)
      jitter: false,
    })
    const mockNext = vi
      .fn()
      .mockRejectedValueOnce(new Error('network error'))
      .mockRejectedValueOnce(new Error('network error'))
      .mockResolvedValue({ data: 'success' })
    const mockReq = createMockRequest()

    const start = Date.now()
    const handler = interceptor(mockNext)
    await handler(mockReq)
    const elapsed = Date.now() - start

    // First delay: 10ms, Second delay: 15ms (capped from 20ms)
    // Total should be around 25ms, not 30ms
    expect(elapsed).toBeLessThan(100)
    expect(mockNext).toHaveBeenCalledTimes(3)
  }, 10000)

  it('should use custom shouldRetry function', async () => {
    const shouldRetry = vi.fn().mockReturnValue(false)
    const interceptor = createRetryInterceptor({ shouldRetry })
    const mockNext = vi.fn().mockRejectedValue(new Error('custom error'))
    const mockReq = createMockRequest()

    const handler = interceptor(mockNext)

    await expect(handler(mockReq)).rejects.toThrow('custom error')
    expect(shouldRetry).toHaveBeenCalledWith(expect.any(Error), 1)
    expect(mockNext).toHaveBeenCalledTimes(1)
  })

  it('should retry on gRPC unavailable status', async () => {
    const interceptor = createRetryInterceptor({
      maxRetries: 1,
      initialDelayMs: 10,
      jitter: false,
    })
    const mockNext = vi
      .fn()
      .mockRejectedValueOnce(new ConnectError('service unavailable', Code.Unavailable))
      .mockResolvedValue({ data: 'success' })
    const mockReq = createMockRequest()

    const handler = interceptor(mockNext)
    const result = await handler(mockReq)

    expect(result).toEqual({ data: 'success' })
    expect(mockNext).toHaveBeenCalledTimes(2)
  }, 10000)

  it('should retry on timeout errors', async () => {
    const interceptor = createRetryInterceptor({
      maxRetries: 1,
      initialDelayMs: 10,
      jitter: false,
    })
    const mockNext = vi
      .fn()
      .mockRejectedValueOnce(new Error('request timeout'))
      .mockResolvedValue({ data: 'success' })
    const mockReq = createMockRequest()

    const handler = interceptor(mockNext)
    const result = await handler(mockReq)

    expect(result).toEqual({ data: 'success' })
    expect(mockNext).toHaveBeenCalledTimes(2)
  }, 10000)

  it('should retry on resource exhausted errors', async () => {
    const interceptor = createRetryInterceptor({
      maxRetries: 1,
      initialDelayMs: 10,
      jitter: false,
    })
    const mockNext = vi
      .fn()
      .mockRejectedValueOnce(new ConnectError('rate limited', Code.ResourceExhausted))
      .mockResolvedValue({ data: 'success' })
    const mockReq = createMockRequest()

    const handler = interceptor(mockNext)
    const result = await handler(mockReq)

    expect(result).toEqual({ data: 'success' })
    expect(mockNext).toHaveBeenCalledTimes(2)
  }, 10000)

  it('should not retry on client errors like not_found', async () => {
    const interceptor = createRetryInterceptor()
    const mockNext = vi
      .fn()
      .mockRejectedValue(new ConnectError('resource not found', Code.NotFound))
    const mockReq = createMockRequest()

    const handler = interceptor(mockNext)

    await expect(handler(mockReq)).rejects.toThrow('resource not found')
    expect(mockNext).toHaveBeenCalledTimes(1)
  })

  it('should use exponential backoff', async () => {
    const delays: number[] = []
    const originalSetTimeout = globalThis.setTimeout
    vi.spyOn(globalThis, 'setTimeout').mockImplementation((fn, delay) => {
      delays.push(delay as number)
      return originalSetTimeout(fn, 1) // Execute immediately for test
    })

    const interceptor = createRetryInterceptor({
      maxRetries: 3,
      initialDelayMs: 100,
      maxDelayMs: 1000,
      jitter: false,
    })
    const mockNext = vi
      .fn()
      .mockRejectedValueOnce(new Error('network error'))
      .mockRejectedValueOnce(new Error('network error'))
      .mockRejectedValueOnce(new Error('network error'))
      .mockResolvedValue({ data: 'success' })
    const mockReq = createMockRequest()

    const handler = interceptor(mockNext)
    await handler(mockReq)

    // Exponential: 100, 200, 400
    expect(delays).toEqual([100, 200, 400])

    vi.restoreAllMocks()
  })
})
