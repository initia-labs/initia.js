import ky, { Options as KyOptions } from 'ky'
import { OrderBy as OrderBy_pb } from '@initia/initia.proto/cosmos/tx/v1beta1/service'

export type APIParams = Record<string, string | number | null | undefined>

export interface Pagination {
  next_key?: string
  total: number
}

export const OrderBy = OrderBy_pb
export type OrderBy = OrderBy_pb

export interface PaginationOptions {
  'pagination.limit': string
  'pagination.offset': string
  'pagination.key': string
  'pagination.count_total': 'true' | 'false'
  'pagination.reverse': 'true' | 'false'
  order_by: keyof typeof OrderBy
}

export class APIRequester {
  private kyInstance: typeof ky
  private readonly baseURL: string

  constructor(baseURL: string, config?: KyOptions) {
    this.baseURL = baseURL

    const defaultConfig: KyOptions = {
      headers: {
        Accept: 'application/json',
      },
      timeout: 30000,
    }

    this.kyInstance = ky.create({
      ...defaultConfig,
      ...config,
      headers: { ...defaultConfig.headers, ...config?.headers },
    })
  }

  private validateEndpoint(endpoint: string) {
    const traversalPatterns = ['../', '..\\', '%2E%2E%2F', '%2E%2E%5C']
    if (traversalPatterns.some((pattern) => endpoint.includes(pattern))) {
      throw new Error('Relative path not allowed')
    }

    if (endpoint.includes('?')) {
      throw new Error('Query param should be passed via the params argument')
    }
  }

  private computeEndpoint(endpoint: string) {
    const relativeEndpoint = endpoint.replace(/^\/+/, '')
    const baseURLObject = new URL(this.baseURL)

    if (!baseURLObject.pathname.endsWith('/')) {
      baseURLObject.pathname += '/'
    }
    baseURLObject.pathname += relativeEndpoint

    return baseURLObject.toString()
  }

  private toURLSearchParams(
    params: URLSearchParams | APIParams = {}
  ): URLSearchParams {
    if (params instanceof URLSearchParams) return params

    const usp = new URLSearchParams()
    for (const [key, value] of Object.entries(params)) {
      if (value !== undefined) {
        usp.set(key, String(value))
      }
    }

    return usp
  }

  public async getRaw<T>(
    endpoint: string,
    params: URLSearchParams | APIParams = {}
  ): Promise<T> {
    this.validateEndpoint(endpoint)
    const url = this.computeEndpoint(endpoint)
    const searchParams = this.toURLSearchParams(params)
    return this.kyInstance.get(url, { searchParams }).json<T>()
  }

  public async get<T>(
    endpoint: string,
    params: URLSearchParams | APIParams = {},
    headers: HeadersInit = {}
  ): Promise<T> {
    this.validateEndpoint(endpoint)
    const url = this.computeEndpoint(endpoint)
    const searchParams = this.toURLSearchParams(params)
    return this.kyInstance.get(url, { searchParams, headers }).json<T>()
  }

  public async post<T>(endpoint: string, data?: any): Promise<T> {
    this.validateEndpoint(endpoint)
    const url = this.computeEndpoint(endpoint)
    return this.kyInstance.post(url, { json: data }).json<T>()
  }
}
