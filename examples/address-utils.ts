/**
 * Example: Address Utilities
 *
 * This example demonstrates how to:
 * 1. Convert between EVM (0x) and Bech32 address formats
 * 2. Validate EVM and Bech32 addresses
 * 3. Generate checksum addresses
 * 4. Use getAddressProfile to detect address types
 */

import { createInitiaContext } from 'initia.js'
import { getAddressProfile } from 'initia.js/client'
import { AccAddress, isValidEvmAddress, toChecksumAddress } from 'initia.js/util'
import { SENDER, RECIPIENT } from './constants'

// =============================================================================
// Address Format Conversion
// =============================================================================

function addressConversionExample() {
  console.log('=== Address Conversion ===\n')

  // EVM address (0x-prefixed, 40 hex characters)
  const evmAddress = SENDER.evm

  // Convert EVM to Bech32 with 'init' prefix
  const initAddress = AccAddress.fromHex(evmAddress, { prefix: 'init' })
  console.log(`EVM address: ${evmAddress}`)
  console.log(`Init address: ${initAddress}`)

  // Convert back to EVM
  const recoveredEvm = AccAddress.toHex(initAddress)
  console.log(`Recovered EVM: ${recoveredEvm}`)
  console.log(`Match: ${recoveredEvm.toLowerCase() === evmAddress.toLowerCase()}\n`)

  // Different Bech32 prefixes
  const cosmosAddress = AccAddress.fromHex(evmAddress, { prefix: 'cosmos' })
  const celestiaAddress = AccAddress.fromHex(evmAddress, { prefix: 'celestia' })
  const osmosisAddress = AccAddress.fromHex(evmAddress, { prefix: 'osmo' })

  console.log('Same address with different prefixes:')
  console.log(`  Cosmos: ${cosmosAddress}`)
  console.log(`  celestia: ${celestiaAddress}`)
  console.log(`  Osmosis: ${osmosisAddress}`)

  // All convert back to the same EVM address
  console.log(`\nAll convert to: ${AccAddress.toHex(cosmosAddress)}`)
}

// =============================================================================
// Address Validation
// =============================================================================

function addressValidationExample() {
  console.log('\n=== Address Validation ===\n')

  // EVM address validation
  console.log('EVM Address Validation:')
  const validEvm = SENDER.evm
  const invalidEvm1 = '0x123' // Too short
  const invalidEvm2 = 'init1...' // Not EVM format
  const invalidEvm3 = '1234567890123456789012345678901234567890' // Missing 0x prefix

  console.log(`  ${validEvm}: ${isValidEvmAddress(validEvm)}`)
  console.log(`  ${invalidEvm1}: ${isValidEvmAddress(invalidEvm1)}`)
  console.log(`  ${invalidEvm2}: ${isValidEvmAddress(invalidEvm2)}`)
  console.log(`  ${invalidEvm3}: ${isValidEvmAddress(invalidEvm3)}`)

  // Bech32 address validation
  console.log('\nBech32 Address Validation:')
  const validBech32 = AccAddress.fromHex(validEvm, { prefix: 'init' })
  const invalidBech32 = 'invalid_address'

  console.log(`  ${validBech32}: ${AccAddress.isValidBech32(validBech32)}`)
  console.log(`  ${invalidBech32}: ${AccAddress.isValidBech32(invalidBech32)}`)

  // Validate with specific prefix
  console.log(
    `  ${validBech32} (with init prefix): ${AccAddress.isValidBech32(validBech32, 'init')}`
  )
  console.log(
    `  ${validBech32} (with cosmos prefix): ${AccAddress.isValidBech32(validBech32, 'cosmos')}`
  )
}

// =============================================================================
// Checksum Addresses
// =============================================================================

