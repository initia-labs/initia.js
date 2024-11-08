import { BaseAPI } from './BaseAPI'
import { APIParams, Pagination, PaginationOptions } from '../APIRequester'
import {
  OphostParams,
  Output,
  BridgeInfo,
  BatchInfoWithOutput,
} from '../../../core'

export interface TokenPair {
  l1_denom: string
  l2_denom: string
}

export interface OutputInfo {
  bridge_id?: number
  output_index: number
  output_proposal: Output
}

export namespace OutputInfo {
  export interface Data {
    bridge_id?: string
    output_index: string
    output_proposal: Output.Data
  }
}

export class OphostAPI extends BaseAPI {
  /**
   * Query all bridge infos.
   */
  public async bridgeInfos(
    params: Partial<PaginationOptions & APIParams> = {}
  ): Promise<[BridgeInfo[], Pagination]> {
    return this.c
      .get<{
        bridges: BridgeInfo.Data[]
        pagination: Pagination
      }>(`/opinit/ophost/v1/bridges`, params)
      .then((d) => [d.bridges.map(BridgeInfo.fromData), d.pagination])
  }

  /**
   * Query bridge info of the given bridge id.
   * @param bridge_id unique bridge identifier
   */
  public async bridgeInfo(
    bridge_id: number,
    params: APIParams = {}
  ): Promise<BridgeInfo> {
    return this.c
      .get<BridgeInfo.Data>(`/opinit/ophost/v1/bridges/${bridge_id}`, params)
      .then((d) => BridgeInfo.fromData(d))
  }

  /**
   * Query all (l1 denom, l2 denom) pairs of given bridge id.
   * @param bridge_id unique bridge identifier
   */
  public async tokenPairs(
    bridge_id: number,
    params: Partial<PaginationOptions & APIParams> = {}
  ): Promise<[TokenPair[], Pagination]> {
    return this.c
      .get<{
        token_pairs: TokenPair[]
        pagination: Pagination
      }>(`/opinit/ophost/v1/bridges/${bridge_id}/token_pairs`, params)
      .then((d) => [d.token_pairs, d.pagination])
  }

  /**
   * Query token pair of given bridge id and l1 denom.
   * @param bridge_id unique bridge identifier
   * @param l1_denom l1 denom
   */
  public async tokenPairByL1Denom(
    bridge_id: number,
    l1_denom: string,
    params: APIParams = {}
  ): Promise<TokenPair> {
    return this.c
      .get<{
        token_pair: TokenPair
      }>(`/opinit/ophost/v1/bridges/${bridge_id}/token_pairs/by_l1_denom`, {
        ...params,
        l1_denom,
      })
      .then((d) => d.token_pair)
  }

  /**
   * Query token pair of given bridge id and l2 denom.
   * @param bridge_id unique bridge identifier
   * @param l2_denom l2 denom
   */
  public async tokenPairByL2Denom(
    bridge_id: number,
    l2_denom: string,
    params: APIParams = {}
  ): Promise<TokenPair> {
    return this.c
      .get<{
        token_pair: TokenPair
      }>(`/opinit/ophost/v1/bridges/${bridge_id}/token_pairs/by_l2_denom`, {
        ...params,
        l2_denom,
      })
      .then((d) => d.token_pair)
  }

  /**
   * Query the last finalized output.
   * @param bridge_id unique bridge identifier
   */
  public async lastFinalizedOutput(
    bridge_id: number,
    params: Partial<PaginationOptions & APIParams> = {}
  ): Promise<OutputInfo> {
    return this.c
      .get<OutputInfo.Data>(
        `/opinit/ophost/v1/bridges/${bridge_id}/last_finalized_output`,
        params
      )
      .then((d) => ({
        output_index: parseInt(d.output_index),
        output_proposal: Output.fromData(d.output_proposal),
      }))
  }

  /**
   * Query all the output proposals.
   * @param bridge_id unique bridge identifier
   */
  public async outputInfos(
    bridge_id: number,
    params: Partial<PaginationOptions & APIParams> = {}
  ): Promise<[OutputInfo[], Pagination]> {
    return this.c
      .get<{
        output_proposals: OutputInfo.Data[]
        pagination: Pagination
      }>(`/opinit/ophost/v1/bridges/${bridge_id}/outputs`, params)
      .then((d) => [
        d.output_proposals.map((info) => ({
          bridge_id: parseInt(info.bridge_id ?? `${bridge_id}`),
          output_index: parseInt(info.output_index),
          output_proposal: Output.fromData(info.output_proposal),
        })),
        d.pagination,
      ])
  }

  /**
   * Query the output proposal by output index.
   * @param bridge_id unique bridge identifier
   * @param output_index output index
   */
  public async outputInfo(
    bridge_id: number,
    output_index: number,
    params: APIParams = {}
  ): Promise<OutputInfo> {
    return this.c
      .get<OutputInfo.Data>(
        `/opinit/ophost/v1/bridges/${bridge_id}/outputs/${output_index}`,
        params
      )
      .then((d) => ({
        bridge_id: parseInt(d.bridge_id ?? `${bridge_id}`),
        output_index: parseInt(d.output_index),
        output_proposal: Output.fromData(d.output_proposal),
      }))
  }

  /**
   * Query whether the output is claimed.
   * @param bridge_id unique bridge identifier
   * @param withdrawal_hash withdrawal hash
   */
  public async withdrawalClaimed(
    bridge_id: number,
    withdrawal_hash: string,
    params: APIParams = {}
  ): Promise<boolean> {
    return this.c
      .get<{
        claimed: boolean
      }>(`/opinit/ophost/v1/bridges/${bridge_id}/withdrawals/claimed/by_hash`, {
        ...params,
        withdrawal_hash: Buffer.from(withdrawal_hash, 'hex').toString('base64'),
      })
      .then((d) => d.claimed)
  }

  /**
   * Query the next l1 sequence number.
   * @param bridge_id unique bridge identifier
   */
  public async nextL1Sequence(
    bridge_id: number,
    params: APIParams = {}
  ): Promise<number> {
    return this.c
      .get<{
        next_l1_sequence: string
      }>(`/opinit/ophost/v1/bridges/${bridge_id}/next_l1_sequence`, params)
      .then((d) => parseInt(d.next_l1_sequence))
  }

  /**
   * Query all the batch infos.
   * @param bridge_id unique bridge identifier
   */
  public async batchInfos(
    bridge_id: number,
    params: Partial<PaginationOptions & APIParams> = {}
  ): Promise<[BatchInfoWithOutput[], Pagination]> {
    return this.c
      .get<{
        batch_infos: BatchInfoWithOutput.Data[]
        pagination: Pagination
      }>(`/opinit/ophost/v1/bridges/${bridge_id}/batch_infos`, params)
      .then((d) => [
        d.batch_infos.map((info) => BatchInfoWithOutput.fromData(info)),
        d.pagination,
      ])
  }

  /**
   * Query the parameters of the ophost module.
   */
  public async parameters(params: APIParams = {}): Promise<OphostParams> {
    return this.c
      .get<{ params: OphostParams.Data }>(`/opinit/ophost/v1/params`, params)
      .then((d) => OphostParams.fromData(d.params))
  }
}
