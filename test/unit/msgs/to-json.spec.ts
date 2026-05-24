/**
 * Unit tests for Message.toJson().
 */

import { describe, it, expect } from 'vitest'
import { createBaseConfig } from '../../../src/chains/common'
import { initiaChain } from '../../../src/chains/initia'
import { coin } from '../../../src/core/coin'
import { Message } from '../../../src/msgs/types'
import { create } from '@bufbuild/protobuf'
import { AnySchema } from '@bufbuild/protobuf/wkt'
import {
  MsgWhitelistSchema,
  MsgDelistSchema,
} from '@buf/initia-labs_initia.bufbuild_es/initia/move/v1/tx_pb'
import { anyPack } from '../../../src/util/any'

const baseMsgs = createBaseConfig().build().msgs
const initiaMsgs = initiaChain.build().msgs

describe('Message.toJson', () => {
  it('should return typeUrl and value for MsgSend', () => {
    const msg = baseMsgs.bank.send({
      fromAddress: 'init1from...',
      toAddress: 'init1to...',
      amount: coin('uinit', '1000000'),
    })
    const json = msg.toJson()

    expect(json.typeUrl).toBe('/cosmos.bank.v1beta1.MsgSend')
    expect(json.value).toEqual({
      fromAddress: 'init1from...',
      toAddress: 'init1to...',
      amount: [{ denom: 'uinit', amount: '1000000' }],
    })
  })

  it('should return typeUrl and value for MsgDelegate', () => {
    const msg = initiaMsgs.mstaking.delegate({
      delegatorAddress: 'init1del...',
      validatorAddress: 'initvaloper1val...',
      amount: [coin('uinit', '5000000')],
    })
    const json = msg.toJson()

    expect(json.typeUrl).toBe('/initia.mstaking.v1.MsgDelegate')
    expect(json.value).toHaveProperty('delegatorAddress', 'init1del...')
    expect(json.value).toHaveProperty('validatorAddress', 'initvaloper1val...')
  })

  it('should return typeUrl and value for Move execute', () => {
    const msg = initiaMsgs.move.execute({
      sender: 'init1sender...',
      moduleAddress: 'init1module...',
      moduleName: 'my_module',
      functionName: 'my_function',
      typeArgs: [],
      args: [],
    })
    const json = msg.toJson()

    expect(json.typeUrl).toBe('/initia.move.v1.MsgExecute')
    expect(json.value).toHaveProperty('sender', 'init1sender...')
    expect(json.value).toHaveProperty('moduleName', 'my_module')
    expect(json.value).toHaveProperty('functionName', 'my_function')
  })

  it('should work with multiple coins', () => {
    const msg = baseMsgs.bank.send({
      fromAddress: 'init1from...',
      toAddress: 'init1to...',
      amount: [coin('uinit', '100'), coin('uusdc', '200')],
    })
    const json = msg.toJson()

    expect(json.value.amount).toEqual([
      { denom: 'uinit', amount: '100' },
      { denom: 'uusdc', amount: '200' },
    ])
  })

  it('should throw for pre-packed Any (fromAny)', () => {
    const any = create(AnySchema, {
      typeUrl: '/cosmos.bank.v1beta1.MsgSend',
      value: new Uint8Array([10, 5]),
    })
    const msg = Message.fromAny(any)

    expect(() => msg.toJson()).toThrow('Cannot convert to JSON on a pre-packed Any')
  })

  it('should return JSON for legacy Move MsgWhitelist', () => {
    const value = create(MsgWhitelistSchema, {
      authority: 'init1authority',
      metadataLp: 'lptoken',
      rewardWeight: '0.5',
    })
    const json = Message.fromAny(MsgWhitelistSchema, anyPack(MsgWhitelistSchema, value)).toJson()

    expect(json.typeUrl).toBe('/initia.move.v1.MsgWhitelist')
    expect(json.value).toEqual({
      authority: 'init1authority',
      metadataLp: 'lptoken',
      rewardWeight: '0.5',
    })
  })

  it('should return JSON for legacy Move MsgDelist', () => {
    const value = create(MsgDelistSchema, {
      authority: 'init1authority',
      metadataLp: 'lptoken',
    })
    const json = Message.fromAny(MsgDelistSchema, anyPack(MsgDelistSchema, value)).toJson()

    expect(json.typeUrl).toBe('/initia.move.v1.MsgDelist')
    expect(json.value).toEqual({
      authority: 'init1authority',
      metadataLp: 'lptoken',
    })
  })

  it('should be usable with map for multiple messages', () => {
    const msgs = [
      baseMsgs.bank.send({
        fromAddress: 'init1a...',
        toAddress: 'init1b...',
        amount: coin('uinit', '100'),
      }),
      initiaMsgs.mstaking.delegate({
        delegatorAddress: 'init1a...',
        validatorAddress: 'initvaloper1v...',
        amount: [coin('uinit', '200')],
      }),
    ]

    const descriptions = msgs.map(m => m.toJson())

    expect(descriptions).toHaveLength(2)
    expect(descriptions[0].typeUrl).toBe('/cosmos.bank.v1beta1.MsgSend')
    expect(descriptions[1].typeUrl).toBe('/initia.mstaking.v1.MsgDelegate')
  })
})
