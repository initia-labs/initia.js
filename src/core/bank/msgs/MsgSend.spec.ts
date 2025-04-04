import { describe, it, expect } from 'vitest'
import { MsgSend } from './MsgSend'
import { Coins } from '../../Coins'

describe('MsgSend', () => {
  it('deserialize correctly', () => {
    const send = MsgSend.fromAmino({
      type: 'cosmos-sdk/MsgSend',
      value: {
        from_address: 'init1y4umfuqfg76t8mfcff6zzx7elvy93jtp4xcdvw',
        to_address: 'init1v9ku44wycfnsucez6fp085f5fsksp47u9x8jr4',
        amount: [
          {
            denom: 'uinit',
            amount: '8102024952',
          },
        ],
      },
    })

    expect(send).toMatchObject({
      from_address: 'init1y4umfuqfg76t8mfcff6zzx7elvy93jtp4xcdvw',
      to_address: 'init1v9ku44wycfnsucez6fp085f5fsksp47u9x8jr4',
      amount: new Coins({
        uinit: 8102024952,
      }),
    })

    expect(send.toAmino()).toMatchObject({
      type: 'cosmos-sdk/MsgSend',
      value: {
        from_address: 'init1y4umfuqfg76t8mfcff6zzx7elvy93jtp4xcdvw',
        to_address: 'init1v9ku44wycfnsucez6fp085f5fsksp47u9x8jr4',
        amount: [
          {
            denom: 'uinit',
            amount: '8102024952',
          },
        ],
      },
    })
  })

  it('deserialize correctly proto', () => {
    const send = MsgSend.fromData({
      '@type': '/cosmos.bank.v1beta1.MsgSend',
      from_address: 'init1y4umfuqfg76t8mfcff6zzx7elvy93jtp4xcdvw',
      to_address: 'init1v9ku44wycfnsucez6fp085f5fsksp47u9x8jr4',
      amount: [
        {
          denom: 'uinit',
          amount: '8102024952',
        },
      ],
    })

    expect(send).toMatchObject({
      from_address: 'init1y4umfuqfg76t8mfcff6zzx7elvy93jtp4xcdvw',
      to_address: 'init1v9ku44wycfnsucez6fp085f5fsksp47u9x8jr4',
      amount: new Coins({
        uinit: 8102024952,
      }),
    })

    expect(send.toData()).toMatchObject({
      '@type': '/cosmos.bank.v1beta1.MsgSend',
      from_address: 'init1y4umfuqfg76t8mfcff6zzx7elvy93jtp4xcdvw',
      to_address: 'init1v9ku44wycfnsucez6fp085f5fsksp47u9x8jr4',
      amount: [
        {
          denom: 'uinit',
          amount: '8102024952',
        },
      ],
    })
  })
})
