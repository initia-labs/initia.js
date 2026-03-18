/**
 * Unit tests for Bridge — Router integration.
 *
 * Tests:
 * - Router unavailable: all router methods throw InitiaError
 * - Router available: methods delegate to RouterClient (via fetch mock)
 * - signOpHook: signs hook data and returns SignedOpHook
 */

import { describe, it, expect, vi, beforeEach } from 'vitest'
import { Bridge } from '../../../src/bridge/bridge'
import { InitiaError } from '../../../src/errors'
import type { ChainInfo, ChainInfoProvider } from '../../../src/provider/types'

const ROUTER_URL = 'https://router.test.initia.xyz'

function createMockProvider(chains: ChainInfo[]): ChainInfoProvider {
  const map = new Map(chains.map(c => [c.chainId, c]))
  return {
    getChainInfo: (id: string) => map.get(id) as any,
    listChains: () => chains,
    hasChain: (id: string) => map.has(id),
  }
}

const l1Chain: ChainInfo = {
  chainId: 'initiation-2',
  chainName: 'Initia Testnet',
  chainType: 'initia',
  network: 'testnet',
}

const mockCreateTransport = (() => ({})) as any
const provider = createMockProvider([l1Chain])

// =============================================================================
// Router unavailable
// =============================================================================

describe('Bridge: router unavailable', () => {
  const bridge = new Bridge(provider, mockCreateTransport) // no routerUrl

  it('route() should throw InitiaError', () => {
    expect(() =>
      bridge.route({
        amount: '1',
        source: { chainId: 'a', denom: 'b' },
        dest: { chainId: 'c', denom: 'd' },
      })
    ).toThrow(InitiaError)
  })

  it('buildTransferMsgs() should throw InitiaError', () => {
    expect(() => bridge.buildTransferMsgs({ route: {} as any, addresses: [] })).toThrow(InitiaError)
  })

  it('getOpHook() should throw InitiaError', () => {
    expect(() =>
      bridge.getOpHook({
        sourceAddress: 'a',
        sourceChainId: 'b',
        sourceDenom: 'c',
        destAddress: 'd',
        destChainId: 'e',
        destDenom: 'f',
      })
    ).toThrow(InitiaError)
  })

  it('trackTransfer() should throw InitiaError', () => {
    expect(() => bridge.trackTransfer('0x1', 'chain-1')).toThrow(InitiaError)
  })

  it('getTransferStatus() should throw InitiaError', () => {
    expect(() => bridge.getTransferStatus('0x1', 'chain-1')).toThrow(InitiaError)
  })

  it('error message should indicate router unavailability', () => {
    expect(() =>
      bridge.route({
        amount: '1',
        source: { chainId: 'a', denom: 'b' },
        dest: { chainId: 'c', denom: 'd' },
      })
    ).toThrow('Router API not available')
  })
})

// =============================================================================
// Router available — delegates to RouterClient
// =============================================================================

describe('Bridge: router available', () => {
  let bridge: Bridge
  let mockFetch: ReturnType<typeof vi.fn>

  beforeEach(() => {
    vi.clearAllMocks()
    mockFetch = vi.fn()
    vi.stubGlobal('fetch', mockFetch)
    bridge = new Bridge(provider, mockCreateTransport, ROUTER_URL)
  })

  it('route() should call RouterClient.route()', async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: () =>
        Promise.resolve({
          amount_in: '100',
          amount_out: '99',
          source_asset_chain_id: 'a',
          source_asset_denom: 'b',
          dest_asset_chain_id: 'c',
          dest_asset_denom: 'd',
          operations: [],
        }),
    })

    const route = await bridge.route({
      amount: '100',
      source: { chainId: 'a', denom: 'b' },
      dest: { chainId: 'c', denom: 'd' },
    })

    expect(route.amountIn).toBe('100')
    expect(mockFetch).toHaveBeenCalledOnce()
    expect(mockFetch.mock.calls[0][0]).toContain('/v2/fungible/route')
  })

  it('buildTransferMsgs() should call RouterClient.msgs()', async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: () => Promise.resolve({ txs: [] }),
    })

    const txs = await bridge.buildTransferMsgs({
      route: { _raw: { operations: [] } } as any,
      addresses: ['init1abc'],
    })

    expect(txs).toEqual([])
    expect(mockFetch.mock.calls[0][0]).toContain('/v2/fungible/msgs')
  })

  it('trackTransfer() should call RouterClient.track()', async () => {
    mockFetch.mockResolvedValueOnce({ ok: true, json: () => Promise.resolve({}) })

    await bridge.trackTransfer('0xabc', 'chain-1')

    expect(mockFetch.mock.calls[0][0]).toContain('/v2/tx/track')
  })

  it('getTransferStatus() should call RouterClient.status()', async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: () =>
        Promise.resolve({
          state: 'STATE_COMPLETED_SUCCESS',
          transfers: [],
          transfer_sequence: [],
        }),
    })

    const status = await bridge.getTransferStatus('0xabc', 'chain-1')

    expect(status.state).toBe('STATE_COMPLETED_SUCCESS')
    expect(mockFetch.mock.calls[0][0]).toContain('/v2/tx/status')
  })
})

// =============================================================================
// signOpHook
// =============================================================================
// Note: signOpHook now builds a full Cosmos TxRaw (requires gRPC account query
// and type registry resolution). Unit testing requires mocking the L2 gRPC client,
// which is covered by integration tests. The old unit tests tested the previous
// (broken) implementation that produced raw signatures instead of TxRaw.
