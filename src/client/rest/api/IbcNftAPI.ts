import { BaseAPI } from './BaseAPI'
import { APIParams, Pagination, PaginationOptions } from '../APIRequester'
import { NftClassTrace, IbcNftParams } from '../../../core'

export class IbcNftAPI extends BaseAPI {
  /** Gets a classTrace for the hash */
  public async classTrace(hash: string): Promise<NftClassTrace> {
    return this.c
      .get<{
        class_trace: NftClassTrace.Data
      }>(`/ibc/apps/nft_transfer/v1/class_traces/${hash}`)
      .then((d) => NftClassTrace.fromData(d.class_trace))
  }

  /** Gets a list of classTraces */
  public async classTraces(
    params: Partial<PaginationOptions & APIParams> = {}
  ): Promise<[NftClassTrace[], Pagination]> {
    return this.c
      .get<{
        class_traces: NftClassTrace[]
        pagination: Pagination
      }>(`/ibc/apps/nft_transfer/v1/class_traces`, params)
      .then((d) => [d.class_traces.map(NftClassTrace.fromData), d.pagination])
  }

  /** Gets a class id hash information */
  public async classHash(trace: string): Promise<string> {
    return await this.c
      .get<{ hash: string }>(`/ibc/apps/nft_transfer/v1/class_hashes/${trace}`)
      .then((d) => d.hash)
  }

  /**
   * Gets the current nft transfer application parameters.
   */
  public async parameters(params: APIParams = {}): Promise<IbcNftParams> {
    return this.c
      .get<{
        params: IbcNftParams.Data
      }>(`/ibc/apps/nft_transfer/v1/params`, params)
      .then((d) => IbcNftParams.fromData(d.params))
  }

  /** Gets the escrow address for a particular port and channel id */
  public async escrowAddress(
    channel_id: string,
    port_id: string,
    params: APIParams = {}
  ): Promise<string> {
    return this.c
      .get<{
        escrow_address: string
      }>(
        `/ibc/apps/nft_transfer/v1/channels/${channel_id}/ports/${port_id}/escrow_address`,
        params
      )
      .then((d) => d.escrow_address)
  }
}
