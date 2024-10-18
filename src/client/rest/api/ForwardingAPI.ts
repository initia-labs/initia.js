import { AccAddress, Coin } from '../../../core'
import { APIParams } from '../APIRequester'
import { BaseAPI } from './BaseAPI'

export interface ForwardingStats {
  num_of_accounts: number
  num_of_forwards: number
  total_forwarded: Coin
}

export namespace ForwardingStats {
  export interface Data {
    num_of_accounts: string
    num_of_forwards: string
    total_forwarded: Coin.Data
  }
}

export class ForwardingAPI extends BaseAPI {
  public async address(
    channel: string,
    recipient: string,
    params: APIParams = {}
  ): Promise<AccAddress> {
    return this.c
      .get<{
        address: AccAddress
      }>(`/noble/forwarding/v1/address/${channel}/${recipient}`, params)
      .then((d) => d.address)
  }

  public async stats(
    channel: string,
    params: APIParams = {}
  ): Promise<ForwardingStats> {
    return this.c
      .get<ForwardingStats.Data>(
        `/noble/forwarding/v1/stats/${channel}`,
        params
      )
      .then((d) => ({
        num_of_accounts: parseInt(d.num_of_accounts),
        num_of_forwards: parseInt(d.num_of_forwards),
        total_forwarded: Coin.fromData(d.total_forwarded),
      }))
  }
}
