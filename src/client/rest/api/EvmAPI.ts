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
  public async code(
    contractAddr: AccAddress,
    params: APIParams = {}
  ): Promise<string> {
    return this.c
      .get<{ code: string }>(`/minievm/evm/v1/codes/${contractAddr}`, params)
      .then((d) => d.code)
  }

  public async state(
    contractAddr: AccAddress,
    key: string,
    params: APIParams = {}
  ): Promise<string> {
    return this.c
      .get<{
        value: string
      }>(`/minievm/evm/v1/states/${contractAddr}/${key}`, params)
      .then((d) => d.value)
  }

  public async erc20Factory(params: APIParams = {}): Promise<string> {
    return this.c
      .get<{
        address: string
      }>(`/minievm/evm/v1/contracts/erc20_factory`, params)
      .then((d) => d.address)
  }

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

  public async denom(
    contractAddr: AccAddress,
    params: APIParams = {}
  ): Promise<string> {
    return this.c
      .get<{ denom: string }>(`/minievm/evm/v1/denoms/${contractAddr}`, params)
      .then((d) => d.denom)
  }

  public async call(
    sender: AccAddress,
    contractAddr: AccAddress,
    input: string,
    withTrace: boolean
  ): Promise<CallResponse> {
    return this.c.post<CallResponse>(`/minievm/evm/v1/call`, {
      sender,
      contract_addr: contractAddr,
      input,
      with_trace: withTrace,
    })
  }

  public async parameters(params: APIParams = {}): Promise<EvmParams> {
    return this.c
      .get<{ params: EvmParams.Data }>(`/minievm/evm/v1/params`, params)
      .then((d) => EvmParams.fromData(d.params))
  }
}
