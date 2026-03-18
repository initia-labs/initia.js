/**
 * EVM JSON-RPC Client Tests
 */

import { describe, it, expect, beforeAll, vi, afterEach } from 'vitest'
import { createEvmRpcClient, type EvmRpcClient } from '../../../src/client/evm-rpc'
import { createRegistryProvider } from '../../../src/provider/registry-provider'
import { auth } from '../../../src/client/types'
import { HeaderConflictError } from '../../../src/errors'

// Skip integration tests if environment variable is set
const SKIP = process.env.SKIP_INTEGRATION_TESTS === 'true'

describe('EvmRpcClient Unit Tests', () => {
  it('should create client with endpoint', () => {
    const client = createEvmRpcClient('https://jsonrpc.example.com')
    expect(client).toBeDefined()
  })

  it('should create client with options', () => {
    const client = createEvmRpcClient('https://jsonrpc.example.com', {
      timeout: 60000,
      headers: { 'X-API-Key': 'test' },
    })
    expect(client).toBeDefined()
  })
})

// =============================================================================
// Auth & Options Tests (mock fetch)
// =============================================================================

describe('EvmRpcClient Auth & Options', () => {
  const mockJsonRpcResponse = (result: unknown) =>
    new Response(JSON.stringify({ jsonrpc: '2.0', result, id: 1 }), {
      status: 200,
      headers: { 'content-type': 'application/json' },
    })

  afterEach(() => {
    vi.restoreAllMocks()
  })

  it('constructor auth option sends auth headers in fetch', async () => {
    const fetchSpy = vi.spyOn(globalThis, 'fetch').mockResolvedValue(mockJsonRpcResponse('0x1'))

    const client = createEvmRpcClient('https://rpc.test', {
      auth: auth.bearer('my-token'),
    })
    await client.getBlockNumber()

    const [, init] = fetchSpy.mock.calls[0]
    const headers = init?.headers as Record<string, string>
    expect(headers['authorization']).toBe('Bearer my-token')
    expect(headers['content-type']).toBe('application/json')
  })

  it('constructor auth coexists with custom headers', async () => {
    const fetchSpy = vi.spyOn(globalThis, 'fetch').mockResolvedValue(mockJsonRpcResponse('0x1'))

    const client = createEvmRpcClient('https://rpc.test', {
      auth: auth.apiKey('sk-123'),
      headers: { 'x-custom': 'val' },
    })
    await client.getBlockNumber()

    const [, init] = fetchSpy.mock.calls[0]
    const headers = init?.headers as Record<string, string>
    expect(headers['x-api-key']).toBe('sk-123')
    expect(headers['x-custom']).toBe('val')
    expect(headers['content-type']).toBe('application/json')
  })

  it('constructor-level auth + headers conflict throws HeaderConflictError', () => {
    expect(() =>
      createEvmRpcClient('https://rpc.test', {
        auth: auth.bearer('token'),
        headers: { authorization: 'other' },
      })
    ).toThrow(HeaderConflictError)
  })

  it('per-request options override constructor-level auth', async () => {
    const fetchSpy = vi.spyOn(globalThis, 'fetch').mockResolvedValue(mockJsonRpcResponse('0x1'))

    const client = createEvmRpcClient('https://rpc.test', {
      auth: auth.bearer('ctx-token'),
    })
    await client.getBlockNumber({ auth: auth.apiKey('req-key') })

    const [, init] = fetchSpy.mock.calls[0]
    const headers = init?.headers as Record<string, string>
    expect(headers['x-api-key']).toBe('req-key')
    expect(headers['authorization']).toBeUndefined()
  })
})

// =============================================================================
// New Method Tests (mock fetch)
// =============================================================================

describe('EvmRpcClient New Methods', () => {
  const mockJsonRpcResponse = (result: unknown) =>
    new Response(JSON.stringify({ jsonrpc: '2.0', result, id: 1 }), {
      status: 200,
      headers: { 'content-type': 'application/json' },
    })

  afterEach(() => {
    vi.restoreAllMocks()
  })

  describe('getTransactionByHash', () => {
    it('should return transaction object', async () => {
      const tx = {
        hash: '0xabc',
        nonce: '0x1',
        blockHash: '0xdef',
        blockNumber: '0x10',
        transactionIndex: '0x0',
        from: '0xsender',
        to: '0xrecipient',
        value: '0x0',
        gas: '0x5208',
        gasPrice: '0x3b9aca00',
        input: '0x',
        v: '0x1b',
        r: '0xaaa',
        s: '0xbbb',
      }
      const fetchSpy = vi.spyOn(globalThis, 'fetch').mockResolvedValue(mockJsonRpcResponse(tx))

      const client = createEvmRpcClient('https://rpc.test')
      const result = await client.getTransactionByHash('0xabc')

      const body = JSON.parse(fetchSpy.mock.calls[0][1]?.body as string)
      expect(body.method).toBe('eth_getTransactionByHash')
      expect(body.params).toEqual(['0xabc'])
      expect(result?.hash).toBe('0xabc')
      expect(result?.from).toBe('0xsender')
    })

    it('should return null for non-existent transaction', async () => {
      vi.spyOn(globalThis, 'fetch').mockResolvedValue(mockJsonRpcResponse(null))

      const client = createEvmRpcClient('https://rpc.test')
      const result = await client.getTransactionByHash('0x0000')

      expect(result).toBeNull()
    })
  })

  describe('getStorageAt', () => {
    it('should query with block param', async () => {
      const fetchSpy = vi.spyOn(globalThis, 'fetch').mockResolvedValue(
        mockJsonRpcResponse('0x0000000000000000000000000000000000000000000000000000000000000001')
      )

      const client = createEvmRpcClient('https://rpc.test')
      const result = await client.getStorageAt('0xcontract', '0x0', 100)

      const body = JSON.parse(fetchSpy.mock.calls[0][1]?.body as string)
      expect(body.method).toBe('eth_getStorageAt')
      expect(body.params).toEqual(['0xcontract', '0x0', '0x64'])
      expect(result).toBe('0x0000000000000000000000000000000000000000000000000000000000000001')
    })

    it('should default to latest block', async () => {
      const fetchSpy = vi.spyOn(globalThis, 'fetch').mockResolvedValue(
        mockJsonRpcResponse('0x00')
      )

      const client = createEvmRpcClient('https://rpc.test')
      await client.getStorageAt('0xcontract', '0x0')

      const body = JSON.parse(fetchSpy.mock.calls[0][1]?.body as string)
      expect(body.params).toEqual(['0xcontract', '0x0', 'latest'])
    })
  })
})

