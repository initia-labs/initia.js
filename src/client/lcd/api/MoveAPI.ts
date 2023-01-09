import { BaseAPI } from './BaseAPI';
import { AccAddress, Coins, StorageFee } from '../../../core';
import { APIParams, Pagination, PaginationOptions } from '../APIRequester';
import { argsEncodeWithABI } from '../../../util';
import { ModuleABI } from 'core/move/types';

const convertIf = (address: string) => {
  return address.startsWith('0x') ? AccAddress.fromHex(address) : address;
}

export interface MoveParams {
  max_module_size: number;
  free_storage_bytes: number;
  storage_fee_per_byte: Coins;
}

export namespace MoveParams {
  export interface Data {
    max_module_size: string;
    free_storage_bytes: string;
    storage_fee_per_byte: Coins.Data;
  }
}

export interface Module {
  address: AccAddress;
  module_name: string;
  code_bytes: string;
  abi: string;
}

export interface ExecuteResult {
  data: string;
}

export interface Resource {
  address: AccAddress;
  struct_tag: string;
  resource_bytes: string;
  move_resource: string;
}

export interface ABI {
  abi: string;
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
      }>(`/initia/move/v1/accounts/${convertIf(address)}/modules`, params)
      .then(d => [
        d.modules.map(mod => ({
          address: mod.address,
          module_name: mod.module_name,
          code_bytes: mod.code_bytes,
          abi: mod.abi,
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
        `/initia/move/v1/accounts/${convertIf(address)}/modules/${moduleName}`,
        params
      )
      .then(({ module: d }) => ({
        address: d.address,
        module_name: d.module_name,
        code_bytes: d.code_bytes,
        abi: d.abi,
      }));
  }

  public async executeEntryFunction(
    address: AccAddress,
    moduleName: string,
    functionName: string,
    typeArgs: string[],
    args: string[]
  ): Promise<ExecuteResult> {
    return this.c.post<ExecuteResult>(
      `/initia/move/v1/accounts/${convertIf(address)}/modules/${moduleName}/entry_functions/${functionName}`,
      {
        type_args: typeArgs,
        args,
      }
    );
  }

  /**
   * Query entry function with not encoded arguments and abi.
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
  public async executeEntryFunctionWithABI(
    address: AccAddress,
    moduleName: string,
    functionName: string,
    typeArgs: string[],
    args: any[],
    abi: string
  ): Promise<ExecuteResult> {
    const module: ModuleABI = JSON.parse(Buffer.from(abi, 'base64').toString());

    const functionAbi = module.exposed_functions.find(
      exposedFunction => exposedFunction.name === functionName
    );

    if (!functionAbi) {
      throw Error('function not found');
    }

    return this.executeEntryFunction(
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
  ): Promise<[Resource[], Pagination]> {
    return this.c
      .get<{
        resources: Resource[];
        pagination: Pagination;
      }>(`/initia/move/v1/accounts/${convertIf(address)}/resources`, params)
      .then(d => [
        d.resources.map(res => ({
          address: res.address,
          struct_tag: res.struct_tag,
          resource_bytes: res.resource_bytes,
          move_resource: res.move_resource,
        })),
        d.pagination,
      ]);
  }

  public async resource(
    address: AccAddress,
    structTag: string,
    params: APIParams = {}
  ): Promise<Resource> {
    return this.c
      .get<{ resource: Resource }>(
        `/initia/move/v1/accounts/${convertIf(address)}/resources/${structTag}`,
        params
      )
      .then(({ resource: d }) => ({
        address: d.address,
        struct_tag: d.struct_tag,
        resource_bytes: d.resource_bytes,
        move_resource: d.move_resource,
      }));
  }

  public async parameters(params: APIParams = {}): Promise<MoveParams> {
    return this.c
      .get<{ params: MoveParams.Data }>(`/initia/move/v1/params`, params)
      .then(({ params: d }) => ({
        max_module_size: Number.parseInt(d.max_module_size),
        free_storage_bytes: Number.parseInt(d.free_storage_bytes),
        storage_fee_per_byte: Coins.fromData(d.storage_fee_per_byte),
      }));
  }

  public async scriptABI(codeBytes: string): Promise<ABI> {
    return this.c.post<ABI>(`/initia/move/v1/script/abi`, {
      code_bytes: codeBytes,
    });
  }

  public async storageFee(
    address: AccAddress, 
    params: APIParams = {}
  ): Promise<StorageFee> {
    return this.c
      .get<{ storage_fee: StorageFee.Data }>(`/initia/move/v1/storage_fee/${convertIf(address)}`, params)
      .then(d => StorageFee.fromData(d.storage_fee));
  }
}
