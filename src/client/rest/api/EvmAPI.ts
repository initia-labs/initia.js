import { AccAddress, EvmParams } from '../../../core'
import { APIParams } from '../APIRequester'
import { BaseAPI } from './BaseAPI'

export interface CallResponse {
  response: string
  used_gas: string
  logs: {
    address: AccAddress
    topics: string[]
    data: string
  }[]
  trace_output: string
}

export class EvmAPI extends BaseAPI {
  /**
   * Query the module info of given contract address.
   * @param contract_addr contract address to look up
   */
  public async code(
    contract_addr: AccAddress,
    params: APIParams = {}
  ): Promise<string> {
    return this.c
      .get<{ code: string }>(`/minievm/evm/v1/codes/${contract_addr}`, params)
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
    params: APIParams = {}
  ): Promise<string> {
    return this.c
      .get<{
        value: string
      }>(`/minievm/evm/v1/states/${contract_addr}/${key}`, params)
      .then((d) => d.value)
  }

  /**
   * Query the ERC20Factory contract address.
   */
  public async erc20Factory(params: APIParams = {}): Promise<string> {
    return this.c
      .get<{
        address: string
      }>(`/minievm/evm/v1/contracts/erc20_factory`, params)
      .then((d) => d.address)
  }

  /**
   * Query the contract address by denom.
   * @param denom denom to look up
   */
  public async contractAddrByDenom(
    denom: string,
    params: APIParams = {}
  ): Promise<AccAddress> {
    return this.c
      .get<{ address: AccAddress }>(`/minievm/evm/v1/contracts/by_denom`, {
        ...params,
        denom,
      })
      .then((d) => d.address)
  }

  /**
   * Query the denom of the given contract address.
   * @param contract_addr contract address to look up
   */
  public async denom(
    contract_addr: AccAddress,
    params: APIParams = {}
  ): Promise<string> {
    return this.c
      .get<{ denom: string }>(`/minievm/evm/v1/denoms/${contract_addr}`, params)
      .then((d) => d.denom)
  }

  /**
   * Executes entry function and returns the function result.
   * @param sender sender address
   * @param contract_addr contract address to execute
   * @param input hex encoded call input
   * @param with_trace whether to trace the call
   */
  public async call(
    sender: AccAddress,
    contract_addr: AccAddress,
    input: string,
    with_trace: boolean
  ): Promise<CallResponse> {
    return this.c.post<CallResponse>(`/minievm/evm/v1/call`, {
      sender,
      contract_addr,
      input,
      with_trace,
    })
  }

  /**
   * Query the parameters of the evm module.
   */
  public async parameters(params: APIParams = {}): Promise<EvmParams> {
    return this.c
      .get<{ params: EvmParams.Data }>(`/minievm/evm/v1/params`, params)
      .then((d) => EvmParams.fromData(d.params))
  }
}
