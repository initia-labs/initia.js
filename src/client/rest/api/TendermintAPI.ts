import { BaseAPI } from './BaseAPI'
import { BlockInfo, ValConsAddress, ValConsPublicKey } from '../../../core'
import { APIParams, Pagination } from '../APIRequester'

export interface DelegateValidator {
  address: ValConsAddress
  pub_key: ValConsPublicKey.Data
  proposer_priority: string
  voting_power: string
}

export class TendermintAPI extends BaseAPI {
  /**
   * Query the node's information.
   */
  public async nodeInfo(
    params: APIParams = {},
    headers: Record<string, string> = {}
  ): Promise<object> {
    return this.c.getRaw(
      `/cosmos/base/tendermint/v1beta1/node_info`,
      params,
      headers
    )
  }

  /**
   * Query the node's chain id.
   */
  public async chainId(
    params: APIParams = {},
    headers: Record<string, string> = {}
  ): Promise<string> {
    return this.c
      .get<{
        default_node_info: { network: string }
      }>(`/cosmos/base/tendermint/v1beta1/node_info`, params, headers)
      .then((res) => res?.default_node_info?.network)
  }

  /**
   * Query whether the node is currently in syncing mode to catch up with blocks.
   */
  public async syncing(
    params: APIParams = {},
    headers: Record<string, string> = {}
  ): Promise<boolean> {
    return this.c
      .getRaw<{
        syncing: boolean
      }>(`/cosmos/base/tendermint/v1beta1/syncing`, params, headers)
      .then((d) => d.syncing)
  }

  /**
   * Query the validator (delegates) set at the specific height. If no height is given, the current set is returned.
   * @param height block height
   */
  public async validatorSet(
    height?: number,
    params: APIParams = {},
    headers: Record<string, string> = {}
  ): Promise<[DelegateValidator[], Pagination]> {
    const url =
      height !== undefined
        ? `/cosmos/base/tendermint/v1beta1/validatorsets/${height}`
        : `/cosmos/base/tendermint/v1beta1/validatorsets/latest`
    return this.c
      .get<{
        block_height: string
        validators: DelegateValidator[]
        pagination: Pagination
      }>(url, params, headers)
      .then((d) => [d.validators, d.pagination])
  }

  /**
   * Query the block information at the specified height. If no height is given, the latest block is returned.
   * @param height block height
   */
  public async blockInfo(
    height?: number,
    params: APIParams = {},
    headers: Record<string, string> = {}
  ): Promise<BlockInfo> {
    const url =
      height !== undefined
        ? `/cosmos/base/tendermint/v1beta1/blocks/${height}`
        : `/cosmos/base/tendermint/v1beta1/blocks/latest`
    return this.c.getRaw<BlockInfo>(url, params, headers)
  }
}
