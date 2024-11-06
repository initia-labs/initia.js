import { BaseAPI } from './BaseAPI'
import {
  ValConsAddress,
  SlashingParams,
  ValidatorSigningInfo,
} from '../../../core'
import { APIParams, Pagination } from '../APIRequester'

export class SlashingAPI extends BaseAPI {
  public async signingInfo(
    valConsAddress: ValConsAddress,
    params: APIParams = {}
  ): Promise<ValidatorSigningInfo> {
    return this.c
      .get<{
        val_signing_info: ValidatorSigningInfo.Data
      }>(`/cosmos/slashing/v1beta1/signing_infos/${valConsAddress}`, params)
      .then((d) => ValidatorSigningInfo.fromData(d.val_signing_info))
  }

  public async signingInfos(
    params: APIParams = {}
  ): Promise<[ValidatorSigningInfo[], Pagination]> {
    return this.c
      .get<{
        info: ValidatorSigningInfo.Data[]
        pagination: Pagination
      }>(`/cosmos/slashing/v1beta1/signing_infos`, params)
      .then((d) => [d.info.map(ValidatorSigningInfo.fromData), d.pagination])
  }

  /**
   * Gets the current Slashing module's parameters.
   */
  public async parameters(params: APIParams = {}): Promise<SlashingParams> {
    return this.c
      .get<{
        params: SlashingParams.Data
      }>(`/cosmos/slashing/v1beta1/params`, params)
      .then((d) => SlashingParams.fromData(d.params))
  }
}
