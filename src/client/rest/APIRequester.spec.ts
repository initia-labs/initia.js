import { describe, it, expect } from 'vitest'
import type { AxiosAdapter } from 'axios'
import { APIRequester } from './APIRequester'

// Resolves with the final request URL instead of sending the request.
const echoUrl: AxiosAdapter = (config) =>
  Promise.resolve({
    data: config.url,
    status: 200,
    statusText: 'OK',
    headers: {},
    config,
  })

const requester = (baseURL = 'https://lcd.test') =>
  new APIRequester(baseURL, { adapter: echoUrl })

describe('APIRequester endpoint validation', () => {
  it.each([
    [
      '/cosmos/bank/v1beta1/balances/init1abc',
      'https://lcd.test/cosmos/bank/v1beta1/balances/init1abc',
    ],
    [
      '/initia/tx/v1/gas_prices/ibc/ABC123',
      'https://lcd.test/initia/tx/v1/gas_prices/ibc/ABC123',
    ],
    [
      '/ibc/apps/transfer/v1/denom_hashes/transfer/channel-0/uinit',
      'https://lcd.test/ibc/apps/transfer/v1/denom_hashes/transfer/channel-0/uinit',
    ],
    [
      '/opinit/opchild/v1/base_denom/l2/a.b..c',
      'https://lcd.test/opinit/opchild/v1/base_denom/l2/a.b..c',
    ],
  ])('keeps the legitimate endpoint %s', async (endpoint, url) => {
    expect(await requester().get(endpoint)).toEqual(url)
  })

  it('keeps a base URL path prefix', async () => {
    expect(
      await requester('https://gw.test/initia-lcd').get(
        '/cosmos/auth/v1beta1/params'
      )
    ).toEqual('https://gw.test/initia-lcd/cosmos/auth/v1beta1/params')
  })

  it.each([
    '/cosmos/wasm/v1/contract/init1a/%2e%2e/init1b',
    '/cosmos/wasm/v1/contract/init1a/%2E%2E/init1b',
    '/cosmos/wasm/v1/contract/init1a/.%2e/init1b',
    '/cosmos/wasm/v1/contract/init1a/%2e./init1b',
    '/cosmos/wasm/v1/contract/init1a/%2e/init1b',
    '/cosmos/wasm/v1/contract/init1a/..',
    '/cosmos/wasm/v1/contract/init1a/.\t./init1b',
    '/cosmos/wasm/v1/contract/init1a\\init1b',
  ])('rejects the dot segment in %j', async (endpoint) => {
    await expect(requester().get(endpoint)).rejects.toThrow(
      'Relative path not allowed'
    )
  })
})
