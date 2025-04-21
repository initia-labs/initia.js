import { BaseAPI } from './BaseAPI'
import { APIParams, Pagination, PaginationOptions } from '../APIRequester'
import { Evidence } from '../../../core'

export class EvidenceAPI extends BaseAPI {
  /**
   * Query evidences of misbehavior (e.g. equivocation).
   */
  public async evidences(
    params: Partial<PaginationOptions & APIParams> = {},
    headers: Record<string, string> = {}
  ): Promise<[Evidence[], Pagination]> {
    return this.c
      .get<{
        evidence: Evidence.Data[]
        pagination: Pagination
      }>(`/cosmos/evidence/v1beta1/evidence`, params, headers)
      .then((d) => [d.evidence.map(Evidence.fromData), d.pagination])
  }

  /**
   * Query evidence of a given hash.
   * @param hash hash to look up
   */
  public async evidence(
    hash: string,
    params: APIParams = {},
    headers: Record<string, string> = {}
  ): Promise<Evidence> {
    return this.c
      .get<{
        evidence: Evidence.Data
      }>(`/cosmos/evidence/v1beta1/evidence/${hash}`, params, headers)
      .then((d) => Evidence.fromData(d.evidence))
  }
}
