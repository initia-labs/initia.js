/**
 * Integration tests for Smart Contract Helpers.
 *
 * These tests connect to actual testnets.
 * They may fail if the network is unavailable.
 *
 * Skip with: SKIP_INTEGRATION_TESTS=true npm test
 */

import { describe, it, expect, beforeAll } from 'vitest'
import { bytesToHex } from '@noble/hashes/utils.js'
import { createRegistryProvider } from '../../src/provider/registry-provider'
import { createClient } from '../../src/entry.node'
import { createEvmContract } from '../../src/contracts/evm/contract'
import type { EvmContract } from '../../src/contracts/evm/types'
import { createMoveContract } from '../../src/contracts/move/contract'
import { createWasmContract } from '../../src/contracts/wasm/contract'
import { AccAddress, isValidEvmAddress } from '../../src/util/address'
import type { ChainInfo } from '../../src/provider/types'
import type { InitiaClient, MinievmClient, MiniwasmClient } from '../../src/client/types'

// Skip integration tests if environment variable is set
const SKIP = process.env.SKIP_INTEGRATION_TESTS === 'true'

// Sample ERC20 ABI (with read and write functions)
const ERC20_ABI = [
  {
    type: 'function',
    name: 'name',
    inputs: [],
    outputs: [{ name: '', type: 'string' }],
    stateMutability: 'view',
  },
  {
    type: 'function',
    name: 'symbol',
    inputs: [],
    outputs: [{ name: '', type: 'string' }],
    stateMutability: 'view',
  },
  {
    type: 'function',
    name: 'decimals',
    inputs: [],
    outputs: [{ name: '', type: 'uint8' }],
    stateMutability: 'view',
  },
  {
    type: 'function',
    name: 'balanceOf',
    inputs: [{ name: 'account', type: 'address' }],
    outputs: [{ name: '', type: 'uint256' }],
    stateMutability: 'view',
  },
  {
    type: 'function',
    name: 'totalSupply',
    inputs: [],
    outputs: [{ name: '', type: 'uint256' }],
    stateMutability: 'view',
  },
  {
    type: 'function',
    name: 'transfer',
    inputs: [
      { name: 'to', type: 'address' },
      { name: 'amount', type: 'uint256' },
    ],
    outputs: [{ name: '', type: 'bool' }],
    stateMutability: 'nonpayable',
  },
  {
    type: 'function',
    name: 'approve',
    inputs: [
      { name: 'spender', type: 'address' },
      { name: 'amount', type: 'uint256' },
    ],
    outputs: [{ name: '', type: 'bool' }],
    stateMutability: 'nonpayable',
  },
] as const

describe.skipIf(SKIP)('Smart Contract Integration Tests', () => {
  let initiaChainInfo: ChainInfo
  let initiaClient: InitiaClient

  beforeAll(async () => {
    const provider = await createRegistryProvider({ network: 'testnet' })
    const chains = provider.listChains()

    // Find Initia L1 testnet
    const initia = chains.find(c => c.chainType === 'initia')
    if (!initia) {
      throw new Error('No Initia L1 testnet found')
    }
    initiaChainInfo = initia
    initiaClient = createClient(initiaChainInfo) as InitiaClient
  }, 30000)

  describe('Address Utilities Integration', () => {
    describe('AccAddress', () => {
      it('should convert EVM address to bech32', () => {
        const evmAddress = '0x1234567890123456789012345678901234567890'
        const bech32 = AccAddress.fromHex(evmAddress, { prefix: 'init' })

        expect(bech32).toBeDefined()
        expect(bech32.startsWith('init1')).toBe(true)
      })

      it('should convert bech32 to EVM address', () => {
        const bech32 = 'init1zg69v7yszg69v7yszg69v7yszg69v7ysmdpetk'
        const evmAddress = AccAddress.toHex(bech32)

        expect(evmAddress).toBeDefined()
        expect(isValidEvmAddress(evmAddress)).toBe(true)
      })

      it('should round-trip convert addresses', () => {
        const original = '0x1234567890123456789012345678901234567890'
        const bech32 = AccAddress.fromHex(original, { prefix: 'init' })
        const recovered = AccAddress.toHex(bech32)

        expect(recovered.toLowerCase()).toBe(original.toLowerCase())
      })
    })
  })

  describe('Move Contract Integration', () => {
    // Module address 0x1 contains standard Move modules
    const MODULE_ADDRESS = '0x1'
    const MODULE_NAME = 'coin'

    describe('createMoveContract', () => {
      it('should create Move contract instance', async () => {
        // createMoveContract expects a context with client property
        const coin = await createMoveContract({ client: initiaClient }, MODULE_ADDRESS, MODULE_NAME)

        expect(coin).toBeDefined()
        expect(coin.moduleAddress).toBe(MODULE_ADDRESS)
        expect(coin.moduleName).toBe(MODULE_NAME)
      }, 30000)

      it('should fetch module ABI', async () => {
        const coin = await createMoveContract({ client: initiaClient }, MODULE_ADDRESS, MODULE_NAME)

        expect(coin.abi).toBeDefined()
        expect(coin.abi?.name).toBe(MODULE_NAME)
      }, 30000)

      it('should have view proxy for view functions', async () => {
        const coin = await createMoveContract({ client: initiaClient }, MODULE_ADDRESS, MODULE_NAME)

        expect(coin.view).toBeDefined()
        // The view proxy should allow calling view functions
      }, 30000)

      it('should have execute proxy for entry functions', async () => {
        const coin = await createMoveContract({ client: initiaClient }, MODULE_ADDRESS, MODULE_NAME)

        expect(coin.execute).toBeDefined()
      }, 30000)
    })
  })
})

