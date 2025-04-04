import { describe, it, expect } from 'vitest'
import { MsgBeginRedelegate } from './MsgBeginRedelegate'
const MsgBeginRedelegateAmino = require('./MsgBeginRedelegate.data.json')

describe('MsgBeginRedelegate', () => {
  it('deserializes', () => {
    MsgBeginRedelegateAmino.txs.forEach((txinfo: any) => {
      txinfo.tx.value.msg.forEach((msg: any) => {
        if (msg.type == 'cosmos-sdk/MsgBeginRedelegate') {
          const e = MsgBeginRedelegate.fromAmino(msg)
          expect(e.toAmino()).toEqual(msg)
        }
      })
    })
  })
})
