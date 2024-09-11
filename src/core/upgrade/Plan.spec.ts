import { Plan } from './Plan'

describe('Plan', () => {
  it('deserializes', () => {
    const plan = Plan.fromAmino({
      name: `v0.5.2`,
      height: '5330001',
      info: 'testinfo',
    })

    expect(plan).toMatchObject({
      name: `v0.5.2`,
      height: 5330001,
      info: 'testinfo',
    })
  })
})
