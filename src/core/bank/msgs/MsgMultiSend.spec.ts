import { describe, it, expect } from 'vitest'
import { MsgMultiSend } from './MsgMultiSend'
import { Coins } from '../../Coins'
import { Coin } from '../../Coin'

const example: MsgMultiSend.Amino = {
  type: 'cosmos-sdk/MsgMultiSend',
  value: {
    inputs: [
      {
        address: 'init1fex9f78reuwhfsnc8sun6mz8rl9zwqh03fhwf3',
        coins: [
          {
            denom: 'uinit',
            amount: '1',
          },
        ],
      },
      {
        address: 'init1gg64sjt947atmh45ls45avdwd89ey4c4r72u9h',
        coins: [
          {
            denom: 'uinit',
            amount: '6900000000',
          },
        ],
      },
      {
        address: 'init1yh9u2x8phrh2dan56nntgpmg7xnjrwtldhgmyu',
        coins: [
          {
            denom: 'uinit',
            amount: '1000000',
          },
        ],
      },
      {
        address: 'init1c5a0njk9q6q6nheja8gp4ymt2c0qspd8ggpg49',
        coins: [
          {
            denom: 'uinit',
            amount: '16430000000',
          },
        ],
      },
      {
        address: 'init1psswnm8mvy9qg5z4cxc2nvptc9dx62r4tvfrmh',
        coins: [
          {
            denom: 'uinit',
            amount: '9900000000',
          },
        ],
      },
      {
        address: 'init10lgpfm8wjrl4d9datzw6r6dl83k977afzel4t5',
        coins: [
          {
            denom: 'uinit',
            amount: '15800000000',
          },
        ],
      },
      {
        address: 'init13uj5qs3lcqtffqtu6aa089uf6a2pusgwndzzch',
        coins: [
          {
            denom: 'uinit',
            amount: '6900000000',
          },
        ],
      },
    ],
    outputs: [
      {
        address: 'init1fex9f78reuwhfsnc8sun6mz8rl9zwqh03fhwf3',
        coins: [
          {
            denom: 'uinit',
            amount: '1',
          },
        ],
      },
      {
        address: 'init105rz2q5a4w7nv7239tl9c4px5cjy7axx3axf6p',
        coins: [
          {
            denom: 'uinit',
            amount: '6900000000',
          },
        ],
      },
      {
        address: 'init1fex9f78reuwhfsnc8sun6mz8rl9zwqh03fhwf3',
        coins: [
          {
            denom: 'uinit',
            amount: '1000000',
          },
        ],
      },
      {
        address: 'init105rz2q5a4w7nv7239tl9c4px5cjy7axx3axf6p',
        coins: [
          {
            denom: 'uinit',
            amount: '16430000000',
          },
        ],
      },
      {
        address: 'init105rz2q5a4w7nv7239tl9c4px5cjy7axx3axf6p',
        coins: [
          {
            denom: 'uinit',
            amount: '9900000000',
          },
        ],
      },
      {
        address: 'init105rz2q5a4w7nv7239tl9c4px5cjy7axx3axf6p',
        coins: [
          {
            denom: 'uinit',
            amount: '15800000000',
          },
        ],
      },
      {
        address: 'init105rz2q5a4w7nv7239tl9c4px5cjy7axx3axf6p',
        coins: [
          {
            denom: 'uinit',
            amount: '6900000000',
          },
        ],
      },
    ],
  },
}

