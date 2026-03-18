/**
 * Unit tests for Message class, normalizeMsg(), and Message.fromAny().
 *
 * Covers:
 * - #113: Message class: toAmino(), toAny(), custom amino override
 * - #114: normalizeMsg(): Message, Any, tuple inputs
 * - #115: Message.fromAny(): toAny() ok, toAmino() throws
 * - #116: Any input + amino signMode gives clear error
 */

import { describe, it, expect } from 'vitest'
import { create } from '@bufbuild/protobuf'
import { AnySchema } from '@bufbuild/protobuf/wkt'
import { MsgSendSchema } from '@buf/cosmos_cosmos-sdk.bufbuild_es/cosmos/bank/v1beta1/tx_pb'
import { MsgTransferSchema } from '@buf/cosmos_ibc.bufbuild_es/ibc/applications/transfer/v1/tx_pb'
import { Message, normalizeMsg, isMessageOf } from '../../../src/msgs/types'
import { ValidationError } from '../../../src/errors'

// ============= #113: Message class =============

describe('Message', () => {
  describe('toAny()', () => {
    it('should pack message as Any with correct typeUrl', () => {
      const msg = new Message(MsgSendSchema, {
        fromAddress: 'init1from...',
        toAddress: 'init1to...',
        amount: [{ denom: 'uinit', amount: '1000' }],
      })

      const any = msg.toAny()
      expect(any.typeUrl).toBe(`/cosmos.bank.v1beta1.MsgSend`)
      expect(any.value).toBeInstanceOf(Uint8Array)
      expect(any.value.length).toBeGreaterThan(0)
    })

    it('should return consistent Any on multiple calls', () => {
      const msg = new Message(MsgSendSchema, {
        fromAddress: 'init1from...',
        toAddress: 'init1to...',
        amount: [],
      })

      const any1 = msg.toAny()
      const any2 = msg.toAny()
      expect(any1.typeUrl).toBe(any2.typeUrl)
    })
  })

  describe('toAmino()', () => {
    it('should convert to amino format with correct type', () => {
      const msg = new Message(MsgSendSchema, {
        fromAddress: 'init1from...',
        toAddress: 'init1to...',
        amount: [{ denom: 'uinit', amount: '1000' }],
      })

      const amino = msg.toAmino()
      expect(amino.type).toBe('cosmos-sdk/MsgSend')
      expect(amino.value).toBeDefined()
      expect(amino.value.from_address).toBe('init1from...')
      expect(amino.value.to_address).toBe('init1to...')
    })
  })

  describe('custom amino override', () => {
    it('should use custom toAmino function when provided', () => {
      const msg = new Message(
        MsgSendSchema,
        {
          fromAddress: 'init1from...',
          toAddress: 'init1to...',
          amount: [{ denom: 'uinit', amount: '1000' }],
        },
        {
          toAmino: value => ({
            type: 'custom/MsgSend',
            value: { sender: value.fromAddress },
          }),
        }
      )

      const amino = msg.toAmino()
      expect(amino.type).toBe('custom/MsgSend')
      expect(amino.value.sender).toBe('init1from...')
    })

    it('should still produce correct Any regardless of amino override', () => {
      const msg = new Message(
        MsgSendSchema,
        {
          fromAddress: 'init1from...',
          toAddress: 'init1to...',
          amount: [],
        },
        {
          toAmino: () => ({ type: 'custom/Msg', value: {} }),
        }
      )

      const any = msg.toAny()
      expect(any.typeUrl).toBe(`/cosmos.bank.v1beta1.MsgSend`)
    })
  })

  describe('value property', () => {
    it('should expose the protobuf message shape', () => {
      const msg = new Message(MsgSendSchema, {
        fromAddress: 'init1from...',
        toAddress: 'init1to...',
        amount: [{ denom: 'uinit', amount: '500' }],
      })

      expect(msg.value.fromAddress).toBe('init1from...')
      expect(msg.value.toAddress).toBe('init1to...')
      expect(msg.value.amount).toHaveLength(1)
    })
  })
})

// ============= #115: Message.fromAny() =============

