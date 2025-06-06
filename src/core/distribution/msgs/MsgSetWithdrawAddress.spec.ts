import { describe, it, expect } from 'vitest'
import { MsgSetWithdrawAddress } from './MsgSetWithdrawAddress'
const MsgSetWithdrawAddressAmino = require('./MsgSetWithdrawAddress.data.json')

describe('MsgSetWithdrawAddress', () => {
  it('deserializes', () => {
    MsgSetWithdrawAddressAmino.txs.forEach((txinfo: any) => {
      txinfo.tx.value.msg.forEach((msg: any) => {
        if (msg.type == 'cosmos-sdk/MsgModifyWithdrawAddress') {
          const e = MsgSetWithdrawAddress.fromAmino(msg)
          expect(e.toAmino()).toEqual(msg)
        }
      })
    })
  })
})
