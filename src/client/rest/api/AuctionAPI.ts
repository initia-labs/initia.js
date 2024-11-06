import { AuctionParams } from '../../../core/auction'
import { APIParams } from '../APIRequester'
import { BaseAPI } from './BaseAPI'

export class AuctionAPI extends BaseAPI {
  public async parameters(params: APIParams = {}): Promise<AuctionParams> {
    return this.c
      .get<{
        params: AuctionParams.Data
      }>(`/block-sdk/auction/v1/params`, params)
      .then((d) => AuctionParams.fromData(d.params))
  }
}
