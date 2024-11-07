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
  /**
   * Query the module infos.
   * @param address the owner address of the modules to query
   */
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

  /**
   * Query the module info.
   * @param address the owner address of the module to query
   * @param module_name the module name to query
   */
  public async module(
    address: AccAddress,
    module_name: string,
    params: APIParams = {}
  ): Promise<Module> {
    return this.c
      .get<{
        module: Module.Data
      }>(`/initia/move/v1/accounts/${address}/modules/${module_name}`, params)
      .then((d) => Module.fromData(d.module))
  }

  /**
   * Query the resource infos.
   * @param address the owner address of the resources to query
   */
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

  /**
   * Query the resource info.
   * @param address the owner address of the resource to query
   * @param struct_tag the unique identifier of the resource to query
   */
  public async resource<T>(
    address: AccAddress,
    struct_tag: string,
    params: APIParams = {}
  ): Promise<{ type: string; data: T }> {
    return this.c
      .get<{
        resource: Resource
      }>(`/initia/move/v1/accounts/${address}/resources/by_struct_tag`, {
        ...params,
        struct_tag,
      })
      .then((d) => JSON.parse(d.resource.move_resource))
  }

  /**
   * Query the table info of the given address.
   * @param address the table handle
   */
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

  /**
   * Query the table entries of the given address.
   * @param address the table handle
   */
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

  /**
   * Query the table entry of the given key.
   * @param address the table handle
   * @param key_bytes the key of the table entry
   */
  public async tableEntry(
    address: AccAddress,
    key_bytes: string,
    params: APIParams = {}
  ): Promise<TableEntry> {
    return this.c
      .get<{
        table_entry: TableEntry
      }>(`/initia/move/v1/tables/${address}/entries/by_key_bytes`, {
        ...params,
        key_bytes,
      })
      .then((d) => d.table_entry)
  }

  /**
   * Execute view function and return the view result.
   * @param address the owner address of the module to query
   * @param module_name the module name of the entry function to query
   * @param function_name the name of a function to query
   * @param type_args the type arguments of a function to execute
   * @param args the arguments of a function to execute
   * @deprecated Use `viewJSON` instead
   */
  public async viewFunction<T>(
    address: AccAddress,
    module_name: string,
    function_name: string,
    type_args: string[] = [],
    args: string[] = []
  ): Promise<T> {
    return this.c
      .post<{ data: string }>(
        `/initia/move/v1/accounts/${address}/modules/${module_name}/view_functions/${function_name}`,
        {
          type_args,
          args,
        }
      )
      .then((res) => JSON.parse(res.data) as T)
  }

  /**
   * Execute view function and return the view result.
   * @param address the owner address of the module to query
   * @param module_name the module name of the entry function to query
   * @param function_name the name of a function to query
   * @param type_args the type arguments of a function to execute
   * @param args the arguments of a function to execute
   * @deprecated Use `viewJSON` instead
   */
  public async view(
    address: AccAddress,
    module_name: string,
    function_name: string,
    type_args: string[] = [],
    args: string[] = []
  ): Promise<ViewResponse> {
    return this.c.post<ViewResponse>(`/initia/move/v1/view`, {
      address,
      module_name,
      function_name,
      type_args,
      args,
    })
  }

  /**
   * Execute multiple view functions and return the view results.
   * @param requests list of requests to execute view functions
   * @deprecated Use `viewBatchJSON` instead
   */
  public async viewBatch(requests: ViewRequest[]): Promise<ViewResponse[]> {
    return this.c
      .post<{ responses: ViewResponse[] }>(`/initia/move/v1/view/batch`, {
        requests,
      })
      .then((d) => d.responses)
  }

  /**
   * Execute view function with json arguments and return the view result.
   * @param address the owner address of the module to query
   * @param module_name the module name of the entry function to query
   * @param function_name the name of a function to query
   * @param type_args the type arguments of a function to execute
   * @param args the arguments of a function to execute
   */
  public async viewJSON(
    address: AccAddress,
    module_name: string,
    function_name: string,
    type_args: string[] = [],
    args: string[] = []
  ): Promise<ViewResponse> {
    return this.c.post<ViewResponse>(`/initia/move/v1/view/json`, {
      address,
      module_name,
      function_name,
      type_args,
      args,
    })
  }

  /**
   * Execute multiple view functions with json arguments and return the view results
   * @param requests list of requests to execute view functions
   */
  public async viewBatchJSON(requests: ViewRequest[]): Promise<ViewResponse[]> {
    return this.c
      .post<{ responses: ViewResponse[] }>(`/initia/move/v1/view/json/batch`, {
        requests,
      })
      .then((d) => d.responses)
  }

  /**
   * Decode script bytes into ABI.
   * @param code_bytes the script code for query operation
   */
  public async scriptABI(code_bytes: string): Promise<ABI> {
    return this.c.post<ABI>(`/initia/move/v1/script/abi`, {
      code_bytes,
    })
  }

  /**
   * Query denom which is converted from the given metadata.
   * @param metadata metadata to convert
   */
  public async denom(metadata: string, params: APIParams = {}): Promise<Denom> {
    return this.c
      .get<{ denom: Denom }>(`/initia/move/v1/denom`, { ...params, metadata })
      .then((d) => d.denom)
  }

  /**
   * Query metadata which is converted from the given denom.
   * @param denom denom to convert
   */
  public async metadata(denom: Denom, params: APIParams = {}): Promise<string> {
    return this.c
      .get<{ metadata: string }>(`/initia/move/v1/metadata`, {
        ...params,
        denom,
      })
      .then((d) => d.metadata)
  }

  /**
   * Query the parameters of the move module.
   */
  public async parameters(params: APIParams = {}): Promise<MoveParams> {
    return this.c
      .get<{ params: MoveParams.Data }>(`/initia/move/v1/params`, params)
      .then((d) => MoveParams.fromData(d.params))
  }
}
