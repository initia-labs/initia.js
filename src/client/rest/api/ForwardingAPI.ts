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
  /**
   * Query all the denoms that are allowed to be forwarded.
   */
  public async denoms(
    params: APIParams = {},
    headers: Record<string, string> = {}
  ): Promise<string[]> {
    return this.c
      .get<{
        allowed_denoms: string[]
      }>(`/noble/forwarding/v1/denoms`, params, headers)
      .then((d) => d.allowed_denoms)
  }

  /**
   * Query the forwarding address by channel and recipient.
   * @param channel
   * @param recipient
   * @param fallback
   */
  public async address(
    channel: string,
    recipient: string,
    fallback: string,
    params: APIParams = {},
    headers: Record<string, string> = {}
  ): Promise<AccAddress> {
    return this.c
      .get<{
        address: AccAddress
      }>(
        `/noble/forwarding/v1/address/${channel}/${recipient}/${fallback}`,
        params,
        headers
      )
      .then((d) => d.address)
  }

  /**
   * Query the forwarding stats by channel.
   * @param channel
   */
  public async stats(
    channel: string,
    params: APIParams = {},
    headers: Record<string, string> = {}
  ): Promise<ForwardingStats> {
    return this.c
      .get<ForwardingStats.Data>(
        `/noble/forwarding/v1/stats/${channel}`,
        params,
        headers
      )
      .then((d) => ({
        num_of_accounts: parseInt(d.num_of_accounts),
        num_of_forwards: parseInt(d.num_of_forwards),
        total_forwarded: Coin.fromData(d.total_forwarded),
      }))
  }
}
