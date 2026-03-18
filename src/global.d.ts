/**
 * Web API type declarations for isomorphic (Node.js + Browser) usage.
 *
 * These APIs are available in all modern browsers and Node.js 18+.
 * Declared here instead of using lib "DOM" to prevent accidental use
 * of browser-only APIs (e.g., document, window) in library code.
 */

// --- Encoding ---

declare class TextEncoder {
  encode(input?: string): Uint8Array
}

declare class TextDecoder {
  constructor(label?: string, options?: { fatal?: boolean; ignoreBOM?: boolean })
  decode(input?: ArrayBufferView | ArrayBuffer, options?: { stream?: boolean }): string
}

// --- Fetch ---

declare function fetch(input: string | URL, init?: RequestInit): Promise<Response>

declare interface RequestInit {
  method?: string
  headers?: HeadersInit
  body?: string | ArrayBuffer | Uint8Array | URLSearchParams | ReadableStream | null
  signal?: AbortSignal | null
  redirect?: 'follow' | 'error' | 'manual'
}

declare interface Response {
  readonly ok: boolean
  readonly status: number
  readonly statusText: string
  readonly headers: Headers
  json(): Promise<unknown>
  text(): Promise<string>
  arrayBuffer(): Promise<ArrayBuffer>
}

declare type HeadersInit = Headers | Record<string, string> | [string, string][]

declare class Headers {
  constructor(init?: HeadersInit)
  append(name: string, value: string): void
  delete(name: string): void
  get(name: string): string | null
  has(name: string): boolean
  set(name: string, value: string): void
  forEach(callback: (value: string, name: string, parent: Headers) => void): void
}

// --- URL ---

declare class URL {
  constructor(url: string, base?: string | URL)
  readonly hostname: string
  readonly port: string
  protocol: string
  pathname: string
  readonly search: string
  readonly origin: string
  href: string
  toString(): string
}

declare class URLSearchParams {
  constructor(init?: string | Record<string, string> | [string, string][])
  append(name: string, value: string): void
  delete(name: string): void
  get(name: string): string | null
  has(name: string): boolean
  set(name: string, value: string): void
  toString(): string
  forEach(callback: (value: string, name: string, parent: URLSearchParams) => void): void
}

// --- Abort ---

declare class AbortController {
  readonly signal: AbortSignal
  abort(reason?: unknown): void
}

declare interface AbortSignal {
  readonly aborted: boolean
  readonly reason: unknown
  addEventListener(type: 'abort', listener: () => void, options?: { once?: boolean }): void
  removeEventListener(type: 'abort', listener: () => void): void
}

declare const AbortSignal: {
  any(signals: AbortSignal[]): AbortSignal
  timeout(ms: number): AbortSignal
}

// --- Timers (isomorphic: Node.js returns Timeout, browsers return number) ---

declare function setTimeout(handler: (...args: unknown[]) => void, ms?: number): unknown
declare function clearTimeout(id: unknown): void

// --- Streams (minimal, for RequestInit body type) ---

declare interface ReadableStream<R = Uint8Array> {
  readonly locked: boolean
  getReader(): ReadableStreamDefaultReader<R>
}

declare interface ReadableStreamDefaultReader<R = Uint8Array> {
  read(): Promise<{ done: boolean; value?: R }>
  releaseLock(): void
}