describe('Message.fromAny()', () => {
  const testAny = create(AnySchema, {
    typeUrl: `/cosmos.bank.v1beta1.MsgSend`,
    value: new Uint8Array([10, 12, 105, 110, 105, 116, 49, 102, 114, 111, 109]),
  })

  it('should return a Message instance', () => {
    const msg = Message.fromAny(testAny)
    expect(msg).toBeInstanceOf(Message)
  })

  it('should return the original Any from toAny()', () => {
    const msg = Message.fromAny(testAny)
    const any = msg.toAny()
    expect(any.typeUrl).toBe(testAny.typeUrl)
    expect(any.value).toBe(testAny.value)
  })

  it('should throw on toAmino()', () => {
    const msg = Message.fromAny(testAny)
    expect(() => msg.toAmino()).toThrow('Cannot convert to Amino on a pre-packed Any')
  })
})

// ============= Message.fromAny(schema, any) — typed decode =============

describe('Message.fromAny(schema, any)', () => {
  it('should decode Any into typed Message with accessible value fields', () => {
    const original = new Message(MsgSendSchema, {
      fromAddress: 'init1from...',
      toAddress: 'init1to...',
      amount: [{ denom: 'uinit', amount: '1000' }],
    })
    const decoded = Message.fromAny(MsgSendSchema, original.toAny())
    expect(decoded).toBeInstanceOf(Message)
    expect(decoded.value.fromAddress).toBe('init1from...')
    expect(decoded.value.toAddress).toBe('init1to...')
  })

  it('should throw on type URL mismatch', () => {
    const wrongAny = create(AnySchema, {
      typeUrl: '/wrong.type.Msg',
      value: new Uint8Array([]),
    })
    expect(() => Message.fromAny(MsgSendSchema, wrongAny)).toThrow('fromAny type mismatch')
  })
})

// ============= isMessageOf() =============

describe('isMessageOf()', () => {
  it('returns true for matching schema', () => {
    const msg = new Message(MsgSendSchema, {
      fromAddress: 'init1a',
      toAddress: 'init1b',
      amount: [],
    })
    expect(isMessageOf(msg, MsgSendSchema)).toBe(true)
  })

  it('returns false for non-matching schema', () => {
    const msg = new Message(MsgSendSchema, {
      fromAddress: 'init1a',
      toAddress: 'init1b',
      amount: [],
    })
    expect(isMessageOf(msg, MsgTransferSchema)).toBe(false)
  })

  it('returns false for rawAny (undecoded) messages', () => {
    const any = create(AnySchema, {
      typeUrl: '/cosmos.bank.v1beta1.MsgSend',
      value: new Uint8Array([10, 5]),
    })
    const msg = Message.fromAny(any)
    expect(msg.isDecoded).toBe(false)
    expect(isMessageOf(msg, MsgSendSchema)).toBe(false)
  })
})

// ============= #114: normalizeMsg() =============

describe('normalizeMsg()', () => {
  it('should pass through Message instances unchanged', () => {
    const original = new Message(MsgSendSchema, {
      fromAddress: 'init1from...',
      toAddress: 'init1to...',
      amount: [],
    })

    const result = normalizeMsg(original)
    expect(result).toBe(original)
  })

  it('should wrap Any input via Message.fromAny()', () => {
    const any = create(AnySchema, {
      typeUrl: `/cosmos.bank.v1beta1.MsgSend`,
      value: new Uint8Array([10, 5]),
    })

    const result = normalizeMsg(any)
    expect(result).toBeInstanceOf(Message)
    expect(result.toAny().typeUrl).toBe(any.typeUrl)
  })

  it('should throw ValidationError for non-object input', () => {
    expect(() => normalizeMsg('not-a-message' as any)).toThrow(ValidationError)
    expect(() => normalizeMsg(42 as any)).toThrow(ValidationError)
    expect(() => normalizeMsg(null as any)).toThrow(ValidationError)
  })
})

// ============= #116: Any input + amino signMode error =============

describe('Any input with amino signing', () => {
  it('should throw clear error when toAmino() called on fromAny() Message', () => {
    const any = create(AnySchema, {
      typeUrl: `/some.custom.MsgType`,
      value: new Uint8Array([1, 2, 3]),
    })

    const msg = normalizeMsg(any)
    expect(() => msg.toAmino()).toThrow('Cannot convert to Amino on a pre-packed Any')
    expect(() => msg.toAmino()).toThrow('Use Message.fromAny(schema, any) to decode')
  })
})
