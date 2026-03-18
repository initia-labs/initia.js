/**
 * Unit tests for EVM event decoding utilities.
 */

import { describe, it, expect } from 'vitest'
import {
  decodeEvmLog,
  decodeEvmLogs,
  filterEvmLogsByEvent,
  getEventSignature,
} from '../../../../src/contracts/evm'
import type { EvmLog } from '../../../../src/client/evm-rpc'

// Sample ERC20 ABI for testing
const erc20Abi = [
  {
    type: 'event',
    name: 'Transfer',
    inputs: [
      { name: 'from', type: 'address', indexed: true },
      { name: 'to', type: 'address', indexed: true },
      { name: 'value', type: 'uint256', indexed: false },
    ],
  },
  {
    type: 'event',
    name: 'Approval',
    inputs: [
      { name: 'owner', type: 'address', indexed: true },
      { name: 'spender', type: 'address', indexed: true },
      { name: 'value', type: 'uint256', indexed: false },
    ],
  },
] as const

// Transfer event topic: keccak256("Transfer(address,address,uint256)")
const TRANSFER_TOPIC = '0xddf252ad1be2c89b69c2b068fc378daa952ba7f163c4a11628f55a4df523b3ef'

// Sample Transfer event log
const sampleTransferLog: EvmLog = {
  address: '0x1234567890123456789012345678901234567890',
  topics: [
    TRANSFER_TOPIC,
    '0x0000000000000000000000001111111111111111111111111111111111111111', // from
    '0x0000000000000000000000002222222222222222222222222222222222222222', // to
  ],
  data: '0x00000000000000000000000000000000000000000000000000000000000003e8', // 1000
  blockNumber: '0x100',
  transactionHash: '0xabcd',
  transactionIndex: '0x1',
  blockHash: '0xblock',
  logIndex: '0x5',
  removed: false,
}

// Approval event topic: keccak256("Approval(address,address,uint256)")
const APPROVAL_TOPIC = '0x8c5be1e5ebec7d5bd14f71427d1e84f3dd0314c0f7b2291e5b200ac8c7c3b925'

// Sample Approval event log
const sampleApprovalLog: EvmLog = {
  address: '0x1234567890123456789012345678901234567890',
  topics: [
    APPROVAL_TOPIC,
    '0x0000000000000000000000001111111111111111111111111111111111111111', // owner
    '0x0000000000000000000000003333333333333333333333333333333333333333', // spender
  ],
  data: '0xffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffff', // max uint256
  blockNumber: '0x101',
  transactionHash: '0xefgh',
  transactionIndex: '0x2',
  blockHash: '0xblock2',
  logIndex: '0x0',
  removed: false,
}

describe('EVM Event Utilities', () => {
  describe('decodeEvmLog', () => {
    it('should decode a Transfer event log', () => {
      const decoded = decodeEvmLog(erc20Abi, sampleTransferLog)

      expect(decoded.eventName).toBe('Transfer')
      expect(decoded.log).toBe(sampleTransferLog)
      expect(decoded.blockNumber).toBe(256n) // 0x100
      expect(decoded.transactionIndex).toBe(1)
      expect(decoded.logIndex).toBe(5)

      const args = decoded.args as { from: string; to: string; value: bigint }
      expect(args.from.toLowerCase()).toBe('0x1111111111111111111111111111111111111111')
      expect(args.to.toLowerCase()).toBe('0x2222222222222222222222222222222222222222')
      expect(args.value).toBe(1000n)
    })

    it('should decode an Approval event log', () => {
      const decoded = decodeEvmLog(erc20Abi, sampleApprovalLog)

      expect(decoded.eventName).toBe('Approval')
      expect(decoded.blockNumber).toBe(257n) // 0x101
      expect(decoded.transactionIndex).toBe(2)
      expect(decoded.logIndex).toBe(0)

      const args = decoded.args as { owner: string; spender: string; value: bigint }
      expect(args.owner.toLowerCase()).toBe('0x1111111111111111111111111111111111111111')
      expect(args.spender.toLowerCase()).toBe('0x3333333333333333333333333333333333333333')
      // Max uint256
      expect(args.value).toBe(2n ** 256n - 1n)
    })
  })

  describe('decodeEvmLogs', () => {
    it('should decode multiple logs', () => {
      const logs = [sampleTransferLog, sampleApprovalLog]
      const decoded = decodeEvmLogs(erc20Abi, logs)

      expect(decoded).toHaveLength(2)
      expect(decoded[0].eventName).toBe('Transfer')
      expect(decoded[1].eventName).toBe('Approval')
    })

    it('should skip invalid logs by default', () => {
      const unknownLog: EvmLog = {
        ...sampleTransferLog,
        topics: ['0x0000000000000000000000000000000000000000000000000000000000000000'],
        data: '0x',
      }
      const logs = [sampleTransferLog, unknownLog, sampleApprovalLog]
      const decoded = decodeEvmLogs(erc20Abi, logs)

      expect(decoded).toHaveLength(2)
      expect(decoded[0].eventName).toBe('Transfer')
      expect(decoded[1].eventName).toBe('Approval')
    })

    it('should throw on invalid logs when skipInvalid is false', () => {
      const unknownLog: EvmLog = {
        ...sampleTransferLog,
        topics: ['0x0000000000000000000000000000000000000000000000000000000000000000'],
        data: '0x',
      }

      expect(() => decodeEvmLogs(erc20Abi, [unknownLog], { skipInvalid: false })).toThrow()
    })
  })

  describe('filterEvmLogsByEvent', () => {
    it('should filter logs by event name', () => {
      const logs = [sampleTransferLog, sampleApprovalLog, sampleTransferLog]
      const transfers = filterEvmLogsByEvent(erc20Abi, logs, 'Transfer')

      expect(transfers).toHaveLength(2)
      expect(transfers[0].eventName).toBe('Transfer')
      expect(transfers[1].eventName).toBe('Transfer')
    })

    it('should return empty array for non-matching event name', () => {
      const logs = [sampleTransferLog, sampleApprovalLog]
      // @ts-expect-error — intentionally passing invalid event name to test runtime behavior
      const burns = filterEvmLogsByEvent(erc20Abi, logs, 'Burn')

      expect(burns).toHaveLength(0)
    })
  })

  describe('getEventSignature', () => {
    it('should return event signature (topic0) for Transfer', () => {
      const signature = getEventSignature(erc20Abi, 'Transfer')

      expect(signature).toBe(TRANSFER_TOPIC)
    })

    it('should return event signature for Approval', () => {
      const signature = getEventSignature(erc20Abi, 'Approval')

      expect(signature).toBe(APPROVAL_TOPIC)
    })

    it('should return undefined for non-existent event', () => {
      // @ts-expect-error — intentionally passing invalid event name to test runtime behavior
      const signature = getEventSignature(erc20Abi, 'NonExistent')

      expect(signature).toBeUndefined()
    })
  })
})
