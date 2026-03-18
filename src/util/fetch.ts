/**
 * Lightweight fetch utilities with timeout support.
 *
 * For use by REST API clients, registry providers, and other HTTP callers.
 * For full-featured HTTP with auth/headers/signal merging, use client/http-client.ts.
 */

import { DEFAULT_REQUEST_TIMEOUT_MS } from '../constants'

/**
 * Merge a caller-provided AbortSignal with a controller's signal.
 * Uses AbortSignal.any when available, falls back to manual event forwarding.
 * The fallback cleans up listeners when the controller aborts first (e.g., timeout).
 */
export function mergeAbortSignals(
  callerSignal: AbortSignal,
  controller: AbortController
): AbortSignal {
  if (typeof AbortSignal.any === 'function') {
    return AbortSignal.any([callerSignal, controller.signal])
  }
  // Handle already-aborted signal (the event already fired, addEventListener won't trigger)
  if (callerSignal.aborted) {
    controller.abort(callerSignal.reason)
    return controller.signal
  }
  const forwardAbort = () => controller.abort(callerSignal.reason)
  callerSignal.addEventListener('abort', forwardAbort, { once: true })
  // Clean up the forwarding listener when controller aborts first (e.g., timeout)
  controller.signal.addEventListener(
    'abort',
    () => {
      callerSignal.removeEventListener('abort', forwardAbort)
    },
    { once: true }
  )
  return controller.signal
}

export interface FetchOptions extends RequestInit {
  /** Timeout in milliseconds (default: DEFAULT_REQUEST_TIMEOUT_MS) */
  timeoutMs?: number
}

/**
 * Fetch with AbortController-based timeout.
 */
export async function fetchWithTimeout(url: string, init?: FetchOptions): Promise<Response> {
  const { timeoutMs = DEFAULT_REQUEST_TIMEOUT_MS, ...fetchInit } = init ?? {}
  const controller = new AbortController()
  const timeoutId = setTimeout(() => controller.abort(), timeoutMs)

  // Merge caller's signal with timeout signal to respect both
  const signal = fetchInit.signal
    ? mergeAbortSignals(fetchInit.signal, controller)
    : controller.signal

  try {
    return await fetch(url, { ...fetchInit, signal })
  } finally {
    clearTimeout(timeoutId)
  }
}

/**
 * Fetch and parse JSON response. Throws on non-ok status.
 */
export async function fetchJson<T>(url: string, init?: FetchOptions): Promise<T> {
  const res = await fetchWithTimeout(url, init)
  if (!res.ok) {
    throw new Error(`HTTP ${res.status}: ${res.statusText}`)
  }
  return (await res.json()) as T
}
