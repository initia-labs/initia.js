import Axios, { AxiosInstance, CreateAxiosDefaults } from 'axios'
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
  private axios: AxiosInstance
  private readonly baseURL: string

  constructor(baseURL: string, config?: CreateAxiosDefaults<any>) {
    this.baseURL = baseURL
    const defaultConfig: CreateAxiosDefaults<any> = {
      headers: {
        Accept: 'application/json',
      },
      timeout: 30000,
    }

    this.axios = Axios.create({
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

  public async getRaw<T>(
    endpoint: string,
    params: URLSearchParams | APIParams = {},
    headers: Record<string, string> = {}
  ): Promise<T> {
    this.validateEndpoint(endpoint)
    const url = this.computeEndpoint(endpoint)
    return this.axios.get(url, { params, headers }).then((d) => d.data)
  }

  public async get<T>(
    endpoint: string,
    params: URLSearchParams | APIParams = {},
    headers: Record<string, string> = {}
  ): Promise<T> {
    this.validateEndpoint(endpoint)
    const url = this.computeEndpoint(endpoint)
    return this.axios.get(url, { params, headers }).then((d) => d.data)
  }

  public async post<T>(
    endpoint: string,
    data?: any,
    headers: Record<string, string> = {}
  ): Promise<T> {
    this.validateEndpoint(endpoint)
    const url = this.computeEndpoint(endpoint)
    return this.axios.post(url, data, { headers }).then((d) => d.data)
  }
}
