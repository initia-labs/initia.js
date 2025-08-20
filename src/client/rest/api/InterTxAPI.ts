import { AccAddress } from '../../../core'
import { BaseAPI } from './BaseAPI'
import { APIParams } from '../APIRequester'

export class InterTxAPI extends BaseAPI {
  /**
   * Query the interchain account for given owner address on a given connection pair.
   * @param owner owner address
   * @param connection_id unique connection identifier
   */
  public async interchainAccount(
    owner: AccAddress,
    connection_id: string,
    params: APIParams = {},
    headers: Record<string, string> = {}
  ): Promise<string> {
    return this.c
      .get<{
        interchain_account_address: string
      }>(
        `/inter-tx/interchain_account/owner/${owner}/connection/${connection_id}`,
        params,
        headers
      )
      .then((d) => d.interchain_account_address)
  }
}
