/**
 * CosmWasm Contract Tests
 */

import { describe, it, expect, vi, beforeEach } from 'vitest'
import {
  createWasmContract,
  createStoreCodeMsg,
  createInstantiateMsg,
  createInstantiate2Msg,
  createWasmExecuteMsg,
  createMigrateMsg,
  createUpdateAdminMsg,
  createClearAdminMsg,
  queryContract,
  getContractInfo,
  getRawContractState,
  getCodeInfo,
  getContractsByCode,
} from '../../../../src/contracts/wasm/contract'
import type { HasWasmService } from '../../../../src/client/types'
import { coin } from '../../../../src/core/coin'

// Valid bech32 test addresses
const ADDR = {
  CONTRACT: 'init142424242424242424242424242424242ngm8s7',
  CONTRACT1: 'init1hwamhwamhwamhwamhwamhwamhwamhwampkv69v',
  CONTRACT2: 'init1enxvenxvenxvenxvenxvenxvenxvenxv7ey9rz',
  SENDER: 'init1zyg3zyg3zyg3zyg3zyg3zyg3zyg3zyg30th3ed',
  RECIPIENT: 'init1yg3zyg3zyg3zyg3zyg3zyg3zyg3zyg3zqkjh36',
  ADMIN: 'init1xvenxvenxvenxvenxvenxvenxvenxvenjg92yg',
  OWNER: 'init1g3zyg3zyg3zyg3zyg3zyg3zyg3zyg3zyd8d4zx',
  SPENDER: 'init124242424242424242424242424242424le6gh5',
  OTHER: 'init1venxvenxvenxvenxvenxvenxvenxvenxsylwlr',
  CREATOR: 'init1wamhwamhwamhwamhwamhwamhwamhwamhz6gn23',
  NOTFOUND: 'init13zyg3zyg3zyg3zyg3zyg3zyg3zyg3zygwtfudm',
  OLDADMIN: 'init1nxvenxvenxvenxvenxvenxvenxvenxveu47pcf',
  NEWADMIN: 'init1mhwamhwamhwamhwamhwamhwamhwamhwav8ncks',
} as const

// Mock WasmQueryClient
function createMockWasmClient(
  overrides: Partial<ReturnType<typeof createDefaultMockWasmClient>> = {}
) {
  return {
    ...createDefaultMockWasmClient(),
    ...overrides,
  }
}

// Create a mock context with wasm client
function createMockContext(
  wasmClient: ReturnType<typeof createMockWasmClient> = createMockWasmClient()
) {
  return { client: { wasm: wasmClient } } as unknown as HasWasmService
}

function createDefaultMockWasmClient() {
  return {
    smartContractState: vi.fn().mockResolvedValue({
      data: new TextEncoder().encode('{"balance":"1000000"}'),
    }),
    contractInfo: vi.fn().mockResolvedValue({
      contractInfo: {
        codeId: 1n,
        creator: ADDR.CREATOR,
        admin: ADDR.ADMIN,
        label: 'my-contract',
      },
    }),
    rawContractState: vi.fn().mockResolvedValue({
      data: new Uint8Array([1, 2, 3]),
    }),
    code: vi.fn().mockResolvedValue({
      codeInfo: {
        codeId: 1n,
        creator: ADDR.CREATOR,
      },
      data: new Uint8Array([0, 97, 115, 109]), // WASM magic bytes
    }),
    contractsByCode: vi.fn().mockResolvedValue({
      contracts: [ADDR.CONTRACT1, ADDR.CONTRACT2],
    }),
  }
}

