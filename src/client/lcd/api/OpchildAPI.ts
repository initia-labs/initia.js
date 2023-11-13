import { BaseAPI } from './BaseAPI';
import { APIParams, Pagination, PaginationOptions } from '../APIRequester';
import { Validator, ValAddress, OpchildParams } from '../../../core';

export class OpchildAPI extends BaseAPI {
  public async validators(
    params: Partial<PaginationOptions & APIParams> = {}
  ): Promise<[Validator[], Pagination]> {
    return this.c
      .get<{
        validators: Validator.Data[];
        pagination: Pagination;
      }>(`/opinit/opchild/v1/validators`, params)
      .then(d => [d.validators.map(Validator.fromData), d.pagination]);
  }

  public async validator(
    validatorAddr: ValAddress,
    params: APIParams = {}
  ): Promise<Validator> {
    return this.c
      .get<{ validator: Validator.Data }>(
        `/opinit/opchild/v1/validator/${validatorAddr}`,
        params
      )
      .then(d => Validator.fromData(d.validator));
  }

  public async parameters(params: APIParams = {}): Promise<OpchildParams> {
    return this.c
      .get<{ params: OpchildParams.Data }>(`/opinit/opchild/v1/params`, params)
      .then(d => OpchildParams.fromData(d.params));
  }
}
