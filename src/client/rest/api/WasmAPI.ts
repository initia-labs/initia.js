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
  /**
   * Query the contract metadata.
   * @param address the address of the contract to query
   */
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
        code_id: parseInt(d.contract_info.code_id),
        creator: d.contract_info.creator,
        admin: d.contract_info.admin,
        label: d.contract_info.label,
        created: AbsoluteTxPosition.fromData(d.contract_info.created),
        ibc_port_id: d.contract_info.ibc_port_id,
        extension: d.contract_info.extension,
      }))
  }

  /**
   * Query the contract code history.
   * @param address the address of the contract to query
   */
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
          code_id: parseInt(entry.code_id),
          updated: AbsoluteTxPosition.fromData(entry.updated),
          msg: entry.msg,
        })),
        d.pagination,
      ])
  }

  /**
   * Query the list of all smart contracts for a code id.
   * @param code_id unique code identifier
   */
  public async contractsByCode(
    code_id: number,
    params: Partial<PaginationOptions & APIParams> = {}
  ): Promise<[string[], Pagination]> {
    return this.c
      .get<{
        contracts: string[]
        pagination: Pagination
      }>(`/cosmwasm/wasm/v1/code/${code_id}/contracts`, params)
      .then((d) => [d.contracts, d.pagination])
  }

  /**
   * Query all the raw store data for a single contract.
   * @param address the address of the contract
   */
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

  /**
   * Query the single key from the raw store data of a contract.
   * @param address the address of the contract
   * @param query_data the query data passed to the contract
   */
  public async rawContractState(
    address: AccAddress,
    query_data: string,
    params: APIParams = {}
  ): Promise<string> {
    return this.c
      .get<{
        data: string
      }>(`/cosmwasm/wasm/v1/contract/${address}/raw/${query_data}`, params)
      .then((d) => d.data)
  }

  /**
   * Query the smart query result from the contract.
   * @param address the address of the contract
   * @param query_data the query data passed to the contract
   */
  public async smartContractState<T>(
    address: AccAddress,
    query_data: string,
    params: APIParams = {}
  ): Promise<T> {
    return this.c
      .get<{
        data: T
      }>(`/cosmwasm/wasm/v1/contract/${address}/smart/${query_data}`, params)
      .then((res) => res.data)
  }

  /**
   * Query the metadatas for all stored wasm codes.
   */
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
          code_id: parseInt(info.code_id),
          creator: info.creator,
          data_hash: info.data_hash,
          instantiate_permission: AccessConfig.fromData(
            info.instantiate_permission
          ),
        })),
        d.pagination,
      ])
  }

  /**
   * Query the binary code and metadata for a singe wasm code.
   * @param code_id unique code identifier
   */
  public async codeInfo(
    code_id: number,
    params: APIParams = {}
  ): Promise<{ code_info: CodeInfo; data: string }> {
    return this.c
      .get<{
        code_info: CodeInfo.Data
        data: string
      }>(`/cosmwasm/wasm/v1/code/${code_id}`, params)
      .then((d) => ({
        code_info: {
          code_id: parseInt(d.code_info.code_id),
          creator: d.code_info.creator,
          data_hash: d.code_info.data_hash,
          instantiate_permission: AccessConfig.fromData(
            d.code_info.instantiate_permission
          ),
        },
        data: d.data,
      }))
  }

  /**
   * Query the pinned code ids.
   */
  public async pinnedCodes(
    params: Partial<PaginationOptions & APIParams> = {}
  ): Promise<[number[], Pagination]> {
    return this.c
      .get<{
        code_ids: string[]
        pagination: Pagination
      }>(`/cosmwasm/wasm/v1/codes/pinned`, params)
      .then((d) => [d.code_ids.map((id) => parseInt(id)), d.pagination])
  }

  /**
   * Query the parameters of the wasm module.
   */
  public async parameters(params: APIParams = {}): Promise<WasmParams> {
    return this.c
      .get<{
        params: WasmParams.Data
      }>(`/cosmwasm/wasm/v1/codes/params`, params)
      .then((d) => WasmParams.fromData(d.params))
  }

  /**
   * Query the contracts by creator.
   * @param creator the address of contract creator
   */
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