// Minievm integration tests (requires minievm rollup)
describe.skipIf(SKIP)('EVM Contract Integration (Minievm)', () => {
  let minievmChainInfo: ChainInfo | undefined
  let minievmClient: MinievmClient | undefined

  beforeAll(async () => {
    const provider = await createRegistryProvider({ network: 'testnet' })
    const chains = provider.listChains()

    const minievm = chains.find(c => c.chainType === 'minievm')
    if (!minievm) {
      throw new Error('No minievm chain found in testnet registry')
    }
    minievmChainInfo = minievm
    minievmClient = createClient(minievmChainInfo) as MinievmClient
  }, 30000)

  describe('createEvmContract', () => {
    it('should create EVM contract instance', async () => {
      if (!minievmClient || !minievmChainInfo) {
        console.warn('Skipping: Minievm chain not available')
        return
      }

      // createEvmContract expects a context with client property
      const mockAddress = '0x1234567890123456789012345678901234567890'
      const erc20 = createEvmContract({ client: minievmClient }, mockAddress, ERC20_ABI)

      expect(erc20).toBeDefined()
      expect(erc20.address).toBe(mockAddress)
      expect(erc20.read).toBeDefined()
      expect(erc20.write).toBeDefined()
    })
  })

  describe('ERC20 Read Operations', () => {
    // Known ERC20 contract addresses to try (common wrapped token addresses)
    const POTENTIAL_ERC20_ADDRESSES = [
      // Anvil testnet wrapped IBC token (confirmed working)
      '0x2eE7007DF876084d4C74685e90bB7f4cd7c86e22',
      '0x0000000000000000000000000000000000000001', // System precompile
      '0x0000000000000000000000000000000000001000', // Common wrapped token
      '0x0000000000000000000000000000000000001001', // Alternative
    ]

    it('should read ERC20 token info when contract exists', async () => {
      if (!minievmClient) {
        console.warn('Skipping: Minievm chain not available')
        return
      }

      // Try to find a working ERC20 contract
      let workingContract: EvmContract<typeof ERC20_ABI> | null = null
      let workingAddress = ''

      for (const addr of POTENTIAL_ERC20_ADDRESSES) {
        try {
          const contract = createEvmContract({ client: minievmClient }, addr, ERC20_ABI)
          // Try to call a view function
          await contract.read.name()
          workingContract = contract
          workingAddress = addr
          break
        } catch {
          // This address doesn't have an ERC20 contract, try next
          continue
        }
      }

      if (!workingContract) {
        console.warn('Skipping: No ERC20 contract found at known addresses')
        return
      }

      console.log(`Found ERC20 contract at: ${workingAddress}`)

      // Test all read functions
      const name = await workingContract.read.name()
      expect(typeof name).toBe('string')
      console.log(`  Name: ${name}`)

      const symbol = await workingContract.read.symbol()
      expect(typeof symbol).toBe('string')
      console.log(`  Symbol: ${symbol}`)

      const decimals = await workingContract.read.decimals()
      expect(typeof decimals).toBe('number')
      expect(decimals).toBeGreaterThanOrEqual(0)
      expect(decimals).toBeLessThanOrEqual(18)
      console.log(`  Decimals: ${decimals}`)

      const totalSupply = await workingContract.read.totalSupply()
      expect(typeof totalSupply).toBe('bigint')
      console.log(`  Total Supply: ${totalSupply}`)
    }, 60000)

    it('should read balanceOf for any address', async () => {
      if (!minievmClient) {
        console.warn('Skipping: Minievm chain not available')
        return
      }

      // Try to find a working ERC20 contract
      let workingContract: EvmContract<typeof ERC20_ABI> | null = null

      for (const addr of POTENTIAL_ERC20_ADDRESSES) {
        try {
          const contract = createEvmContract({ client: minievmClient }, addr, ERC20_ABI)
          await contract.read.name()
          workingContract = contract
          break
        } catch {
          continue
        }
      }

      if (!workingContract) {
        console.warn('Skipping: No ERC20 contract found')
        return
      }

      // Query balance for a random address
      const testAddress = '0x1234567890123456789012345678901234567890'
      const balance = await workingContract.read.balanceOf(testAddress)

      expect(typeof balance).toBe('bigint')
      expect(balance).toBeGreaterThanOrEqual(0n)
      console.log(`Balance of ${testAddress}: ${balance}`)
    }, 60000)

    it('should use getTokenInfo helper', async () => {
      if (!minievmClient) {
        console.warn('Skipping: Minievm chain not available')
        return
      }

      // Try to find a working ERC20 contract
      let workingContract: EvmContract<typeof ERC20_ABI> | null = null

      for (const addr of POTENTIAL_ERC20_ADDRESSES) {
        try {
          const contract = createEvmContract({ client: minievmClient }, addr, ERC20_ABI)
          await contract.read.name()
          workingContract = contract
          break
        } catch {
          continue
        }
      }

      if (!workingContract) {
        console.warn('Skipping: No ERC20 contract found')
        return
      }

      // Use the convenience helper
      const tokenInfo = await workingContract.getTokenInfo()

      expect(tokenInfo).toBeDefined()
      expect(typeof tokenInfo.name).toBe('string')
      expect(typeof tokenInfo.symbol).toBe('string')
      expect(typeof tokenInfo.decimals).toBe('number')
      // totalSupply may or may not be present depending on ABI
      console.log('Token Info:', tokenInfo)
    }, 60000)

    it('should create write message without sending', async () => {
      if (!minievmClient) {
        console.warn('Skipping: Minievm chain not available')
        return
      }

      // Create contract instance
      const sender = 'init1q6dd2frhtlh27lhlset9ggq5x35ekj593qhee4'
      const contract = createEvmContract(
        { client: minievmClient },
        '0x1234567890123456789012345678901234567890',
        ERC20_ABI
      )

      // Create transfer message (sender passed per-call)
      const recipient = '0xabcdefabcdefabcdefabcdefabcdefabcdefabcd'
      const amount = 1000000n

      const msg = contract.write.transfer(sender, recipient, amount)

      expect(msg).toBeDefined()
      expect(msg.value.$typeName).toBe('minievm.evm.v1.MsgCall')
      expect(msg.value.sender).toBe(sender)
      console.log('Transfer message created successfully')
    })
  })
})