describe('CosmWasm Contract', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('createWasmContract', () => {
    it('should create contract instance', () => {
      const mockWasmClient = createMockWasmClient()
      const contract = createWasmContract(createMockContext(mockWasmClient), ADDR.CONTRACT)

      expect(contract.contractAddress).toBe(ADDR.CONTRACT)
      expect(contract.execute).toBeDefined()
      expect(contract.query).toBeDefined()
    })

    it('should store schema if provided', () => {
      const mockWasmClient = createMockWasmClient()
      const schema = {
        contract_name: 'cw20-base',
        execute: { oneOf: [] },
        query: { oneOf: [] },
      }
      const contract = createWasmContract(createMockContext(mockWasmClient), ADDR.CONTRACT, {
        schema,
      })

      expect(contract.schema).toBe(schema)
    })
  })

  describe('execute proxy', () => {
    it('should create MsgExecuteContract', () => {
      const mockWasmClient = createMockWasmClient()
      const contract = createWasmContract(createMockContext(mockWasmClient), ADDR.CONTRACT)

      const msg = contract.execute.transfer(ADDR.SENDER, {
        recipient: ADDR.RECIPIENT,
        amount: '1000000',
      })

      expect(msg.value.$typeName).toBe('cosmwasm.wasm.v1.MsgExecuteContract')
      expect(msg.value.sender).toBe(ADDR.SENDER)
      expect(msg.value.contract).toBe(ADDR.CONTRACT)

      // Check encoded message
      const decodedMsg = JSON.parse(new TextDecoder().decode(msg.value.msg))
      expect(decodedMsg).toEqual({
        transfer: {
          recipient: ADDR.RECIPIENT,
          amount: '1000000',
        },
      })
    })

    it('should handle variant without args', () => {
      const mockWasmClient = createMockWasmClient()
      const contract = createWasmContract(createMockContext(mockWasmClient), ADDR.CONTRACT)

      const msg = contract.execute.pause(ADDR.SENDER)
      const decodedMsg = JSON.parse(new TextDecoder().decode(msg.value.msg))
      expect(decodedMsg).toEqual({ pause: {} })
    })

    it('should include funds', () => {
      const mockWasmClient = createMockWasmClient()
      const contract = createWasmContract(createMockContext(mockWasmClient), ADDR.CONTRACT)

      const msg = contract.execute.buy(ADDR.SENDER, { token_id: '1' }, [coin('uatom', '1000000')])

      expect(msg.value.funds).toHaveLength(1)
      expect(msg.value.funds[0].denom).toBe('uatom')
      expect(msg.value.funds[0].amount).toBe('1000000')
    })
  })

  describe('query proxy', () => {
    it('should call smartContractState and return result', async () => {
      const mockWasmClient = createMockWasmClient()
      const contract = createWasmContract(createMockContext(mockWasmClient), ADDR.CONTRACT)

      const result = await contract.query.balance({ address: 'init1...' })

      expect(mockWasmClient.smartContractState).toHaveBeenCalledWith({
        address: ADDR.CONTRACT,
        queryData: expect.any(Uint8Array),
      })
      expect(result).toEqual({ balance: '1000000' })
    })

    it('should handle query without args', async () => {
      const mockWasmClient = createMockWasmClient()
      const contract = createWasmContract(createMockContext(mockWasmClient), ADDR.CONTRACT)

      await contract.query.token_info()

      const callArg = mockWasmClient.smartContractState.mock.calls[0][0]
      const decodedQuery = JSON.parse(new TextDecoder().decode(callArg.queryData))
      expect(decodedQuery).toEqual({ token_info: {} })
    })
  })

  describe('executeRaw', () => {
    it('should create MsgExecuteContract from raw message', () => {
      const mockWasmClient = createMockWasmClient()
      const contract = createWasmContract(createMockContext(mockWasmClient), ADDR.CONTRACT)

      const msg = contract.executeRaw(ADDR.SENDER, {
        transfer: { recipient: 'init1...', amount: '1000' },
      })

      expect(msg.$typeName).toBe('cosmwasm.wasm.v1.MsgExecuteContract')
      const decodedMsg = JSON.parse(new TextDecoder().decode(msg.msg))
      expect(decodedMsg.transfer.recipient).toBe('init1...')
    })
  })

  describe('queryRaw', () => {
    it('should query with raw message', async () => {
      const mockWasmClient = createMockWasmClient()
      const contract = createWasmContract(createMockContext(mockWasmClient), ADDR.CONTRACT)

      const result = await contract.queryRaw({ balance: { address: 'init1...' } })

      expect(result).toEqual({ balance: '1000000' })
    })
  })

  describe('getContractInfo', () => {
    it('should return contract info', async () => {
      const mockWasmClient = createMockWasmClient()
      const contract = createWasmContract(createMockContext(mockWasmClient), ADDR.CONTRACT)

      const info = await contract.getContractInfo()

      expect(info.codeId).toBe(1n)
      expect(info.creator).toBe(ADDR.CREATOR)
    })

    it('should throw if contract not found', async () => {
      const mockWasmClient = createMockWasmClient()
      mockWasmClient.contractInfo.mockResolvedValue({ contractInfo: null })
      const contract = createWasmContract(createMockContext(mockWasmClient), ADDR.NOTFOUND)

      await expect(contract.getContractInfo()).rejects.toThrow('Contract info not found')
    })
  })

  describe('getRawState', () => {
    it('should return raw state from string key', async () => {
      const mockWasmClient = createMockWasmClient()
      const contract = createWasmContract(createMockContext(mockWasmClient), ADDR.CONTRACT)

      const state = await contract.getRawState('config')

      expect(mockWasmClient.rawContractState).toHaveBeenCalledWith({
        address: ADDR.CONTRACT,
        queryData: new TextEncoder().encode('config'),
      })
      expect(state).toEqual(new Uint8Array([1, 2, 3]))
    })

    it('should accept Uint8Array key', async () => {
      const mockWasmClient = createMockWasmClient()
      const contract = createWasmContract(createMockContext(mockWasmClient), ADDR.CONTRACT)

      const keyBytes = new Uint8Array([1, 2, 3])
      await contract.getRawState(keyBytes)

      expect(mockWasmClient.rawContractState).toHaveBeenCalledWith({
        address: ADDR.CONTRACT,
        queryData: keyBytes,
      })
    })
  })

  describe('getTokenInfo (CW20)', () => {
    it('should query and return token info', async () => {
      const mockWasmClient = createMockWasmClient()
      mockWasmClient.smartContractState.mockResolvedValue({
        data: new TextEncoder().encode(
          JSON.stringify({
            name: 'My Token',
            symbol: 'MTK',
            decimals: 6,
            total_supply: '1000000000000',
          })
        ),
      })
      const contract = createWasmContract(createMockContext(mockWasmClient), ADDR.CONTRACT)

      const tokenInfo = await contract.getTokenInfo()

      expect(tokenInfo.name).toBe('My Token')
      expect(tokenInfo.symbol).toBe('MTK')
      expect(tokenInfo.decimals).toBe(6)
      expect(tokenInfo.totalSupply).toBe(1000000000000n)
    })

    it('should handle missing total_supply', async () => {
      const mockWasmClient = createMockWasmClient()
      mockWasmClient.smartContractState.mockResolvedValue({
        data: new TextEncoder().encode(
          JSON.stringify({
            name: 'My Token',
            symbol: 'MTK',
            decimals: 6,
          })
        ),
      })
      const contract = createWasmContract(createMockContext(mockWasmClient), ADDR.CONTRACT)

      const tokenInfo = await contract.getTokenInfo()

      expect(tokenInfo.totalSupply).toBeUndefined()
    })
  })

  describe('getNftInfo (CW721)', () => {
    it('should query and return NFT info', async () => {
      const mockWasmClient = createMockWasmClient()
      mockWasmClient.smartContractState.mockResolvedValue({
        data: new TextEncoder().encode(
          JSON.stringify({
            token_uri: 'ipfs://Qm.../metadata.json',
            extension: { attributes: [{ trait_type: 'rarity', value: 'rare' }] },
          })
        ),
      })
      const contract = createWasmContract(createMockContext(mockWasmClient), ADDR.CONTRACT)

      const nftInfo = await contract.getNftInfo('token-1')

      expect(nftInfo.tokenUri).toBe('ipfs://Qm.../metadata.json')
      expect(nftInfo.extension).toEqual({ attributes: [{ trait_type: 'rarity', value: 'rare' }] })

      // Verify query was called with correct params
      const callArg = mockWasmClient.smartContractState.mock.calls[0][0]
      const decodedQuery = JSON.parse(new TextDecoder().decode(callArg.queryData))
      expect(decodedQuery).toEqual({ nft_info: { token_id: 'token-1' } })
    })

    it('should handle missing token_uri', async () => {
      const mockWasmClient = createMockWasmClient()
      mockWasmClient.smartContractState.mockResolvedValue({
        data: new TextEncoder().encode(JSON.stringify({})),
      })
      const contract = createWasmContract(createMockContext(mockWasmClient), ADDR.CONTRACT)

      const nftInfo = await contract.getNftInfo('token-1')

      expect(nftInfo.tokenUri).toBeUndefined()
      expect(nftInfo.extension).toBeUndefined()
    })
  })

  describe('getOwnerOf (CW721)', () => {
    it('should query and return owner with approvals', async () => {
      const mockWasmClient = createMockWasmClient()
      mockWasmClient.smartContractState.mockResolvedValue({
        data: new TextEncoder().encode(
          JSON.stringify({
            owner: ADDR.OWNER,
            approvals: [
              { spender: ADDR.SPENDER, expires: { at_height: 1000000 } },
              { spender: ADDR.OTHER, expires: { never: {} } },
            ],
          })
        ),
      })
      const contract = createWasmContract(createMockContext(mockWasmClient), ADDR.CONTRACT)

      const result = await contract.getOwnerOf('token-1')

      expect(result.owner).toBe(ADDR.OWNER)
      expect(result.approvals).toHaveLength(2)
      expect(result.approvals[0].spender).toBe(ADDR.SPENDER)
      expect(result.approvals[0].expires?.atHeight).toBe(1000000n)
      expect(result.approvals[1].expires?.never).toBe(true)
    })

    it('should handle empty approvals', async () => {
      const mockWasmClient = createMockWasmClient()
      mockWasmClient.smartContractState.mockResolvedValue({
        data: new TextEncoder().encode(
          JSON.stringify({
            owner: ADDR.OWNER,
            approvals: [],
          })
        ),
      })
      const contract = createWasmContract(createMockContext(mockWasmClient), ADDR.CONTRACT)

      const result = await contract.getOwnerOf('token-1')

      expect(result.owner).toBe(ADDR.OWNER)
      expect(result.approvals).toHaveLength(0)
    })

    it('should handle expiration at_time', async () => {
      const mockWasmClient = createMockWasmClient()
      mockWasmClient.smartContractState.mockResolvedValue({
        data: new TextEncoder().encode(
          JSON.stringify({
            owner: ADDR.OWNER,
            approvals: [{ spender: ADDR.SPENDER, expires: { at_time: '1700000000000000000' } }],
          })
        ),
      })
      const contract = createWasmContract(createMockContext(mockWasmClient), ADDR.CONTRACT)

      const result = await contract.getOwnerOf('token-1')

      expect(result.approvals[0].expires?.atTime).toBe(1700000000000000000n)
    })
  })

  describe('getTokens (CW721)', () => {
    it('should query and return list of token IDs', async () => {
      const mockWasmClient = createMockWasmClient()
      mockWasmClient.smartContractState.mockResolvedValue({
        data: new TextEncoder().encode(
          JSON.stringify({
            tokens: ['token-1', 'token-2', 'token-3'],
          })
        ),
      })
      const contract = createWasmContract(createMockContext(mockWasmClient), ADDR.CONTRACT)

      const tokens = await contract.getTokens(ADDR.OWNER)

      expect(tokens).toEqual(['token-1', 'token-2', 'token-3'])

      // Verify query was called with correct params (default limit)
      const callArg = mockWasmClient.smartContractState.mock.calls[0][0]
      const decodedQuery = JSON.parse(new TextDecoder().decode(callArg.queryData))
      expect(decodedQuery).toEqual({
        tokens: { owner: ADDR.OWNER, start_after: undefined, limit: 30 },
      })
    })

    it('should support pagination with startAfter and limit', async () => {
      const mockWasmClient = createMockWasmClient()
      mockWasmClient.smartContractState.mockResolvedValue({
        data: new TextEncoder().encode(JSON.stringify({ tokens: ['token-4', 'token-5'] })),
      })
      const contract = createWasmContract(createMockContext(mockWasmClient), ADDR.CONTRACT)

      const tokens = await contract.getTokens(ADDR.OWNER, 'token-3', 10)

      expect(tokens).toEqual(['token-4', 'token-5'])

      // Verify query was called with pagination params
      const callArg = mockWasmClient.smartContractState.mock.calls[0][0]
      const decodedQuery = JSON.parse(new TextDecoder().decode(callArg.queryData))
      expect(decodedQuery).toEqual({
        tokens: { owner: ADDR.OWNER, start_after: 'token-3', limit: 10 },
      })
    })

    it('should handle empty result', async () => {
      const mockWasmClient = createMockWasmClient()
      mockWasmClient.smartContractState.mockResolvedValue({
        data: new TextEncoder().encode(JSON.stringify({ tokens: [] })),
      })
      const contract = createWasmContract(createMockContext(mockWasmClient), ADDR.CONTRACT)

      const tokens = await contract.getTokens(ADDR.OWNER)

      expect(tokens).toEqual([])
    })
  })

  describe('createStoreCodeMsg', () => {
    it('should create MsgStoreCode', () => {
      const wasmCode = new Uint8Array([0, 97, 115, 109])
      const msg = createStoreCodeMsg({
        sender: ADDR.SENDER,
        wasmByteCode: wasmCode,
      })

      expect(msg.$typeName).toBe('cosmwasm.wasm.v1.MsgStoreCode')
      expect(msg.sender).toBe(ADDR.SENDER)
      expect(msg.wasmByteCode).toEqual(wasmCode)
    })
  })

  describe('createInstantiateMsg', () => {
    it('should create MsgInstantiateContract', () => {
      const msg = createInstantiateMsg({
        sender: ADDR.SENDER,
        codeId: 1n,
        msg: { name: 'My Token', symbol: 'MTK', decimals: 6 },
        label: 'my-token-v1',
        admin: ADDR.ADMIN,
        funds: [coin('uatom', '1000000')],
      })

      expect(msg.$typeName).toBe('cosmwasm.wasm.v1.MsgInstantiateContract')
      expect(msg.sender).toBe(ADDR.SENDER)
      expect(msg.codeId).toBe(1n)
      expect(msg.label).toBe('my-token-v1')
      expect(msg.admin).toBe(ADDR.ADMIN)
      expect(msg.funds).toHaveLength(1)
    })

    it('should default admin to empty string', () => {
      const msg = createInstantiateMsg({
        sender: ADDR.SENDER,
        codeId: 1n,
        msg: {},
        label: 'test',
      })

      expect(msg.admin).toBe('')
    })
  })

  describe('createInstantiate2Msg', () => {
    it('should create MsgInstantiateContract2 with salt', () => {
      const salt = new TextEncoder().encode('my-salt')
      const msg = createInstantiate2Msg({
        sender: ADDR.SENDER,
        codeId: 1n,
        msg: {},
        label: 'test',
        salt,
        fixMsg: true,
      })

      expect(msg.$typeName).toBe('cosmwasm.wasm.v1.MsgInstantiateContract2')
      expect(msg.salt).toEqual(salt)
      expect(msg.fixMsg).toBe(true)
    })
  })

  describe('createWasmExecuteMsg', () => {
    it('should create MsgExecuteContract directly', () => {
      const msg = createWasmExecuteMsg(ADDR.SENDER, ADDR.CONTRACT, {
        transfer: { recipient: 'init1...', amount: '1000' },
      })

      expect(msg.$typeName).toBe('cosmwasm.wasm.v1.MsgExecuteContract')
      expect(msg.sender).toBe(ADDR.SENDER)
      expect(msg.contract).toBe(ADDR.CONTRACT)
    })
  })

  describe('createMigrateMsg', () => {
    it('should create MsgMigrateContract', () => {
      const msg = createMigrateMsg({
        sender: ADDR.ADMIN,
        contract: ADDR.CONTRACT,
        codeId: 2n,
        msg: { new_field: 'value' },
      })

      expect(msg.$typeName).toBe('cosmwasm.wasm.v1.MsgMigrateContract')
      expect(msg.sender).toBe(ADDR.ADMIN)
      expect(msg.codeId).toBe(2n)
    })
  })

  describe('createUpdateAdminMsg', () => {
    it('should create MsgUpdateAdmin', () => {
      const msg = createUpdateAdminMsg({
        sender: ADDR.OLDADMIN,
        contract: ADDR.CONTRACT,
        newAdmin: ADDR.NEWADMIN,
      })

      expect(msg.$typeName).toBe('cosmwasm.wasm.v1.MsgUpdateAdmin')
      expect(msg.newAdmin).toBe(ADDR.NEWADMIN)
    })
  })

  describe('createClearAdminMsg', () => {
    it('should create MsgClearAdmin', () => {
      const msg = createClearAdminMsg({
        sender: ADDR.ADMIN,
        contract: ADDR.CONTRACT,
      })

      expect(msg.$typeName).toBe('cosmwasm.wasm.v1.MsgClearAdmin')
      expect(msg.sender).toBe(ADDR.ADMIN)
    })
  })

  describe('queryContract', () => {
    it('should query contract directly', async () => {
      const mockWasmClient = createMockWasmClient()

      const result = await queryContract(createMockContext(mockWasmClient), ADDR.CONTRACT, {
        balance: { address: 'init1...' },
      })

      expect(result).toEqual({ balance: '1000000' })
    })
  })

  describe('getContractInfo (standalone)', () => {
    it('should get contract info directly', async () => {
      const mockWasmClient = createMockWasmClient()

      const info = await getContractInfo(createMockContext(mockWasmClient), ADDR.CONTRACT)

      expect(info.codeId).toBe(1n)
    })

    it('should throw if not found', async () => {
      const mockWasmClient = createMockWasmClient()
      mockWasmClient.contractInfo.mockResolvedValue({ contractInfo: null })

      await expect(getContractInfo(createMockContext(mockWasmClient), 'init1...')).rejects.toThrow(
        'Contract info not found'
      )
    })
  })

  describe('getRawContractState (standalone)', () => {
    it('should get raw state directly', async () => {
      const mockWasmClient = createMockWasmClient()

      const state = await getRawContractState(
        createMockContext(mockWasmClient),
        ADDR.CONTRACT,
        'config'
      )

      expect(state).toEqual(new Uint8Array([1, 2, 3]))
    })
  })

  describe('getCodeInfo', () => {
    it('should get code info', async () => {
      const mockWasmClient = createMockWasmClient()

      const result = await getCodeInfo(createMockContext(mockWasmClient), 1n)

      expect(result.codeInfo.codeId).toBe(1n)
      expect(result.data).toEqual(new Uint8Array([0, 97, 115, 109]))
    })

    it('should throw if code not found', async () => {
      const mockWasmClient = createMockWasmClient()
      mockWasmClient.code.mockResolvedValue({ codeInfo: null, data: new Uint8Array() })

      await expect(getCodeInfo(createMockContext(mockWasmClient), 999n)).rejects.toThrow(
        'Code not found'
      )
    })
  })

  describe('getContractsByCode', () => {
    it('should list contracts by code', async () => {
      const mockWasmClient = createMockWasmClient()

      const contracts = await getContractsByCode(createMockContext(mockWasmClient), 1n)

      expect(contracts).toEqual([ADDR.CONTRACT1, ADDR.CONTRACT2])
    })
  })
})
