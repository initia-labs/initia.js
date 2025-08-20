import { BaseAPI } from './BaseAPI'
import { APIParams, Pagination, PaginationOptions } from '../APIRequester'
import { DenomTrace, IbcTransferParams } from '../../../core'

export class IbcTransferAPI extends BaseAPI {
  /**
   * Query a denomination trace information.
   * @param hash hash (in hex format) or denom (full denom with ibc prefix) of the denomination trace information
   */
  public async denomTrace(
    hash: string,
    params: APIParams = {},
    headers: Record<string, string> = {}
  ): Promise<DenomTrace> {
    return this.c
      .get<{
        denom_trace: DenomTrace.Data
      }>(`/ibc/apps/transfer/v1/denom_traces/${hash}`, params, headers)
      .then((d) => DenomTrace.fromData(d.denom_trace))
  }

  /**
   * Query all denomination traces.
   */
  public async denomTraces(
    params: Partial<PaginationOptions & APIParams> = {},
    headers: Record<string, string> = {}
  ): Promise<[DenomTrace[], Pagination]> {
    return this.c
      .get<{
        denom_traces: DenomTrace[]
        pagination: Pagination
      }>(`/ibc/apps/transfer/v1/denom_traces`, params, headers)
      .then((d) => [d.denom_traces.map(DenomTrace.fromData), d.pagination])
  }

  /**
   * Query a denomination hash information.
   * @param trace the denomination trace ([port_id]/[channel_id])+/[denom]
   */
  public async denomHash(
    trace: string,
    params: APIParams = {},
    headers: Record<string, string> = {}
  ): Promise<string> {
    return this.c
      .get<{
        hash: string
      }>(`/ibc/apps/transfer/v1/denom_hashes/${trace}`, params, headers)
      .then((d) => d.hash)
  }

  /**
   * Query the parameters of the ibc transfer module.
   */
  public async parameters(
    params: APIParams = {},
    headers: Record<string, string> = {}
  ): Promise<IbcTransferParams> {
    return this.c
      .get<{
        params: IbcTransferParams.Data
      }>(`/ibc/apps/transfer/v1/params`, params, headers)
      .then((d) => IbcTransferParams.fromData(d.params))
  }

  /**
   * Query the escrow address for a particular port and channel id.
   * @param channel_id unique channel identifier
   * @param port_id unique port identifier
   */
  public async escrowAddress(
    channel_id: string,
    port_id: string,
    params: APIParams = {},
    headers: Record<string, string> = {}
  ): Promise<string> {
    return this.c
      .get<{
        escrow_address: string
      }>(
        `/ibc/apps/transfer/v1/channels/${channel_id}/ports/${port_id}/escrow_address`,
        params,
        headers
      )
      .then((d) => d.escrow_address)
  }
}
