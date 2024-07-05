import { BaseAPI } from './BaseAPI'
import { APIParams, Pagination, PaginationOptions } from '../APIRequester'
import { Evidence } from '../../../core'

export class EvidenceAPI extends BaseAPI {
  public async evidences(
    params: Partial<PaginationOptions & APIParams> = {}
  ): Promise<[Evidence[], Pagination]> {
    return this.c
      .get<{
        evidence: Evidence.Data[]
        pagination: Pagination
      }>(`/cosmos/evidence/v1beta1/evidence`, params)
      .then((d) => [d.evidence.map(Evidence.fromData), d.pagination])
  }

  public async evidence(
    hash: string,
    params: APIParams = {}
  ): Promise<Evidence> {
    return this.c
      .get<{
        evidence: Evidence.Data
      }>(`/cosmos/evidence/v1beta1/evidence/${hash}`, params)
      .then((d) => Evidence.fromData(d.evidence))
  }
}
