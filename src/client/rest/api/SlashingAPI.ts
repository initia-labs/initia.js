import { BaseAPI } from './BaseAPI'
import {
  ValConsAddress,
  SlashingParams,
  ValidatorSigningInfo,
} from '../../../core'
import { APIParams, Pagination, PaginationOptions } from '../APIRequester'

export class SlashingAPI extends BaseAPI {
  /**
   * Query the signing infos of all validators.
   */
  public async signingInfos(
    params: Partial<PaginationOptions & APIParams> = {},
    headers: Record<string, string> = {}
  ): Promise<[ValidatorSigningInfo[], Pagination]> {
    return this.c
      .get<{
        info: ValidatorSigningInfo.Data[]
        pagination: Pagination
      }>(`/cosmos/slashing/v1beta1/signing_infos`, params, headers)
      .then((d) => [d.info.map(ValidatorSigningInfo.fromData), d.pagination])
  }

  /**
   * Query the signing info of given cons address.
   * @param val_cons_address the address to query signing info of
   */
  public async signingInfo(
    val_cons_address: ValConsAddress,
    params: APIParams = {},
    headers: Record<string, string> = {}
  ): Promise<ValidatorSigningInfo> {
    return this.c
      .get<{
        val_signing_info: ValidatorSigningInfo.Data
      }>(
        `/cosmos/slashing/v1beta1/signing_infos/${val_cons_address}`,
        params,
        headers
      )
      .then((d) => ValidatorSigningInfo.fromData(d.val_signing_info))
  }

  /**
   * Query the parameters of the slashing module.
   */
  public async parameters(
    params: APIParams = {},
    headers: Record<string, string> = {}
  ): Promise<SlashingParams> {
    return this.c
      .get<{
        params: SlashingParams.Data
      }>(`/cosmos/slashing/v1beta1/params`, params, headers)
      .then((d) => SlashingParams.fromData(d.params))
  }
}
