import { describe, it, expect } from 'vitest'
import { MsgUnjail } from './MsgUnjail'
const MsgUnjailAmino = require('./MsgUnjail.data.json')

describe('MsgUnjail', () => {
  it('deserializes', () => {
    MsgUnjailAmino.txs.forEach((txinfo: any) => {
      txinfo.tx.value.msg.forEach((msg: any) => {
        if (msg.type == 'cosmos-sdk/MsgUnjail') {
          const e = MsgUnjail.fromAmino(msg)
          expect(e.toAmino()).toEqual(msg)
        }
      })
    })
  })
})
