/**
 * Account module - Query and represent on-chain account information.
 */

import type { Numeric } from '../types'
import type { Any } from '@bufbuild/protobuf/wkt'
import { anyIs, anyUnpack } from '@bufbuild/protobuf/wkt'
import { BaseAccountSchema } from '@buf/cosmos_cosmos-sdk.bufbuild_es/cosmos/auth/v1beta1/auth_pb'
import { AccountNotFoundError } from '../errors'

/**
 * On-chain account information.
 */
export interface AccountInfo {
  address: string
  number: bigint
  sequence: bigint
}

/**
 * Minimal client interface for account queries.
 * Compatible with any client that has an auth service.
 */
export interface AuthClient {
  auth: {
    account(
      request: { address: string },
      options?: { height?: Numeric }
    ): Promise<{ account?: Any }>
  }
}

/**
 * Query account information from chain.
 *
 * @param client - gRPC client with auth service
 * @param address - Bech32 address to query
 * @param options - Query options (height for historical query)
 * @returns Account information (address, number, sequence)
 * @throws {AccountNotFoundError} If account doesn't exist on chain
 *
 * @example
 * ```typescript
 * const account = await getAccount(client, 'init1...')
 * console.log('Account number:', account.number)
 * console.log('Sequence:', account.sequence)
 * ```
 */
export async function getAccount(
  client: AuthClient,
  address: string,
  options?: { height?: Numeric }
): Promise<AccountInfo> {
  const queryOptions = options?.height !== undefined ? { height: options.height } : undefined
  const response = await client.auth.account({ address }, queryOptions)

  if (!response.account) {
    throw new AccountNotFoundError(address)
  }

  if (anyIs(response.account, BaseAccountSchema)) {
    const baseAccount = anyUnpack(response.account, BaseAccountSchema)
    if (!baseAccount) {
      throw new AccountNotFoundError(address)
    }

    return {
      address,
      number: baseAccount.accountNumber,
      sequence: baseAccount.sequence,
    }
  }

  // Unsupported account type
  throw new Error(`Unsupported account type: ${response.account.typeUrl}`)
}
