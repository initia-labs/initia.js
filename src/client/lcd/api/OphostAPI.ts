import { BaseAPI } from './BaseAPI';
import { APIParams, Pagination, PaginationOptions } from '../APIRequester';
import { OphostParams, BridgeConfig, AccAddress, Output } from '../../../core';

export interface TokenPair {
  l1_denom: string;
  l2_denom: string;
}

export interface BridgeInfo {
  bridge_id: number;
  bridge_addr: AccAddress;
  bridge_config: BridgeConfig;
}

export namespace BridgeInfo {
  export interface Data {
    bridge_id: string;
    bridge_addr: AccAddress;
    bridge_config: BridgeConfig.Data;
  }
}

export interface OutputInfo {
  bridge_id?: number;
  output_index: number;
  output_proposal: Output;
}

export namespace OutputInfo {
  export interface Data {
    bridge_id?: string;
    output_index: string;
    output_proposal: Output.Data;
  }
}

export class OphostAPI extends BaseAPI {
  public async bridgeInfos(
    params: Partial<PaginationOptions & APIParams> = {}
  ): Promise<[BridgeInfo[], Pagination]> {
    return this.c
      .get<{
        bridges: BridgeInfo.Data[];
        pagination: Pagination;
      }>(`/opinit/ophost/v1/bridges`, params)
      .then(d => [
        d.bridges.map(info => ({
          bridge_id: Number.parseInt(info.bridge_id),
          bridge_addr: info.bridge_addr,
          bridge_config: BridgeConfig.fromData(info.bridge_config),
        })),
        d.pagination,
      ]);
  }

  public async bridgeInfo(
    bridgeId: number,
    params: APIParams = {}
  ): Promise<BridgeInfo> {
    return this.c
      .get<BridgeInfo.Data>(`/opinit/ophost/v1/bridges/${bridgeId}`, params)
      .then(d => ({
        bridge_id: Number.parseInt(d.bridge_id),
        bridge_addr: d.bridge_addr,
        bridge_config: BridgeConfig.fromData(d.bridge_config),
      }));
  }

  public async tokenPairs(
    bridgeId: number,
    params: Partial<PaginationOptions & APIParams> = {}
  ): Promise<[TokenPair[], Pagination]> {
    return this.c
      .get<{
        token_pairs: TokenPair[];
        pagination: Pagination;
      }>(`/opinit/ophost/v1/bridges/${bridgeId}/token_pairs`, params)
      .then(d => [d.token_pairs, d.pagination]);
  }

  public async tokenPairByL1Denom(
    bridgeId: number,
    l1Denom: string,
    params: APIParams = {}
  ): Promise<TokenPair> {
    return this.c
      .get<{ token_pair: TokenPair }>(
        `/opinit/ophost/v1/bridges/${bridgeId}/token_pairs/by_l1_denom`,
        { ...params, l1_denom: l1Denom }
      )
      .then(d => d.token_pair);
  }

  public async tokenPairByL2Denom(
    bridgeId: number,
    l2Denom: string,
    params: APIParams = {}
  ): Promise<TokenPair> {
    return this.c
      .get<{ token_pair: TokenPair }>(
        `/opinit/ophost/v1/bridges/${bridgeId}/token_pairs/by_l2_denom`,
        { ...params, l2_denom: l2Denom }
      )
      .then(d => d.token_pair);
  }

  public async lastFinalizedOutput(
    bridgeId: number,
    params: Partial<PaginationOptions & APIParams> = {}
  ): Promise<OutputInfo> {
    return this.c
      .get<OutputInfo.Data>(
        `/opinit/ophost/v1/bridges/${bridgeId}/last_finalized_output`,
        params
      )
      .then(d => ({
        output_index: Number.parseInt(d.output_index),
        output_proposal: Output.fromData(d.output_proposal),
      }));
  }

  public async outputInfos(
    bridgeId: number,
    params: Partial<PaginationOptions & APIParams> = {}
  ): Promise<[OutputInfo[], Pagination]> {
    return this.c
      .get<{
        output_proposals: OutputInfo.Data[];
        pagination: Pagination;
      }>(`/opinit/ophost/v1/bridges/${bridgeId}/outputs`, params)
      .then(d => [
        d.output_proposals.map(info => ({
          bridge_id: Number.parseInt(info.bridge_id ?? `${bridgeId}`),
          output_index: Number.parseInt(info.output_index),
          output_proposal: Output.fromData(info.output_proposal),
        })),
        d.pagination,
      ]);
  }

  public async outputInfo(
    bridgeId: number,
    outputIndex: number,
    params: APIParams = {}
  ): Promise<OutputInfo> {
    return this.c
      .get<OutputInfo.Data>(
        `/opinit/ophost/v1/bridges/${bridgeId}/outputs/${outputIndex}`,
        params
      )
      .then(d => ({
        bridge_id: Number.parseInt(d.bridge_id ?? `${bridgeId}`),
        output_index: Number.parseInt(d.output_index),
        output_proposal: Output.fromData(d.output_proposal),
      }));
  }

  public async parameters(params: APIParams = {}): Promise<OphostParams> {
    return this.c
      .get<{ params: OphostParams.Data }>(`/opinit/opchild/v1/params`, params)
      .then(d => OphostParams.fromData(d.params));
  }
}
