/**
 * Unit tests for RouterClient.
 *
 * Mocks globalThis.fetch to verify:
 * - snake_case → camelCase normalization
 * - _raw preservation for route roundtrip
 * - Correct request body construction
 * - Error handling
 */

import { describe, it, expect, vi, beforeEach } from 'vitest'
import { RouterClient } from '../../../src/bridge/router-client'
import { Message } from '../../../src/msgs/types'
import { InitiaError } from '../../../src/errors'

const BASE_URL = 'https://router.test.initia.xyz'

// =============================================================================
// Mock helpers
// =============================================================================

function jsonResponse(data: unknown, ok = true, status = 200) {
  return {
    ok,
    status,
    statusText: ok ? 'OK' : 'Bad Request',
    json: () => Promise.resolve(data),
  }
}

// =============================================================================
// Test fixtures
// =============================================================================

const ROUTE_RESPONSE = {
  amount_in: '1000000',
  amount_out: '990000',
  source_asset_chain_id: 'evm-1',
  source_asset_denom: 'uinit',
  source_asset_symbol: 'INIT',
  dest_asset_chain_id: 'initiation-2',
  dest_asset_denom: 'uinit',
  dest_asset_symbol: 'INIT',
  operations: [
    {
      type: 'transfer',
      chain_id: 'evm-1',
      channel: 'channel-0',
      denom_in: 'uinit',
      denom_out: 'uinit',
    },
  ],
  estimated_duration_seconds: 60,
  usd_amount_in: '1.00',
  usd_amount_out: '0.99',
  warnings: ['test warning'],
  required_op_hook: false,
  extra_field: 'should be preserved in _raw',
}

const MSGS_RESPONSE = {
  txs: [
    {
      chain_id: 'evm-1',
      cosmos_tx: {
        msgs: [
          {
            msg_type_url: '/ibc.applications.transfer.v1.MsgTransfer',
            msg: 'AQIDBA==', // base64 of [1,2,3,4]
          },
        ],
      },
      signer_address: 'init1abc',
    },
  ],
}

const OP_HOOK_RESPONSE = {
  chain_id: 'evm-1',
  hook: ['hook_data_1', 'hook_data_2'],
}

const STATUS_RESPONSE = {
  state: 'STATE_COMPLETED_SUCCESS',
  transfers: [],
  transfer_sequence: [
    { src_chain_id: 'initiation-2', dst_chain_id: 'evm-1', state: 'TRANSFER_SUCCESS' },
  ],
  next_blocking_transfer: null,
  transfer_asset_release: null,
  error: null,
}

// =============================================================================
// Tests
// =============================================================================

