import { BaseAPI } from './BaseAPI'
import {
  AbsoluteTxPosition,
  AccAddress,
  AccessConfig,
  WasmParams,
} from '../../../core'
import { APIParams, Pagination, PaginationOptions } from '../APIRequester'
import {
  ContractCodeHistoryOperationType,
  contractCodeHistoryOperationTypeFromJSON,
} from '@initia/initia.proto/cosmwasm/wasm/v1/types'

export interface ContractInfo {
  code_id: number
  creator: AccAddress
  admin?: AccAddress
  label?: string
  created: AbsoluteTxPosition
  ibc_port_id: string
  extension: {
    type_url: string
    value: string
  }
}

export namespace ContractInfo {
  export interface Data {
    code_id: string
    creator: AccAddress
    admin?: AccAddress
    label?: string
    created: AbsoluteTxPosition.Data
    ibc_port_id: string
    extension: {
      type_url: string
      value: string
    }
  }
}

export interface ContractCodeHistoryEntry {
  operation: ContractCodeHistoryOperationType
  code_id: number
  updated: AbsoluteTxPosition
  msg: string
}

export namespace ContractCodeHistoryEntry {
  export interface Data {
    operation: string
    code_id: string
    updated: AbsoluteTxPosition.Data
    msg: string
  }
}

export interface Model {
  key: string
  value: string
}

export interface CodeInfo {
  code_id: number
  creator: AccAddress
  data_hash: string
  instantiate_permission: AccessConfig
}

export namespace CodeInfo {
  export interface Data {
    code_id: string
    creator: AccAddress
    data_hash: string
    instantiate_permission: AccessConfig.Data
  }
}

export class WasmAPI extends BaseAPI {
  public async contractInfo(
    address: AccAddress,
    params: APIParams = {}
  ): Promise<ContractInfo> {
    return this.c
      .get<{
        address: AccAddress
        contract_info: ContractInfo.Data
      }>(`/cosmwasm/wasm/v1/contract/${address}`, params)
      .then((d) => ({
        code_id: Number.parseInt(d.contract_info.code_id),
        creator: d.contract_info.creator,
        admin: d.contract_info.admin,
        label: d.contract_info.label,
        created: AbsoluteTxPosition.fromData(d.contract_info.created),
        ibc_port_id: d.contract_info.ibc_port_id,
        extension: d.contract_info.extension,
      }))
  }

  public async contractHistory(
    address: AccAddress,
    params: Partial<PaginationOptions & APIParams> = {}
  ): Promise<[ContractCodeHistoryEntry[], Pagination]> {
    return this.c
      .get<{
        entries: ContractCodeHistoryEntry.Data[]
        pagination: Pagination
      }>(`/cosmwasm/wasm/v1/contract/${address}/history`, params)
      .then((d) => [
        d.entries.map((entry) => ({
          operation: contractCodeHistoryOperationTypeFromJSON(entry.operation),
          code_id: Number.parseInt(entry.code_id),
          updated: AbsoluteTxPosition.fromData(entry.updated),
          msg: entry.msg,
        })),
        d.pagination,
      ])
  }

  public async contractsByCode(
    codeId: number,
    params: Partial<PaginationOptions & APIParams> = {}
  ): Promise<[string[], Pagination]> {
    return this.c
      .get<{
        contracts: string[]
        pagination: Pagination
      }>(`/cosmwasm/wasm/v1/code/${codeId}/contracts`, params)
      .then((d) => [d.contracts, d.pagination])
  }

  public async allContractState(
    address: AccAddress,
    params: Partial<PaginationOptions & APIParams> = {}
  ): Promise<[Model[], Pagination]> {
    return this.c
      .get<{
        models: Model[]
        pagination: Pagination
      }>(`/cosmwasm/wasm/v1/contract/${address}/state`, params)
      .then((d) => [d.models, d.pagination])
  }

  public async rawContractState(
    address: AccAddress,
    queryData: string,
    params: APIParams = {}
  ): Promise<string> {
    return this.c
      .get<{
        data: string
      }>(`/cosmwasm/wasm/v1/contract/${address}/raw/${queryData}`, params)
      .then((d) => d.data)
  }

  public async smartContractState<T>(
    address: AccAddress,
    queryData: string,
    params: APIParams = {}
  ): Promise<T> {
    return this.c
      .get<{
        data: T
      }>(`/cosmwasm/wasm/v1/contract/${address}/smart/${queryData}`, params)
      .then((res) => res.data)
  }

  public async codeInfos(
    params: Partial<PaginationOptions & APIParams> = {}
  ): Promise<[CodeInfo[], Pagination]> {
    return this.c
      .get<{
        code_infos: CodeInfo.Data[]
        pagination: Pagination
      }>(`/cosmwasm/wasm/v1/code`, params)
      .then((d) => [
        d.code_infos.map((info) => ({
          code_id: Number.parseInt(info.code_id),
          creator: info.creator,
          data_hash: info.data_hash,
          instantiate_permission: AccessConfig.fromData(
            info.instantiate_permission
          ),
        })),
        d.pagination,
      ])
  }

  public async codeInfo(
    codeId: number,
    params: APIParams = {}
  ): Promise<{ code_info: CodeInfo; data: string }> {
    return this.c
      .get<{
        code_info: CodeInfo.Data
        data: string
      }>(`/cosmwasm/wasm/v1/code/${codeId}`, params)
      .then((d) => ({
        code_info: {
          code_id: Number.parseInt(d.code_info.code_id),
          creator: d.code_info.creator,
          data_hash: d.code_info.data_hash,
          instantiate_permission: AccessConfig.fromData(
            d.code_info.instantiate_permission
          ),
        },
        data: d.data,
      }))
  }

  public async pinnedCodes(
    params: Partial<PaginationOptions & APIParams> = {}
  ): Promise<[number[], Pagination]> {
    return this.c
      .get<{
        code_ids: string[]
        pagination: Pagination
      }>(`/cosmwasm/wasm/v1/codes/pinned`, params)
      .then((d) => [d.code_ids.map((id) => Number.parseInt(id)), d.pagination])
  }

  public async parameters(params: APIParams = {}): Promise<WasmParams> {
    return this.c
      .get<{
        params: WasmParams.Data
      }>(`/cosmwasm/wasm/v1/codes/params`, params)
      .then((d) => WasmParams.fromData(d.params))
  }

  public async contractsByCreator(
    creator: AccAddress,
    params: Partial<PaginationOptions & APIParams> = {}
  ): Promise<[string[], Pagination]> {
    return this.c
      .get<{
        contract_addresses: string[]
        pagination: Pagination
      }>(`/cosmwasm/wasm/v1/contracts/creator/${creator}`, params)
      .then((d) => [d.contract_addresses, d.pagination])
  }
}
