import { TokenfactoryParams } from '../../../core'
import { APIParams } from '../APIRequester'
import { BaseAPI } from './BaseAPI'

export interface AuthorityMetadata {
  admin: string
}

export class TokenfactoryAPI extends BaseAPI {
  /**
   * Query the authority metadata for a specific denom.
   * @param denom denom to query
   */
  public async authorityMetadata(
    denom: string,
    params: APIParams = {},
    headers: Record<string, string> = {}
  ): Promise<AuthorityMetadata> {
    return this.c
      .get<{
        authority_metadata: AuthorityMetadata
      }>(
        `/miniwasm/tokenfactory/v1/denoms/${denom}/authority_metadata`,
        params,
        headers
      )
      .then((d) => d.authority_metadata)
  }

  /**
   * Query the address registered for the before send hook.
   * @param denom denom to query
   */
  public async beforeSendHookAddr(
    denom: string,
    params: APIParams = {},
    headers: Record<string, string> = {}
  ): Promise<string> {
    return this.c
      .get<{
        cosmwasm_address: string
      }>(
        `/miniwasm/tokenfactory/v1/denoms/${denom}/before_send_hook`,
        params,
        headers
      )
      .then((d) => d.cosmwasm_address)
  }

  /**
   * Query all the denominations created by a specific admin/creator.
   * @param creator creator address
   */
  public async denomsFromCreator(
    creator: string,
    params: APIParams = {},
    headers: Record<string, string> = {}
  ): Promise<string[]> {
    return this.c
      .get<{
        denoms: string[]
      }>(
        `/miniwasm/tokenfactory/v1/denoms_from_creator/${creator}`,
        params,
        headers
      )
      .then((d) => d.denoms)
  }

  /**
   * Query the parameters of the tokenfactory module.
   */
  public async parameters(
    params: APIParams = {},
    headers: Record<string, string> = {}
  ): Promise<TokenfactoryParams> {
    return this.c
      .get<{
        params: TokenfactoryParams.Data
      }>(`/miniwasm/tokenfactory/v1/params`, params, headers)
      .then((d) => TokenfactoryParams.fromData(d.params))
  }
}
