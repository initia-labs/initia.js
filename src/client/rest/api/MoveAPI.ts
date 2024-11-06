import { BaseAPI } from './BaseAPI'
import { AccAddress, Denom, Module, MoveParams } from '../../../core'
import { APIParams, Pagination, PaginationOptions } from '../APIRequester'

export interface Resource {
  address: AccAddress
  struct_tag: string
  move_resource: string
  raw_bytes: string
}

export interface ABI {
  abi: string
}

export interface TableEntry {
  address: AccAddress
  key: string
  value: string
}

export interface TableInfo {
  address: AccAddress
  key_type: string
  value_type: string
}

export interface ViewRequest {
  address: AccAddress
  module_name: string
  function_name: string
  type_args: string[]
  args: string[]
}

export interface ViewResponse {
  data: string
  events: VMEvent[]
  gas_used: string
}

export interface VMEvent {
  type_tag: string
  data: string
}

export class MoveAPI extends BaseAPI {
  public async modules(
    address: AccAddress,
    params: Partial<PaginationOptions & APIParams> = {}
  ): Promise<[Module[], Pagination]> {
    return this.c
      .get<{
        modules: Module.Data[]
        pagination: Pagination
      }>(`/initia/move/v1/accounts/${address}/modules`, params)
      .then((d) => [d.modules.map(Module.fromData), d.pagination])
  }

  public async module(
    address: AccAddress,
    moduleName: string,
    params: APIParams = {}
  ): Promise<Module> {
    return this.c
      .get<{
        module: Module.Data
      }>(`/initia/move/v1/accounts/${address}/modules/${moduleName}`, params)
      .then((d) => Module.fromData(d.module))
  }

  public async viewFunction<T>(
    address: AccAddress,
    moduleName: string,
    functionName: string,
    typeArgs: string[] = [],
    args: string[] = []
  ): Promise<T> {
    return this.c
      .post<{ data: string }>(
        `/initia/move/v1/accounts/${address}/modules/${moduleName}/view_functions/${functionName}`,
        {
          type_args: typeArgs,
          args,
        }
      )
      .then((res) => JSON.parse(res.data) as T)
  }

  public async view(
    address: AccAddress,
    moduleName: string,
    functionName: string,
    typeArgs: string[] = [],
    args: string[] = []
  ): Promise<ViewResponse> {
    return this.c.post<ViewResponse>(`/initia/move/v1/view`, {
      address,
      module_name: moduleName,
      function_name: functionName,
      type_args: typeArgs,
      args,
    })
  }

  public async viewBatch(requests: ViewRequest[]): Promise<ViewResponse[]> {
    return this.c
      .post<{ responses: ViewResponse[] }>(`/initia/move/v1/view/batch`, {
        requests,
      })
      .then((d) => d.responses)
  }

  public async viewJSON(
    address: AccAddress,
    moduleName: string,
    functionName: string,
    typeArgs: string[] = [],
    args: string[] = []
  ): Promise<ViewResponse> {
    return this.c.post<ViewResponse>(`/initia/move/v1/view/json`, {
      address,
      module_name: moduleName,
      function_name: functionName,
      type_args: typeArgs,
      args,
    })
  }

  public async viewBatchJSON(requests: ViewRequest[]): Promise<ViewResponse[]> {
    return this.c
      .post<{ responses: ViewResponse[] }>(`/initia/move/v1/view/json/batch`, {
        requests,
      })
      .then((d) => d.responses)
  }

  public async resources(
    address: AccAddress,
    params: Partial<PaginationOptions & APIParams> = {}
  ): Promise<[{ type: string; data: any }[], Pagination]> {
    return this.c
      .get<{
        resources: Resource[]
        pagination: Pagination
      }>(`/initia/move/v1/accounts/${address}/resources`, params)
      .then((d) => [
        d.resources.map((res) => JSON.parse(res.move_resource)),
        d.pagination,
      ])
  }

  public async resource<T>(
    address: AccAddress,
    structTag: string,
    params: APIParams = {}
  ): Promise<{ type: string; data: T }> {
    return this.c
      .get<{
        resource: Resource
      }>(`/initia/move/v1/accounts/${address}/resources/by_struct_tag`, {
        ...params,
        struct_tag: structTag,
      })
      .then((d) => JSON.parse(d.resource.move_resource))
  }

  public async denom(metadata: string, params: APIParams = {}): Promise<Denom> {
    return this.c
      .get<{ denom: Denom }>(`/initia/move/v1/denom`, { ...params, metadata })
      .then((d) => d.denom)
  }

  public async metadata(denom: Denom, params: APIParams = {}): Promise<string> {
    return this.c
      .get<{ metadata: string }>(`/initia/move/v1/metadata`, {
        ...params,
        denom,
      })
      .then((d) => d.metadata)
  }

  public async parameters(params: APIParams = {}): Promise<MoveParams> {
    return this.c
      .get<{ params: MoveParams.Data }>(`/initia/move/v1/params`, params)
      .then((d) => MoveParams.fromData(d.params))
  }

  public async scriptABI(codeBytes: string): Promise<ABI> {
    return this.c.post<ABI>(`/initia/move/v1/script/abi`, {
      code_bytes: codeBytes,
    })
  }

  public async tableInfo(
    address: AccAddress,
    params: APIParams = {}
  ): Promise<TableInfo> {
    return this.c
      .get<{
        table_info: TableInfo
      }>(`/initia/move/v1/tables/${address}`, params)
      .then((d) => d.table_info)
  }

  public async tableEntries(
    address: AccAddress,
    params: Partial<PaginationOptions & APIParams> = {}
  ): Promise<[TableEntry[], Pagination]> {
    return this.c
      .get<{
        table_entries: TableEntry[]
        pagination: Pagination
      }>(`/initia/move/v1/tables/${address}/entries`, params)
      .then((d) => [d.table_entries, d.pagination])
  }

  public async tableEntry(
    address: AccAddress,
    keyBytes: string,
    params: APIParams = {}
  ): Promise<TableEntry> {
    return this.c
      .get<{
        table_entry: TableEntry
      }>(`/initia/move/v1/tables/${address}/entries/by_key_bytes`, {
        ...params,
        key_bytes: keyBytes,
      })
      .then((d) => d.table_entry)
  }
}
