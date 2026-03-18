/**
 * HTTP client for the Initia Usernames API.
 * Uses native fetch API for browser compatibility.
 * No retry logic — matches project pattern (registry-provider, evm-rpc).
 */

import type { UsernameMetadata, UsernameRecord } from './types'
import { UsernameServiceError } from './types'
import { fetchWithTimeout } from '../../util/fetch'

const DEFAULT_TIMEOUT = 10_000

/**
 * Fetch and parse JSON response.
 *
 * - 200 OK + valid JSON: return data
 * - 200 OK + null/"not_found": return null
 * - 404: return null
 * - 4xx/5xx: throw UsernameServiceError
 * - timeout/network error: throw UsernameServiceError
 */
async function fetchJson<T>(url: string, timeout?: number): Promise<T | null> {
  let response: Response

  try {
    response = await fetchWithTimeout(url, { timeoutMs: timeout ?? DEFAULT_TIMEOUT })
  } catch (error) {
    throw new UsernameServiceError(
      error instanceof Error && error.name === 'AbortError' ? 'Request timeout' : 'Network error',
      error instanceof Error ? error : undefined
    )
  }

  if (response.status === 404) {
    return null
  }

  if (!response.ok) {
    throw new UsernameServiceError(`HTTP ${response.status}: ${response.statusText}`)
  }

  const text = await response.text()
  let data: unknown
  try {
    data = JSON.parse(text)
  } catch (error) {
    throw new UsernameServiceError(
      'Invalid JSON response',
      error instanceof Error ? error : undefined
    )
  }

  if (data === null || data === 'not_found') {
    return null
  }

  return data as T
}

/**
 * Fetch address by username.
 * GET /metadata/name_to_address/:name
 */
export async function fetchNameToAddress(
  baseUrl: string,
  name: string,
  timeout?: number
): Promise<string | null> {
  return fetchJson<string>(`${baseUrl}/metadata/name_to_address/${name}`, timeout)
}

/**
 * Fetch NFT metadata by username.
 * GET /metadata/:name
 */
export async function fetchMetadata(
  baseUrl: string,
  name: string,
  timeout?: number
): Promise<UsernameMetadata | null> {
  return fetchJson<UsernameMetadata>(`${baseUrl}/metadata/${name}`, timeout)
}

/**
 * Fetch primary username by address.
 * GET /metadata/address_to_name/:address
 */
export async function fetchAddressToName(
  baseUrl: string,
  address: string,
  timeout?: number
): Promise<string | null> {
  return fetchJson<string>(`${baseUrl}/metadata/address_to_name/${address}`, timeout)
}

/**
 * Extract expiration timestamp from metadata attributes.
 * API returns seconds — we convert to milliseconds.
 */
export function extractExpirationFromMetadata(metadata: UsernameMetadata): number {
  const attr = metadata.attributes.find(a => a.trait_type === 'Expiration Date')
  if (!attr || typeof attr.value !== 'number') {
    throw new UsernameServiceError('Expiration date not found in metadata')
  }
  return attr.value * 1000
}

/**
 * Fetch username record with metadata for caching.
 * Combines name_to_address and metadata API calls.
 *
 * Returns undefined if the username does not exist.
 */
export async function fetchUsernameRecord(
  baseUrl: string,
  name: string,
  timeout?: number
): Promise<{ record: UsernameRecord; metadata: UsernameMetadata } | undefined> {
  // 1. Check address first (fast fail if not found)
  const address = await fetchNameToAddress(baseUrl, name, timeout)
  if (address === null) return undefined

  // 2. Fetch metadata for expiration info
  const metadata = await fetchMetadata(baseUrl, name, timeout)
  if (metadata === null) return undefined

  const expiresAt = extractExpirationFromMetadata(metadata)

  return {
    record: { name, address, expiresAt },
    metadata,
  }
}
