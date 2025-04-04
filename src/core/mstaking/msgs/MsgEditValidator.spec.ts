import { describe, it, expect } from 'vitest'
import { MsgEditValidator } from './MsgEditValidator'
const MsgEditValidatorAmino = require('./MsgEditValidator.data.json')

describe('MsgEditValidator', () => {
  it('deserializes', () => {
    MsgEditValidatorAmino.txs.forEach((txinfo: any) => {
      txinfo.tx.value.msg.forEach((msg: any) => {
        if (msg.type == 'cosmos-sdk/MsgEditValidator') {
          const e = MsgEditValidator.fromAmino(msg)
          expect(e.toAmino()).toEqual(msg)
        }
      })
    })
  })
})
