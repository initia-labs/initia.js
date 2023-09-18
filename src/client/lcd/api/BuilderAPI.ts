import { BuilderParams } from '../../../core';
import { APIParams } from '../APIRequester';
import { BaseAPI } from './BaseAPI';

export class BuilderAPI extends BaseAPI {
  public async parameters(params: APIParams = {}): Promise<BuilderParams> {
    return this.c
      .get<{ params: BuilderParams.Data }>(`/pob/builder/v1/params`, params)
      .then(({ params: d }) => BuilderParams.fromData(d));
  }
}
