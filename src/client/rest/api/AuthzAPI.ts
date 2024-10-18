import { AccAddress, AuthorizationGrant } from '../../../core'
import { BaseAPI } from './BaseAPI'
import { APIParams, Pagination } from '../APIRequester'

export class AuthzAPI extends BaseAPI {
  /**
   * Get the message authorization grants for a specific granter and grantee
   */
  public async grants(
    granter: AccAddress,
    grantee: AccAddress,
    msgTypeUrl?: string,
    params: APIParams = {}
  ): Promise<[AuthorizationGrant[], Pagination]> {
    return this.c
      .get<{ grants: AuthorizationGrant.Data[]; pagination: Pagination }>(
        `/cosmos/authz/v1beta1/grants`,
        Object.assign(
          {
            granter,
            grantee,
            msg_type_url: msgTypeUrl,
          },
          params
        )
      )
      .then((d) => [d.grants.map(AuthorizationGrant.fromData), d.pagination])
  }

  /**
   * get list of `GrantAuthorization`, granted by granter.
   */
  public async granter(
    granter: AccAddress,
    params: APIParams = {}
  ): Promise<[AuthorizationGrant[], Pagination]> {
    return this.c
      .get<{
        grants: AuthorizationGrant.Data[]
        pagination: Pagination
      }>(`/cosmos/authz/v1beta1/grants/granter/${granter}`, params)
      .then((d) => [
        d.grants.map((g) => AuthorizationGrant.fromData(g)),
        d.pagination,
      ])
  }

  /**
   * get list of `GrantAuthorization`, by grantee.
   */
  public async grantee(
    grantee: AccAddress,
    params: APIParams = {}
  ): Promise<[AuthorizationGrant[], Pagination]> {
    return this.c
      .get<{
        grants: AuthorizationGrant.Data[]
        pagination: Pagination
      }>(`/cosmos/authz/v1beta1/grants/grantee/${grantee}`, params)
      .then((d) => [
        d.grants.map((g) => AuthorizationGrant.fromData(g)),
        d.pagination,
      ])
  }
}
