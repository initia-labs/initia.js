import { describe, it, expect } from 'vitest'
import { MsgUndelegate } from './MsgUndelegate'
const MsgUndelegateAmino = require('./MsgUndelegate.data.json')

describe('MsgUndelegate', () => {
  it('deserializes', () => {
    MsgUndelegateAmino.txs.forEach((txinfo: any) => {
      txinfo.tx.value.msg.forEach((msg: any) => {
        if (msg.type == 'cosmos-sdk/MsgUndelegate') {
          const e = MsgUndelegate.fromAmino(msg)
          expect(e.toAmino()).toEqual(msg)
        }
      })
    })
  })
})
