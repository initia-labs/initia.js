import { AuctionParams } from '../../../core/auction'
import { APIParams } from '../APIRequester'
import { BaseAPI } from './BaseAPI'

export class AuctionAPI extends BaseAPI {
  /**
   * Query the parameters of the auction module.
   */
  public async parameters(
    params: APIParams = {},
    headers: Record<string, string> = {}
  ): Promise<AuctionParams> {
    return this.c
      .get<{
        params: AuctionParams.Data
      }>(`/block-sdk/auction/v1/params`, params, headers)
      .then((d) => AuctionParams.fromData(d.params))
  }
}
