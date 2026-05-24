/**
 * Verify that Coin instances serialize correctly in amino sign docs.
 * Regression test for _amount / _proto leak bug.
 */
import { describe, it, expect } from 'vitest'
import { coin } from '../../../src/core/coin'
import { makeStdSignDoc, makeAminoSignBytes } from '../../../src/tx/sign'
import { sortObject } from '../../../src/tx/amino'
import { msg } from '../../../src/msgs/types'
import { MsgSendSchema } from '@buf/cosmos_cosmos-sdk.bufbuild_es/cosmos/bank/v1beta1/tx_pb'

describe('Coin amino serialization', () => {
  it('sortObject on Coin instance should NOT leak _proto or _amount', () => {
    const c = coin('uinit', '20000')
    const sorted = sortObject(c)
    const json = JSON.stringify(sorted)
    expect(json).not.toContain('_proto')
    expect(json).not.toContain('_amount')
    expect(json).toContain('"amount"')
    expect(json).toContain('"denom"')
  })

  it('sortObject on fee with Coin instances should produce clean JSON', () => {
    const fee = { amount: [coin('uinit', '20000')], gas: '200000' }
    const sorted = sortObject(fee)
    const json = JSON.stringify(sorted)
    expect(json).not.toContain('_proto')
    expect(json).not.toContain('_amount')
    expect(json).toContain('"amount":"20000"')
    expect(json).toContain('"denom":"uinit"')
  })

  it('JSON.stringify on Coin instance should use toJSON()', () => {
    const c = coin('uinit', '42')
    const json = JSON.stringify(c)
    expect(json).toBe('{"denom":"uinit","amount":"42"}')
  })

  it('Coin.toAmino() should return plain object', () => {
    const c = coin('uinit', '20000')
    const amino = c.toAmino()
    expect(amino).toEqual({ denom: 'uinit', amount: '20000' })
    expect(Object.keys(amino).sort()).toEqual(['amount', 'denom'])
  })

  it('buildStdFee equivalent with Coin instances should produce correct amino', () => {
    // Simulate buildStdFee
    const fees = [coin('uinit', '20000')]
    const mapped = fees.map(c => ('toAmino' in c ? (c as any).toAmino() : c))
    expect(JSON.stringify(mapped)).toBe('[{"denom":"uinit","amount":"20000"}]')
  })

  it('full amino sign doc with Coin fee should NOT contain _amount', () => {
    const sendMsg = msg(MsgSendSchema, {
      fromAddress: 'init1abc',
      toAddress: 'init1def',
      amount: [coin('uinit', '1')],
    })

    const aminoMsgs = [sendMsg.toAmino()]

    // Fee with Coin instance (like user would pass)
    const feeCoin = coin('uinit', '20000')
    // Simulate buildStdFee: toAmino conversion
    const stdFee = {
      amount: [feeCoin].map(c => ('toAmino' in c ? (c as any).toAmino() : c)),
      gas: '200000',
    }

    const stdSignDoc = makeStdSignDoc(aminoMsgs, stdFee, 'test-chain', 'test memo', 0n, 0n)

    const aminoBytes = makeAminoSignBytes(stdSignDoc)
    const aminoJson = new TextDecoder().decode(aminoBytes)

    console.log('amino JSON:', aminoJson)

    expect(aminoJson).not.toContain('_amount')
    expect(aminoJson).not.toContain('_proto')
    expect(aminoJson).toContain('"amount":"20000"')
  })

  it('full amino sign doc includes timeout_height when provided', () => {
    const stdSignDoc = makeStdSignDoc(
      [],
      { amount: [], gas: '200000' },
      'test-chain',
      '',
      0n,
      0n,
      42n
    )
    const aminoBytes = makeAminoSignBytes(stdSignDoc)
    const aminoJson = new TextDecoder().decode(aminoBytes)

    expect(JSON.parse(aminoJson)).toMatchObject({ timeout_height: '42' })
  })

  it('full amino sign doc omits timeout_height when unset or zero', () => {
    const unset = makeStdSignDoc([], { amount: [], gas: '200000' }, 'test-chain', '', 0n, 0n)
    const zero = makeStdSignDoc([], { amount: [], gas: '200000' }, 'test-chain', '', 0n, 0n, 0n)

    expect(JSON.parse(new TextDecoder().decode(makeAminoSignBytes(unset)))).not.toHaveProperty(
      'timeout_height'
    )
    expect(JSON.parse(new TextDecoder().decode(makeAminoSignBytes(zero)))).not.toHaveProperty(
      'timeout_height'
    )
  })

  it('full amino sign doc WITHOUT buildStdFee should ALSO not contain _amount', () => {
    // This tests the path where Coin instances go directly into stdFee
    // WITHOUT toAmino() conversion — relies on sortObject + JSON.stringify
    const feeCoin = coin('uinit', '20000')
    const stdFee = {
      amount: [feeCoin], // RAW Coin instance, no toAmino
      gas: '200000',
    }

    const stdSignDoc = makeStdSignDoc([], stdFee, 'test-chain', '', 0n, 0n)

    const aminoBytes = makeAminoSignBytes(stdSignDoc)
    const aminoJson = new TextDecoder().decode(aminoBytes)

    console.log('amino JSON (raw Coin):', aminoJson)

    // This WILL contain _proto because sortObject doesn't call toJSON
    // This test documents the current behavior
    const hasProtoLeak = aminoJson.includes('_proto')
    console.log('has _proto leak:', hasProtoLeak)

    // If this fails, sortObject needs to handle toJSON
    expect(aminoJson).not.toContain('_amount')
    expect(aminoJson).not.toContain('_proto')
  })
})
