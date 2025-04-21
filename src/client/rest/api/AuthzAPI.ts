import { AccAddress, AuthorizationGrant } from '../../../core'
import { BaseAPI } from './BaseAPI'
import { APIParams, Pagination } from '../APIRequester'

export class AuthzAPI extends BaseAPI {
  /**
   * Query the message authorization grants for a specific granter and grantee.
   * @param granter address of granter
   * @param grantee address of grantee
   * @param msg_type_url type url of msg
   */
  public async grants(
    granter: AccAddress,
    grantee: AccAddress,
    msg_type_url?: string,
    params: APIParams = {},
    headers: Record<string, string> = {}
  ): Promise<[AuthorizationGrant[], Pagination]> {
    return this.c
      .get<{ grants: AuthorizationGrant.Data[]; pagination: Pagination }>(
        `/cosmos/authz/v1beta1/grants`,
        Object.assign(
          {
            granter,
            grantee,
            msg_type_url,
          },
          params,
          headers
        )
      )
      .then((d) => [d.grants.map(AuthorizationGrant.fromData), d.pagination])
  }

  /**
   * Query the list of `AuthorizationGrant`, granted by granter.
   * @param granter address of granter
   */
  public async granter(
    granter: AccAddress,
    params: APIParams = {},
    headers: Record<string, string> = {}
  ): Promise<[AuthorizationGrant[], Pagination]> {
    return this.c
      .get<{
        grants: AuthorizationGrant.Data[]
        pagination: Pagination
      }>(`/cosmos/authz/v1beta1/grants/granter/${granter}`, params, headers)
      .then((d) => [
        d.grants.map((g) => AuthorizationGrant.fromData(g)),
        d.pagination,
      ])
  }

  /**
   * Query the list of `AuthorizationGrant`, by grantee.
   * @param grantee address of grantee
   */
  public async grantee(
    grantee: AccAddress,
    params: APIParams = {},
    headers: Record<string, string> = {}
  ): Promise<[AuthorizationGrant[], Pagination]> {
    return this.c
      .get<{
        grants: AuthorizationGrant.Data[]
        pagination: Pagination
      }>(`/cosmos/authz/v1beta1/grants/grantee/${grantee}`, params, headers)
      .then((d) => [
        d.grants.map((g) => AuthorizationGrant.fromData(g)),
        d.pagination,
      ])
  }
}
