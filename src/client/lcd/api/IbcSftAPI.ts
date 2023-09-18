import { BaseAPI } from './BaseAPI';
import { APIParams, Pagination, PaginationOptions } from '../APIRequester';
import { SftClassTrace, IbcSftParams } from '../../../core';

export class IbcSftAPI extends BaseAPI {
  /** Gets a classTrace for the hash */
  public async classTrace(hash: string): Promise<SftClassTrace> {
    return this.c
      .get<{ class_trace: SftClassTrace.Data }>(
        `/ibc/apps/sft_transfer/v1/class_traces/${hash}`
      )
      .then(d => SftClassTrace.fromData(d.class_trace));
  }

  /** Gets a list of classTraces */
  public async classTraces(
    params: Partial<PaginationOptions & APIParams> = {}
  ): Promise<[SftClassTrace[], Pagination]> {
    return this.c
      .get<{ class_traces: SftClassTrace[]; pagination: Pagination }>(
        `/ibc/apps/sft_transfer/v1/class_traces`,
        params
      )
      .then(d => [d.class_traces.map(SftClassTrace.fromData), d.pagination]);
  }

  /** Gets a class id hash information */
  public async classHash(trace: string): Promise<string> {
    return await this.c
      .get<{ hash: string }>(`/ibc/apps/sft_transfer/v1/class_hashes/${trace}`)
      .then(d => d.hash);
  }

  /**
   * Gets the current sft transfer application parameters.
   */
  public async parameters(params: APIParams = {}): Promise<IbcSftParams> {
    return this.c
      .get<{ params: IbcSftParams.Data }>(
        `/ibc/apps/sft_transfer/v1/params`,
        params
      )
      .then(({ params: d }) => IbcSftParams.fromData(d));
  }

  /** Gets the escrow address for a particular port and channel id */
  public async escrowAddress(
    channel_id: string,
    port_id: string,
    params: APIParams = {}
  ): Promise<string> {
    return this.c
      .get<{ escrow_address: string }>(
        `/ibc/apps/sft_transfer/v1/channels/${channel_id}/ports/${port_id}/escrow_address`,
        params
      )
      .then(d => d.escrow_address);
  }
}
