import { BaseAPI } from './BaseAPI';
import { AccAddress, Denom } from '../../../core';
import { APIParams, Pagination, PaginationOptions } from '../APIRequester';
import { argsEncodeWithABI } from '../../../util';
import { ModuleABI } from '../../../core/move/types';
import { UpgradePolicy } from '@initia/initia.proto/initia/move/v1/types';

export interface MoveParams {
  base_denom: string;
  max_module_size: number;
}

export namespace MoveParams {
  export interface Data {
    base_denom: string;
    max_module_size: string;
  }
}

export interface Module {
  address: AccAddress;
  module_name: string;
  abi: string;
  raw_bytes: string;
  upgrade_policy: UpgradePolicy;
}

export interface Resource {
  address: AccAddress;
  struct_tag: string;
  move_resource: string;
  raw_bytes: string;
}

export interface ABI {
  abi: string;
}

export interface TableEntry {
  address: AccAddress;
  key: string;
  value: string;
}

export class MoveAPI extends BaseAPI {
  public async modules(
    address: AccAddress,
    params: Partial<PaginationOptions & APIParams> = {}
  ): Promise<[Module[], Pagination]> {
    return this.c
      .get<{
        modules: Module[];
        pagination: Pagination;
      }>(`/initia/move/v1/accounts/${address}/modules`, params)
      .then(d => [
        d.modules.map(mod => ({
          address: mod.address,
          module_name: mod.module_name,
          abi: mod.abi,
          raw_bytes: mod.raw_bytes,
          upgrade_policy: mod.upgrade_policy,
        })),
        d.pagination,
      ]);
  }

  public async module(
    address: AccAddress,
    moduleName: string,
    params: APIParams = {}
  ): Promise<Module> {
    return this.c
      .get<{ module: Module }>(
        `/initia/move/v1/accounts/${address}/modules/${moduleName}`,
        params
      )
      .then(({ module: d }) => ({
        address: d.address,
        module_name: d.module_name,
        abi: d.abi,
        raw_bytes: d.raw_bytes,
        upgrade_policy: d.upgrade_policy,
      }));
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
      .then(res => JSON.parse(res.data) as T);
  }

  /**
   * Query view function with not encoded arguments and abi.
   * Arguments will be bcs encoded with type informations from abi.
   *
   * @param address
   * @param moduleName
   * @param functionName
   * @param typeArgs
   * @param args // not encoded arguments
   * @param abi // base64 encoded module abi
   * @returns
   */
  public async viewFunctionWithABI<T>(
    abi: string,
    address: AccAddress,
    moduleName: string,
    functionName: string,
    typeArgs: string[] = [],
    args: any[] = []
  ): Promise<T> {
    const module: ModuleABI = JSON.parse(Buffer.from(abi, 'base64').toString());

    const functionAbi = module.exposed_functions.find(
      exposedFunction => exposedFunction.name === functionName
    );

    if (!functionAbi) {
      throw Error('function not found');
    }

    return this.viewFunction<T>(
      address,
      moduleName,
      functionName,
      typeArgs,
      argsEncodeWithABI(args, functionAbi)
    );
  }

  public async resources(
    address: AccAddress,
    params: Partial<PaginationOptions & APIParams> = {}
  ): Promise<[{ type: string; data: any }[], Pagination]> {
    return this.c
      .get<{
        resources: Resource[];
        pagination: Pagination;
      }>(`/initia/move/v1/accounts/${address}/resources`, params)
      .then(d => [
        d.resources.map(res => JSON.parse(res.move_resource)),
        d.pagination,
      ]);
  }

  public async resource<T>(
    address: AccAddress,
    structTag: string,
    params: APIParams = {}
  ): Promise<{ type: string; data: T }> {
    return this.c
      .get<{ resource: Resource }>(
        `/initia/move/v1/accounts/${address}/resources/by_struct_tag`,
        { ...params, struct_tag: structTag }
      )
      .then(({ resource: d }) => JSON.parse(d.move_resource));
  }

  public async denom(
    structTag: string,
    params: APIParams = {}
  ): Promise<Denom> {
    return this.c
      .get<{ denom: Denom }>(`/initia/move/v1/denoms/by_struct_tag`, {
        ...params,
        struct_tag: structTag,
      })
      .then(d => d.denom);
  }

  public async parameters(params: APIParams = {}): Promise<MoveParams> {
    return this.c
      .get<{ params: MoveParams.Data }>(`/initia/move/v1/params`, params)
      .then(({ params: d }) => ({
        base_denom: d.base_denom,
        max_module_size: Number.parseInt(d.max_module_size),
      }));
  }

  public async scriptABI(codeBytes: string): Promise<ABI> {
    return this.c.post<ABI>(`/initia/move/v1/script/abi`, {
      code_bytes: codeBytes,
    });
  }

  public async structTag(
    denom: Denom,
    params: APIParams = {}
  ): Promise<string> {
    return this.c
      .get<{ struct_tag: string }>(`/initia/move/v1/struct_tags/by_denom`, {
        ...params,
        denom,
      })
      .then(d => d.struct_tag);
  }

  public async tableEntries(
    address: AccAddress,
    params: Partial<PaginationOptions & APIParams> = {}
  ): Promise<[TableEntry[], Pagination]> {
    return this.c
      .get<{ table_entries: TableEntry[]; pagination: Pagination }>(
        `/initia/move/v1/tables/${address}/entries`,
        params
      )
      .then(d => [d.table_entries, d.pagination]);
  }

  public async tableEntry(
    address: AccAddress,
    keyBytes: string,
    params: APIParams = {}
  ): Promise<TableEntry> {
    return this.c
      .get<{ table_entry: TableEntry }>(
        `/initia/move/v1/tables/${address}/entries/${keyBytes}`,
        params
      )
      .then(d => d.table_entry);
  }
}
