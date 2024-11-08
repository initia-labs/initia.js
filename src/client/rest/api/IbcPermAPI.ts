import { BaseAPI } from './BaseAPI'
import { APIParams, Pagination, PaginationOptions } from '../APIRequester'

export interface ChannelState {
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
    params: Partial<PaginationOptions & APIParams> = {}
  ): Promise<[ChannelState[], Pagination]> {
    return this.c
      .get<{
        channel_states: ChannelState[]
        pagination: Pagination
      }>(`/ibc/apps/perm/v1/channel_states`, params)
      .then((d) => [d.channel_states, d.pagination])
  }

  /**
   * Query the channel state for the specific port-id:channel-id pair.
   * @param channel_id unique channel identifier
   * @param port_id unique port identifier
   */
  public async channelState(
    channel_id: string,
    port_id: string
  ): Promise<ChannelState> {
    return this.c
      .get<{
        channel_state: ChannelState
      }>(`/ibc/apps/perm/v1/channel_states/${channel_id}/${port_id}`)
      .then((d) => d.channel_state)
  }
}