const proto_example: MsgMultiSend.Data = {
  '@type': '/cosmos.bank.v1beta1.MsgMultiSend',
  inputs: [
    {
      address: 'init1fex9f78reuwhfsnc8sun6mz8rl9zwqh03fhwf3',
      coins: [
        {
          denom: 'uinit',
          amount: '1',
        },
      ],
    },
    {
      address: 'init1gg64sjt947atmh45ls45avdwd89ey4c4r72u9h',
      coins: [
        {
          denom: 'uinit',
          amount: '6900000000',
        },
      ],
    },
    {
      address: 'init1yh9u2x8phrh2dan56nntgpmg7xnjrwtldhgmyu',
      coins: [
        {
          denom: 'uinit',
          amount: '1000000',
        },
      ],
    },
    {
      address: 'init1c5a0njk9q6q6nheja8gp4ymt2c0qspd8ggpg49',
      coins: [
        {
          denom: 'uinit',
          amount: '16430000000',
        },
      ],
    },
    {
      address: 'init1psswnm8mvy9qg5z4cxc2nvptc9dx62r4tvfrmh',
      coins: [
        {
          denom: 'uinit',
          amount: '9900000000',
        },
      ],
    },
    {
      address: 'init10lgpfm8wjrl4d9datzw6r6dl83k977afzel4t5',
      coins: [
        {
          denom: 'uinit',
          amount: '15800000000',
        },
      ],
    },
    {
      address: 'init13uj5qs3lcqtffqtu6aa089uf6a2pusgwndzzch',
      coins: [
        {
          denom: 'uinit',
          amount: '6900000000',
        },
      ],
    },
  ],
  outputs: [
    {
      address: 'init1fex9f78reuwhfsnc8sun6mz8rl9zwqh03fhwf3',
      coins: [
        {
          denom: 'uinit',
          amount: '1',
        },
      ],
    },
    {
      address: 'init105rz2q5a4w7nv7239tl9c4px5cjy7axx3axf6p',
      coins: [
        {
          denom: 'uinit',
          amount: '6900000000',
        },
      ],
    },
    {
      address: 'init1fex9f78reuwhfsnc8sun6mz8rl9zwqh03fhwf3',
      coins: [
        {
          denom: 'uinit',
          amount: '1000000',
        },
      ],
    },
    {
      address: 'init105rz2q5a4w7nv7239tl9c4px5cjy7axx3axf6p',
      coins: [
        {
          denom: 'uinit',
          amount: '16430000000',
        },
      ],
    },
    {
      address: 'init105rz2q5a4w7nv7239tl9c4px5cjy7axx3axf6p',
      coins: [
        {
          denom: 'uinit',
          amount: '9900000000',
        },
      ],
    },
    {
      address: 'init105rz2q5a4w7nv7239tl9c4px5cjy7axx3axf6p',
      coins: [
        {
          denom: 'uinit',
          amount: '15800000000',
        },
      ],
    },
    {
      address: 'init105rz2q5a4w7nv7239tl9c4px5cjy7axx3axf6p',
      coins: [
        {
          denom: 'uinit',
          amount: '6900000000',
        },
      ],
    },
  ],
}

describe('MsgMultiSend', () => {
  it('deserialize correctly', () => {
    const multisend = MsgMultiSend.fromAmino(example)
    expect(multisend.toAmino()).toMatchObject(example)
  })

  it('deserialize correctly proto', () => {
    const multisend = MsgMultiSend.fromProto(proto_example)
    expect(multisend.toData()).toMatchObject(proto_example)
  })

  it('can be created manually', () => {
    const inputs: MsgMultiSend.Input[] = [
      new MsgMultiSend.Input(
        'init105rz2q5a4w7nv7239tl9c4px5cjy7axx3axf6p',
        new Coins({
          uinit: 123123,
        })
      ),
      new MsgMultiSend.Input('init105rz2q5a4w7nv7239tl9c4px5cjy7axx3axfad', [
        new Coin('uinit', 123123),
      ]),
    ]

    const outputs: MsgMultiSend.Output[] = [
      new MsgMultiSend.Output(
        'init105rz2q5a4w7nv7239tl9c4px5cjy7axx3axfad',
        new Coins({
          uinit: 123123,
        })
      ),
      new MsgMultiSend.Output('init105rz2q5a4w7nv7239tl9c4px5cjy7axx3axfga', {
        uinit: 123123,
      }),
    ]
    const multisend = new MsgMultiSend(inputs, outputs)
    expect(multisend.toAmino()).toMatchObject({
      type: 'cosmos-sdk/MsgMultiSend',
      value: {
        inputs: [
          {
            address: 'init105rz2q5a4w7nv7239tl9c4px5cjy7axx3axf6p',
            coins: [
              {
                denom: 'uinit',
                amount: '123123',
              },
            ],
          },
          {
            address: 'init105rz2q5a4w7nv7239tl9c4px5cjy7axx3axfad',
            coins: [
              {
                denom: 'uinit',
                amount: '123123',
              },
            ],
          },
        ],
        outputs: [
          {
            address: 'init105rz2q5a4w7nv7239tl9c4px5cjy7axx3axfad',
            coins: [
              {
                denom: 'uinit',
                amount: '123123',
              },
            ],
          },
          {
            address: 'init105rz2q5a4w7nv7239tl9c4px5cjy7axx3axfga',
            coins: [
              {
                denom: 'uinit',
                amount: '123123',
              },
            ],
          },
        ],
      },
    })
  })
})
