import { AccAddress } from '../../../core'
import { BaseAPI } from './BaseAPI'

export class InterTxAPI extends BaseAPI {
  public async interchainAccount(
    owner: AccAddress,
    connection_id: string
  ): Promise<string> {
    return this.c
      .get<{
        interchain_account_address: string
      }>(
        `/inter-tx/interchain_account/owner/${owner}/connection/${connection_id}`
      )
      .then((d) => d.interchain_account_address)
  }
}
