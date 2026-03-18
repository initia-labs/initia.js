/**
 * T1: Unit tests for createDecode.
 */

import { describe, it, expect } from 'vitest'
import { createDecode } from '../../../src/msgs/decode'
import { Message, isMessageOf } from '../../../src/msgs/types'
import { MsgSendSchema } from '@buf/cosmos_cosmos-sdk.bufbuild_es/cosmos/bank/v1beta1/tx_pb'
import { MsgTransferSchema } from '@buf/cosmos_ibc.bufbuild_es/ibc/applications/transfer/v1/tx_pb'
import { ParseError } from '../../../src/errors'

describe('createDecode', () => {
  const decode = createDecode([MsgSendSchema, MsgTransferSchema])

  it('should round-trip a MsgSend through Any', () => {
    const original = new Message(MsgSendSchema, {
      fromAddress: 'init1from',
      toAddress: 'init1to',
      amount: [{ denom: 'uinit', amount: '1000' }],
    })

    const decoded = decode(original.toAny())
    expect(decoded).toBeInstanceOf(Message)

    // Use isMessageOf to narrow then access typed fields
    if (isMessageOf(decoded, MsgSendSchema)) {
      expect(decoded.value.fromAddress).toBe('init1from')
      expect(decoded.value.toAddress).toBe('init1to')
    } else {
      expect.unreachable('decoded should be MsgSend')
    }
  })

  it('should round-trip a MsgTransfer through Any', () => {
    const original = new Message(MsgTransferSchema, {
      sender: 'init1sender',
      receiver: 'init1receiver',
      sourceChannel: 'channel-0',
      sourcePort: 'transfer',
      token: { denom: 'uinit', amount: '500' },
    })

    const decoded = decode(original.toAny())
    expect(decoded).toBeInstanceOf(Message)

    if (isMessageOf(decoded, MsgTransferSchema)) {
      expect(decoded.value.sender).toBe('init1sender')
    } else {
      expect.unreachable('decoded should be MsgTransfer')
    }
  })

  it('should throw ParseError for unknown typeUrl', () => {
    const unknownAny = {
      typeUrl: '/unknown.type.MsgFoo',
      value: new Uint8Array([]),
      $typeName: 'google.protobuf.Any' as const,
    }

    expect(() => decode(unknownAny)).toThrow(ParseError)
    expect(() => decode(unknownAny)).toThrow('Unknown message type')
    expect(() => decode(unknownAny)).toThrow('/unknown.type.MsgFoo')
  })

  it('should handle schemas with / prefix in typeUrl', () => {
    const original = new Message(MsgSendSchema, {
      fromAddress: 'init1a',
      toAddress: 'init1b',
      amount: [],
    })

    const any = original.toAny()
    expect(any.typeUrl).toBe('/cosmos.bank.v1beta1.MsgSend')
    const decoded = decode(any)
    expect(decoded).toBeInstanceOf(Message)
  })

  it('should throw ParseError for empty typeUrl', () => {
    const emptyAny = {
      typeUrl: '',
      value: new Uint8Array([]),
      $typeName: 'google.protobuf.Any' as const,
    }
    expect(() => decode(emptyAny)).toThrow(ParseError)
  })

  it('should throw ParseError for any typeUrl when schema list is empty', () => {
    const emptyDecode = createDecode([])
    const any = {
      typeUrl: '/cosmos.bank.v1beta1.MsgSend',
      value: new Uint8Array([]),
      $typeName: 'google.protobuf.Any' as const,
    }
    expect(() => emptyDecode(any)).toThrow(ParseError)
  })

  it('error message includes the unrecognized typeUrl', () => {
    try {
      decode({
        typeUrl: '/foo.bar.Baz',
        value: new Uint8Array([]),
        $typeName: 'google.protobuf.Any' as const,
      })
      expect.unreachable('should throw')
    } catch (e) {
      expect((e as Error).message).toContain('/foo.bar.Baz')
    }
  })

  it('should use last schema when duplicates exist (override semantics)', () => {
    // Both have MsgSendSchema, second entry should win
    const decode2 = createDecode([MsgSendSchema, MsgTransferSchema, MsgSendSchema])
    const original = new Message(MsgSendSchema, {
      fromAddress: 'init1a',
      toAddress: 'init1b',
      amount: [],
    })
    const decoded = decode2(original.toAny())
    expect(decoded).toBeInstanceOf(Message)
  })
})
