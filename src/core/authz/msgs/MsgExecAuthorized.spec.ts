import { describe, it, expect } from 'vitest'
import { MsgExecAuthorized } from './MsgExecAuthorized'
const examples = require('./MsgExecAuthorized.data.json')

describe('MsgExecAuthorized', () => {
  it('deserializes', () => {
    examples.forEach((data: MsgExecAuthorized.Amino) => {
      expect(MsgExecAuthorized.fromAmino(data).toAmino()).toEqual(data)
    })
  })
})
