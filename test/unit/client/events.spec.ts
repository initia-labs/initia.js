/**
 * Unit tests for Cosmos event parsing utilities.
 */

import { describe, it, expect } from 'vitest'
import {
  findEvent,
  findEvents,
  getEventAttribute,
  getEventAttributes,
  filterEvents,
  isWasmEvent,
  parseWasmEvents,
  findWasmEventsByContract,
  findWasmEventsByAction,
  isMoveEvent,
  parseMoveEvents,
  findMoveEventsByModule,
  findMoveEventsByType,
  type CosmosEvent,
} from '../../../src/client/events'

// Sample Cosmos events for testing
const sampleEvents: CosmosEvent[] = [
  {
    type: 'message',
    attributes: [
      { key: 'action', value: '/cosmos.bank.v1beta1.MsgSend' },
      { key: 'sender', value: 'init1sender...' },
      { key: 'module', value: 'bank' },
    ],
  },
  {
    type: 'transfer',
    attributes: [
      { key: 'recipient', value: 'init1recipient...' },
      { key: 'sender', value: 'init1sender...' },
      { key: 'amount', value: '1000uinit' },
    ],
  },
  {
    type: 'coin_spent',
    attributes: [
      { key: 'spender', value: 'init1sender...' },
      { key: 'amount', value: '1000uinit' },
    ],
  },
  {
    type: 'coin_received',
    attributes: [
      { key: 'receiver', value: 'init1recipient...' },
      { key: 'amount', value: '1000uinit' },
    ],
  },
]

// Sample Wasm events
const wasmEvents: CosmosEvent[] = [
  {
    type: 'wasm',
    attributes: [
      { key: '_contract_address', value: 'init1contract1...' },
      { key: 'action', value: 'transfer' },
      { key: 'from', value: 'init1sender...' },
      { key: 'to', value: 'init1recipient...' },
      { key: 'amount', value: '1000' },
    ],
  },
  {
    type: 'wasm',
    attributes: [
      { key: '_contract_address', value: 'init1contract2...' },
      { key: 'action', value: 'mint' },
      { key: 'to', value: 'init1recipient...' },
      { key: 'amount', value: '500' },
    ],
  },
  {
    type: 'wasm-instantiate',
    attributes: [
      { key: '_contract_address', value: 'init1contract3...' },
      { key: 'code_id', value: '1' },
    ],
  },
]

// Sample Move events
const moveEvents: CosmosEvent[] = [
  {
    type: 'move',
    attributes: [
      { key: 'type_tag', value: '0x1::coin::DepositEvent' },
      { key: 'data', value: 'base64encodeddata' },
      { key: 'sequence_number', value: '1' },
    ],
  },
  {
    type: 'move',
    attributes: [
      { key: 'type_tag', value: '0x1::coin::WithdrawEvent' },
      { key: 'data', value: 'base64encodeddata2' },
      { key: 'sequence_number', value: '2' },
    ],
  },
  {
    type: 'move',
    attributes: [
      { key: 'type_tag', value: '0x2::nft::TransferEvent' },
      { key: 'data', value: 'base64encodeddata3' },
    ],
  },
]

