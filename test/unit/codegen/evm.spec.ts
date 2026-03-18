import { describe, it, expect } from 'vitest'
import { generateEvmAbiFromJson } from '../../../src/codegen/evm'

// Minimal ERC-20-like ABI array
const RAW_ABI = [
  {
    type: 'function',
    name: 'balanceOf',
    stateMutability: 'view',
    inputs: [{ name: 'account', type: 'address' }],
    outputs: [{ name: '', type: 'uint256' }],
  },
  {
    type: 'function',
    name: 'transfer',
    stateMutability: 'nonpayable',
    inputs: [
      { name: 'to', type: 'address' },
      { name: 'amount', type: 'uint256' },
    ],
    outputs: [{ name: '', type: 'bool' }],
  },
  {
    type: 'event',
    name: 'Transfer',
    inputs: [
      { name: 'from', type: 'address', indexed: true },
      { name: 'to', type: 'address', indexed: true },
      { name: 'value', type: 'uint256', indexed: false },
    ],
  },
]

// Hardhat-style artifact with .abi field and contractName
const HARDHAT_ARTIFACT = {
  contractName: 'MyToken',
  abi: RAW_ABI,
  bytecode: '0x608060...',
  deployedBytecode: '0x608060...',
}

// Foundry-style artifact with .abi field and no contractName
const FOUNDRY_ARTIFACT = {
  abi: RAW_ABI,
  bytecode: { object: '0x608060...' },
}

describe('generateEvmAbiFromJson', () => {
  it('should generate valid TypeScript from raw ABI array', () => {
    const result = generateEvmAbiFromJson({ json: RAW_ABI })

    // Header comment
    expect(result).toContain('// EVM contract ABI')
    expect(result).toContain('// This file is auto-generated. Do not edit manually.')

    // Import statement
    expect(result).toContain("import type { Abi } from 'abitype'")

    // Default export name when no contractName
    expect(result).toContain('export const CONTRACT_ABI =')

    // Type assertion
    expect(result).toContain('as const satisfies Abi')

    // Contains function names from the ABI
    expect(result).toContain("'balanceOf'")
    expect(result).toContain("'transfer'")

    // Contains event name
    expect(result).toContain("'Transfer'")
  })

  it('should derive export name from Hardhat artifact contractName', () => {
    const result = generateEvmAbiFromJson({ json: HARDHAT_ARTIFACT })

    // Derived from "MyToken" -> "MY_TOKEN_ABI"
    expect(result).toContain('export const MY_TOKEN_ABI =')

    // Source comment references contract name
    expect(result).toContain('// EVM contract ABI: MyToken')

    // Still contains ABI content
    expect(result).toContain("'balanceOf'")
    expect(result).toContain("'transfer'")
  })

  it('should use custom export name when provided', () => {
    const result = generateEvmAbiFromJson({
      json: RAW_ABI,
      exportName: 'ERC20_TOKEN',
    })

    expect(result).toContain('export const ERC20_TOKEN =')
    // Should not contain default name
    expect(result).not.toContain('CONTRACT_ABI')
  })

  it('should prefer custom export name over contractName', () => {
    const result = generateEvmAbiFromJson({
      json: HARDHAT_ARTIFACT,
      exportName: 'CUSTOM_NAME',
    })

    expect(result).toContain('export const CUSTOM_NAME =')
    expect(result).not.toContain('MY_TOKEN_ABI')
  })

  it('should use Foundry artifact without contractName', () => {
    const result = generateEvmAbiFromJson({ json: FOUNDRY_ARTIFACT })

    // No contractName, falls back to default
    expect(result).toContain('export const CONTRACT_ABI =')
    expect(result).toContain("'balanceOf'")
  })

  it('should throw when input is not array and has no .abi field', () => {
    expect(() => generateEvmAbiFromJson({ json: { foo: 'bar' } })).toThrow()
  })

  it('should throw when input is a primitive', () => {
    expect(() => generateEvmAbiFromJson({ json: 'not an abi' })).toThrow()
    expect(() => generateEvmAbiFromJson({ json: 42 })).toThrow()
    expect(() => generateEvmAbiFromJson({ json: null })).toThrow()
    expect(() => generateEvmAbiFromJson({ json: true })).toThrow()
  })

  it('should throw when artifact .abi is not an array', () => {
    expect(() => generateEvmAbiFromJson({ json: { abi: 'not-an-array' } })).toThrow()

    expect(() => generateEvmAbiFromJson({ json: { abi: { notAnArray: true } } })).toThrow()
  })

  it('should handle empty ABI array', () => {
    const result = generateEvmAbiFromJson({ json: [] })

    expect(result).toContain('export const CONTRACT_ABI =')
    expect(result).toContain('[]')
    expect(result).toContain('as const satisfies Abi')
  })

  it('should preserve all ABI item fields in output', () => {
    const result = generateEvmAbiFromJson({ json: RAW_ABI })

    // Function fields
    expect(result).toContain("type: 'function'")
    expect(result).toContain("stateMutability: 'view'")
    expect(result).toContain("stateMutability: 'nonpayable'")
    expect(result).toContain('inputs:')
    expect(result).toContain('outputs:')

    // Event fields
    expect(result).toContain("type: 'event'")
    expect(result).toContain('indexed: true')
    expect(result).toContain('indexed: false')
  })
})
