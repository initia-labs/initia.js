import { describe, expect, it } from 'vitest'
import { MsgDelist as MsgDelist_pb } from '@initia/initia.proto/initia/move/v1/tx'
import { Any } from '@initia/initia.proto/google/protobuf/any'
import { Msg, MsgDelist } from '../..'

describe('MsgDelist legacy move msg', () => {
  it('decodes from data through Msg.fromData', () => {
    const msg = Msg.fromData({
      '@type': '/initia.move.v1.MsgDelist',
      authority: 'init1qqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqeup2p7',
      metadata_lp: '0x1',
    })

    expect(msg).toBeInstanceOf(MsgDelist)
    expect(msg.toData()).toEqual({
      '@type': '/initia.move.v1.MsgDelist',
      authority: 'init1qqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqeup2p7',
      metadata_lp: '0x1',
    })
  })

  it('decodes from proto through Msg.fromProto', () => {
    const proto = MsgDelist_pb.fromPartial({
      authority: 'init1qqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqeup2p7',
      metadataLp: '0x1',
    })
    const any = Any.fromPartial({
      typeUrl: '/initia.move.v1.MsgDelist',
      value: MsgDelist_pb.encode(proto).finish(),
    })

    const msg = Msg.fromProto(any)

    expect(msg).toBeInstanceOf(MsgDelist)
    expect((msg as MsgDelist).metadata_lp).toBe('0x1')
  })

  it('decodes from amino through Msg.fromAmino', () => {
    const msg = Msg.fromAmino({
      type: 'move/MsgDelist',
      value: {
        authority: 'init1qqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqeup2p7',
        metadata_lp: '0x1',
      },
    })

    expect(msg).toBeInstanceOf(MsgDelist)
    expect(msg.toAmino()).toEqual({
      type: 'move/MsgDelist',
      value: {
        authority: 'init1qqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqeup2p7',
        metadata_lp: '0x1',
      },
    })
  })
})