// Miniwasm integration tests (specifically using wasm-1 rollup)
describe.skipIf(SKIP)('Wasm Contract Integration (wasm-1)', () => {
  let miniwasmChainInfo: ChainInfo | undefined
  let miniwasmClient: MiniwasmClient | undefined

  beforeAll(async () => {
    const provider = await createRegistryProvider({ network: 'testnet' })
    const chains = provider.listChains()

    // Prefer wasm-1, fallback to any miniwasm chain
    const wasm1 = chains.find(c => c.chainId === 'wasm-1')
    const miniwasm = wasm1 ?? chains.find(c => c.chainType === 'miniwasm')
    if (!miniwasm) {
      throw new Error('No miniwasm chain found in testnet registry')
    }
    miniwasmChainInfo = miniwasm
    miniwasmClient = createClient(miniwasmChainInfo) as MiniwasmClient
    console.log(`Connected to ${miniwasm.chainId} at ${miniwasm.grpc}`)
  }, 30000)

  describe('createWasmContract', () => {
    it('should create Wasm contract instance', async () => {
      if (!miniwasmClient || !miniwasmChainInfo) {
        console.warn('Skipping: Miniwasm chain not available')
        return
      }

      // createWasmContract expects a context with client property
      // Use a valid bech32 address for testing
      const mockAddress = 'init1q6dd2frhtlh27lhlset9ggq5x35ekj593qhee4'
      const cw20 = createWasmContract({ client: miniwasmClient }, mockAddress)

      expect(cw20).toBeDefined()
      expect(cw20.contractAddress).toBe(mockAddress)
      expect(cw20.query).toBeDefined()
      expect(cw20.execute).toBeDefined()
    })
  })

  describe('Wasm Query Operations', () => {
    it('should query wasm module params', async () => {
      if (!miniwasmClient) {
        console.warn('Skipping: Miniwasm chain not available')
        return
      }

      const params = await miniwasmClient.wasm.params({})

      expect(params).toBeDefined()
      expect(params.params).toBeDefined()
      console.log('Wasm params:', params.params)
    }, 30000)

    it('should list all uploaded wasm codes', async () => {
      if (!miniwasmClient) {
        console.warn('Skipping: Miniwasm chain not available')
        return
      }

      const codesResponse = await miniwasmClient.wasm.codes({
        pagination: { limit: 10n },
      })

      expect(codesResponse).toBeDefined()
      expect(codesResponse.codeInfos).toBeDefined()
      console.log(`Found ${codesResponse.codeInfos.length} wasm codes`)

      if (codesResponse.codeInfos.length > 0) {
        const firstCode = codesResponse.codeInfos[0]
        console.log(`  First code - ID: ${firstCode.codeId}, Creator: ${firstCode.creator}`)
      }
    }, 30000)

    it('should get code info for specific code ID', async () => {
      if (!miniwasmClient) {
        console.warn('Skipping: Miniwasm chain not available')
        return
      }

      // First get available codes
      const codesResponse = await miniwasmClient.wasm.codes({
        pagination: { limit: 1n },
      })

      if (codesResponse.codeInfos.length === 0) {
        console.warn('Skipping: No wasm codes found on chain')
        return
      }

      const codeId = codesResponse.codeInfos[0].codeId
      const codeInfo = await miniwasmClient.wasm.codeInfo({ codeId })

      expect(codeInfo).toBeDefined()
      expect(codeInfo.codeId).toBe(codeId)
      expect(codeInfo.creator).toBeDefined()
      console.log(`Code ${codeId} info:`, {
        creator: codeInfo.creator,
        checksumHex: bytesToHex(codeInfo.checksum).slice(0, 16) + '...',
      })
    }, 30000)

    it('should list contracts instantiated from a code', async () => {
      if (!miniwasmClient) {
        console.warn('Skipping: Miniwasm chain not available')
        return
      }

      // First get available codes
      const codesResponse = await miniwasmClient.wasm.codes({
        pagination: { limit: 10n },
      })

      if (codesResponse.codeInfos.length === 0) {
        console.warn('Skipping: No wasm codes found on chain')
        return
      }

      // Try each code until we find one with contracts
      let foundContracts = false
      for (const codeInfo of codesResponse.codeInfos) {
        const contractsResponse = await miniwasmClient.wasm.contractsByCode({
          codeId: codeInfo.codeId,
          pagination: { limit: 5n },
        })

        if (contractsResponse.contracts.length > 0) {
          console.log(
            `Code ${codeInfo.codeId} has ${contractsResponse.contracts.length} contracts:`
          )
          contractsResponse.contracts.forEach((addr, i) => {
            console.log(`  [${i}] ${addr}`)
          })
          foundContracts = true
          break
        }
      }

      expect(foundContracts).toBe(true)
    }, 60000)

    it('should query contract info for deployed contract', async () => {
      if (!miniwasmClient) {
        console.warn('Skipping: Miniwasm chain not available')
        return
      }

      // Find a deployed contract
      const codesResponse = await miniwasmClient.wasm.codes({
        pagination: { limit: 10n },
      })

      let contractAddress: string | undefined

      for (const codeInfo of codesResponse.codeInfos) {
        const contractsResponse = await miniwasmClient.wasm.contractsByCode({
          codeId: codeInfo.codeId,
          pagination: { limit: 1n },
        })

        if (contractsResponse.contracts.length > 0) {
          contractAddress = contractsResponse.contracts[0]
          break
        }
      }

      if (!contractAddress) {
        console.warn('Skipping: No deployed contracts found')
        return
      }

      const contractInfo = await miniwasmClient.wasm.contractInfo({
        address: contractAddress,
      })

      expect(contractInfo).toBeDefined()
      expect(contractInfo.contractInfo).toBeDefined()
      expect(contractInfo.address).toBe(contractAddress)

      console.log('Contract info:', {
        address: contractAddress,
        codeId: contractInfo.contractInfo?.codeId,
        creator: contractInfo.contractInfo?.creator,
        admin: contractInfo.contractInfo?.admin || '(none)',
        label: contractInfo.contractInfo?.label,
      })
    }, 60000)

    it('should query contract history', async () => {
      if (!miniwasmClient) {
        console.warn('Skipping: Miniwasm chain not available')
        return
      }

      // Find a deployed contract
      const codesResponse = await miniwasmClient.wasm.codes({
        pagination: { limit: 10n },
      })

      let contractAddress: string | undefined

      for (const codeInfo of codesResponse.codeInfos) {
        const contractsResponse = await miniwasmClient.wasm.contractsByCode({
          codeId: codeInfo.codeId,
          pagination: { limit: 1n },
        })

        if (contractsResponse.contracts.length > 0) {
          contractAddress = contractsResponse.contracts[0]
          break
        }
      }

      if (!contractAddress) {
        console.warn('Skipping: No deployed contracts found')
        return
      }

      const history = await miniwasmClient.wasm.contractHistory({
        address: contractAddress,
      })

      expect(history).toBeDefined()
      expect(history.entries).toBeDefined()
      expect(history.entries.length).toBeGreaterThan(0)

      console.log(`Contract ${contractAddress} history:`)
      history.entries.forEach((entry, i) => {
        console.log(`  [${i}] CodeID: ${entry.codeId}, Operation: ${entry.operation}`)
      })
    }, 60000)
  })

  describe('CW20 Query Operations', () => {
    it('should query CW20 token info if contract exists', async () => {
      if (!miniwasmClient) {
        console.warn('Skipping: Miniwasm chain not available')
        return
      }

      // Find deployed contracts
      const codesResponse = await miniwasmClient.wasm.codes({
        pagination: { limit: 20n },
      })

      let cw20ContractAddress: string | undefined

      // Try each contract to see if it's a CW20
      for (const codeInfo of codesResponse.codeInfos) {
        const contractsResponse = await miniwasmClient.wasm.contractsByCode({
          codeId: codeInfo.codeId,
          pagination: { limit: 3n },
        })

        for (const contractAddr of contractsResponse.contracts) {
          try {
            const contract = createWasmContract({ client: miniwasmClient }, contractAddr)
            // Try to query token_info - if it works, it's a CW20
            const tokenInfo = await contract.getTokenInfo()
            if (tokenInfo.name && tokenInfo.symbol) {
              cw20ContractAddress = contractAddr
              console.log(`Found CW20 contract at ${contractAddr}:`)
              console.log(`  Name: ${tokenInfo.name}`)
              console.log(`  Symbol: ${tokenInfo.symbol}`)
              console.log(`  Decimals: ${tokenInfo.decimals}`)
              if (tokenInfo.totalSupply !== undefined) {
                console.log(`  Total Supply: ${tokenInfo.totalSupply}`)
              }
              break
            }
          } catch {
            // Not a CW20 contract, continue searching
          }
        }

        if (cw20ContractAddress) break
      }

      if (!cw20ContractAddress) {
        console.warn('Skipping: No CW20 contracts found on chain')
        return
      }

      // Query using the createWasmContract factory
      const cw20 = createWasmContract({ client: miniwasmClient }, cw20ContractAddress)

      // Test proxy-based query
      const tokenInfo = await cw20.query.token_info()
      expect(tokenInfo).toBeDefined()

      // Test convenience method
      const tokenInfoHelper = await cw20.getTokenInfo()
      expect(tokenInfoHelper.name).toBeDefined()
      expect(tokenInfoHelper.symbol).toBeDefined()
      expect(typeof tokenInfoHelper.decimals).toBe('number')
    }, 120000)

    it('should query CW20 balance', async () => {
      if (!miniwasmClient) {
        console.warn('Skipping: Miniwasm chain not available')
        return
      }

      // Find a CW20 contract
      const codesResponse = await miniwasmClient.wasm.codes({
        pagination: { limit: 20n },
      })

      let cw20ContractAddress: string | undefined

      for (const codeInfo of codesResponse.codeInfos) {
        const contractsResponse = await miniwasmClient.wasm.contractsByCode({
          codeId: codeInfo.codeId,
          pagination: { limit: 3n },
        })

        for (const contractAddr of contractsResponse.contracts) {
          try {
            const contract = createWasmContract({ client: miniwasmClient }, contractAddr)
            await contract.getTokenInfo()
            cw20ContractAddress = contractAddr
            break
          } catch {
            // Not a CW20
          }
        }

        if (cw20ContractAddress) break
      }

      if (!cw20ContractAddress) {
        console.warn('Skipping: No CW20 contracts found')
        return
      }

      const cw20 = createWasmContract({ client: miniwasmClient }, cw20ContractAddress)

      // Query balance for a random address
      const testAddress = 'init1q6dd2frhtlh27lhlset9ggq5x35ekj593qhee4'
      const balanceResult = (await cw20.query.balance({ address: testAddress })) as {
        balance: string
      }

      expect(balanceResult).toBeDefined()
      expect(balanceResult.balance).toBeDefined()
      console.log(`Balance of ${testAddress}: ${balanceResult.balance}`)
    }, 120000)
  })
})

