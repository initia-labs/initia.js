import {
  AccAddress,
  AccessTuple,
  EvmParams,
  SetCodeAuthorization,
} from '../../../core'
import { APIParams, Pagination, PaginationOptions } from '../APIRequester'
import { BaseAPI } from './BaseAPI'

export interface TraceOptions {
  with_memory: boolean
  with_stack: boolean
  with_storage: boolean
  with_return_data: boolean
}

export interface ERC721ClassInfo {
  class_id: string
  class_name: string
  class_uri: string
  class_descs: string
}

export interface ERC721TokenInfo {
  token_origin_id: string
  token_uri: string
}

export interface CallResponse {
  response: string
  used_gas: string
  logs: {
    address: AccAddress
    topics: string[]
    data: string
  }[]
  trace_output: string
  error: string
}

export class EvmAPI extends BaseAPI {
  /**
   * Query the module info of given contract address.
   * @param contract_addr contract address to look up
   */
  public async code(
    contract_addr: AccAddress,
    params: APIParams = {},
    headers: Record<string, string> = {}
  ): Promise<string> {
    return this.c
      .get<{
        code: string
      }>(`/minievm/evm/v1/codes/${contract_addr}`, params, headers)
      .then((d) => d.code)
  }

  /**
   * Query the state bytes of given contract address and key bytes.
   * @param contract_addr contract address to look up
   * @param key hex encoded hash string
   */
  public async state(
    contract_addr: AccAddress,
    key: string,
    params: APIParams = {},
    headers: Record<string, string> = {}
  ): Promise<string> {
    return this.c
      .get<{
        value: string
      }>(`/minievm/evm/v1/states/${contract_addr}/${key}`, params, headers)
      .then((d) => d.value)
  }

  /**
   * Query the ERC20Factory contract address.
   */
  public async erc20Factory(
    params: APIParams = {},
    headers: Record<string, string> = {}
  ): Promise<string> {
    return this.c
      .get<{
        address: string
      }>(`/minievm/evm/v1/contracts/erc20_factory`, params, headers)
      .then((d) => d.address)
  }

  /**
   * Query the ERC20Wrapper contract address.
   */
  public async erc20Wrapper(
    params: APIParams = {},
    headers: Record<string, string> = {}
  ): Promise<string> {
    return this.c
      .get<{
        address: string
      }>(`/minievm/evm/v1/contracts/erc20_wrapper`, params, headers)
      .then((d) => d.address)
  }

  /**
   * Query the Connect Oracle contract address.
   */
  public async connectOracle(
    params: APIParams = {},
    headers: Record<string, string> = {}
  ): Promise<string> {
    return this.c
      .get<{
        address: string
      }>(`/minievm/evm/v1/connect_oracle`, params, headers)
      .then((d) => d.address)
  }

  /**
   * Query the contract address by denom.
   * @param denom denom to look up
   */
  public async contractAddrByDenom(
    denom: string,
    params: APIParams = {},
    headers: Record<string, string> = {}
  ): Promise<AccAddress> {
    return this.c
      .get<{ address: AccAddress }>(
        `/minievm/evm/v1/contracts/by_denom`,
        {
          ...params,
          denom,
        },
        headers
      )
      .then((d) => d.address)
  }

  /**
   * Query the class id by contract address.
   * @param contract_addr contract address
   */
  public async erc721ClassId(
    contract_addr: AccAddress,
    params: APIParams = {},
    headers: Record<string, string> = {}
  ): Promise<string> {
    return this.c
      .get<{
        class_id: string
      }>(`/minievm/evm/v1/erc721/class_id/${contract_addr}`, params, headers)
      .then((d) => d.class_id)
  }

  /**
   * Query the class infos.
   */
  public async erc721ClassInfos(
    params: Partial<PaginationOptions & APIParams> = {},
    headers: Record<string, string> = {}
  ): Promise<[ERC721ClassInfo[], Pagination]> {
    return this.c
      .get<{
        class_infos: ERC721ClassInfo[]
        pagination: Pagination
      }>(`/minievm/evm/v1/erc721/class_infos`, params, headers)
      .then((d) => [d.class_infos, d.pagination])
  }

  /**
   * Query the class info by class id.
   * @param class_id class id
   */
  public async erc721ClassInfo(
    class_id: string,
    params: APIParams = {},
    headers: Record<string, string> = {}
  ): Promise<ERC721ClassInfo> {
    return this.c
      .get<{
        class_info: ERC721ClassInfo
      }>(`/minievm/evm/v1/erc721/class_infos/${class_id}`, params, headers)
      .then((d) => d.class_info)
  }

  /**
   * Query the origin token info by class id and token id.
   * @param class_id class id
   * @param token_id token id
   */
  public async erc721TokenInfo(
    class_id: string,
    token_id: string,
    params: APIParams = {},
    headers: Record<string, string> = {}
  ): Promise<ERC721TokenInfo> {
    return this.c
      .get<{
        token_infos: ERC721TokenInfo[]
      }>(
        `/minievm/evm/v1/erc721/origin_token_infos/${class_id}`,
        { ...params, token_ids: token_id },
        headers
      )
      .then((d) => d.token_infos[0])
  }

  /**
   * Query the denom of the given contract address.
   * @param contract_addr contract address to look up
   */
  public async denom(
    contract_addr: AccAddress,
    params: APIParams = {},
    headers: Record<string, string> = {}
  ): Promise<string> {
    return this.c
      .get<{
        denom: string
      }>(`/minievm/evm/v1/denoms/${contract_addr}`, params, headers)
      .then((d) => d.denom)
  }

  /**
   * Executes entry function and returns the function result.
   * @param sender sender address
   * @param contract_addr contract address to execute
   * @param input hex encoded call input
   * @param value the amount of fee denom token to transfer to the contract
   * @param access_list list of Ethereum addresses and their corresponding storage slots that a transaction will interact with during its execution
   * @param trace_options whether to trace the call
   * @param auth_list list of authorizations that allow code deployment at specific addresses
   */
  public async call(
    sender: AccAddress,
    contract_addr: AccAddress,
    input: string,
    value: string,
    access_list: AccessTuple[] | undefined,
    trace_options: TraceOptions | undefined,
    auth_list: SetCodeAuthorization[],
    headers: Record<string, string> = {}
  ): Promise<CallResponse> {
    return this.c.post<CallResponse>(
      `/minievm/evm/v1/call`,
      {
        sender,
        contract_addr,
        input,
        value,
        access_list,
        trace_options,
        auth_list: auth_list.map((auth) => auth.toData()),
      },
      headers
    )
  }

  /**
   * Query the parameters of the evm module.
   */
  public async parameters(
    params: APIParams = {},
    headers: Record<string, string> = {}
  ): Promise<EvmParams> {
    return this.c
      .get<{
        params: EvmParams.Data
      }>(`/minievm/evm/v1/params`, params, headers)
      .then((d) => EvmParams.fromData(d.params))
  }
}
