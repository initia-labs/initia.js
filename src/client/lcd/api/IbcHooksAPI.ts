import { BaseAPI } from './BaseAPI';
import { APIParams, Pagination, PaginationOptions } from '../APIRequester';
import { AccAddress, ACL, IbcHooksParams } from '../../../core';

export class IbcHooksAPI extends BaseAPI {
  public async acls(
    params: Partial<PaginationOptions & APIParams> = {}
  ): Promise<[ACL[], Pagination]> {
    return this.c
      .get<{
        acls: ACL.Data[];
        pagination: Pagination;
      }>(`/initia/ibchooks/v1/acls`, params)
      .then(d => [d.acls.map(ACL.fromData), d.pagination]);
  }

  public async acl(address: AccAddress, params: APIParams = {}): Promise<ACL> {
    return this.c
      .get<{ acl: ACL.Data }>(`/initia/ibchooks/v1/acls/${address}`, params)
      .then(d => ACL.fromData(d.acl));
  }

  public async parameters(params: APIParams = {}): Promise<IbcHooksParams> {
    return this.c
      .get<{ params: IbcHooksParams.Data }>(
        `/initia/ibchooks/v1/params`,
        params
      )
      .then(d => IbcHooksParams.fromData(d.params));
  }
}
