import { AccAddress, Allowance } from '../../../core'
import { BaseAPI } from './BaseAPI'
import { APIParams, Pagination, PaginationOptions } from '../APIRequester'

export class FeeGrantAPI extends BaseAPI {
  /**
   * Query all the grants for the given grantee address.
   * @param grantee grantee address to look up
   */
  public async allowances(
    grantee: AccAddress,
    params: Partial<PaginationOptions & APIParams> = {},
    headers: Record<string, string> = {}
  ): Promise<{
    allowances: {
      granter: AccAddress
      grantee: AccAddress
      allowance: Allowance
    }[]
    pagination: Pagination
  }> {
    return this.c
      .get<{
        allowances: {
          granter: AccAddress
          grantee: AccAddress
          allowance: Allowance.Data
        }[]
        pagination: Pagination
      }>(`/cosmos/feegrant/v1beta1/allowances/${grantee}`, params, headers)
      .then((d) => ({
        allowances: d.allowances.map((allowance) => ({
          granter: allowance.granter,
          grantee: allowance.grantee,
          allowance: Allowance.fromData(allowance.allowance),
        })),
        pagination: d.pagination,
      }))
  }

  /**
   * Query the granted allowance to the grantee by the granter.
   * @param granter granter address to look up
   * @param grantee grantee address to look up
   */
  public async allowance(
    granter: AccAddress,
    grantee: AccAddress,
    params: APIParams = {},
    headers: Record<string, string> = {}
  ): Promise<Allowance> {
    return this.c
      .get<{
        allowance: {
          granter: AccAddress
          grantee: AccAddress
          allowance: Allowance.Data
        }
      }>(
        `/cosmos/feegrant/v1beta1/allowance/${granter}/${grantee}`,
        params,
        headers
      )
      .then((d) => Allowance.fromData(d.allowance.allowance))
  }

  /**
   * Query all the grants given by an address.
   * @param granter granter address to look up
   */
  public async allowancesByGranter(
    granter: AccAddress,
    params: Partial<PaginationOptions & APIParams> = {},
    headers: Record<string, string> = {}
  ): Promise<{
    allowances: {
      granter: AccAddress
      grantee: AccAddress
      allowance: Allowance
    }[]
    pagination: Pagination
  }> {
    return this.c
      .get<{
        allowances: {
          granter: AccAddress
          grantee: AccAddress
          allowance: Allowance.Data
        }[]
        pagination: Pagination
      }>(`/cosmos/feegrant/v1beta1/issued/${granter}`, params, headers)
      .then((d) => ({
        allowances: d.allowances.map((allowance) => ({
          granter: allowance.granter,
          grantee: allowance.grantee,
          allowance: Allowance.fromData(allowance.allowance),
        })),
        pagination: d.pagination,
      }))
  }
}
