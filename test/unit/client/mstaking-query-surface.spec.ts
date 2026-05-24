import { describe, expect, it } from 'vitest'
import { create } from '@bufbuild/protobuf'
import type { Transport } from '@connectrpc/connect'
import { CoinSchema } from '@buf/cosmos_cosmos-sdk.bufbuild_es/cosmos/base/v1beta1/coin_pb'
import { QueryDelegatorTotalUnbondingBalanceResponseSchema } from '@buf/initia-labs_initia.bufbuild_es/initia/mstaking/v1/query_pb'
import { createClientWithConfig } from '../../../src/client/create-client-initia'
import type { ChainInfo } from '../../../src/provider/types'

describe('mstaking generated query surface', () => {
  it('proxies delegatorTotalUnbondingBalance through the generated Connect client', async () => {
    let capturedMethod: string | undefined
    let capturedInput: unknown

    const transport = {
      async unary(method, _signal, _timeoutMs, _header, input) {
        capturedMethod = method.localName
        capturedInput = input
        return {
          stream: false,
          service: method.parent,
          method,
          header: new Headers(),
          trailer: new Headers(),
          message: create(QueryDelegatorTotalUnbondingBalanceResponseSchema, {
            balance: [create(CoinSchema, { denom: 'uinit', amount: '123' })],
          }),
        }
      },
      async stream() {
        throw new Error('stream should not be called')
      },
    } as Transport
    const chainInfo: ChainInfo = {
      chainId: 'initiation-2',
      chainName: 'Initia',
      chainType: 'initia',
      network: 'local',
    }

    const client = createClientWithConfig(chainInfo, transport)
    const response = await client.mstaking.delegatorTotalUnbondingBalance({
      delegatorAddr: 'init1delegator',
    })

    expect(capturedMethod).toBe('delegatorTotalUnbondingBalance')
    expect(capturedInput).toMatchObject({ delegatorAddr: 'init1delegator' })
    expect(response.balance.map(({ denom, amount }) => ({ denom, amount }))).toEqual([
      { denom: 'uinit', amount: '123' },
    ])
  })
})