describe('RouterClient', () => {
  let client: RouterClient
  let mockFetch: ReturnType<typeof vi.fn>

  beforeEach(() => {
    vi.clearAllMocks()
    mockFetch = vi.fn()
    vi.stubGlobal('fetch', mockFetch)
    client = new RouterClient(BASE_URL)
  })

  // =========================================================================
  // route()
  // =========================================================================

  describe('route()', () => {
    it('should normalize snake_case response to camelCase', async () => {
      mockFetch.mockResolvedValueOnce(jsonResponse(ROUTE_RESPONSE))

      const route = await client.route({
        amount: '1000000',
        source: { chainId: 'evm-1', denom: 'uinit' },
        dest: { chainId: 'initiation-2', denom: 'uinit' },
      })

      expect(route.amountIn).toBe('1000000')
      expect(route.amountOut).toBe('990000')
      expect(route.source.chainId).toBe('evm-1')
      expect(route.source.symbol).toBe('INIT')
      expect(route.dest.chainId).toBe('initiation-2')
      expect(route.estimatedDurationSeconds).toBe(60)
      expect(route.usdAmountIn).toBe('1.00')
      expect(route.warnings).toEqual(['test warning'])
      expect(route.requiresOpHook).toBe(false)
    })

    it('should normalize operations', async () => {
      mockFetch.mockResolvedValueOnce(jsonResponse(ROUTE_RESPONSE))

      const route = await client.route({
        amount: '1000000',
        source: { chainId: 'evm-1', denom: 'uinit' },
        dest: { chainId: 'initiation-2', denom: 'uinit' },
      })

      expect(route.operations).toHaveLength(1)
      expect(route.operations[0]).toEqual({
        type: 'transfer',
        chainId: 'evm-1',
        channel: 'channel-0',
        denomIn: 'uinit',
        denomOut: 'uinit',
      })
    })

    it('should preserve entire raw response in _raw', async () => {
      mockFetch.mockResolvedValueOnce(jsonResponse(ROUTE_RESPONSE))

      const route = await client.route({
        amount: '1000000',
        source: { chainId: 'evm-1', denom: 'uinit' },
        dest: { chainId: 'initiation-2', denom: 'uinit' },
      })

      // _raw should contain the full original response including unknown fields
      const raw = route._raw as Record<string, unknown>
      expect(raw.amount_in).toBe('1000000')
      expect(raw.operations).toEqual(ROUTE_RESPONSE.operations)
      expect(raw.extra_field).toBe('should be preserved in _raw')
    })

    it('should send correct snake_case request body', async () => {
      mockFetch.mockResolvedValueOnce(jsonResponse(ROUTE_RESPONSE))

      await client.route({
        amount: '1000000',
        source: { chainId: 'evm-1', denom: 'uinit' },
        dest: { chainId: 'initiation-2', denom: 'uinit' },
        allowUnsafe: true,
        goFast: true,
      })

      const [url, opts] = mockFetch.mock.calls[0]
      expect(url).toBe(`${BASE_URL}/v2/fungible/route`)
      expect(opts.method).toBe('POST')

      const body = JSON.parse(opts.body)
      expect(body.amount_in).toBe('1000000')
      expect(body.source_asset_chain_id).toBe('evm-1')
      expect(body.dest_asset_denom).toBe('uinit')
      expect(body.allow_unsafe).toBe(true)
      expect(body.go_fast).toBe(true)
    })
  })

  // =========================================================================
  // msgs()
  // =========================================================================

  describe('msgs()', () => {
    it('should pass _raw.operations verbatim to the API', async () => {
      mockFetch.mockResolvedValueOnce(jsonResponse(MSGS_RESPONSE))

      const fakeRaw = {
        amount_in: '1000000',
        amount_out: '990000',
        source_asset_chain_id: 'evm-1',
        source_asset_denom: 'uinit',
        dest_asset_chain_id: 'initiation-2',
        dest_asset_denom: 'uinit',
        operations: [{ op_type: 'transfer', some_field: 'preserved' }],
      }

      await client.msgs({
        route: { _raw: fakeRaw } as any,
        addresses: ['init1abc', 'init1def'],
        slippageTolerance: '2',
      })

      const body = JSON.parse(mockFetch.mock.calls[0][1].body)
      // operations should be passed as-is from _raw (not re-normalized)
      expect(body.operations).toEqual([{ op_type: 'transfer', some_field: 'preserved' }])
      expect(body.address_list).toEqual(['init1abc', 'init1def'])
      expect(body.slippage_tolerance_percent).toBe('2')
    })

    it('should normalize cosmos msgs with proper Any instances', async () => {
      mockFetch.mockResolvedValueOnce(jsonResponse(MSGS_RESPONSE))

      const txs = await client.msgs({
        route: { _raw: ROUTE_RESPONSE } as any,
        addresses: ['init1abc'],
      })

      expect(txs).toHaveLength(1)
      expect(txs[0].chainId).toBe('evm-1')
      expect(txs[0].signerAddress).toBe('init1abc')
      expect(txs[0].cosmosMsgs).toBeDefined()
      expect(txs[0].cosmosMsgs).toHaveLength(1)

      const msg = txs[0].cosmosMsgs![0]
      expect(msg).toBeInstanceOf(Message)
      const any = msg.toAny()
      expect(any.typeUrl).toBe('/ibc.applications.transfer.v1.MsgTransfer')
      expect(any.value).toBeInstanceOf(Uint8Array)
      expect(any.value).toEqual(new Uint8Array([1, 2, 3, 4]))
    })

    it('should default slippageTolerance to 1%', async () => {
      mockFetch.mockResolvedValueOnce(jsonResponse(MSGS_RESPONSE))

      await client.msgs({
        route: { _raw: ROUTE_RESPONSE } as any,
        addresses: ['init1abc'],
        // no slippageTolerance
      })

      const body = JSON.parse(mockFetch.mock.calls[0][1].body)
      expect(body.slippage_tolerance_percent).toBe('1')
    })
  })

  // =========================================================================
  // opHook()
  // =========================================================================

  describe('opHook()', () => {
    it('should normalize OP Hook response', async () => {
      mockFetch.mockResolvedValueOnce(jsonResponse(OP_HOOK_RESPONSE))

      const result = await client.opHook({
        sourceAddress: 'init1abc',
        sourceChainId: 'evm-1',
        sourceDenom: 'uinit',
        destAddress: 'init1def',
        destChainId: 'initiation-2',
        destDenom: 'uinit',
      })

      expect(result.chainId).toBe('evm-1')
      expect(result.hook).toEqual(['hook_data_1', 'hook_data_2'])
    })

    it('should send correct snake_case body', async () => {
      mockFetch.mockResolvedValueOnce(jsonResponse(OP_HOOK_RESPONSE))

      await client.opHook({
        sourceAddress: 'init1abc',
        sourceChainId: 'evm-1',
        sourceDenom: 'uinit',
        destAddress: 'init1def',
        destChainId: 'initiation-2',
        destDenom: 'uinit',
      })

      const body = JSON.parse(mockFetch.mock.calls[0][1].body)
      expect(body.source_address).toBe('init1abc')
      expect(body.source_asset_chain_id).toBe('evm-1')
      expect(body.dest_address).toBe('init1def')
      expect(body.dest_asset_chain_id).toBe('initiation-2')
    })
  })

  // =========================================================================
  // track()
  // =========================================================================

  describe('track()', () => {
    it('should POST to /v2/tx/track', async () => {
      mockFetch.mockResolvedValueOnce(jsonResponse({}))

      await client.track('0xabc', 'evm-1')

      const [url, opts] = mockFetch.mock.calls[0]
      expect(url).toBe(`${BASE_URL}/v2/tx/track`)
      const body = JSON.parse(opts.body)
      expect(body.tx_hash).toBe('0xabc')
      expect(body.chain_id).toBe('evm-1')
    })
  })

  // =========================================================================
  // status()
  // =========================================================================

  describe('status()', () => {
    it('should GET status with query params', async () => {
      mockFetch.mockResolvedValueOnce(jsonResponse(STATUS_RESPONSE))

      const result = await client.status('0xabc123', 'evm-1')

      expect(result.state).toBe('STATE_COMPLETED_SUCCESS')
      expect(result.transferSequence).toHaveLength(1)
      expect(result.transferSequence[0].srcChainId).toBe('initiation-2')

      // Verify GET request with query params
      const url = mockFetch.mock.calls[0][0] as string
      expect(url).toContain('/v2/tx/status?')
      expect(url).toContain('tx_hash=0xabc123')
      expect(url).toContain('chain_id=evm-1')
    })
  })

  // =========================================================================
  // Error handling
  // =========================================================================

  describe('error handling', () => {
    it('should throw InitiaError on non-ok POST response', async () => {
      mockFetch.mockResolvedValueOnce(jsonResponse(null, false, 400))

      await expect(
        client.route({
          amount: '1000000',
          source: { chainId: 'evm-1', denom: 'uinit' },
          dest: { chainId: 'initiation-2', denom: 'uinit' },
        })
      ).rejects.toThrow(InitiaError)
    })

    it('should throw InitiaError on non-ok GET response', async () => {
      mockFetch.mockResolvedValueOnce(jsonResponse(null, false, 500))

      await expect(client.status('0xabc', 'evm-1')).rejects.toThrow(InitiaError)
    })

    it('should include status code in error message', async () => {
      mockFetch.mockResolvedValueOnce(jsonResponse(null, false, 404))

      await expect(client.track('0xabc', 'evm-1')).rejects.toThrow('Router API')
    })
  })
})
