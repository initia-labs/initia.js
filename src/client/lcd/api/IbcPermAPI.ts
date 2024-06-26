import { BaseAPI } from './BaseAPI';
import { APIParams, Pagination, PaginationOptions } from '../APIRequester';

export interface PermissionedRelayers {
  port_id: string;
  channel_id: string;
  relayers: string[];
}

export class IbcPermAPI extends BaseAPI {
  public async relayers(
    params: Partial<PaginationOptions & APIParams> = {}
  ): Promise<[PermissionedRelayers[], Pagination]> {
    return this.c
      .get<{
        permissioned_relayers: PermissionedRelayers[];
        pagination: Pagination;
      }>(`/ibc/apps/perm/v1/relayers`, params)
      .then(d => [d.permissioned_relayers, d.pagination]);
  }

  public async relayersByChannel(
    port_id: string,
    channel_id: string
  ): Promise<PermissionedRelayers> {
    return this.c
      .get<{ permissioned_relayers: PermissionedRelayers }>(
        `/ibc/apps/perm/v1/relayers/${port_id}/${channel_id}`
      )
      .then(d => d.permissioned_relayers);
  }
}