// =============================================================================
// Integration Tests
// =============================================================================

describe.skipIf(SKIP)('EvmRpcClient Integration Tests (Minievm)', () => {
  let rpcClient: EvmRpcClient | undefined
  let evmRpcEndpoint: string | undefined

  beforeAll(async () => {
    try {
      const provider = await createRegistryProvider({ network: 'testnet' })
      const minievm = provider.listChains().find(c => c.chainType === 'minievm')

      if (minievm?.evmRpc) {
        evmRpcEndpoint = minievm.evmRpc
        rpcClient = createEvmRpcClient(evmRpcEndpoint)
        console.log('Connected to EVM RPC:', evmRpcEndpoint)
      }
    } catch (error) {
      console.warn('Failed to setup EVM RPC client:', error)
    }
  }, 30000)

  it('should get block number', async () => {
    if (!rpcClient) return

    const blockNumber = await rpcClient.getBlockNumber()
    console.log('Current block number:', blockNumber)

    expect(typeof blockNumber).toBe('bigint')
    expect(blockNumber).toBeGreaterThan(0n)
  }, 30000)

  it('should get chain ID', async () => {
    if (!rpcClient) return

    const chainId = await rpcClient.getChainId()
    console.log('Chain ID:', chainId)

    expect(typeof chainId).toBe('bigint')
    expect(chainId).toBeGreaterThan(0n)
  }, 30000)

  it('should get gas price', async () => {
    if (!rpcClient) return

    const gasPrice = await rpcClient.getGasPrice()
    console.log('Gas price:', gasPrice)

    expect(typeof gasPrice).toBe('bigint')
    expect(gasPrice).toBeGreaterThanOrEqual(0n)
  }, 30000)

  it('should get block by number', async () => {
    if (!rpcClient) return

    const block = await rpcClient.getBlockByNumber('latest', false)
    console.log('Latest block hash:', block?.hash)
    console.log('Latest block number:', block?.number)
    console.log('Transactions count:', block?.transactions.length)

    expect(block).toBeDefined()
    expect(block?.hash).toBeDefined()
    expect(block?.number).toBeDefined()
    expect(Array.isArray(block?.transactions)).toBe(true)
  }, 30000)

  it('should get balance for zero address', async () => {
    if (!rpcClient) return

    const balance = await rpcClient.getBalance('0x0000000000000000000000000000000000000000')
    console.log('Zero address balance:', balance)

    expect(typeof balance).toBe('bigint')
  }, 30000)

  it('should get code for known ERC20 contract', async () => {
    if (!rpcClient) return

    // Anvil testnet native token ERC20
    const contractAddress = '0x2eE7007DF876084d4C74685e90bB7f4cd7c86e22'
    const code = await rpcClient.getCode(contractAddress)
    console.log('Contract code length:', code.length)

    expect(code).toBeDefined()
    expect(code.length).toBeGreaterThan(2) // More than just "0x"
  }, 30000)

  it('should return null for non-existent transaction receipt', async () => {
    if (!rpcClient) return

    const fakeHash = '0x0000000000000000000000000000000000000000000000000000000000000000'
    const receipt = await rpcClient.getTransactionReceipt(fakeHash)

    expect(receipt).toBeNull()
  }, 30000)

  it('should get logs with empty filter', async () => {
    if (!rpcClient) return

    // Get latest block for reference
    const blockNumber = await rpcClient.getBlockNumber()

    // Get logs from recent blocks (last 10 blocks)
    const fromBlock = blockNumber - 10n
    const logs = await rpcClient.getLogs({
      fromBlock: Number(fromBlock),
      toBlock: 'latest',
    })

    console.log('Logs found in last 10 blocks:', logs.length)

    expect(Array.isArray(logs)).toBe(true)
    // Logs might be empty if no transactions in recent blocks
  }, 30000)

  it('should get logs for specific contract', async () => {
    if (!rpcClient) return

    // Anvil testnet native token ERC20
    const contractAddress = '0x2eE7007DF876084d4C74685e90bB7f4cd7c86e22'

    const logs = await rpcClient.getLogs({
      address: contractAddress,
      fromBlock: 'earliest',
      toBlock: 'latest',
    })

    console.log('Logs for contract:', logs.length)

    expect(Array.isArray(logs)).toBe(true)

    // If there are logs, verify structure
    if (logs.length > 0) {
      const log = logs[0]
      expect(log.address).toBeDefined()
      expect(log.topics).toBeDefined()
      expect(log.data).toBeDefined()
      expect(log.blockNumber).toBeDefined()
      expect(log.transactionHash).toBeDefined()
    }
  }, 60000)
})
