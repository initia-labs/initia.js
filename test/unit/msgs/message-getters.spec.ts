/**
 * Tests for Message getter behavior on rawAny messages and typeUrl.
 */

import { describe, it, expect } from 'vitest'
import { create } from '@bufbuild/protobuf'
import { AnySchema } from '@bufbuild/protobuf/wkt'
import { MsgSendSchema } from '@buf/cosmos_cosmos-sdk.bufbuild_es/cosmos/bank/v1beta1/tx_pb'
import { MsgTransferSchema } from '@buf/cosmos_ibc.bufbuild_es/ibc/applications/transfer/v1/tx_pb'
import { Message, isMessageOf, normalizeMsg } from '../../../src/msgs/types'
import { InitiaError, ValidationError } from '../../../src/errors'

describe('Message getter safety', () => {
  const testAny = create(AnySchema, {
    typeUrl: '/cosmos.bank.v1beta1.MsgSend',
    value: new Uint8Array([10, 5, 105, 110, 105, 116, 49]),
  })

  describe('fromAny(any) — opaque mode', () => {
    it('should throw InitiaError when accessing .schema', () => {
      const msg = Message.fromAny(testAny)
      expect(() => msg.schema).toThrow(InitiaError)
      expect(() => msg.schema).toThrow('pre-packed Any')
    })

    it('should throw InitiaError when accessing .value', () => {
      const msg = Message.fromAny(testAny)
      expect(() => msg.value).toThrow(InitiaError)
      expect(() => msg.value).toThrow('pre-packed Any')
    })

    it('should still allow toAny()', () => {
      const msg = Message.fromAny(testAny)
      const any = msg.toAny()
      expect(any.typeUrl).toBe(testAny.typeUrl)
      expect(any.value).toBe(testAny.value)
    })

    it('should return correct typeUrl on rawAny message (I10)', () => {
      const msg = Message.fromAny(testAny)
      expect(msg.typeUrl).toBe('/cosmos.bank.v1beta1.MsgSend')
    })
  })

  describe('fromAny(schema, any) — typed mode', () => {
    it('should allow accessing .schema', () => {
      const original = new Message(MsgSendSchema, {
        fromAddress: 'init1a',
        toAddress: 'init1b',
        amount: [{ denom: 'uinit', amount: '100' }],
      })

      const decoded = Message.fromAny(MsgSendSchema, original.toAny())
      expect(() => decoded.schema).not.toThrow()
      expect(decoded.schema).toBe(MsgSendSchema)
    })

    it('should allow accessing .value with correct fields', () => {
      const original = new Message(MsgSendSchema, {
        fromAddress: 'init1sender',
        toAddress: 'init1receiver',
        amount: [{ denom: 'uinit', amount: '999' }],
      })

      const decoded = Message.fromAny(MsgSendSchema, original.toAny())
      expect(decoded.value.fromAddress).toBe('init1sender')
      expect(decoded.value.toAddress).toBe('init1receiver')
      expect(decoded.value.amount).toHaveLength(1)
      expect(decoded.value.amount[0].amount).toBe('999')
    })
  })

  describe('normal constructor', () => {
    it('should allow .schema and .value access', () => {
      const msg = new Message(MsgSendSchema, {
        fromAddress: 'init1a',
        toAddress: 'init1b',
        amount: [],
      })

      expect(msg.schema).toBe(MsgSendSchema)
      expect(msg.value.fromAddress).toBe('init1a')
    })

    it('should return correct typeUrl on normal message', () => {
      const msg = new Message(MsgSendSchema, {
        fromAddress: 'init1a',
        toAddress: 'init1b',
        amount: [],
      })

      expect(msg.typeUrl).toBe('/cosmos.bank.v1beta1.MsgSend')
    })
  })

  describe('isMessageOf type guard (S8)', () => {
    it('should return true for matching schema', () => {
      const msg = new Message(MsgSendSchema, {
        fromAddress: 'init1a',
        toAddress: 'init1b',
        amount: [],
      })

      expect(isMessageOf(msg, MsgSendSchema)).toBe(true)
    })

    it('should narrow type after guard', () => {
      const msg: Message = new Message(MsgSendSchema, {
        fromAddress: 'init1a',
        toAddress: 'init1b',
        amount: [{ denom: 'uinit', amount: '100' }],
      })

      if (isMessageOf(msg, MsgSendSchema)) {
        // TypeScript should narrow to Message<typeof MsgSendSchema>
        expect(msg.value.fromAddress).toBe('init1a')
      } else {
        expect.unreachable()
      }
    })
  })

  describe('isMessageOf with wrong schema on decoded message', () => {
    it('should return false when decoded message checked against different schema', () => {
      const msg = new Message(MsgSendSchema, {
        fromAddress: 'init1a',
        toAddress: 'init1b',
        amount: [],
      })

      expect(msg.isDecoded).toBe(true)
      expect(isMessageOf(msg, MsgTransferSchema)).toBe(false)
    })
  })

  describe('isDecoded getter', () => {
    it('should return false for rawAny message', () => {
      const msg = Message.fromAny(testAny)
      expect(msg.isDecoded).toBe(false)
    })

    it('should return true for typed message', () => {
      const msg = new Message(MsgSendSchema, {
        fromAddress: 'init1a',
        toAddress: 'init1b',
        amount: [],
      })
      expect(msg.isDecoded).toBe(true)
    })
  })

  describe('isMessageOf on rawAny (I3)', () => {
    it('should return false for rawAny message even if typeUrl matches', () => {
      const msg = Message.fromAny(testAny)
      expect(msg.typeUrl).toBe('/cosmos.bank.v1beta1.MsgSend')
      expect(isMessageOf(msg, MsgSendSchema)).toBe(false)
    })
  })

  describe('fromAny(any) — invalid typeUrl', () => {
    it('should throw ValidationError for empty typeUrl', () => {
      const badAny = create(AnySchema, { typeUrl: '', value: new Uint8Array([]) })
      expect(() => Message.fromAny(badAny)).toThrow(ValidationError)
      expect(() => Message.fromAny(badAny)).toThrow('valid typeUrl')
    })

    it('should throw ValidationError for missing typeUrl', () => {
      const badAny = create(AnySchema, { value: new Uint8Array([]) })
      expect(() => Message.fromAny(badAny)).toThrow(ValidationError)
    })
  })

  describe('normalizeMsg validation (I1)', () => {
    it('should throw ValidationError for non-Any plain object', () => {
      expect(() => normalizeMsg({ foo: 'bar' } as never)).toThrow(ValidationError)
    })

    it('should throw ValidationError for null', () => {
      expect(() => normalizeMsg(null as never)).toThrow(ValidationError)
    })

    it('should pass through valid Any to Message.fromAny', () => {
      const msg = normalizeMsg(testAny)
      expect(msg.typeUrl).toBe('/cosmos.bank.v1beta1.MsgSend')
    })
  })
})