// Cross-platform tests
describe.skipIf(SKIP)('Cross-Platform Integration', () => {
  describe('Address Conversion', () => {
    it('should convert between EVM and bech32 addresses', () => {
      const evmAddress = '0x1234567890123456789012345678901234567890'

      // Convert to bech32
      const bech32Address = AccAddress.fromHex(evmAddress, { prefix: 'init' })
      expect(bech32Address).toBeDefined()
      expect(bech32Address.startsWith('init1')).toBe(true)

      // Convert back to EVM
      const recoveredEvmAddress = AccAddress.toHex(bech32Address)
      expect(recoveredEvmAddress.toLowerCase()).toBe(evmAddress.toLowerCase())
    })

    it('should support different bech32 prefixes', () => {
      const evmAddress = '0x1234567890123456789012345678901234567890'

      // Different prefixes
      const initAddress = AccAddress.fromHex(evmAddress, { prefix: 'init' })
      const cosmosAddress = AccAddress.fromHex(evmAddress, { prefix: 'cosmos' })
      const celestiaAddress = AccAddress.fromHex(evmAddress, { prefix: 'celestia' })

      expect(initAddress.startsWith('init1')).toBe(true)
      expect(cosmosAddress.startsWith('cosmos1')).toBe(true)
      expect(celestiaAddress.startsWith('celestia1')).toBe(true)

      // All should convert back to the same EVM address
      expect(AccAddress.toHex(initAddress).toLowerCase()).toBe(evmAddress.toLowerCase())
      expect(AccAddress.toHex(cosmosAddress).toLowerCase()).toBe(evmAddress.toLowerCase())
      expect(AccAddress.toHex(celestiaAddress).toLowerCase()).toBe(evmAddress.toLowerCase())
    })
  })

  describe('Address Validation', () => {
    it('should validate EVM addresses', () => {
      // All-lowercase (no checksum, always valid)
      expect(isValidEvmAddress('0x1234567890123456789012345678901234567890')).toBe(true)
      // All-lowercase hex with letters
      expect(isValidEvmAddress('0xabcdefabcdefabcdefabcdefabcdefabcdefabcd')).toBe(true)
      // Invalid inputs
      expect(isValidEvmAddress('invalid')).toBe(false)
      expect(isValidEvmAddress('0x123')).toBe(false) // Too short
      // Note: Mixed-case addresses are validated against EIP-55 checksum by viem
    })

    it('should validate bech32 addresses', () => {
      const validAddress = AccAddress.fromHex('0x1234567890123456789012345678901234567890', {
        prefix: 'init',
      })
      expect(AccAddress.isValidBech32(validAddress)).toBe(true)
      expect(AccAddress.isValidBech32('invalid')).toBe(false)
    })
  })
})
