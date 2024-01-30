import { BaseAPI } from './BaseAPI';
import { IbcFetchpriceParams } from '../../../core';
import { APIParams } from '../APIRequester';

export class IbcFetchpriceAPI extends BaseAPI {
  public async parameters(
    params: APIParams = {}
  ): Promise<IbcFetchpriceParams> {
    return this.c
      .get<{ params: IbcFetchpriceParams.Data }>(
        `/ibc/apps/fetchprice/v1/params`,
        params
      )
      .then(d => IbcFetchpriceParams.fromData(d.params));
  }
}
