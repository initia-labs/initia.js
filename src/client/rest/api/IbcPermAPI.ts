import { BaseAPI } from './BaseAPI'
import { APIParams, Pagination, PaginationOptions } from '../APIRequester'

export interface ChannelStateResponse {
  port_id: string
  channel_id: string
  admin: string
  relayers: string[]
}

export class IbcPermAPI extends BaseAPI {
  /**
   * Query all the channel states.
   */
  public async channelStates(
    params: Partial<PaginationOptions & APIParams> = {},
    headers: Record<string, string> = {}
  ): Promise<[ChannelStateResponse[], Pagination]> {
    return this.c
      .get<{
        channel_states: ChannelStateResponse[]
        pagination: Pagination
      }>(`/ibc/apps/perm/v1/channel_states`, params, headers)
      .then((d) => [d.channel_states, d.pagination])
  }

  /**
   * Query the channel state for the specific port-id:channel-id pair.
   * @param channel_id unique channel identifier
   * @param port_id unique port identifier
   */
  public async channelState(
    channel_id: string,
    port_id: string,
    params: APIParams = {},
    headers: Record<string, string> = {}
  ): Promise<ChannelStateResponse> {
    return this.c
      .get<{
        channel_state: ChannelStateResponse
      }>(
        `/ibc/apps/perm/v1/channel_states/${channel_id}/${port_id}`,
        params,
        headers
      )
      .then((d) => d.channel_state)
  }
}
