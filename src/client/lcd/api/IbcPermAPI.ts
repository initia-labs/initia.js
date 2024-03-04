import { BaseAPI } from './BaseAPI';
import { APIParams, Pagination, PaginationOptions } from '../APIRequester';

export interface PermissionedRelayer {
  port_id: string;
  channel_id: string;
  relayer: string;
}

export class IbcPermAPI extends BaseAPI {
  public async relayers(
    params: Partial<PaginationOptions & APIParams> = {}
  ): Promise<[PermissionedRelayer[], Pagination]> {
    return this.c
      .get<{
        permissioned_relayers: PermissionedRelayer[];
        pagination: Pagination;
      }>(`/ibc/apps/perm/v1/relayers`, params)
      .then(d => [d.permissioned_relayers, d.pagination]);
  }

  public async relayer(
    port_id: string,
    channel_id: string
  ): Promise<PermissionedRelayer> {
    return this.c
      .get<{ permissioned_relayer: PermissionedRelayer }>(
        `/ibc/apps/perm/v1/relayers/${port_id}/${channel_id}`
      )
      .then(d => d.permissioned_relayer);
  }
}
