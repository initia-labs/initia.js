/**
 * Shared transport utilities.
 *
 * Common types, URL normalization, and interceptor helpers
 * used by both Node.js and browser transport implementations.
 */

import { ConnectError, Code, type Interceptor, type Transport } from '@connectrpc/connect'
import type { ChainInfo } from '../provider/types'

export type { Interceptor }

/**
 * Transport creation options.
 */
export interface TransportOptions {
  /**
   * Default timeout for RPC calls in milliseconds.
   * @default 10000 (10 seconds)
   */
  timeoutMs?: number

  /**
   * Interceptors to apply to all requests.
   *
   * Interceptors can observe and modify requests/responses,
   * add headers, implement retry logic, logging, etc.
   *
   * @example Add Authorization header
   * ```typescript
   * const authInterceptor: Interceptor = (next) => async (req) => {
   *   req.header.set('Authorization', 'Bearer token123')
   *   return await next(req)
   * }
   *
   * const client = createClient(chainInfo, {
   *   interceptors: [authInterceptor]
   * })
   * ```
   */
  interceptors?: Interceptor[]

  /**
   * Custom headers to add to all requests.
   *
   * Convenience option that creates an interceptor internally.
   * For dynamic headers (e.g., refreshing tokens), use `interceptors` instead.
   *
   * @example
   * ```typescript
   * const client = createClient(chainInfo, {
   *   headers: {
   *     'Authorization': 'Bearer token123',
   *     'X-Custom-Header': 'value'
   *   }
   * })
   * ```
   */
  headers?: Record<string, string>
}

/**
 * Factory function type for creating platform-specific transports.
 * Used for transport injection in bridge and provider code.
 */
export type TransportFactory = (chainInfo: ChainInfo, options?: TransportOptions) => Transport

/**
 * Create an interceptor that adds custom headers to all requests.
 *
 * @param headers - Headers to add
 * @returns Interceptor that adds the headers
 *
 * @example
 * ```typescript
 * const authInterceptor = createHeadersInterceptor({
 *   'Authorization': 'Bearer token123',
 *   'X-API-Key': 'my-api-key'
 * })
 *
 * const client = createClient(chainInfo, {
 *   interceptors: [authInterceptor]
 * })
 * ```
 */
export function createHeadersInterceptor(headers: Record<string, string>): Interceptor {
  return next => async req => {
    for (const [key, value] of Object.entries(headers)) {
      req.header.set(key, value)
    }
    return await next(req)
  }
}

/**
 * Options for retry interceptor.
 */
export interface RetryOptions {
  /**
   * Maximum number of retry attempts.
   * @default 3
   */
  maxRetries?: number

  /**
   * Initial delay in milliseconds before first retry.
   * Uses exponential backoff: delay * 2^attempt
   * @default 1000
   */
  initialDelayMs?: number

  /**
   * Maximum delay in milliseconds between retries.
   * @default 30000
   */
  maxDelayMs?: number

  /**
   * Whether to add jitter to prevent thundering herd.
   * Adds random 0-25% to each delay.
   * @default true
   */
  jitter?: boolean

  /**
   * Custom function to determine if an error should be retried.
   * By default, retries on network errors and transient gRPC codes (Unavailable, ResourceExhausted, Aborted, Internal).
   */
  shouldRetry?: (error: unknown, attempt: number) => boolean
}

const DEFAULT_RETRY_OPTIONS: Required<Omit<RetryOptions, 'shouldRetry'>> = {
  maxRetries: 3,
  initialDelayMs: 1000,
  maxDelayMs: 30000,
  jitter: true,
}

/**
 * Check if an error is retryable.
 *
 * - ConnectError: uses Code enum (auth errors excluded)
 * - Other errors: falls back to message string matching for network-level errors
 */
function isRetryableError(error: unknown): boolean {
  // ConnectError: use Code enum for precise matching
  if (error instanceof ConnectError) {
    switch (error.code) {
      case Code.Unavailable:
      case Code.ResourceExhausted:
      case Code.Aborted:
      case Code.Internal:
        return true
      default:
        return false
    }
  }

  // Non-ConnectError: network/transport-level errors (fetch failures, socket errors)
  if (error instanceof Error) {
    const message = error.message.toLowerCase()
    if (
      message.includes('network') ||
      message.includes('fetch') ||
      message.includes('econnrefused') ||
      message.includes('enotfound') ||
      message.includes('timeout') ||
      message.includes('socket')
    ) {
      return true
    }
  }

  return false
}

/**
 * Calculate delay with exponential backoff and optional jitter.
 */
function calculateDelay(
  attempt: number,
  initialDelayMs: number,
  maxDelayMs: number,
  jitter: boolean
): number {
  // Exponential backoff: initialDelay * 2^attempt
  const exponentialDelay = initialDelayMs * Math.pow(2, attempt)
  const cappedDelay = Math.min(exponentialDelay, maxDelayMs)

  if (jitter) {
    // Add 0-25% random jitter
    const jitterFactor = 1 + Math.random() * 0.25
    return Math.floor(cappedDelay * jitterFactor)
  }

  return cappedDelay
}

