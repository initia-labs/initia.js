import { BaseAPI } from './BaseAPI';
import { APIParams, Pagination, PaginationOptions } from '../APIRequester';
import { ClassTrace } from '../../../core/ibc/applications/nft-transfer';

export interface IbcNftParams {
  send_enabled: boolean;
  receive_enabled: boolean;
}

export namespace IbcNftParams {
  export interface Data {
    send_enabled: boolean;
    receive_enabled: boolean;
  }
}

export class IbcNftAPI extends BaseAPI {
  /** Gets a classTrace for the hash */
  public async classTrace(hash: string): Promise<ClassTrace> {
    return this.c
      .get<{ class_trace: ClassTrace.Data }>(
        `/ibc/apps/nft_transfer/v1/class_traces/${hash}`
      )
      .then(d => ClassTrace.fromData(d.class_trace));
  }

  /** Gets a list of classTraces */
  public async classTraces(
    params: Partial<PaginationOptions & APIParams> = {}
  ): Promise<[ClassTrace[], Pagination]> {
    return this.c
      .get<{ class_traces: ClassTrace[]; pagination: Pagination }>(
        `/ibc/apps/nft_transfer/v1/class_traces`,
        params
      )
      .then(d => [d.class_traces.map(ClassTrace.fromData), d.pagination]);
  }

  /** Gets a class id hash information */
  public async classHash(trace: string): Promise<string> {
    return await this.c
      .get<{ hash: string }>(`/ibc/apps/nft_transfer/v1/class_hashes/${trace}`)
      .then(d => d.hash);
  }

  /**
   * Gets the current nft transfer application parameters.
   */
  public async parameters(params: APIParams = {}): Promise<IbcNftParams> {
    return this.c
      .get<{ params: IbcNftParams.Data }>(
        `/ibc/apps/nft_transfer/v1/params`,
        params
      )
      .then(({ params: d }) => ({
        send_enabled: d.send_enabled,
        receive_enabled: d.receive_enabled,
      }));
  }

  /** Gets the escrow address for a particular port and channel id */
  public async escrowAddress(
    channel_id: string,
    port_id: string,
    params: APIParams = {}
  ): Promise<string> {
    return this.c
      .get<{ escrow_address: string }>(
        `/ibc/apps/nft_transfer/v1/channels/${channel_id}/ports/${port_id}/escrow_address`,
        params
      )
      .then(d => d.escrow_address);
  }
}
