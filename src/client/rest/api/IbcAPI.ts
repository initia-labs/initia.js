import { BaseAPI } from './BaseAPI'
import { APIParams, Pagination, PaginationOptions } from '../APIRequester'
import {
  IdentifiedClientState,
  ClientConsensusStates,
  Channel,
  IdentifiedConnection,
  Height,
  IbcClientParams,
} from '../../../core'

export interface ClientState {
  client_state: any
  proof: string | null
  proof_height: Height
}

export namespace ClientState {
  export interface Data {
    client_state: any
    proof: string | null
    proof_height: Height.Data
  }
}

export interface Port {
  channel: Channel
  proof: string
  proof_height: Height
}

export namespace Port {
  export interface Data {
    channel: Channel.Data
    proof: string
    proof_height: Height.Data
  }
}

export class IbcAPI extends BaseAPI {
  /**
   * Query all the IBC channels of a chain.
   */
  public async channels(
    params: APIParams = {}
  ): Promise<[Channel[], Pagination]> {
    return this.c
      .get<{
        channels: Channel.Data[]
        pagination: Pagination
      }>(`/ibc/core/channel/v1/channels`, params)
      .then((d) => [d.channels.map(Channel.fromData), d.pagination])
  }

  /**
   * Query the information of the port at given channel.
   * @param channel_id channel identifier
   * @param port_id port name
   */
  public async port(
    channel_id: string,
    port_id: string,
    params: APIParams = {}
  ): Promise<Port> {
    return this.c
      .get<{
        channel: Channel.Data
        proof: string
        proof_height: Height.Data
      }>(`/ibc/core/channel/v1/channels/${channel_id}/ports/${port_id}`, params)
      .then((d) => {
        return {
          channel: Channel.fromData(d.channel),
          proof: d.proof,
          proof_height: Height.fromData(d.proof_height),
        }
      })
  }

  /**
   * Query all the IBC connections of a chain.
   */
  public async connections(
    params: APIParams = {}
  ): Promise<[IdentifiedConnection[], Pagination]> {
    return this.c
      .get<{
        connections: IdentifiedConnection.Data[]
        pagination: Pagination
      }>(`/ibc/core/connection/v1/connections`, params)
      .then((d) => [
        d.connections.map(IdentifiedConnection.fromData),
        d.pagination,
      ])
  }

  /**
   * Query an IBC connection end.
   * @param connection_id connection unique identifier
   */
  public async connection(
    connection_id: string,
    params: APIParams = {}
  ): Promise<IdentifiedConnection> {
    return this.c
      .get<{
        connection: IdentifiedConnection.Data
      }>(`/ibc/core/connection/v1/connections/${connection_id}`, params)
      .then((d) => IdentifiedConnection.fromData(d.connection))
  }

  /**
   * Query all the channels associated with a connection end.
   * @param connection_id connection unique identifier
   */
  public async connectionChannels(
    connection_id: string,
    params: APIParams = {}
  ): Promise<[Channel[], Height, Pagination]> {
    return this.c
      .get<{
        channels: Channel.Data[]
        pagination: Pagination
        height: Height.Data
      }>(`/ibc/core/channel/v1/connections/${connection_id}/channels`, params)
      .then((d) => [
        d.channels.map(Channel.fromData),
        Height.fromData(d.height),
        d.pagination,
      ])
  }

  /**
   * Query the parameters of the ibc module.
   */
  public async parameters(params: APIParams = {}): Promise<IbcClientParams> {
    return this.c
      .get<{
        params: IbcClientParams.Data
      }>(`/ibc/core/client/v1/params`, params)
      .then((d) => IbcClientParams.fromData(d.params))
  }

  /**
   * Query all the IBC light clients of a chain.
   */
  public async clientStates(
    params: Partial<PaginationOptions & APIParams> = {}
  ): Promise<[IdentifiedClientState[], Pagination]> {
    return this.c
      .get<{
        client_states: IdentifiedClientState.Data[]
        pagination: Pagination
      }>(`/ibc/core/client/v1/client_states`, params)
      .then((d) => [
        d.client_states.map(IdentifiedClientState.fromData),
        d.pagination,
      ])
  }

  /**
   * Query an IBC light client.
   * @param client_id client state unique identifier
   */
  public async clientState(
    client_id: string,
    params: APIParams = {}
  ): Promise<ClientState> {
    return this.c
      .get<ClientState.Data>(
        `/ibc/core/client/v1/client_states/${client_id}`,
        params
      )
      .then((d) => ({
        client_state: d.client_state,
        proof: d.proof,
        proof_height: Height.fromData(d.proof_height),
      }))
  }

  /**
   * Query the status of an IBC light client
   * @param client_id client state unique ident.ifier
   */
  public async clientStatus(
    client_id: string,
    params: APIParams = {}
  ): Promise<string> {
    return this.c
      .get<{
        status: string
      }>(`/ibc/core/client/v1/client_status/${client_id}`, params)
      .then((d) => d.status)
  }

  /**
   * Query all the consensus state associated with a given client.
   * @param client_id client identifier
   */
  public async consensusStates(
    client_id: string,
    params: Partial<PaginationOptions & APIParams> = {}
  ): Promise<[ClientConsensusStates, Pagination]> {
    return this.c
      .get<{
        consensus_states: ClientConsensusStates.Data
        pagination: Pagination
      }>(`/ibc/core/client/v1/consensus_states/${client_id}`, params)
      .then()
  }

  /**
   * Query the height of every consensus states associated with a given client.
   * @param client_id client identifier
   */
  public async consensusStateHeights(
    client_id: string,
    params: Partial<PaginationOptions & APIParams> = {}
  ): Promise<[Height[], Pagination]> {
    return this.c
      .get<{
        consensus_state_heights: Height.Data[]
        pagination: Pagination
      }>(`/ibc/core/client/v1/consensus_states/${client_id}/heights`, params)
      .then((d) => [
        d.consensus_state_heights.map(Height.fromData),
        d.pagination,
      ])
  }

  /**
   * Query all the unreceived IBC packets associated with a channel and sequences.
   * @param port_id port unique identifier
   * @param channel_id channel unique identifier
   * @param sequences list of packet sequences
   */
  public async unreceivedPackets(
    port_id: string,
    channel_id: string,
    sequences: number[],
    params: APIParams = {}
  ): Promise<{ sequences: string[]; height: Height }> {
    return this.c.get<{ sequences: string[]; height: Height }>(
      `/ibc/core/channel/v1/channels/${channel_id}/ports/${port_id}/packet_commitments/${sequences.join(
        ','
      )}/unreceived_packets`,
      params
    )
  }

  /**
   * Query all the unreceived IBC acknowledgements associated with a channel and sequences.
   * @param port_id port unique identifier
   * @param channel_id channel unique identifier
   * @param sequences list of packet sequences
   */
  public async unreceivedAcks(
    port_id: string,
    channel_id: string,
    sequences: number[],
    params: APIParams = {}
  ): Promise<{ sequences: string[]; height: Height }> {
    return this.c.get<{ sequences: string[]; height: Height }>(
      `/ibc/core/channel/v1/channels/${channel_id}/ports/${port_id}/packet_commitments/${sequences.join(
        ','
      )}/unreceived_acks`,
      params
    )
  }
}