function checksumAddressExample() {
  console.log('\n=== Checksum Addresses (EIP-55) ===\n')

  // EIP-55 checksum encoding adds uppercase letters based on address hash
  const lowercaseAddress = RECIPIENT.evm

  try {
    const checksumAddress = toChecksumAddress(lowercaseAddress)
    console.log(`Lowercase: ${lowercaseAddress}`)
    console.log(`Checksum:  ${checksumAddress}`)

    // Note: Checksum addresses have mixed case based on the hash
    // This helps detect typos when entering addresses manually
  } catch (error) {
    console.log('Checksum error:', error)
  }
}

// =============================================================================
// Address Type Detection (getAddressProfile)
// =============================================================================

async function addressInfoExample() {
  console.log('\n=== Address Type Detection ===\n')

  try {
    // Connect to Initia testnet
    const ctx = await createInitiaContext({ network: 'testnet' })

    // Example addresses to check
    const addresses = [
      '0x0000000000000000000000000000000000000001', // System address (0x1)
      'init1q6dd2frhtlh27lhlset9ggq5x35ekj593qhee4', // Regular account
    ]

    for (const address of addresses) {
      console.log(`Checking: ${address}`)
      const profile = await getAddressProfile(ctx, address)
      console.log(`  Contract Type: ${profile.contract}`)
      console.log(`  Account Type: ${profile.account ?? 'unknown'}`)

      if (profile.contract === 'evm' && 'codeSize' in profile) {
        console.log(`  EVM Code Size: ${profile.codeSize} bytes`)
      }
      if (profile.contract === 'move' && 'modules' in profile) {
        console.log(`  Move Modules: ${profile.modules.join(', ')}`)
      }
      if (profile.contract === 'wasm' && 'codeId' in profile) {
        console.log(`  Wasm Code ID: ${profile.codeId}`)
      }
      console.log()
    }
  } catch (error) {
    console.log('Address info example requires network connection:', error)
  }
}

// =============================================================================
// Practical Use Cases
// =============================================================================

function practicalExamples() {
  console.log('\n=== Practical Use Cases ===\n')

  // 1. Normalize user input
  function normalizeAddress(input: string): string {
    if (isValidEvmAddress(input)) {
      // Return checksum version
      return toChecksumAddress(input)
    }
    if (AccAddress.isValidBech32(input)) {
      // Return as-is
      return input
    }
    throw new Error('Invalid address format')
  }

  console.log('Address normalization:')
  console.log(`  Input: ${RECIPIENT.evm} => ${normalizeAddress(RECIPIENT.evm)}`)

  // 2. Convert for cross-chain use
  function toCosmosFormat(address: string): string {
    if (isValidEvmAddress(address)) {
      return AccAddress.fromHex(address, { prefix: 'cosmos' })
    }
    // Already bech32, convert to cosmos prefix
    const evmHex = AccAddress.toHex(address)
    return AccAddress.fromHex(evmHex, { prefix: 'cosmos' })
  }

  const evmAddr = SENDER.evm
  console.log(`\nCross-chain conversion:`)
  console.log(`  EVM: ${evmAddr}`)
  console.log(`  Cosmos: ${toCosmosFormat(evmAddr)}`)

  // 3. Address comparison (case-insensitive for EVM)
  function addressesEqual(a: string, b: string): boolean {
    // Convert both to lowercase EVM format for comparison
    const normalizeToEvm = (addr: string) => {
      if (isValidEvmAddress(addr)) {
        return addr.toLowerCase()
      }
      return AccAddress.toHex(addr).toLowerCase()
    }
    return normalizeToEvm(a) === normalizeToEvm(b)
  }

  const addr1 = SENDER.evm
  const addr2 = AccAddress.fromHex(addr1, { prefix: 'init' })
  console.log(`\nAddress comparison:`)
  console.log(`  ${addr1} === ${addr2}: ${addressesEqual(addr1, addr2)}`)
}

// Run examples
addressConversionExample()
addressValidationExample()
checksumAddressExample()
practicalExamples()

// Async examples (require network)
addressInfoExample().catch(console.error)
