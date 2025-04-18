import { describe, it, expect } from 'vitest'
import { MsgCreateValidator } from './MsgCreateValidator'
const MsgCreateValidatorAmino = require('./MsgCreateValidator.data.json')

describe('MsgCreateValidator', () => {
  it('deserializes', () => {
    MsgCreateValidatorAmino.txs.forEach((txinfo: any) => {
      txinfo.tx.value.msg.forEach((msg: any) => {
        if (msg.type == 'cosmos-sdk/MsgCreateValidator') {
          const e = MsgCreateValidator.fromAmino(msg)
          expect(e.toAmino()).toEqual(msg)
        }
      })
    })
  })
})
