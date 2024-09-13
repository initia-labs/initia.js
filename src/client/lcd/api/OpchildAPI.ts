import { BaseAPI } from './BaseAPI'
import { APIParams, Pagination, PaginationOptions } from '../APIRequester'
import {
  OpValidator,
  ValAddress,
  OpchildParams,
  BridgeInfo,
} from '../../../core'

export class OpchildAPI extends BaseAPI {
  public async validators(
    params: Partial<PaginationOptions & APIParams> = {}
  ): Promise<[OpValidator[], Pagination]> {
    return this.c
      .get<{
        validators: OpValidator.Data[]
        pagination: Pagination
      }>(`/opinit/opchild/v1/validators`, params)
      .then((d) => [d.validators.map(OpValidator.fromData), d.pagination])
  }

  public async validator(
    validatorAddr: ValAddress,
    params: APIParams = {}
  ): Promise<OpValidator> {
    return this.c
      .get<{
        validator: OpValidator.Data
      }>(`/opinit/opchild/v1/validator/${validatorAddr}`, params)
      .then((d) => OpValidator.fromData(d.validator))
  }

  public async bridgeInfo(params: APIParams = {}): Promise<BridgeInfo> {
    return this.c
      .get<{
        bridge_info: BridgeInfo.Data
      }>(`/opinit/opchild/v1/bridge_info`, params)
      .then((d) => BridgeInfo.fromData(d.bridge_info))
  }

  public async nextL1Sequence(params: APIParams = {}): Promise<number> {
    return this.c
      .get<{
        next_l1_sequence: string
      }>(`/opinit/opchild/v1/next_l1_sequence`, params)
      .then((d) => parseInt(d.next_l1_sequence))
  }

  public async nextL2Sequence(params: APIParams = {}): Promise<number> {
    return this.c
      .get<{
        next_l2_sequence: string
      }>(`/opinit/opchild/v1/next_l2_sequence`, params)
      .then((d) => parseInt(d.next_l2_sequence))
  }

  public async baseDenom(
    denom: string,
    params: APIParams = {}
  ): Promise<string> {
    return this.c
      .get<{
        base_denom: string
      }>(`/opinit/opchild/v1/base_denom/${denom}`, params)
      .then((d) => d.base_denom)
  }

  public async parameters(params: APIParams = {}): Promise<OpchildParams> {
    return this.c
      .get<{ params: OpchildParams.Data }>(`/opinit/opchild/v1/params`, params)
      .then((d) => OpchildParams.fromData(d.params))
  }
}
