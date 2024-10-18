import { BaseAPI } from './BaseAPI'
import { APIParams, Pagination, PaginationOptions } from '../APIRequester'

export interface ChannelState {
  port_id: string
  channel_id: string
  admin: string
  relayers: string[]
}

export class IbcPermAPI extends BaseAPI {
  public async channelStates(
    params: Partial<PaginationOptions & APIParams> = {}
  ): Promise<[ChannelState[], Pagination]> {
    return this.c
      .get<{
        channel_states: ChannelState[]
        pagination: Pagination
      }>(`/ibc/apps/perm/v1/channel_states`, params)
      .then((d) => [d.channel_states, d.pagination])
  }

  public async channelState(
    channelId: string,
    portId: string
  ): Promise<ChannelState> {
    return this.c
      .get<{
        channel_state: ChannelState
      }>(`/ibc/apps/perm/v1/channel_states/${channelId}/${portId}`)
      .then((d) => d.channel_state)
  }
}