/**
 * Create an interceptor that retries failed requests with exponential backoff.
 *
 * Useful for handling transient network errors and server overload.
 * Retries transient failures by default (network errors, Unavailable, ResourceExhausted, Aborted, Internal). Use `shouldRetry` to customize.
 *
 * @param options - Retry configuration
 * @returns Interceptor that retries failed requests
 *
 * @example Basic usage
 * ```typescript
 * const client = createClient(chainInfo, {
 *   interceptors: [createRetryInterceptor()]
 * })
 * ```
 *
 * @example Custom configuration
 * ```typescript
 * const client = createClient(chainInfo, {
 *   interceptors: [
 *     createRetryInterceptor({
 *       maxRetries: 5,
 *       initialDelayMs: 500,
 *       maxDelayMs: 10000,
 *     })
 *   ]
 * })
 * ```
 *
 * @example With custom retry logic
 * ```typescript
 * const client = createClient(chainInfo, {
 *   interceptors: [
 *     createRetryInterceptor({
 *       shouldRetry: (error, attempt) => {
 *         // Only retry on specific errors
 *         return attempt < 3 && error.message.includes('timeout')
 *       }
 *     })
 *   ]
 * })
 * ```
 */
export function createRetryInterceptor(options?: RetryOptions): Interceptor {
  const config = { ...DEFAULT_RETRY_OPTIONS, ...options }
  const shouldRetry = options?.shouldRetry ?? isRetryableError

  return next => async req => {
    let lastError: unknown
    let attempt = 0

    while (attempt <= config.maxRetries) {
      try {
        return await next(req)
      } catch (error) {
        lastError = error
        attempt++

        // Check if we should retry
        if (attempt > config.maxRetries || !shouldRetry(error, attempt)) {
          throw error
        }

        // Calculate delay with exponential backoff
        const delay = calculateDelay(
          attempt - 1,
          config.initialDelayMs,
          config.maxDelayMs,
          config.jitter
        )

        // Wait before retrying
        await new Promise(resolve => setTimeout(resolve, delay))
      }
    }

    // Should not reach here, but TypeScript needs it
    throw lastError
  }
}

/**
 * Normalize a URL to ensure it has a scheme.
 *
 * Uses port-based heuristics for gRPC endpoints:
 * - Port 443: HTTPS (TLS)
 * - Other ports: HTTP (plain gRPC / h2c)
 *
 * This is because many Cosmos chains expose gRPC on non-standard ports
 * without TLS encryption (e.g., noble-grpc.polkachu.com:21590).
 */
export function normalizeUrl(url: string): string {
  if (url.startsWith('http://') || url.startsWith('https://')) {
    return url
  }

  // Extract port from URL (format: host:port or just host)
  const portMatch = url.match(/:(\d+)$/)
  const port = portMatch ? parseInt(portMatch[1], 10) : 443

  // Port 443 typically uses TLS, other ports often use plain gRPC
  const scheme = port === 443 ? 'https' : 'http'
  return `${scheme}://${url}`
}

/**
 * Get the best endpoint URL for native gRPC transport.
 *
 * Priority: grpc > grpcWeb
 */
export function getGrpcEndpoint(chainInfo: ChainInfo): string {
  if (chainInfo.grpc) {
    return normalizeUrl(chainInfo.grpc)
  }
  if (chainInfo.grpcWeb) {
    return normalizeUrl(chainInfo.grpcWeb)
  }
  throw new Error(
    `No gRPC endpoint available for chain ${chainInfo.chainId}. ` +
      `Native gRPC requires a grpc or grpcWeb endpoint.`
  )
}

/**
 * Get the best endpoint URL for gRPC-web transport.
 *
 * Priority: grpcWeb > grpc
 */
export function getGrpcWebEndpoint(chainInfo: ChainInfo): string {
  if (chainInfo.grpcWeb) {
    return normalizeUrl(chainInfo.grpcWeb)
  }
  if (chainInfo.grpc) {
    return normalizeUrl(chainInfo.grpc)
  }
  throw new Error(
    `No gRPC-web endpoint available for chain ${chainInfo.chainId}. ` +
      `gRPC-web requires a grpcWeb or grpc endpoint.`
  )
}

/**
 * Combine headers option with interceptors option.
 */
export function buildInterceptors(options?: TransportOptions): Interceptor[] | undefined {
  const interceptors: Interceptor[] = []

  // Add headers interceptor first if headers option is provided
  if (options?.headers && Object.keys(options.headers).length > 0) {
    interceptors.push(createHeadersInterceptor(options.headers))
  }

  // Add user-provided interceptors
  if (options?.interceptors) {
    interceptors.push(...options.interceptors)
  }

  return interceptors.length > 0 ? interceptors : undefined
}
