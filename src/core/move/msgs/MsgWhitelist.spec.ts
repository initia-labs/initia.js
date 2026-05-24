import { describe, expect, it } from 'vitest'
import { MsgWhitelist as MsgWhitelist_pb } from '@initia/initia.proto/initia/move/v1/tx'
import { Any } from '@initia/initia.proto/google/protobuf/any'
import { Msg, MsgWhitelist } from '../..'

describe('MsgWhitelist legacy move msg', () => {
  it('decodes from data through Msg.fromData', () => {
    const msg = Msg.fromData({
      '@type': '/initia.move.v1.MsgWhitelist',
      authority: 'init1qqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqeup2p7',
      metadata_lp: '0x1',
      reward_weight: '1',
    })

    expect(msg).toBeInstanceOf(MsgWhitelist)
    expect(msg.toData()).toEqual({
      '@type': '/initia.move.v1.MsgWhitelist',
      authority: 'init1qqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqeup2p7',
      metadata_lp: '0x1',
      reward_weight: '1',
    })
  })

  it('decodes from proto through Msg.fromProto', () => {
    const proto = MsgWhitelist_pb.fromPartial({
      authority: 'init1qqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqeup2p7',
      metadataLp: '0x1',
      rewardWeight: '1000000000000000000',
    })
    const any = Any.fromPartial({
      typeUrl: '/initia.move.v1.MsgWhitelist',
      value: MsgWhitelist_pb.encode(proto).finish(),
    })

    const msg = Msg.fromProto(any)

    expect(msg).toBeInstanceOf(MsgWhitelist)
    expect((msg as MsgWhitelist).reward_weight).toBe('1')
  })

  it('decodes from amino through Msg.fromAmino', () => {
    const msg = Msg.fromAmino({
      type: 'move/MsgWhitelist',
      value: {
        authority: 'init1qqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqeup2p7',
        metadata_lp: '0x1',
        reward_weight: '1.000000000000000000',
      },
    })

    expect(msg).toBeInstanceOf(MsgWhitelist)
    expect(msg.toAmino()).toEqual({
      type: 'move/MsgWhitelist',
      value: {
        authority: 'init1qqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqeup2p7',
        metadata_lp: '0x1',
        reward_weight: '1.000000000000000000',
      },
    })
  })
})