describe('Cosmos Event Utilities', () => {
  describe('Basic Event Functions', () => {
    describe('findEvent', () => {
      it('should find first event by type', () => {
        const event = findEvent(sampleEvents, 'transfer')
        expect(event).toBeDefined()
        expect(event?.type).toBe('transfer')
      })

      it('should return undefined for non-existent type', () => {
        const event = findEvent(sampleEvents, 'nonexistent')
        expect(event).toBeUndefined()
      })
    })

    describe('findEvents', () => {
      it('should find all events by type', () => {
        const events = findEvents(sampleEvents, 'message')
        expect(events).toHaveLength(1)
        expect(events[0].type).toBe('message')
      })

      it('should return empty array for non-existent type', () => {
        const events = findEvents(sampleEvents, 'nonexistent')
        expect(events).toHaveLength(0)
      })
    })

    describe('getEventAttribute', () => {
      it('should get attribute value by key', () => {
        const transfer = findEvent(sampleEvents, 'transfer')!
        const recipient = getEventAttribute(transfer, 'recipient')
        expect(recipient).toBe('init1recipient...')
      })

      it('should return undefined for non-existent attribute', () => {
        const transfer = findEvent(sampleEvents, 'transfer')!
        const value = getEventAttribute(transfer, 'nonexistent')
        expect(value).toBeUndefined()
      })
    })

    describe('getEventAttributes', () => {
      it('should get all attributes as record', () => {
        const transfer = findEvent(sampleEvents, 'transfer')!
        const attrs = getEventAttributes(transfer)

        expect(attrs).toEqual({
          recipient: 'init1recipient...',
          sender: 'init1sender...',
          amount: '1000uinit',
        })
      })
    })

    describe('filterEvents', () => {
      it('should filter by type only', () => {
        const events = filterEvents(sampleEvents, 'transfer')
        expect(events).toHaveLength(1)
        expect(events[0].type).toBe('transfer')
      })

      it('should filter by type and attributes', () => {
        const events = filterEvents(sampleEvents, 'transfer', {
          recipient: 'init1recipient...',
        })
        expect(events).toHaveLength(1)

        const noMatch = filterEvents(sampleEvents, 'transfer', {
          recipient: 'init1other...',
        })
        expect(noMatch).toHaveLength(0)
      })
    })
  })

  describe('Wasm Event Functions', () => {
    describe('isWasmEvent', () => {
      it('should return true for wasm events', () => {
        expect(isWasmEvent({ type: 'wasm', attributes: [] })).toBe(true)
        expect(isWasmEvent({ type: 'wasm-instantiate', attributes: [] })).toBe(true)
        expect(isWasmEvent({ type: 'wasm-execute', attributes: [] })).toBe(true)
      })

      it('should return false for non-wasm events', () => {
        expect(isWasmEvent({ type: 'transfer', attributes: [] })).toBe(false)
        expect(isWasmEvent({ type: 'message', attributes: [] })).toBe(false)
        expect(isWasmEvent({ type: 'move', attributes: [] })).toBe(false)
      })
    })

    describe('parseWasmEvents', () => {
      it('should parse wasm events with contract address and action', () => {
        const parsed = parseWasmEvents(wasmEvents)

        expect(parsed).toHaveLength(3)

        // First event: transfer
        expect(parsed[0].contractAddress).toBe('init1contract1...')
        expect(parsed[0].action).toBe('transfer')
        expect(parsed[0].data).toEqual({
          action: 'transfer',
          from: 'init1sender...',
          to: 'init1recipient...',
          amount: '1000',
        })

        // Second event: mint
        expect(parsed[1].contractAddress).toBe('init1contract2...')
        expect(parsed[1].action).toBe('mint')

        // Third event: instantiate
        expect(parsed[2].contractAddress).toBe('init1contract3...')
        expect(parsed[2].data.code_id).toBe('1')
      })

      it('should skip non-wasm events', () => {
        const mixed = [...sampleEvents, ...wasmEvents]
        const parsed = parseWasmEvents(mixed)

        expect(parsed).toHaveLength(3)
      })
    })

    describe('findWasmEventsByContract', () => {
      it('should find events by contract address', () => {
        const events = findWasmEventsByContract(wasmEvents, 'init1contract1...')

        expect(events).toHaveLength(1)
        expect(events[0].action).toBe('transfer')
      })

      it('should be case-insensitive', () => {
        const events = findWasmEventsByContract(wasmEvents, 'INIT1CONTRACT1...')

        expect(events).toHaveLength(1)
      })
    })

    describe('findWasmEventsByAction', () => {
      it('should find events by action', () => {
        const events = findWasmEventsByAction(wasmEvents, 'transfer')

        expect(events).toHaveLength(1)
        expect(events[0].contractAddress).toBe('init1contract1...')
      })

      it('should return empty for non-matching action', () => {
        const events = findWasmEventsByAction(wasmEvents, 'burn')

        expect(events).toHaveLength(0)
      })
    })
  })

  describe('Move Event Functions', () => {
    describe('isMoveEvent', () => {
      it('should return true for move events', () => {
        expect(isMoveEvent({ type: 'move', attributes: [] })).toBe(true)
      })

      it('should return false for non-move events', () => {
        expect(isMoveEvent({ type: 'transfer', attributes: [] })).toBe(false)
        expect(isMoveEvent({ type: 'wasm', attributes: [] })).toBe(false)
      })
    })

    describe('parseMoveEvents', () => {
      it('should parse move events with type tag', () => {
        const parsed = parseMoveEvents(moveEvents)

        expect(parsed).toHaveLength(3)

        // First event: DepositEvent
        expect(parsed[0].moduleAddress).toBe('0x1')
        expect(parsed[0].moduleName).toBe('coin')
        expect(parsed[0].eventType).toBe('0x1::coin::DepositEvent')
        expect(parsed[0].data.sequence_number).toBe('1')

        // Second event: WithdrawEvent
        expect(parsed[1].moduleAddress).toBe('0x1')
        expect(parsed[1].moduleName).toBe('coin')
        expect(parsed[1].eventType).toBe('0x1::coin::WithdrawEvent')

        // Third event: TransferEvent from different module
        expect(parsed[2].moduleAddress).toBe('0x2')
        expect(parsed[2].moduleName).toBe('nft')
        expect(parsed[2].eventType).toBe('0x2::nft::TransferEvent')
      })

      it('should skip non-move events', () => {
        const mixed = [...sampleEvents, ...moveEvents]
        const parsed = parseMoveEvents(mixed)

        expect(parsed).toHaveLength(3)
      })
    })

    describe('findMoveEventsByModule', () => {
      it('should find events by module address only', () => {
        const events = findMoveEventsByModule(moveEvents, '0x1')

        expect(events).toHaveLength(2)
      })

      it('should find events by module address and name', () => {
        const events = findMoveEventsByModule(moveEvents, '0x1', 'coin')

        expect(events).toHaveLength(2)
        expect(events[0].eventType).toBe('0x1::coin::DepositEvent')
        expect(events[1].eventType).toBe('0x1::coin::WithdrawEvent')
      })

      it('should be case-insensitive for address', () => {
        const events = findMoveEventsByModule(moveEvents, '0X1', 'coin')

        expect(events).toHaveLength(2)
      })
    })

    describe('findMoveEventsByType', () => {
      it('should find events by exact type', () => {
        const events = findMoveEventsByType(moveEvents, '0x1::coin::DepositEvent')

        expect(events).toHaveLength(1)
        expect(events[0].data.sequence_number).toBe('1')
      })

      it('should return empty for non-matching type', () => {
        const events = findMoveEventsByType(moveEvents, '0x1::coin::BurnEvent')

        expect(events).toHaveLength(0)
      })
    })
  })
})
