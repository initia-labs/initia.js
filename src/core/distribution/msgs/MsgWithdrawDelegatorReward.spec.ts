import { describe, it, expect } from 'vitest'
import { MsgWithdrawDelegatorReward } from './MsgWithdrawDelegatorReward'
const MsgWithdrawDelegatorRewardAmino = require('./MsgWithdrawDelegatorReward.data.json')

describe('MsgWithdrawDelegatorReward', () => {
  it('deserializes', () => {
    MsgWithdrawDelegatorRewardAmino.txs.forEach((txinfo: any) => {
      txinfo.tx.value.msg.forEach((msg: any) => {
        if (msg.type == 'cosmos-sdk/MsgWithdrawDelegationReward') {
          const e = MsgWithdrawDelegatorReward.fromAmino(msg)
          expect(e.toAmino()).toEqual(msg)
        }
      })
    })
  })
})
