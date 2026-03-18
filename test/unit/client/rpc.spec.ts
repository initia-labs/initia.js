import { describe, it, expect, vi, beforeEach } from 'vitest'

// Mock http-client before import
vi.mock('../../../src/client/http-client', () => ({
  httpRequest: vi.fn(),
}))

import { RpcClient, createRpcClient } from '../../../src/client/rpc'
import { httpRequest } from '../../../src/client/http-client'

const mockHttpRequest = vi.mocked(httpRequest)

function mockJsonRpcResponse<T>(result: T): Response {
  return {
    ok: true,
    json: () => Promise.resolve({ jsonrpc: '2.0', id: -1, result }),
  } as unknown as Response
}

function mockErrorResponse(code: number, message: string): Response {
  return {
    ok: true,
    json: () => Promise.resolve({ jsonrpc: '2.0', id: -1, error: { code, message } }),
  } as unknown as Response
}

describe('RpcClient', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('factory', () => {
    it('should create client with createRpcClient', () => {
      const client = createRpcClient('https://rpc.initia.xyz')
      expect(client).toBeInstanceOf(RpcClient)
    })
  })

  describe('status', () => {
    it('should query /status', async () => {
      const statusResult = {
        node_info: { network: 'interwoven-1' },
        sync_info: { latest_block_height: '14107946', catching_up: false },
      }
      mockHttpRequest.mockResolvedValueOnce(mockJsonRpcResponse(statusResult))

      const client = createRpcClient('https://rpc.initia.xyz')
      const result = await client.status()

      expect(mockHttpRequest).toHaveBeenCalledWith(
        expect.objectContaining({ endpoint: 'https://rpc.initia.xyz' }),
        '/status',
        expect.objectContaining({ method: 'GET' }),
        undefined
      )
      expect(result.sync_info.latest_block_height).toBe('14107946')
    })
  })

  describe('blockResults', () => {
    it('should query /block_results with height', async () => {
      const blockResult = {
        height: '14107946',
        txs_results: [
          { code: 0, gas_wanted: '200000', gas_used: '100000', events: [] },
        ],
        finalize_block_events: [
          { type: 'commission', attributes: [{ key: 'amount', value: '100uinit' }] },
        ],
        validator_updates: null,
        consensus_param_updates: null,
        app_hash: 'ABCDEF',
      }
      mockHttpRequest.mockResolvedValueOnce(mockJsonRpcResponse(blockResult))

      const client = createRpcClient('https://rpc.initia.xyz')
      const result = await client.blockResults(14107946)

      expect(mockHttpRequest).toHaveBeenCalledWith(
        expect.anything(),
        '/block_results?height=14107946',
        expect.objectContaining({ method: 'GET' }),
        undefined
      )
      expect(result.txs_results).toHaveLength(1)
      expect(result.finalize_block_events).toHaveLength(1)
    })

    it('should query latest block_results without height', async () => {
      mockHttpRequest.mockResolvedValueOnce(
        mockJsonRpcResponse({ height: '14107946', txs_results: null })
      )

      const client = createRpcClient('https://rpc.initia.xyz')
      await client.blockResults()

      expect(mockHttpRequest).toHaveBeenCalledWith(
        expect.anything(),
        '/block_results',
        expect.objectContaining({ method: 'GET' }),
        undefined
      )
    })
  })

  describe('tx', () => {
    it('should query /tx with hash', async () => {
      const txResult = {
        hash: '6E7457469F14FDA524617756C7F7E2F16ADA61537179C2028E3E1F87AF00CD67',
        height: '14107791',
        index: 1,
        tx_result: { code: 0, gas_wanted: '322204', gas_used: '162827', events: [] },
        tx: 'base64encodedtx...',
      }
      mockHttpRequest.mockResolvedValueOnce(mockJsonRpcResponse(txResult))

      const client = createRpcClient('https://rpc.initia.xyz')
      const result = await client.tx('6E7457469F14FDA524617756C7F7E2F16ADA61537179C2028E3E1F87AF00CD67')

      expect(mockHttpRequest).toHaveBeenCalledWith(
        expect.anything(),
        '/tx?hash=0x6E7457469F14FDA524617756C7F7E2F16ADA61537179C2028E3E1F87AF00CD67',
        expect.objectContaining({ method: 'GET' }),
        undefined
      )
      expect(result.index).toBe(1)
      expect(result.tx_result.code).toBe(0)
    })

    it('should handle 0x-prefixed hash', async () => {
      mockHttpRequest.mockResolvedValueOnce(
        mockJsonRpcResponse({ hash: 'ABC', height: '1', index: 0, tx_result: { code: 0 }, tx: '' })
      )

      const client = createRpcClient('https://rpc.initia.xyz')
      await client.tx('0xABC')

      expect(mockHttpRequest).toHaveBeenCalledWith(
        expect.anything(),
        '/tx?hash=0xABC',
        expect.anything(),
        undefined
      )
    })
  })

  describe('block', () => {
    it('should query /block with height', async () => {
      const blockData = {
        block_id: { hash: 'AABB' },
        block: {
          header: { height: '14107946', chain_id: 'interwoven-1' },
          data: { txs: [] },
        },
      }
      mockHttpRequest.mockResolvedValueOnce(mockJsonRpcResponse(blockData))

      const client = createRpcClient('https://rpc.initia.xyz')
      const result = await client.block(14107946)

      expect(mockHttpRequest).toHaveBeenCalledWith(
        expect.anything(),
        '/block?height=14107946',
        expect.objectContaining({ method: 'GET' }),
        undefined
      )
      expect(result.block.header.height).toBe('14107946')
    })
  })

  describe('txSearch', () => {
    it('should query /tx_search with event query', async () => {
      const searchResult = {
        txs: [
          {
            hash: 'ABC',
            height: '100',
            index: 0,
            tx_result: { code: 0, events: [] },
            tx: 'base64...',
          },
        ],
        total_count: '1',
      }
      mockHttpRequest.mockResolvedValueOnce(mockJsonRpcResponse(searchResult))

      const client = createRpcClient('https://rpc.initia.xyz')
      const result = await client.txSearch("tx.height=100")

      expect(mockHttpRequest).toHaveBeenCalledWith(
        expect.anything(),
        expect.stringContaining('/tx_search?query='),
        expect.objectContaining({ method: 'GET' }),
        undefined
      )
      expect(result.txs).toHaveLength(1)
      expect(result.total_count).toBe('1')
    })

    it('should support pagination params', async () => {
      mockHttpRequest.mockResolvedValueOnce(
        mockJsonRpcResponse({ txs: [], total_count: '0' })
      )

      const client = createRpcClient('https://rpc.initia.xyz')
      await client.txSearch("tx.height=100", { page: 2, perPage: 10, orderBy: 'desc' })

      expect(mockHttpRequest).toHaveBeenCalledWith(
        expect.anything(),
        expect.stringMatching(/page=2.*per_page=10.*order_by=%22desc%22/),
        expect.anything(),
        undefined
      )
    })
  })

  describe('error handling', () => {
    it('should throw on HTTP error', async () => {
      mockHttpRequest.mockResolvedValueOnce({
        ok: false,
        status: 500,
        statusText: 'Internal Server Error',
        text: () => Promise.resolve(''),
      } as unknown as Response)

      const client = createRpcClient('https://rpc.initia.xyz')
      await expect(client.status()).rejects.toThrow('HTTP error: 500')
    })

    it('should throw on JSON-RPC error', async () => {
      mockHttpRequest.mockResolvedValueOnce(mockErrorResponse(-32602, 'invalid height'))

      const client = createRpcClient('https://rpc.initia.xyz')
      await expect(client.blockResults(999999999)).rejects.toThrow('invalid height')
    })
  })

  describe('request options passthrough', () => {
    it('should pass HttpRequestOptions to httpRequest', async () => {
      mockHttpRequest.mockResolvedValueOnce(
        mockJsonRpcResponse({ node_info: {}, sync_info: {} })
      )

      const client = createRpcClient('https://rpc.initia.xyz')
      const opts = { timeoutMs: 5000 }
      await client.status(opts)

      expect(mockHttpRequest).toHaveBeenCalledWith(
        expect.anything(),
        expect.anything(),
        expect.anything(),
        opts
      )
    })
  })

  // ===========================================================================
  // New endpoints
  // ===========================================================================

  describe('health', () => {
    it('should return true on success', async () => {
      mockHttpRequest.mockResolvedValueOnce(mockJsonRpcResponse({}))

      const client = createRpcClient('https://rpc.initia.xyz')
      const result = await client.health()

      expect(mockHttpRequest).toHaveBeenCalledWith(
        expect.anything(),
        '/health',
        expect.objectContaining({ method: 'GET' }),
        undefined
      )
      expect(result).toBe(true)
    })

    it('should return false on HTTP error', async () => {
      mockHttpRequest.mockResolvedValueOnce({
        ok: false,
        status: 503,
        statusText: 'Service Unavailable',
        text: () => Promise.resolve(''),
      } as unknown as Response)

      const client = createRpcClient('https://rpc.initia.xyz')
      const result = await client.health()
      expect(result).toBe(false)
    })

    it('should return false on JSON-RPC error', async () => {
      mockHttpRequest.mockResolvedValueOnce(mockErrorResponse(-32603, 'internal error'))

      const client = createRpcClient('https://rpc.initia.xyz')
      const result = await client.health()
      expect(result).toBe(false)
    })
  })

  describe('abciInfo', () => {
    it('should query /abci_info', async () => {
      const info = { response: { version: '1.0.0', last_block_height: '100' } }
      mockHttpRequest.mockResolvedValueOnce(mockJsonRpcResponse(info))

      const client = createRpcClient('https://rpc.initia.xyz')
      const result = await client.abciInfo()

      expect(mockHttpRequest).toHaveBeenCalledWith(
        expect.anything(),
        '/abci_info',
        expect.objectContaining({ method: 'GET' }),
        undefined
      )
      expect(result.response.last_block_height).toBe('100')
    })
  })

  describe('commit', () => {
    it('should query /commit with height', async () => {
      const commitData = {
        signed_header: {
          header: { height: '100', chain_id: 'interwoven-1' },
          commit: { height: '100', round: 0 },
        },
        canonical: true,
      }
      mockHttpRequest.mockResolvedValueOnce(mockJsonRpcResponse(commitData))

      const client = createRpcClient('https://rpc.initia.xyz')
      const result = await client.commit(100)

      expect(mockHttpRequest).toHaveBeenCalledWith(
        expect.anything(),
        '/commit?height=100',
        expect.objectContaining({ method: 'GET' }),
        undefined
      )
      expect(result.canonical).toBe(true)
    })

    it('should query latest commit without height', async () => {
      mockHttpRequest.mockResolvedValueOnce(
        mockJsonRpcResponse({ signed_header: {}, canonical: true })
      )

      const client = createRpcClient('https://rpc.initia.xyz')
      await client.commit()

      expect(mockHttpRequest).toHaveBeenCalledWith(
        expect.anything(),
        '/commit',
        expect.objectContaining({ method: 'GET' }),
        undefined
      )
    })
  })

  describe('validators', () => {
    it('should query /validators with height and pagination', async () => {
      const validatorsData = {
        block_height: '100',
        validators: [{ address: 'AABB', pub_key: { type: 'ed25519', value: 'abc' }, voting_power: '1000', proposer_priority: '0' }],
        count: '1',
        total: '1',
      }
      mockHttpRequest.mockResolvedValueOnce(mockJsonRpcResponse(validatorsData))

      const client = createRpcClient('https://rpc.initia.xyz')
      const result = await client.validators(100, { page: 1, perPage: 30 })

      expect(mockHttpRequest).toHaveBeenCalledWith(
        expect.anything(),
        expect.stringContaining('/validators?'),
        expect.objectContaining({ method: 'GET' }),
        undefined
      )
      expect(result.validators).toHaveLength(1)
    })

    it('should query latest validators without height', async () => {
      mockHttpRequest.mockResolvedValueOnce(
        mockJsonRpcResponse({ block_height: '100', validators: [], count: '0', total: '0' })
      )

      const client = createRpcClient('https://rpc.initia.xyz')
      await client.validators()

      expect(mockHttpRequest).toHaveBeenCalledWith(
        expect.anything(),
        '/validators',
        expect.objectContaining({ method: 'GET' }),
        undefined
      )
    })
  })

  describe('consensusParams', () => {
    it('should query /consensus_params with height', async () => {
      const paramsData = {
        block_height: '100',
        consensus_params: { block: { max_bytes: '22020096', max_gas: '-1' } },
      }
      mockHttpRequest.mockResolvedValueOnce(mockJsonRpcResponse(paramsData))

      const client = createRpcClient('https://rpc.initia.xyz')
      const result = await client.consensusParams(100)

      expect(mockHttpRequest).toHaveBeenCalledWith(
        expect.anything(),
        '/consensus_params?height=100',
        expect.objectContaining({ method: 'GET' }),
        undefined
      )
      expect(result.block_height).toBe('100')
    })

    it('should query latest consensus_params without height', async () => {
      mockHttpRequest.mockResolvedValueOnce(
        mockJsonRpcResponse({ block_height: '100', consensus_params: {} })
      )

      const client = createRpcClient('https://rpc.initia.xyz')
      await client.consensusParams()

      expect(mockHttpRequest).toHaveBeenCalledWith(
        expect.anything(),
        '/consensus_params',
        expect.objectContaining({ method: 'GET' }),
        undefined
      )
    })
  })

  describe('blockchain', () => {
    it('should query /blockchain with min and max height', async () => {
      const blockchainData = {
        last_height: '200',
        block_metas: [{ block_id: { hash: 'AA' }, block_size: '1234', header: { height: '200' }, num_txs: '5' }],
      }
      mockHttpRequest.mockResolvedValueOnce(mockJsonRpcResponse(blockchainData))

      const client = createRpcClient('https://rpc.initia.xyz')
      const result = await client.blockchain(190, 200)

      expect(mockHttpRequest).toHaveBeenCalledWith(
        expect.anything(),
        expect.stringContaining('/blockchain?'),
        expect.objectContaining({ method: 'GET' }),
        undefined
      )
      expect(result.last_height).toBe('200')
    })

    it('should query latest blocks without params', async () => {
      mockHttpRequest.mockResolvedValueOnce(
        mockJsonRpcResponse({ last_height: '200', block_metas: [] })
      )

      const client = createRpcClient('https://rpc.initia.xyz')
      await client.blockchain()

      expect(mockHttpRequest).toHaveBeenCalledWith(
        expect.anything(),
        '/blockchain',
        expect.objectContaining({ method: 'GET' }),
        undefined
      )
    })
  })

  describe('blockByHash', () => {
    it('should query /block_by_hash with 0x normalization', async () => {
      const blockData = {
        block_id: { hash: 'AABB' },
        block: { header: { height: '100' }, data: { txs: null } },
      }
      mockHttpRequest.mockResolvedValueOnce(mockJsonRpcResponse(blockData))

      const client = createRpcClient('https://rpc.initia.xyz')
      await client.blockByHash('AABB')

      expect(mockHttpRequest).toHaveBeenCalledWith(
        expect.anything(),
        '/block_by_hash?hash=0xAABB',
        expect.objectContaining({ method: 'GET' }),
        undefined
      )
    })

    it('should not double-prefix 0x hash', async () => {
      mockHttpRequest.mockResolvedValueOnce(
        mockJsonRpcResponse({ block_id: {}, block: {} })
      )

      const client = createRpcClient('https://rpc.initia.xyz')
      await client.blockByHash('0xAABB')

      expect(mockHttpRequest).toHaveBeenCalledWith(
        expect.anything(),
        '/block_by_hash?hash=0xAABB',
        expect.anything(),
        undefined
      )
    })
  })

  describe('blockSearch', () => {
    it('should query /block_search with query and pagination', async () => {
      const searchData = { blocks: [], total_count: '0' }
      mockHttpRequest.mockResolvedValueOnce(mockJsonRpcResponse(searchData))

      const client = createRpcClient('https://rpc.initia.xyz')
      await client.blockSearch("block.height > 100", { page: 1, perPage: 25, orderBy: 'asc' })

      expect(mockHttpRequest).toHaveBeenCalledWith(
        expect.anything(),
        expect.stringContaining('/block_search?'),
        expect.objectContaining({ method: 'GET' }),
        undefined
      )
    })
  })

  describe('unconfirmedTxs', () => {
    it('should query /unconfirmed_txs with limit', async () => {
      const data = { n_txs: '2', total: '2', total_bytes: '512', txs: ['abc', 'def'] }
      mockHttpRequest.mockResolvedValueOnce(mockJsonRpcResponse(data))

      const client = createRpcClient('https://rpc.initia.xyz')
      const result = await client.unconfirmedTxs(10)

      expect(mockHttpRequest).toHaveBeenCalledWith(
        expect.anything(),
        '/unconfirmed_txs?limit=10',
        expect.objectContaining({ method: 'GET' }),
        undefined
      )
      expect(result.n_txs).toBe('2')
    })

    it('should query without limit', async () => {
      mockHttpRequest.mockResolvedValueOnce(
        mockJsonRpcResponse({ n_txs: '0', total: '0', total_bytes: '0', txs: null })
      )

      const client = createRpcClient('https://rpc.initia.xyz')
      await client.unconfirmedTxs()

      expect(mockHttpRequest).toHaveBeenCalledWith(
        expect.anything(),
        '/unconfirmed_txs',
        expect.objectContaining({ method: 'GET' }),
        undefined
      )
    })
  })

  describe('numUnconfirmedTxs', () => {
    it('should query /num_unconfirmed_txs', async () => {
      const data = { n_txs: '5', total: '5', total_bytes: '1024', txs: null }
      mockHttpRequest.mockResolvedValueOnce(mockJsonRpcResponse(data))

      const client = createRpcClient('https://rpc.initia.xyz')
      const result = await client.numUnconfirmedTxs()

      expect(mockHttpRequest).toHaveBeenCalledWith(
        expect.anything(),
        '/num_unconfirmed_txs',
        expect.objectContaining({ method: 'GET' }),
        undefined
      )
      expect(result.n_txs).toBe('5')
    })
  })

  describe('header', () => {
    it('should query /header with height', async () => {
      const data = { header: { height: '100', chain_id: 'interwoven-1' } }
      mockHttpRequest.mockResolvedValueOnce(mockJsonRpcResponse(data))

      const client = createRpcClient('https://rpc.initia.xyz')
      const result = await client.header(100)

      expect(mockHttpRequest).toHaveBeenCalledWith(
        expect.anything(),
        '/header?height=100',
        expect.objectContaining({ method: 'GET' }),
        undefined
      )
      expect(result.header.height).toBe('100')
    })

    it('should query latest header without height', async () => {
      mockHttpRequest.mockResolvedValueOnce(
        mockJsonRpcResponse({ header: { height: '200' } })
      )

      const client = createRpcClient('https://rpc.initia.xyz')
      await client.header()

      expect(mockHttpRequest).toHaveBeenCalledWith(
        expect.anything(),
        '/header',
        expect.objectContaining({ method: 'GET' }),
        undefined
      )
    })
  })

  describe('headerByHash', () => {
    it('should query /header_by_hash with 0x normalization', async () => {
      mockHttpRequest.mockResolvedValueOnce(
        mockJsonRpcResponse({ header: { height: '100' } })
      )

      const client = createRpcClient('https://rpc.initia.xyz')
      await client.headerByHash('AABB')

      expect(mockHttpRequest).toHaveBeenCalledWith(
        expect.anything(),
        '/header_by_hash?hash=0xAABB',
        expect.objectContaining({ method: 'GET' }),
        undefined
      )
    })

    it('should not double-prefix 0x hash', async () => {
      mockHttpRequest.mockResolvedValueOnce(
        mockJsonRpcResponse({ header: { height: '100' } })
      )

      const client = createRpcClient('https://rpc.initia.xyz')
      await client.headerByHash('0xAABB')

      expect(mockHttpRequest).toHaveBeenCalledWith(
        expect.anything(),
        '/header_by_hash?hash=0xAABB',
        expect.anything(),
        undefined
      )
    })
  })

  describe('consensusState', () => {
    it('should query /consensus_state', async () => {
      const data = {
        round_state: {
          'height/round/step': '100/0/1',
          start_time: '2024-01-01T00:00:00Z',
        },
      }
      mockHttpRequest.mockResolvedValueOnce(mockJsonRpcResponse(data))

      const client = createRpcClient('https://rpc.initia.xyz')
      const result = await client.consensusState()

      expect(mockHttpRequest).toHaveBeenCalledWith(
        expect.anything(),
        '/consensus_state',
        expect.objectContaining({ method: 'GET' }),
        undefined
      )
      expect(result.round_state['height/round/step']).toBe('100/0/1')
    })
  })

  describe('dumpConsensusState', () => {
    it('should query /dump_consensus_state', async () => {
      const data = {
        round_state: { height: '100', round: 0, step: 1 },
        peers: [],
      }
      mockHttpRequest.mockResolvedValueOnce(mockJsonRpcResponse(data))

      const client = createRpcClient('https://rpc.initia.xyz')
      const result = await client.dumpConsensusState()

      expect(mockHttpRequest).toHaveBeenCalledWith(
        expect.anything(),
        '/dump_consensus_state',
        expect.objectContaining({ method: 'GET' }),
        undefined
      )
      expect(result.round_state.height).toBe('100')
    })
  })

  describe('genesis', () => {
    it('should query /genesis', async () => {
      const data = {
        genesis: {
          genesis_time: '2024-01-01T00:00:00Z',
          chain_id: 'interwoven-1',
          initial_height: '1',
          app_hash: '',
        },
      }
      mockHttpRequest.mockResolvedValueOnce(mockJsonRpcResponse(data))

      const client = createRpcClient('https://rpc.initia.xyz')
      const result = await client.genesis()

      expect(mockHttpRequest).toHaveBeenCalledWith(
        expect.anything(),
        '/genesis',
        expect.objectContaining({ method: 'GET' }),
        undefined
      )
      expect(result.genesis.chain_id).toBe('interwoven-1')
    })
  })

  describe('genesisChunked', () => {
    it('should query /genesis_chunked with chunk number', async () => {
      const data = { chunk: '0', total: '3', data: 'base64data...' }
      mockHttpRequest.mockResolvedValueOnce(mockJsonRpcResponse(data))

      const client = createRpcClient('https://rpc.initia.xyz')
      const result = await client.genesisChunked(0)

      expect(mockHttpRequest).toHaveBeenCalledWith(
        expect.anything(),
        '/genesis_chunked?chunk=0',
        expect.objectContaining({ method: 'GET' }),
        undefined
      )
      expect(result.total).toBe('3')
    })
  })

  describe('netInfo', () => {
    it('should query /net_info', async () => {
      const data = {
        listening: true,
        listeners: ['Listener(@)'],
        n_peers: '5',
        peers: [],
      }
      mockHttpRequest.mockResolvedValueOnce(mockJsonRpcResponse(data))

      const client = createRpcClient('https://rpc.initia.xyz')
      const result = await client.netInfo()

      expect(mockHttpRequest).toHaveBeenCalledWith(
        expect.anything(),
        '/net_info',
        expect.objectContaining({ method: 'GET' }),
        undefined
      )
      expect(result.listening).toBe(true)
      expect(result.n_peers).toBe('5')
    })
  })

  describe('abciQuery', () => {
    it('should query /abci_query with path only', async () => {
      const data = {
        response: { code: 0, log: '', info: '', index: '0', key: '', value: 'AAEE', height: '100', codespace: '' },
      }
      mockHttpRequest.mockResolvedValueOnce(mockJsonRpcResponse(data))

      const client = createRpcClient('https://rpc.initia.xyz')
      const result = await client.abciQuery('/store/bank/key')

      expect(mockHttpRequest).toHaveBeenCalledWith(
        expect.anything(),
        expect.stringContaining('/abci_query?'),
        expect.objectContaining({ method: 'GET' }),
        undefined
      )
      expect(result.response.code).toBe(0)
    })

    it('should query /abci_query with all options', async () => {
      const data = {
        response: { code: 0, log: '', info: '', index: '0', key: '', value: '', height: '50', codespace: '' },
      }
      mockHttpRequest.mockResolvedValueOnce(mockJsonRpcResponse(data))

      const client = createRpcClient('https://rpc.initia.xyz')
      await client.abciQuery('/store/bank/key', { data: '0xABCD', height: 50, prove: true })

      const callPath = mockHttpRequest.mock.calls[0][1]
      expect(callPath).toContain('path=')
      expect(callPath).toContain('data=')
      expect(callPath).toContain('height=50')
      expect(callPath).toContain('prove=true')
    })
  })
})
